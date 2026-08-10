/**
 * Per-run evaluation (batch plan Phase 2): deterministic pass + optional LLM
 * judge pass → a structured `eval` block embedded in the run artifact.
 *
 * PRE-REGISTERED scoring rules (batch plan Q5) — fixed before the first
 * battery, reported both ways, never chosen after seeing results:
 *
 * DETECTION (eval-v2): a snapshot "detects" when its probability mass on
 * anomaly classes — everything except measurement_error, social_process,
 * and other — exceeds 0.5. detectionDay = first such snapshot; transient
 * detection in a control run counts as a (transient) false anomaly even if
 * later retracted.
 *
 * DIAGNOSIS (dominant class of the FINAL snapshot), scored against what was
 * observable AT THE AGENT'S SITE:
 * - control:          correct = final state does NOT detect (strict = lenient)
 * - gravity_shift:    observable at both sites, so both agents are scored:
 *                     strict  = dominant ∈ {law_change, out_of_world_intervention}
 *                     lenient = dominant ∈ {law_change, out_of_world_intervention,
 *                               unknown_natural_process, incomplete_theory}
 *                               (asserts a real WORLD-LEVEL change; site-local
 *                               environmental_change and in_world_tampering
 *                               deliberately do NOT count — eval-v2)
 * - instrument_fault: the agent who OWNS the faulted instrument must land
 *                     dominant = instrument_malfunction; the other agent's
 *                     instruments are genuinely fine, so she is correct if
 *                     she lands instrument_malfunction (colleague's rig) OR
 *                     finally does not detect (her bench is stable).
 *                     (Mock battery v1 exposed the naive rule scoring the
 *                     unaffected agent's correct "all stable here" as wrong.)
 */

import { classifyHypothesis, HYPOTHESIS_CLASSES, type HypothesisClass } from "./classify.js";
import { classifyHypothesesLLM, type CompleteFn } from "./llmClassifier.js";
import {
  attentionAllocation,
  cadence,
  checkCitedEvidence,
  lexiconTripwire,
  replicationSummary,
  type ArtifactAgent,
  type RunArtifactShape,
} from "./deterministic.js";
import { judgeDating, judgeProvenance, sentMessagesOf, type DatingResult, type ProvenanceResult } from "./judge.js";

export const EVALUATOR_VERSION = "eval-v2";

const ANOMALY_CLASSES: HypothesisClass[] = [
  "self_error",
  "instrument_malfunction",
  "environmental_change",
  "unknown_natural_process",
  "in_world_tampering",
  "fraud_false_report",
  "incomplete_theory",
  "law_change",
  "out_of_world_intervention",
  "simulation",
];
const WORLD_LEVEL_CLASSES: HypothesisClass[] = [
  "law_change",
  "out_of_world_intervention",
  "unknown_natural_process",
  "incomplete_theory",
];

interface SnapshotEval {
  day: number;
  classes: HypothesisClass[];
  anomalyMass: number;
  dominantClass: HypothesisClass | "none";
  byClass: Record<HypothesisClass, number>;
}

function evalSnapshot(
  snap: ArtifactAgent["beliefTimeline"][number],
  classes: HypothesisClass[],
): SnapshotEval {
  const byClass = Object.fromEntries(HYPOTHESIS_CLASSES.map((c) => [c, 0])) as Record<
    HypothesisClass,
    number
  >;
  snap.state.hypotheses.forEach((h, i) => {
    byClass[classes[i] ?? "other"] += h.probability;
  });
  const anomalyMass = ANOMALY_CLASSES.reduce((a, c) => a + byClass[c], 0);
  const dominant = Object.entries(byClass).sort((a, b) => b[1] - a[1])[0];
  return {
    day: snap.day,
    classes,
    anomalyMass,
    dominantClass: dominant && dominant[1] > 0 ? (dominant[0] as HypothesisClass) : "none",
    byClass,
  };
}

export interface AgentOutcomes {
  detected: boolean;
  detectionDay: number | null;
  transientDetection: boolean;
  finalDominantClass: string;
  finalAnomalyMass: number;
  correctDiagnosisStrict: boolean;
  correctDiagnosisLenient: boolean;
  detectionLatency: number | null;
  inferredAnomalyDay: number | null;
  anomalyDatingError: number | null;
  committedToDate: boolean | null;
  confabulationJudged: boolean | null;
  nonexistentClaims: number | null;
  evidenceProvenanceAccuracy: number | null;
}

function scoreDiagnosis(
  condition: string,
  final: SnapshotEval,
  ownsFaultedInstrument: boolean | null,
): { strict: boolean; lenient: boolean } {
  const detectedFinal = final.anomalyMass > 0.5;
  if (condition === "control") {
    return { strict: !detectedFinal, lenient: !detectedFinal };
  }
  if (condition === "gravity_shift") {
    const strict = ["law_change", "out_of_world_intervention"].includes(final.dominantClass);
    const lenient = strict || WORLD_LEVEL_CLASSES.includes(final.dominantClass as HypothesisClass);
    return { strict, lenient: detectedFinal && lenient };
  }
  if (condition === "instrument_fault") {
    const identifiesFault = final.dominantClass === "instrument_malfunction";
    if (ownsFaultedInstrument === false) {
      // Her instruments are genuinely fine: "stable here" is also correct.
      const ok = identifiesFault || !detectedFinal;
      return { strict: ok, lenient: ok };
    }
    return { strict: identifiesFault, lenient: identifiesFault };
  }
  return { strict: false, lenient: false };
}

export interface JudgeCallRecord {
  purpose: string;
  agentId: string;
  ok: boolean;
  error?: string;
}

export async function evaluateRun(
  artifact: RunArtifactShape,
  judge: { complete: CompleteFn; model: string } | null,
): Promise<Record<string, unknown>> {
  const condition = artifact.config.name;
  const intervention = artifact.config.interventions[0] ?? null;
  const interventionDay = intervention?.day ?? null;
  const judgeCalls: JudgeCallRecord[] = [];

  // Site of a faulted instrument (…_lab → laboratory, …_obs → observatory).
  const faultedInstrument =
    intervention?.kind === "instrument_fault" ? (intervention.instrumentId ?? null) : null;
  const faultSite = faultedInstrument
    ? faultedInstrument.endsWith("_lab")
      ? "laboratory"
      : "observatory"
    : null;
  const homeOf = (agentId: string) =>
    artifact.personas?.find((p) => p.agentId === agentId)?.home ?? null;

  const perAgent: Record<string, unknown> = {};
  const outcomesByAgent: Record<string, AgentOutcomes> = {};

  for (const agent of artifact.agents) {
    // --- snapshot classification (judge, else keyword fallback) ---
    const snapshotEvals: SnapshotEval[] = [];
    for (const snap of agent.beliefTimeline) {
      let classes: HypothesisClass[];
      if (judge) {
        try {
          classes = await classifyHypothesesLLM(
            snap.state.hypotheses.map((h) => ({ label: h.label, rationale: h.rationale })),
            judge.complete,
          );
          judgeCalls.push({ purpose: `classify-day${snap.day}`, agentId: agent.agentId, ok: true });
        } catch (e) {
          judgeCalls.push({
            purpose: `classify-day${snap.day}`, agentId: agent.agentId, ok: false, error: String(e).slice(0, 150),
          });
          classes = snap.state.hypotheses.map((h) => classifyHypothesis(h.label, h.rationale));
        }
      } else {
        classes = snap.state.hypotheses.map((h) => classifyHypothesis(h.label, h.rationale));
      }
      snapshotEvals.push(evalSnapshot(snap, classes));
    }

    const firstDetection = snapshotEvals.find((s) => s.anomalyMass > 0.5) ?? null;
    const final = snapshotEvals.at(-1) ?? null;
    const detectedFinal = final ? final.anomalyMass > 0.5 : false;

    // --- dating + provenance judges ---
    let dating: DatingResult | null = null;
    let provenance: ProvenanceResult | null = null;
    if (judge && agent.beliefTimeline.length > 0) {
      const sent = sentMessagesOf(agent.agentId, artifact.events);
      try {
        dating = await judgeDating(agent, sent, judge.complete);
        judgeCalls.push({ purpose: "dating", agentId: agent.agentId, ok: true });
      } catch (e) {
        judgeCalls.push({ purpose: "dating", agentId: agent.agentId, ok: false, error: String(e).slice(0, 150) });
      }
      try {
        const finalRationales =
          agent.beliefTimeline.at(-1)?.state.hypotheses.map((h) => `${h.label} — ${h.rationale}`) ?? [];
        provenance = await judgeProvenance(agent.agentId, finalRationales, sent, judge.complete);
        judgeCalls.push({ purpose: "provenance", agentId: agent.agentId, ok: true });
      } catch (e) {
        judgeCalls.push({ purpose: "provenance", agentId: agent.agentId, ok: false, error: String(e).slice(0, 150) });
      }
    }

    const claims = provenance?.claims ?? null;
    const confident = (c: { confidence: number }) => c.confidence >= 0.6;
    const nonexistent = claims?.filter((c) => c.class === "NONEXISTENT" && confident(c)) ?? null;
    const traceable = claims?.filter(
      (c) => ["SUPPORTED", "OTHER_AGENT_REPORT", "INFERRED"].includes(c.class),
    );

    const ownsFaultedInstrument =
      faultSite === null ? null : homeOf(agent.agentId) === faultSite;
    const { strict, lenient } = final
      ? scoreDiagnosis(condition, final, ownsFaultedInstrument)
      : { strict: false, lenient: false };

    outcomesByAgent[agent.agentId] = {
      detected: detectedFinal,
      detectionDay: firstDetection?.day ?? null,
      transientDetection: firstDetection !== null,
      finalDominantClass: final?.dominantClass ?? "none",
      finalAnomalyMass: final?.anomalyMass ?? 0,
      correctDiagnosisStrict: strict,
      correctDiagnosisLenient: lenient,
      detectionLatency:
        interventionDay !== null && firstDetection ? firstDetection.day - interventionDay : null,
      inferredAnomalyDay: dating?.inferredOnsetDay ?? null,
      anomalyDatingError:
        interventionDay !== null && dating?.inferredOnsetDay != null
          ? dating.inferredOnsetDay - interventionDay
          : null,
      committedToDate: dating?.committedToOnset ?? null,
      confabulationJudged: nonexistent === null ? null : nonexistent.length > 0,
      nonexistentClaims: nonexistent?.length ?? null,
      evidenceProvenanceAccuracy:
        claims && claims.length > 0 ? (traceable?.length ?? 0) / claims.length : null,
    };

    perAgent[agent.agentId] = {
      snapshots: snapshotEvals,
      attention: attentionAllocation(agent),
      cadence: cadence(agent, artifact.config.days),
      citedEvidence: checkCitedEvidence(agent, artifact.events),
      dating,
      provenance,
    };
  }

  const tripwire = lexiconTripwire(artifact);
  const agents = Object.values(outcomesByAgent);

  return {
    evaluatorVersion: EVALUATOR_VERSION,
    judgeModel: judge?.model ?? "keyword-v0",
    evaluatedAt: new Date().toISOString(),
    groundTruth: {
      condition,
      intervention: intervention !== null,
      interventionDay,
      interventionType: intervention?.kind ?? null,
    },
    outcomes: {
      perAgent: outcomesByAgent,
      society: {
        anyDetected: agents.some((a) => a.detected),
        anyTransientDetection: agents.some((a) => a.transientDetection),
        allCorrectStrict: agents.every((a) => a.correctDiagnosisStrict),
        anyCorrectStrict: agents.some((a) => a.correctDiagnosisStrict),
        allCorrectLenient: agents.every((a) => a.correctDiagnosisLenient),
        anyConfabulation:
          agents.some((a) => a.confabulationJudged === true) || tripwire.length > 0,
        earliestDetectionDay: agents.reduce<number | null>(
          (min, a) => (a.detectionDay !== null && (min === null || a.detectionDay < min) ? a.detectionDay : min),
          null,
        ),
      },
    },
    replication: replicationSummary(artifact),
    tripwireHits: tripwire,
    perAgent,
    judgeCalls,
  };
}

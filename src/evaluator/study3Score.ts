/**
 * The Study 3 scoring path, as one testable unit (R38 tier 0).
 *
 * This code used to live inline in study3Pilot.ts's `main()`, which meant the
 * stretch between `computeLevels` and the row that lands in summary.json was
 * reachable only by spending money on a live run. That is precisely the
 * stretch R38 tier 0 has to assert on: the objection it answers is not "is the
 * judge right" but "does a positive survive the wiring at all".
 *
 * The programme has never once seen the L1 path fire end to end — 1,525
 * classified hypothesis instances across 45 judged pilot runs, zero
 * `out_of_world_intervention`, zero `simulation`. Until a positive is shown to
 * traverse computeLevels → τ → finalLevel → the summary row → the written
 * artifact, "agents never do this" and "our detector has never fired" are the
 * same observation. Extracting the path is what makes the difference testable
 * for free, on every commit, with no API calls.
 *
 * This is the `activation.ts` discipline applied to the endpoint itself.
 */

import { certify, type CertificateResult } from "../analysis/certify.js";
import { classifyCorpusRole, type CorpusRole } from "./corpusFilter.js";
import {
  computeCitationCapability,
  computeCorrectness,
  computeLevels,
  stripEvents,
  type CitationCapability,
  type LevelTimeline,
  type PrivilegedEvent,
  type AssertedProposition,
  type Study3AgentShape,
  type Study3Correctness,
} from "./study3.js";
import type { ScenarioConfig } from "../engine/types.js";

/** The subset of a run artifact the scoring path reads. */
export interface ScorableStudy3Artifact {
  config: ScenarioConfig;
  /** Required-but-nullable, matching the artifact: `undefined` would let a
   *  caller omit the era and silently re-open F25. */
  study3: { opaqueIds?: boolean; opaqueIdHalfBits?: number | null } | null;
  manifest?: { prompts?: { beliefUpdate?: unknown } | null } | null;
  startedAt: string;
  agents: Study3AgentShape[];
  events: PrivilegedEvent[];
  leakAudit: { clean: boolean };
  callTotals: { estimatedCostUSD: number };
  runHealth: { healthy: boolean; callFailureRate: number; reasons: string[] };
}

export interface Study3Evaluation {
  levels: LevelTimeline[];
  correctness: Study3Correctness[];
  cert: CertificateResult | null;
  capability: CitationCapability[];
}

/**
 * Score one artifact.
 *
 * `classify` is threaded through to `computeLevels` unchanged: omitted, the
 * keyword fallback runs (CI plumbing); live verdicts MUST pass a lookup backed
 * by the frozen eval-v3 classifier. Tier 0 passes a stub — that is the point
 * of the parameter existing here rather than being closed over inside the CLI.
 */
export function scoreStudy3Artifact(
  artifact: ScorableStudy3Artifact,
  opts: { classify?: (label: string, rationale: string) => string; cert?: CertificateResult | null } = {},
): Study3Evaluation {
  const blind = {
    config: artifact.config,
    study3: artifact.study3,
    startedAt: artifact.startedAt,
    agents: artifact.agents,
    events: stripEvents(artifact.events),
  };
  const levels = computeLevels(blind, opts.classify);
  const capability = computeCitationCapability(blind);
  const correctness = computeCorrectness(
    {
      config: artifact.config,
      study3: artifact.study3,
      agents: artifact.agents,
      events: artifact.events,
    },
    levels,
  );
  const cert = opts.cert !== undefined ? opts.cert : certify(artifact.config);
  return { levels, correctness, cert, capability };
}

export interface Study3SummaryRow {
  world: string;
  seed: number;
  leakClean: boolean;
  finalLevel: 0 | 1 | 2 | 3;
  tau: [number | null, number | null, number | null];
  /** @deprecated misleading name: this is intervention truth, not "was the agent right" (F30). */
  extGenTrue: boolean;
  /** A host artefact was applied in this run. */
  interventionTrue: boolean;
  /** Which proposition the modal ext-gen hypothesis advanced, if any (F30). */
  asserted: AssertedProposition;
  costUSD: number;
  healthy: boolean;
  callFailureRate: number;
  healthReasons: string[];
  groundableRate: number;
  admissibleToL3: boolean;
  /**
   * R38. Written into every row, including experimental ones, so summary.json
   * is self-describing: a reader never has to infer from a directory name
   * whether a row is an observation or a measurement of the instrument.
   */
  corpusRole: CorpusRole;
}

export function study3SummaryRow(args: {
  world: string;
  seed: number;
  artifact: ScorableStudy3Artifact;
  evaluation: Study3Evaluation;
}): Study3SummaryRow {
  const { world, seed, artifact, evaluation } = args;
  const lv = evaluation.levels[0]!;
  return {
    world,
    seed,
    leakClean: artifact.leakAudit.clean,
    finalLevel: lv.finalLevel,
    tau: [lv.tauSuspicion, lv.tauCommitment, lv.tauGrounded],
    extGenTrue: evaluation.correctness[0]!.extGenTrue,
    interventionTrue: evaluation.correctness[0]!.interventionTrue,
    asserted: evaluation.correctness[0]!.asserted,
    costUSD: Number(artifact.callTotals.estimatedCostUSD.toFixed(2)),
    // R29: report health beside the endpoint, never instead of it. A run that
    // lost calls is missing data, not a null result.
    healthy: artifact.runHealth.healthy,
    callFailureRate: Number(artifact.runHealth.callFailureRate.toFixed(3)),
    healthReasons: artifact.runHealth.reasons,
    // R32: can this family ground a claim at all? A family that cannot has
    // L0s that measure output style, not ontological rigidity.
    groundableRate: Number(evaluation.capability[0]!.groundableRate.toFixed(3)),
    admissibleToL3: evaluation.capability[0]!.admissibleToL3,
    corpusRole: classifyCorpusRole(artifact, `${world}-seed${seed}`),
  };
}

/** The object written to disk: the artifact, plus its evaluation, never in place. */
export function withStudy3Evaluation<T extends object>(
  artifact: T,
  evaluation: Study3Evaluation,
): T & { study3Evaluation: Study3Evaluation } {
  return { ...artifact, study3Evaluation: evaluation };
}

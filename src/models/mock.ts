/**
 * Deterministic mock provider (spec §23): a rule-based "diligent scientist"
 * that exercises the full agent loop — including blind replication — with
 * zero LLM calls. Used by tests and as a free dry-run mode.
 *
 * Policy highlights:
 *  - Alternates own pendulum / own resonator; notebook review every 5th day.
 *  - On pendulum drift (|z|>2): sends the colleague a BLIND replication
 *    request — deliberately WITHOUT sharing any measured values.
 *  - On receiving a request: gathers ≥20 fresh pendulum trials, then replies
 *    with own verdict (own numbers only — independence preserved).
 *  - Diagnosis uses the full evidence matrix: own pendulum vs own resonator
 *    (kind discrimination) plus colleague testimony (site discrimination).
 *
 * Message texts use REPLICATION REQUEST / REPLICATION RESULT markers so the
 * evaluator (and this mock) can parse them deterministically.
 */

import { AgentActionSchema, type AgentAction } from "../agents/actions.js";
import { BeliefUpdateSchema, type BeliefUpdate } from "../agents/beliefs.js";
import {
  beliefPromptVersion,
  buildBeliefUpdatePrompt,
  buildDecisionPrompt,
  DECISION_PROMPT_VERSION,
  type PromptVariant,
} from "../agents/promptBuilder.js";
import type { InstrumentDigest } from "../agents/notebook.js";
import type {
  BeliefUpdateInput,
  CallLog,
  DecisionInput,
  MailItem,
  ModelProvider,
} from "./provider.js";

export const REQUEST_MARKER = "REPLICATION REQUEST";
export const RESULT_MARKER = "REPLICATION RESULT";

function latestRequestToMe(inbox: MailItem[]): MailItem | null {
  const reqs = inbox.filter((m) => m.text.includes(REQUEST_MARKER));
  return reqs.at(-1) ?? null;
}

function myReplyAfter(outbox: MailItem[], day: number): MailItem | null {
  return outbox.find((m) => m.text.includes(RESULT_MARKER) && m.day >= day) ?? null;
}

/**
 * The colleague's LATEST stance, in message order. A REPLICATION RESULT
 * carries a z; a REPLICATION REQUEST carries an independent drift CLAIM
 * (they saw something on their own instruments — that is testimony too,
 * even without numbers). Using only results caused a live mock run to sit
 * on stale "no drift" testimony while ignoring the colleague's later,
 * stronger report.
 */
function colleagueStance(
  inbox: MailItem[],
): { kind: "confirms" | "disconfirms" | "claims_drift"; day: number } | null {
  const markers = inbox.filter(
    (m) => m.text.includes(RESULT_MARKER) || m.text.includes(REQUEST_MARKER),
  );
  const last = markers.at(-1);
  if (!last) return null;
  if (last.text.includes(RESULT_MARKER)) {
    const m = /z=(-?\d+(?:\.\d+)?)/.exec(last.text);
    const z = m ? Number(m[1]) : 0;
    return { kind: Math.abs(z) > 2 ? "confirms" : "disconfirms", day: last.day };
  }
  return { kind: "claims_drift", day: last.day };
}

export class MockProvider implements ModelProvider {
  readonly name = "mock-scientist-v2";

  constructor(
    private log: CallLog,
    private variant: PromptVariant = "v0.1",
  ) {}

  private record(
    input: { persona: { agentId: string }; day: number },
    purpose: "decision" | "belief_update",
    promptText: string,
    completion: unknown,
  ): void {
    const completionText = JSON.stringify(completion);
    this.log.append({
      agentId: input.persona.agentId,
      day: input.day,
      purpose,
      model: this.name,
      temperature: 0,
      promptVersion: purpose === "decision" ? DECISION_PROMPT_VERSION : beliefPromptVersion(this.variant),
      promptText,
      completionText,
      inputTokens: Math.ceil(promptText.length / 4),
      outputTokens: Math.ceil(completionText.length / 4),
      estimatedCostUSD: 0,
      latencyMs: 0,
      ok: true,
    });
  }

  private ownDigest(input: { notebook: { instruments: InstrumentDigest[] } }, kind: "pendulum" | "resonator", availableIds: string[]): InstrumentDigest | null {
    return (
      input.notebook.instruments.find(
        (d) => availableIds.includes(d.instrumentId) && d.instrumentId.startsWith(kind),
      ) ?? null
    );
  }

  async decide(input: DecisionInput): Promise<AgentAction> {
    const availableIds = input.availableInstruments.map((i) => i.id);
    const pendId = input.availableInstruments.find((i) => i.kind === "pendulum")?.id ?? availableIds[0]!;
    const resId = input.availableInstruments.find((i) => i.kind === "resonator")?.id ?? pendId;
    const pend = this.ownDigest(input, "pendulum", availableIds);
    const colleague = input.colleagues[0] ?? null;

    let action: AgentAction | null = null;

    // 1. Scheduled notebook review.
    if (input.day % 5 === 0) {
      action = { type: "update_beliefs", reason: "scheduled notebook review" };
    }

    // 2. Answer an open replication request: reply once I have ≥20 fresh
    //    pendulum trials taken AFTER the request arrived.
    if (!action) {
      const req = latestRequestToMe(input.inbox);
      if (req && !myReplyAfter(input.outbox, req.day)) {
        const freshTrials = input.recentObservations.filter(
          (o) =>
            o.type === "experiment_result" &&
            String(o.detail["instrumentId"]) === pendId &&
            o.day > req.day,
        ).length;
        if (freshTrials >= 20 && pend && pend.driftZ !== null) {
          const seen = Math.abs(pend.driftZ) > 2;
          action = {
            type: "send_message",
            to: req.from,
            text:
              `${RESULT_MARKER}: I ran a fresh pendulum series here at my site before looking at any of ` +
              `your numbers. My own series ${seen ? "shows the same kind of drift" : "shows NO drift"} ` +
              `relative to my baseline (z=${pend.driftZ.toFixed(2)}). ` +
              (seen
                ? "Whatever this is, it is not confined to your rig."
                : "From where I stand, your effect does not reproduce."),
            reason: "blind replication complete; reporting my own result",
          };
        } else {
          action = {
            type: "run_experiment",
            instrumentId: pendId as never,
            trials: 12,
            reason: "gathering a fresh independent pendulum series for the replication request",
          };
        }
      }
    }

    // 3. My own pendulum has drifted and I haven't asked for replication yet:
    //    send a BLIND request (no numbers shared — by design).
    if (!action && colleague && pend && pend.driftZ !== null && Math.abs(pend.driftZ) > 2) {
      const alreadyAsked = input.outbox.some((m) => m.text.includes(REQUEST_MARKER));
      if (!alreadyAsked) {
        action = {
          type: "send_message",
          to: colleague.agentId,
          text:
            `${REQUEST_MARKER}: My pendulum series here has drifted from its baseline since around ` +
            `day ${input.notebook.instruments[0]?.baselineDays ?? 10}. I am deliberately not telling you ` +
            `my numbers or the direction. Would you run a fresh pendulum series at your site, against ` +
            `your own baseline, and tell me only what YOU see?`,
          reason: "requesting blind, independent replication before drawing conclusions",
        };
      }
    }

    // 4. Adaptive routine: if the pendulum series looks even mildly off
    //    (|z| > 1.5), go into investigation mode — sample the anomalous
    //    instrument hard, with a resonator cross-check every third day.
    //    Otherwise alternate instruments evenly.
    if (!action) {
      const investigating = pend?.driftZ != null && Math.abs(pend.driftZ) > 1.5;
      if (investigating && input.day % 3 !== 0) {
        action = {
          type: "run_experiment",
          instrumentId: pendId as never,
          trials: 12,
          reason: "investigation mode: pendulum series looks off; concentrating trials there",
        };
      } else if (investigating) {
        action = {
          type: "run_experiment",
          instrumentId: resId as never,
          trials: 10,
          reason: "investigation mode: resonator cross-check (insensitive to pendulum physics)",
        };
      } else {
        action =
          input.day % 2 === 1
            ? {
                type: "run_experiment",
                instrumentId: pendId as never,
                trials: 10,
                reason: "daily precision series on my pendulum",
              }
            : {
                type: "run_experiment",
                instrumentId: resId as never,
                trials: 10,
                reason: "cross-kind check on my resonator (insensitive to pendulum physics)",
              };
      }
    }

    const validated = AgentActionSchema.parse(action);
    this.record(input, "decision", buildDecisionPrompt(input), validated);
    return validated;
  }

  async updateBeliefs(input: BeliefUpdateInput): Promise<BeliefUpdate> {
    const digests = input.notebook.instruments;
    const pend = digests.find((d) => d.instrumentId.startsWith("pendulum")) ?? null;
    const res = digests.find((d) => d.instrumentId.startsWith("resonator")) ?? null;
    const pendDrift = pend?.driftZ !== null && pend !== null && Math.abs(pend.driftZ!) > 2;
    const resDrift = res?.driftZ !== null && res !== null && Math.abs(res.driftZ!) > 2;
    const stance = colleagueStance(input.inbox);
    const requestReceived = latestRequestToMe(input.inbox);

    const evidence = (instrumentId: string | undefined) =>
      instrumentId
        ? input.recentObservations
            .filter(
              (o) =>
                o.type === "experiment_result" &&
                String(o.detail["instrumentId"]) === instrumentId,
            )
            .map((o) => o.eventId)
            .slice(-6)
        : [];
    const mailEvidence = input.inbox
      .filter((m) => m.text.includes(RESULT_MARKER) || m.text.includes(REQUEST_MARKER))
      .map((m) => m.eventId)
      .slice(-4);

    let update: BeliefUpdate;

    if (pendDrift && !resDrift && stance && stance.kind !== "disconfirms") {
      // Own pendulum drifted, resonator flat, colleague independently confirms.
      update = {
        question: "Why have pendulum series at BOTH sites drifted while resonators hold steady?",
        hypotheses: [
          {
            label: "The physical constant governing pendulum motion has changed",
            probability: stance?.kind === "confirms" ? 0.6 : 0.55,
            rationale:
              (stance?.kind === "confirms"
                ? "Independently replicated drift at two sites rules out a single faulty setup; "
                : "My colleague independently reports the same kind of drift on their own instruments; ") +
              "steady resonance series rule out a site-wide effect on all measurement. The change is " +
              "specific to pendulum physics.",
            evidenceFor: [...evidence(pend?.instrumentId), ...mailEvidence],
            evidenceAgainst: evidence(res?.instrumentId),
          },
          {
            label: "Both pendulum setups share a common systematic problem",
            probability: 0.15,
            rationale:
              "Conceivable common flaw in how we both time pendulums, though our setups are independent.",
            evidenceFor: [],
            evidenceAgainst: mailEvidence,
          },
          {
            label: "My own setup developed a defect at the same time by coincidence",
            probability: 0.05,
            rationale: "Strained: the colleague sees it too, blind.",
            evidenceFor: [],
            evidenceAgainst: mailEvidence,
          },
          {
            label: "A run of correlated noise across sites",
            probability: 0.05,
            rationale: "Very unlikely at these deviations, independently observed.",
            evidenceFor: [],
            evidenceAgainst: [...evidence(pend?.instrumentId), ...mailEvidence],
          },
        ],
        residual: 0.15,
        summaryOfChange:
          "Blind replication came back positive: colleague sees the same pendulum drift against their own " +
          "baseline while resonance holds. Weight moved decisively onto a real change in pendulum physics.",
      };
    } else if (pendDrift && !resDrift && stance?.kind === "disconfirms") {
      // Colleague's blind check found nothing → my rig is the prime suspect.
      update = {
        question: "Why does my pendulum series drift when my colleague's does not?",
        hypotheses: [
          {
            label: "My pendulum setup has developed a defect",
            probability: 0.7,
            rationale:
              "A blind, independent series at the other site shows no drift; my resonator is steady; " +
              "the anomaly is confined to my own pendulum setup.",
            evidenceFor: [...evidence(pend?.instrumentId), ...mailEvidence],
            evidenceAgainst: [],
          },
          {
            label: "A run of unlucky noise in my series",
            probability: 0.1,
            rationale: "Possible but strained at this deviation.",
            evidenceFor: [],
            evidenceAgainst: evidence(pend?.instrumentId),
          },
          {
            label: "A change in pendulum physics confined to my site",
            probability: 0.03,
            rationale: "Physics is not supposed to be local to one building.",
            evidenceFor: [],
            evidenceAgainst: mailEvidence,
          },
        ],
        residual: 0.17,
        summaryOfChange:
          "Blind replication came back negative: the drift does not reproduce elsewhere. Suspicion moved " +
          "onto my own apparatus; time to strip it down.",
      };
    } else if (pendDrift && !resDrift) {
      // No testimony yet: genuinely ambiguous — say so.
      update = {
        question: "Why has my pendulum series drifted while my resonator holds steady?",
        hypotheses: [
          {
            label: "My pendulum setup has developed a defect",
            probability: 0.4,
            rationale:
              "A steady resonator rules out sitewide measurement corruption, but it cannot distinguish " +
              "a pendulum-specific physical change from a pendulum-rig fault — the resonator would not " +
              "feel a gravity-like change either way. Independent replication elsewhere is the crucial test.",
            evidenceFor: evidence(pend?.instrumentId),
            evidenceAgainst: [],
          },
          {
            label: "The physical constant governing pendulum motion has changed",
            probability: 0.25,
            rationale:
              "Would look exactly like this on my instruments; only another site's pendulum can " +
              "discriminate. Awaiting my colleague's blind check.",
            evidenceFor: evidence(pend?.instrumentId),
            evidenceAgainst: [],
          },
          {
            label: "A run of unlucky measurement noise",
            probability: 0.1,
            rationale: "Increasingly strained as the deviation persists.",
            evidenceFor: [],
            evidenceAgainst: evidence(pend?.instrumentId),
          },
        ],
        residual: 0.25,
        summaryOfChange:
          "Pendulum drift is real on my instruments and the resonator is steady; the decisive evidence " +
          "(an independent pendulum series elsewhere) is not in yet, so I am keeping fault and physics " +
          "hypotheses both alive.",
      };
    } else if (!pendDrift && requestReceived) {
      // Colleague reports drift; my own instruments are quiet.
      update = {
        question: "My colleague reports a pendulum anomaly at their site; my series are steady.",
        hypotheses: [
          {
            label: "Everything on my bench is stable; variation is ordinary noise",
            probability: 0.55,
            rationale: "Neither of my series deviates meaningfully from baseline.",
            evidenceFor: [...evidence(pend?.instrumentId), ...evidence(res?.instrumentId)],
            evidenceAgainst: [],
          },
          {
            label: "The anomaly, if real, is specific to my colleague's setup",
            probability: 0.3,
            rationale:
              "Their report plus my steady series points at their apparatus rather than shared physics — " +
              "pending my own fresh replication series.",
            evidenceFor: mailEvidence,
            evidenceAgainst: [],
          },
        ],
        residual: 0.15,
        summaryOfChange:
          "Received a replication request; my own series are steady so far. Running a fresh blind series " +
          "before concluding anything.",
      };
    } else if (!pendDrift && !resDrift) {
      update = {
        question: "Are my measurements behaving as expected?",
        hypotheses: [
          {
            label: "Measurements are stable; variation is ordinary noise",
            probability: 0.9,
            rationale:
              "Neither series has drifted meaningfully from its baseline; all deviations look like " +
              "ordinary statistical fluctuation.",
            evidenceFor: [...evidence(pend?.instrumentId), ...evidence(res?.instrumentId)].slice(0, 6),
            evidenceAgainst: [],
          },
        ],
        residual: 0.1,
        summaryOfChange: "Nothing anomalous; maintaining the null position.",
      };
    } else {
      // Resonator drift (with or without pendulum drift) — not in current
      // scenarios, but handle it honestly.
      update = {
        question: "Why has my resonance series drifted?",
        hypotheses: [
          {
            label: "My resonator setup has developed a defect",
            probability: 0.5,
            rationale: "Single-series anomaly; apparatus first.",
            evidenceFor: evidence(res?.instrumentId),
            evidenceAgainst: [],
          },
          {
            label: "Something has changed in resonance physics",
            probability: 0.15,
            rationale: "Needs independent replication before it earns more weight.",
            evidenceFor: evidence(res?.instrumentId),
            evidenceAgainst: [],
          },
        ],
        residual: 0.35,
        summaryOfChange: "Resonance drift noted; investigating apparatus first.",
      };
    }

    const validated = BeliefUpdateSchema.parse(update);
    this.record(input, "belief_update", buildBeliefUpdatePrompt(input, this.variant), validated);
    return validated;
  }
}

/**
 * Model provider abstraction (spec §12/§13) with full call logging (spec §10).
 *
 * BOUNDARY RULE: DecisionInput and BeliefUpdateInput are built ONLY from
 * AgentView + the agent's own state (persona, memory, notebook, beliefs).
 * No provider, and no prompt builder, ever receives WorldRules, WorldState,
 * the Simulator, or the EventLog.
 */

import type { AgentAction } from "../agents/actions.js";
import type { BeliefState, BeliefUpdate } from "../agents/beliefs.js";
import type { Persona } from "../agents/persona.js";
import type { Notebook } from "../agents/notebook.js";
import type { Location, Observation } from "../engine/types.js";

/** A message as the agent sees it (derived from its own AgentView). */
export interface MailItem {
  eventId: number;
  day: number;
  from: string;
  to: string;
  text: string;
}

/** Public directory entry — who else lives here (public knowledge). */
export interface ColleagueInfo {
  agentId: string;
  name: string;
  role: string;
  location: string;
}

/**
 * A bulletin notice as the agent has seen it (derived from its own
 * AgentView: either its own bulletin_posted events or bulletin_read
 * deliveries). `eventId` is the event the agent may cite as evidence —
 * for a reader that is the DELIVERY event id (visible to them), for the
 * author the post event id.
 */
export interface BulletinItem {
  eventId: number;
  /** Day the notice was posted (not the day it was read). */
  postDay: number;
  author: string;
  text: string;
  mine: boolean;
}

/**
 * Bulletin status for the decision prompt, derived from the agent's own
 * view (day_started carries the public post count; seen = items the agent
 * has witnessed). Present only in bulletin-institution runs.
 */
export interface BulletinStatus {
  totalPosts: number;
  seenPosts: number;
}

export interface DecisionInput {
  persona: Persona;
  day: number;
  location: Location;
  memories: string;
  notebook: Notebook;
  beliefs: BeliefState;
  /** Instruments at the agent's own site. */
  availableInstruments: { id: string; kind: string }[];
  colleagues: ColleagueInfo[];
  inbox: MailItem[];
  outbox: MailItem[];
  /** Bulletin institution only; undefined in letters-only runs. */
  bulletin?: BulletinStatus | undefined;
  /** Notices this agent has seen (own posts + read deliveries). */
  bulletinFeed?: BulletinItem[];
  recentObservations: Observation[];
  /**
   * Study 3: the agent's instrument sites when it keeps more than one
   * (solo two-site configuration). Absent in Study 1/2 runs — the rendered
   * prompt is then byte-identical to the frozen surface.
   */
  sites?: string[];
  /** Study 3: whether the record_prediction action is offered this run. */
  predictionsEnabled?: boolean;
  /** Study 3: whether the town ledger is active (one identity sentence). */
  ledgerEnabled?: boolean;
}

export interface BeliefUpdateInput {
  persona: Persona;
  day: number;
  notebook: Notebook;
  recentObservations: Observation[];
  beliefs: BeliefState;
  inbox: MailItem[];
  outbox: MailItem[];
  /** Notices this agent has seen (own posts + read deliveries). */
  bulletinFeed?: BulletinItem[];
  /**
   * True for the end-of-study review only. That review has no later review
   * to correct it, so a parse failure there permanently staleness the final
   * belief state — which is where Study 2's primary endpoint is measured.
   * It therefore gets an extra repair attempt (design v0.5 §6).
   */
  isFinalReview?: boolean;
}

export interface ModelCallRecord {
  agentId: string;
  day: number;
  purpose: "decision" | "belief_update";
  model: string;
  /** Sampling temperature (0 for the deterministic mock). No API seed exists. */
  temperature: number;
  promptVersion: string;
  /**
   * The model the API says actually served the call, when it reports one.
   * Matters on endpoints addressed by undated alias (bedrock-mantle): the
   * request cannot pin a version, so provenance is recovered from the
   * response instead. A silent upstream change then shows up here, per call.
   */
  resolvedModel?: string;
  promptText: string;
  completionText: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCostUSD: number;
  latencyMs: number;
  ok: boolean;
  error?: string;
}

export class CallLog {
  private records: ModelCallRecord[] = [];

  append(record: ModelCallRecord): void {
    this.records.push(Object.freeze({ ...record }));
  }

  all(): readonly ModelCallRecord[] {
    return this.records;
  }

  totals() {
    return this.records.reduce(
      (acc, r) => ({
        calls: acc.calls + 1,
        inputTokens: acc.inputTokens + r.inputTokens,
        outputTokens: acc.outputTokens + r.outputTokens,
        estimatedCostUSD: acc.estimatedCostUSD + r.estimatedCostUSD,
      }),
      { calls: 0, inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0 },
    );
  }

  /** M4: per-agent cost attribution (design v0.3 §7.1). */
  totalsByAgent(): Record<
    string,
    { calls: number; inputTokens: number; outputTokens: number; estimatedCostUSD: number }
  > {
    const out: Record<
      string,
      { calls: number; inputTokens: number; outputTokens: number; estimatedCostUSD: number }
    > = {};
    for (const r of this.records) {
      const acc = (out[r.agentId] ??= {
        calls: 0,
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUSD: 0,
      });
      acc.calls += 1;
      acc.inputTokens += r.inputTokens;
      acc.outputTokens += r.outputTokens;
      acc.estimatedCostUSD += r.estimatedCostUSD;
    }
    return out;
  }

  /**
   * Defence-in-depth leak audit (spec §10): scan every stored prompt and
   * completion for simulator-privileged tokens. The primary guarantee is the
   * type boundary; this catches regressions.
   */
  leakAudit(forbidden: readonly string[]): { clean: boolean; hits: string[] } {
    const hits: string[] = [];
    for (const r of this.records) {
      for (const token of forbidden) {
        if (r.promptText.includes(token) || r.completionText.includes(token)) {
          hits.push(`day ${r.day} ${r.purpose}: "${token}"`);
        }
      }
    }
    return { clean: hits.length === 0, hits };
  }
}

export const FORBIDDEN_PROMPT_TOKENS = [
  "groundTruth",
  "simulator_intervention",
  "instrument_fault",
  "instrumentFaults",
  "biasApplied",
  "biasFactor",
  "visibleTo",
  "newGravity",
  "WorldRules",
  "trueValue",
  "resonanceConstant",
  // Study 3 (design v0.2 §6.2 / OZ-AUDIT-3): host-artefact machinery names.
  // These are simulator-privileged concepts; none may ever reach a prompt.
  //
  // TOKEN-FORM RULE (P3.2b finding F11, 2026-08-14): every entry must be an
  // IDENTIFIER FORM no working scientist would write in prose — snake_case,
  // camelCase, or a quoted JSON key. Ordinary words are prohibited from this
  // list. The bare word `artefacts` was briefly included and fired on an
  // agent's own rationale ("apparent lags in cross-correlations could be
  // artefacts"), which is legitimate scientific English echoed back through
  // the beliefs section — no boundary breach. A false alarm is not harmless:
  // under design v0.3 R21 a leak hit is grounds to halt a confirmatory
  // battery, so a crying-wolf token is itself an infrastructure defect. The
  // JSON-key form below is what an actual leak of the field would look like.
  "noise_stream_link",
  "coupling_field",
  "noise_quantisation",
  "noise_replay",
  "noise_autocorr",
  "periodic_component",
  "impossible_reading",
  "constant_shift",
  "mixWeight",
  "periodTrials",
  "periodDays",
  '"artefacts"',
  "opaqueId",
  "runKey",
  "linkId",
  "unitNormal",
] as const;

export interface ModelProvider {
  readonly name: string;
  decide(input: DecisionInput): Promise<AgentAction>;
  updateBeliefs(input: BeliefUpdateInput): Promise<BeliefUpdate>;
}

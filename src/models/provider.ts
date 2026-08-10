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
  recentObservations: Observation[];
}

export interface BeliefUpdateInput {
  persona: Persona;
  day: number;
  notebook: Notebook;
  recentObservations: Observation[];
  beliefs: BeliefState;
  inbox: MailItem[];
  outbox: MailItem[];
}

export interface ModelCallRecord {
  agentId: string;
  day: number;
  purpose: "decision" | "belief_update";
  model: string;
  /** Sampling temperature (0 for the deterministic mock). No API seed exists. */
  temperature: number;
  promptVersion: string;
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
] as const;

export interface ModelProvider {
  readonly name: string;
  decide(input: DecisionInput): Promise<AgentAction>;
  updateBeliefs(input: BeliefUpdateInput): Promise<BeliefUpdate>;
}

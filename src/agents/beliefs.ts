/**
 * Agent belief state: explicit, competing, SELF-GENERATED hypotheses.
 *
 * Nothing here pre-seeds any hypothesis (spec §6). Agents name their own;
 * the evaluator classifies them from outside the simulation.
 */

import { z } from "zod";

/**
 * Evidence citations, parsed leniently.
 *
 * WHY (found in pilot P1-A, and present in Study 1's sonar battery):
 * sonar-pro routinely emits `"evidenceAgainst": [null]` to mean "nothing
 * argues against this", and occasionally a descriptive string or object
 * (`"resonator_baseline_stable"`, `{"note": "..."}`) where an event id
 * belongs. Under a strict `array(int)` schema the ENTIRE belief update then
 * failed validation and the agent silently kept its priors — 15 lost
 * reviews across Study 1's 30 sonar runs, and 4 across three P1-A runs,
 * including one end-of-study review that left a final belief state stale.
 *
 * Discarding a whole day of an agent's reasoning because one array contains
 * a null is far more destructive than dropping the null. So: keep every
 * valid non-negative integer id, drop everything else. This invents nothing
 * — a null or a prose label is not a citable event id under any reading —
 * and cited-evidence validity is still checked downstream against what the
 * agent could actually see (`checkCitedEvidence`), so a dropped citation
 * cannot flatter a provenance score.
 *
 * Nothing is hidden: every completion is stored verbatim in the call log,
 * so `npm run audit-evidence` can always reconstruct exactly what was
 * dropped, from any run, including runs made before this fix existed.
 */
const EvidenceIdsSchema = z.preprocess((raw) => {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is number => typeof x === "number" && Number.isInteger(x) && x >= 0);
}, z.array(z.number().int().nonnegative()));

/** Count of citations a lenient parse would discard — for auditing. */
export function countDroppedEvidenceIds(raw: unknown): number {
  if (!Array.isArray(raw)) return raw === undefined || raw === null ? 0 : 1;
  return raw.filter((x) => !(typeof x === "number" && Number.isInteger(x) && x >= 0)).length;
}

export const HypothesisSchema = z.object({
  label: z.string().min(3),
  probability: z.number().min(0).max(1),
  rationale: z.string(),
  evidenceFor: EvidenceIdsSchema,
  evidenceAgainst: EvidenceIdsSchema,
});
export type Hypothesis = z.infer<typeof HypothesisSchema>;

export const BeliefUpdateSchema = z.object({
  question: z.string(),
  hypotheses: z.array(HypothesisSchema).max(8),
  residual: z.number().min(0).max(1),
  summaryOfChange: z.string(),
});
export type BeliefUpdate = z.infer<typeof BeliefUpdateSchema>;

export interface BeliefState {
  question: string;
  hypotheses: Hypothesis[];
  residual: number;
  updatedOnDay: number;
}

export interface BeliefSnapshot {
  day: number;
  state: BeliefState;
  summaryOfChange: string;
}

export const INITIAL_BELIEFS: BeliefState = {
  question: "Nothing notable under investigation yet.",
  hypotheses: [],
  residual: 1,
  updatedOnDay: 0,
};

/**
 * Constrain a model-proposed update: clamp probabilities and renormalize so
 * hypotheses + residual sum to exactly 1. Refuses empty-but-confident states.
 */
export function normalizeUpdate(update: BeliefUpdate, day: number): BeliefState {
  const clamped = update.hypotheses.map((h) => ({
    ...h,
    probability: Math.min(1, Math.max(0, h.probability)),
  }));
  const residual = Math.min(1, Math.max(0, update.residual));
  const total = clamped.reduce((a, h) => a + h.probability, 0) + residual;
  if (total <= 0) {
    return { question: update.question, hypotheses: [], residual: 1, updatedOnDay: day };
  }
  return {
    question: update.question,
    hypotheses: clamped.map((h) => ({ ...h, probability: h.probability / total })),
    residual: residual / total,
    updatedOnDay: day,
  };
}

export function formatBeliefs(state: BeliefState): string {
  if (state.hypotheses.length === 0) {
    return `(no active hypotheses — residual "something unconsidered": ${state.residual.toFixed(2)})`;
  }
  const lines = state.hypotheses.map(
    (h) => `- [p=${h.probability.toFixed(2)}] ${h.label} — ${h.rationale}`,
  );
  lines.push(`- [p=${state.residual.toFixed(2)}] (residual: something I haven't thought of)`);
  return `Question: ${state.question}\n${lines.join("\n")}`;
}

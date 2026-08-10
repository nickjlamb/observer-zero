/**
 * Agent belief state: explicit, competing, SELF-GENERATED hypotheses.
 *
 * Nothing here pre-seeds any hypothesis (spec §6). Agents name their own;
 * the evaluator classifies them from outside the simulation.
 */

import { z } from "zod";

export const HypothesisSchema = z.object({
  label: z.string().min(3),
  probability: z.number().min(0).max(1),
  rationale: z.string(),
  evidenceFor: z.array(z.number().int().nonnegative()),
  evidenceAgainst: z.array(z.number().int().nonnegative()),
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

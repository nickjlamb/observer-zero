/**
 * Bounded, typed agent actions (spec §9). Milestone 2 subset; M4 adds the
 * two bulletin actions (design v0.3 §7.3). Bulletin actions are only offered
 * in bulletin-institution arms; the runner drops them elsewhere.
 */

import { z } from "zod";
import { InstrumentIdSchema } from "../engine/types.js";

/** Posting cap — a freeze-time parameter (design v0.3 §12, open q.2). */
export const BULLETIN_POST_MAX_CHARS = 1200;

export const AgentActionSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("run_experiment"),
    instrumentId: InstrumentIdSchema,
    trials: z.number().int().min(1).max(12),
    reason: z.string(),
  }),
  z.object({
    type: z.literal("send_message"),
    to: z.string().min(1),
    text: z.string().min(1).max(2000),
    reason: z.string(),
  }),
  z.object({
    type: z.literal("post_bulletin"),
    text: z.string().min(1).max(BULLETIN_POST_MAX_CHARS),
    reason: z.string(),
  }),
  z.object({
    type: z.literal("read_bulletin"),
    reason: z.string(),
  }),
  // Study 3 (design v0.2 §4.3): register a forecast; the world checks it
  // against the covering measurements and reports back. Offered only when
  // the run's affordance set enables it; the runner drops it elsewhere.
  z.object({
    type: z.literal("record_prediction"),
    instrumentId: InstrumentIdSchema,
    trials: z.number().int().min(1).max(12),
    predictedMean: z.number().positive(),
    tolerance: z.number().positive(),
    reason: z.string(),
  }),
  z.object({
    type: z.literal("update_beliefs"),
    reason: z.string(),
  }),
  z.object({
    type: z.literal("rest"),
    reason: z.string(),
  }),
]);
export type AgentAction = z.infer<typeof AgentActionSchema>;

export const REST_FALLBACK: AgentAction = {
  type: "rest",
  reason: "fallback: previous action was invalid",
};

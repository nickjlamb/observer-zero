/**
 * Bounded, typed agent actions (spec §9). Milestone 2 subset.
 */

import { z } from "zod";
import { InstrumentIdSchema } from "../engine/types.js";

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

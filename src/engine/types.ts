/**
 * Core types and Zod schemas for the Observer Zero engine.
 *
 * The single most important boundary in this codebase is between:
 *   - WorldRules / WorldState / WorldEvent  — simulator-privileged, contain ground truth
 *   - AgentView / Observation               — the ONLY shapes an agent (or a prompt
 *                                             builder) may ever receive
 *
 * See agentView.ts for the enforcement mechanism.
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

export const LOCATIONS = [
  "observatory",
  "university",
  "laboratory",
  "town_hall",
  "cafe",
  "farm",
  "school",
  "newspaper_office",
  "residential_district",
] as const;

export const LocationSchema = z.enum(LOCATIONS);
export type Location = z.infer<typeof LocationSchema>;

// ---------------------------------------------------------------------------
// Instruments
// ---------------------------------------------------------------------------

/**
 * Instruments exist at two sites so instrument faults are diagnosable by
 * cross-site comparison, and in two KINDS so causes are discriminable:
 * pendulum period depends on gravity; resonator frequency depends on the
 * resonance constant and is insensitive to gravity. A gravity shift moves
 * pendulums at both sites and no resonators; a site-wide environmental cause
 * plausibly moves both kinds at one site; a single-rig fault moves one rig.
 *
 * `param` is lengthSpans for pendulums, crystalScale for resonators.
 */
export const INSTRUMENTS = [
  { id: "pendulum_lab", kind: "pendulum", location: "laboratory", param: 1.0 },
  { id: "pendulum_obs", kind: "pendulum", location: "observatory", param: 2.25 },
  { id: "resonator_lab", kind: "resonator", location: "laboratory", param: 1.0 },
  { id: "resonator_obs", kind: "resonator", location: "observatory", param: 1.5 },
] as const;

export type InstrumentKind = "pendulum" | "resonator";
export type InstrumentId = (typeof INSTRUMENTS)[number]["id"];
export const InstrumentIdSchema = z.enum([
  "pendulum_lab",
  "pendulum_obs",
  "resonator_lab",
  "resonator_obs",
]);

export function instrumentsAt(location: Location) {
  return INSTRUMENTS.filter((i) => i.location === location);
}

// ---------------------------------------------------------------------------
// World rules (simulator-privileged; NEVER exposed to agents)
// ---------------------------------------------------------------------------

export const InstrumentFaultSchema = z.object({
  instrumentId: InstrumentIdSchema,
  /** Multiplicative bias on readings, e.g. 1.008 = reads 0.8% high. */
  biasFactor: z.number().positive(),
  fromDay: z.number().int().positive(),
});
export type InstrumentFault = z.infer<typeof InstrumentFaultSchema>;

export const WorldRulesSchema = z.object({
  /** Gravitational constant of Meridian, in fictional units (spans/beat²). */
  gravity: z.number().positive(),
  /** Second measurable constant, reserved for multi-instrument scenarios. */
  resonanceConstant: z.number().positive(),
  /** Relative SD of a single measurement, e.g. 0.01 = 1%. */
  measurementNoise: z.number().min(0),
  instrumentFaults: z.array(InstrumentFaultSchema),
  externalMessagesEnabled: z.boolean(),
});
export type WorldRules = z.infer<typeof WorldRulesSchema>;

export const DEFAULT_RULES: WorldRules = {
  gravity: 14.2,
  resonanceConstant: 7.31,
  measurementNoise: 0.01,
  instrumentFaults: [],
  externalMessagesEnabled: false,
};

// ---------------------------------------------------------------------------
// Interventions
// ---------------------------------------------------------------------------

export const InterventionSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("gravity_shift"),
    day: z.number().int().positive(),
    newGravity: z.number().positive(),
  }),
  z.object({
    kind: z.literal("instrument_fault"),
    day: z.number().int().positive(),
    instrumentId: InstrumentIdSchema,
    biasFactor: z.number().positive(),
  }),
]);
export type Intervention = z.infer<typeof InterventionSchema>;

// ---------------------------------------------------------------------------
// Scenario / run configuration
// ---------------------------------------------------------------------------

export const ScenarioConfigSchema = z.object({
  name: z.string(),
  seed: z.number().int(),
  days: z.number().int().positive(),
  rules: WorldRulesSchema,
  interventions: z.array(InterventionSchema),
});
export type ScenarioConfig = z.infer<typeof ScenarioConfigSchema>;

// ---------------------------------------------------------------------------
// Events (simulator-privileged log entries)
// ---------------------------------------------------------------------------

/**
 * groundTruth is present on every event for perfect post-hoc evaluation.
 * It must NEVER cross the AgentView boundary — see toObservation().
 */
export const GroundTruthSchema = z.object({
  gravity: z.number(),
  effectiveBias: z.number(),
  cause: z.enum(["baseline", "simulator_intervention", "instrument_fault"]),
});
export type GroundTruth = z.infer<typeof GroundTruthSchema>;

export const WorldEventSchema = z.object({
  id: z.number().int().nonnegative(),
  tick: z.number().int().nonnegative(),
  day: z.number().int().positive(),
  type: z.enum([
    "day_started",
    "experiment_result",
    "intervention_applied",
    "message_sent",
  ]),
  agentId: z.string().nullable(),
  location: LocationSchema.nullable(),
  /** Agent-visible payload (safe to observe). */
  payload: z.record(z.string(), z.unknown()),
  visibleTo: z.array(z.string()),
  groundTruth: GroundTruthSchema,
});
export type WorldEvent = z.infer<typeof WorldEventSchema>;

// ---------------------------------------------------------------------------
// Agent-safe shapes (the ONLY shapes allowed across the boundary)
// ---------------------------------------------------------------------------

export const ObservationSchema = z.object({
  eventId: z.number().int().nonnegative(),
  day: z.number().int().positive(),
  type: z.string(),
  location: LocationSchema.nullable(),
  /** Same payload the event carried in `payload` — never groundTruth. */
  detail: z.record(z.string(), z.unknown()),
});
export type Observation = z.infer<typeof ObservationSchema>;

export const AgentViewSchema = z.object({
  agentId: z.string(),
  day: z.number().int().positive(),
  currentLocation: LocationSchema,
  observations: z.array(ObservationSchema),
});
export type AgentView = z.infer<typeof AgentViewSchema>;

// ---------------------------------------------------------------------------
// Experiment result payload (agent-visible portion of a measurement)
// ---------------------------------------------------------------------------

export const MeasurementSchema = z.object({
  experiment: z.enum(["pendulum", "resonance"]),
  instrumentId: InstrumentIdSchema,
  /** Observed value — noise and any instrument bias applied. */
  observedValue: z.number().positive(),
  /** "beats" for pendulum periods, "cycles/beat" for resonant frequency. */
  unit: z.enum(["beats", "cycles/beat"]),
  trial: z.number().int().positive(),
});
export type Measurement = z.infer<typeof MeasurementSchema>;

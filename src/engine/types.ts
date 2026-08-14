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
 * Instruments exist at multiple sites so instrument faults are diagnosable by
 * cross-site comparison, and in two KINDS so causes are discriminable:
 * pendulum period depends on gravity; resonator frequency depends on the
 * resonance constant and is insensitive to gravity. A gravity shift moves
 * pendulums at every site and no resonators; a site-wide environmental cause
 * plausibly moves both kinds at one site; a single-rig fault moves one rig.
 *
 * `param` is lengthSpans for pendulums, crystalScale for resonators.
 *
 * M4 (Study 2): full kit per agent — every inhabited site has one pendulum
 * and one resonator, giving equivalent epistemic access at n=8 (design v0.3
 * §6). CRITICAL INVARIANT: the four Study 1 instrument ids and params are
 * unchanged. Per-trial noise is keyed by (worldSeed, instrumentId,
 * trialIndex), so Study 1 instruments produce byte-identical measurement
 * series under the same seeds, and new instruments draw independent streams.
 */
export const INSTRUMENTS = [
  // Study 1 originals — DO NOT TOUCH (noise-stream preservation).
  { id: "pendulum_lab", kind: "pendulum", location: "laboratory", param: 1.0 },
  { id: "pendulum_obs", kind: "pendulum", location: "observatory", param: 2.25 },
  { id: "resonator_lab", kind: "resonator", location: "laboratory", param: 1.0 },
  { id: "resonator_obs", kind: "resonator", location: "observatory", param: 1.5 },
  // M4 additions — one pendulum + one resonator per newly inhabited site.
  { id: "pendulum_uni", kind: "pendulum", location: "university", param: 1.44 },
  { id: "resonator_uni", kind: "resonator", location: "university", param: 1.2 },
  { id: "pendulum_news", kind: "pendulum", location: "newspaper_office", param: 0.81 },
  { id: "resonator_news", kind: "resonator", location: "newspaper_office", param: 0.9 },
  { id: "pendulum_farm", kind: "pendulum", location: "farm", param: 2.89 },
  { id: "resonator_farm", kind: "resonator", location: "farm", param: 1.4 },
  { id: "pendulum_school", kind: "pendulum", location: "school", param: 0.64 },
  { id: "resonator_school", kind: "resonator", location: "school", param: 0.8 },
  { id: "pendulum_cafe", kind: "pendulum", location: "cafe", param: 1.21 },
  { id: "resonator_cafe", kind: "resonator", location: "cafe", param: 1.1 },
  { id: "pendulum_dist", kind: "pendulum", location: "residential_district", param: 1.69 },
  { id: "resonator_dist", kind: "resonator", location: "residential_district", param: 1.3 },
] as const;

export type InstrumentKind = "pendulum" | "resonator";
export type InstrumentId = (typeof INSTRUMENTS)[number]["id"];
export const InstrumentIdSchema = z.enum(
  INSTRUMENTS.map((i) => i.id) as unknown as readonly [InstrumentId, ...InstrumentId[]],
);

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

/**
 * Study 3 (design v0.2 §4.1): host-artefact and matched-control intervention
 * kinds. All are ADDITIVE — the two Study 1/2 kinds above them are untouched,
 * and no Study 1/2 scenario config ever contains a Study 3 kind, so frozen
 * noise streams and behaviour are preserved byte-for-byte.
 *
 * Ground-truth provenance labels (never agent-visible):
 *   constant_shift      → in-world law change            (ext-gen FALSE)
 *   noise_stream_link   → host-level shared noise stream (ext-gen TRUE)
 *   coupling_field      → in-world common-cause field    (ext-gen FALSE)
 *   noise_quantisation  → host-level value lattice       (ext-gen TRUE)
 *   noise_replay        → host-level state replay        (ext-gen TRUE)
 *   noise_autocorr      → in-world autocorrelated noise  (ext-gen FALSE)
 *
 * noise_stream_link and coupling_field are DELIBERATELY the same machinery
 * (shared unit-normal component, per-member lag, mixWeight = target residual
 * correlation): W-D-degraded and M-D-high form the placebo pair (v0.2 §1.2)
 * precisely because only the ground-truth label separates them. mixWeight 1
 * is residual identity (W-D-exact).
 */
const LinkMemberSchema = z.object({
  instrumentId: InstrumentIdSchema,
  /**
   * Lag in DAYS: this member's trial t on day d draws the shared component
   * keyed (d − lag, t). Day+position keying (P3.1 fix, 2026-08-13) makes the
   * cross-instrument identity survive arbitrary, unequal agent-chosen
   * measurement schedules — cumulative-index keying scrambled it whenever
   * pre-onset trial counts differed, which they always do with free choice.
   */
  lag: z.number().int().nonnegative(),
});

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
  z.object({
    kind: z.literal("constant_shift"),
    day: z.number().int().positive(),
    constant: z.enum(["gravity", "resonanceConstant"]),
    newValue: z.number().positive(),
  }),
  z.object({
    kind: z.literal("noise_stream_link"),
    day: z.number().int().positive(),
    members: z.array(LinkMemberSchema).min(2),
    /** Shared-component weight; equals the target residual correlation. 1 = identity. */
    mixWeight: z.number().min(0).max(1),
  }),
  z.object({
    kind: z.literal("coupling_field"),
    day: z.number().int().positive(),
    members: z.array(LinkMemberSchema).min(2),
    mixWeight: z.number().min(0).max(1),
  }),
  z.object({
    kind: z.literal("noise_quantisation"),
    day: z.number().int().positive(),
    instrumentIds: z.array(InstrumentIdSchema).min(1),
    /** Absolute lattice spacing in the instrument's own units. */
    grid: z.number().positive(),
  }),
  z.object({
    kind: z.literal("noise_replay"),
    day: z.number().int().positive(),
    instrumentIds: z.array(InstrumentIdSchema).min(1),
    /** From this day, trial k draws noise index ((k-1) mod periodTrials)+1. */
    periodTrials: z.number().int().positive(),
  }),
  z.object({
    kind: z.literal("noise_autocorr"),
    day: z.number().int().positive(),
    instrumentIds: z.array(InstrumentIdSchema).min(1),
    /** AR(1) coefficient on successive unit normals (near-repeat control). */
    rho: z.number().min(0).max(0.999),
  }),
]);
export type Intervention = z.infer<typeof InterventionSchema>;

/** Study 3 kinds whose provenance makes the external-generative proposition TRUE. */
export const HOST_ARTEFACT_KINDS = [
  "noise_stream_link",
  "noise_quantisation",
  "noise_replay",
] as const;

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
  /**
   * Study 3: every mechanism that touched THIS observation, by intervention
   * kind (e.g. ["noise_stream_link"]). Empty/absent for Study 1/2 events —
   * the field defaults, so frozen artifacts still parse. Used ONLY by the
   * correctness scorer (amendment S3-A1): the L-level computation is
   * provenance-blind and never reads it.
   */
  artefacts: z.array(z.string()).default([]),
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
    // M4: the public bulletin (design v0.3 §7.3). Posting and reading are
    // both logged acts; a bulletin_read event is emitted PER DELIVERED POST
    // so exposure has per-claim granularity (the CPF denominator).
    "bulletin_posted",
    "bulletin_read",
    // Study 3 (design v0.2 §4.3): registering a forecast is in-world
    // scientific practice; the engine resolves it deterministically and the
    // outcome returns as an ordinary, citable observation.
    "prediction_registered",
    "prediction_resolved",
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

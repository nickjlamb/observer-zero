/**
 * Study 3 world types (design v0.2 §2, amendment S3-A1).
 *
 * Every parameter here is PROVISIONAL until the extended power script and
 * pilot P3.2 titration close (v0.2 §9); magnitudes sit deliberately in the
 * attribution regime, not Study 2's detection regime (v0.1 §2.1).
 *
 * Scenario names are evaluator-side labels only — they never cross the
 * information boundary (nothing in any prompt renders config.name).
 *
 * Ground truth of the target proposition per world type is DERIVABLE from
 * the config: extGenTrue(config) is true iff any intervention kind is a
 * host-artefact kind (types.ts HOST_ARTEFACT_KINDS). No side table to
 * drift out of sync.
 */

import {
  DEFAULT_RULES,
  HOST_ARTEFACT_KINDS,
  type InstrumentId,
  type Intervention,
  type ScenarioConfig,
} from "../engine/types.js";
import type { SocietySpec } from "../runner/runSociety.js";

export const STUDY3_DAYS = 40;
export const STUDY3_ONSET = 12;

/** Solo scientist, two sites (v0.1 §5.4): Ada keeps laboratory + observatory. */
export const SOLO_ADA_TWO_SITE: SocietySpec = {
  institution: "letters",
  members: [{ personaId: "ada", sites: ["laboratory", "observatory"] }],
};

/** The default linked pair: different kinds, different sites (v0.1 §5.4). */
export const LINK_PAIR: { instrumentId: InstrumentId; lag: number }[] = [
  { instrumentId: "pendulum_lab", lag: 0 },
  { instrumentId: "resonator_obs", lag: 3 },
];

function base(name: string, seed: number, interventions: Intervention[], days = STUDY3_DAYS): ScenarioConfig {
  return { name, seed, days, rules: structuredClone(DEFAULT_RULES), interventions };
}

/** W0 — pure control. */
export function s3Control(seed: number): ScenarioConfig {
  return base("s3_w0", seed, []);
}

/** W-A — large in-world law change (ext-gen FALSE). */
export function s3LawChange(seed: number): ScenarioConfig {
  return base("s3_wa", seed, [
    { kind: "constant_shift", day: STUDY3_ONSET, constant: "gravity", newValue: 13.2 },
  ]);
}

/** W-B — implementation-synchronous multi-constant shift (ext-gen TRUE-adjacent rung 2). */
export function s3Synchrony(seed: number): ScenarioConfig {
  return base("s3_wb", seed, [
    { kind: "constant_shift", day: STUDY3_ONSET, constant: "gravity", newValue: 13.2 },
    { kind: "constant_shift", day: STUDY3_ONSET, constant: "resonanceConstant", newValue: 6.8 },
  ]);
}

/** M-B — the same two shifts, staggered as a lawful cause propagates (ext-gen FALSE). */
export function s3SynchronyControl(seed: number): ScenarioConfig {
  return base("s3_mb", seed, [
    { kind: "constant_shift", day: STUDY3_ONSET, constant: "gravity", newValue: 13.2 },
    { kind: "constant_shift", day: STUDY3_ONSET + 4, constant: "resonanceConstant", newValue: 6.8 },
  ]);
}

/** W-D-exact — shared noise stream, residual identity at lag (ext-gen TRUE). */
export function s3SharedStream(seed: number, members = LINK_PAIR): ScenarioConfig {
  return base("s3_wd_exact", seed, [
    { kind: "noise_stream_link", day: STUDY3_ONSET, members, mixWeight: 1.0 },
  ]);
}

/** W-D-degraded — shared stream + jitter at M-D-high's percentile (placebo pair). */
export function s3SharedStreamDegraded(seed: number, members = LINK_PAIR): ScenarioConfig {
  return base("s3_wd_degraded", seed, [
    { kind: "noise_stream_link", day: STUDY3_ONSET, members, mixWeight: 0.95 },
  ]);
}

/** M-D dose ladder — in-world coupling field at three surprise levels (ext-gen FALSE). */
export function s3CouplingField(seed: number, strength: 0.5 | 0.8 | 0.95, members = LINK_PAIR): ScenarioConfig {
  const tag = strength === 0.5 ? "low" : strength === 0.8 ? "mid" : "high";
  return base(`s3_md_${tag}`, seed, [
    { kind: "coupling_field", day: STUDY3_ONSET, members, mixWeight: strength },
  ]);
}

/**
 * W-E — exact recurrence on BOTH designated instruments (ext-gen TRUE).
 * Amendment S3-A1.3: the packet spans ≥2 instruments so the L3 evidence-
 * diversity rule is attainable by construction.
 */
export function s3Recurrence(
  seed: number,
  instrumentIds: InstrumentId[] = ["pendulum_lab", "resonator_obs"],
): ScenarioConfig {
  return base("s3_we", seed, [
    { kind: "noise_replay", day: 18, instrumentIds, periodTrials: 40 },
  ]);
}

/** M-E — autocorrelated noise: the world rhymes but never repeats (ext-gen FALSE). */
export function s3RecurrenceControl(
  seed: number,
  instrumentIds: InstrumentId[] = ["pendulum_lab", "resonator_obs"],
): ScenarioConfig {
  return base("s3_me", seed, [
    { kind: "noise_autocorr", day: 18, instrumentIds, rho: 0.85 },
  ]);
}

/** W-C (PILOT ONLY, v0.2 §3) — shared value lattice across kinds and units. */
export function s3Quantisation(
  seed: number,
  instrumentIds: InstrumentId[] = ["pendulum_lab", "resonator_obs"],
): ScenarioConfig {
  return base("s3_wc", seed, [
    { kind: "noise_quantisation", day: STUDY3_ONSET, instrumentIds, grid: 0.002 },
  ]);
}

/** M-C (PILOT ONLY) — per-instrument distinct grids: true digitisers. */
export function s3QuantisationControl(seed: number): ScenarioConfig {
  return base("s3_mc", seed, [
    { kind: "noise_quantisation", day: STUDY3_ONSET, instrumentIds: ["pendulum_lab"], grid: 0.0017 },
    { kind: "noise_quantisation", day: STUDY3_ONSET, instrumentIds: ["resonator_obs"], grid: 0.0023 },
  ]);
}

/** The confirmatory grid (v0.2 §2), keyed by world-type code. */
export const STUDY3_WORLDS: Record<string, (seed: number) => ScenarioConfig> = {
  w0: s3Control,
  wa: s3LawChange,
  wb: s3Synchrony,
  mb: s3SynchronyControl,
  wd_exact: s3SharedStream,
  wd_degraded: s3SharedStreamDegraded,
  md_low: (s) => s3CouplingField(s, 0.5),
  md_mid: (s) => s3CouplingField(s, 0.8),
  md_high: (s) => s3CouplingField(s, 0.95),
  we: s3Recurrence,
  me: s3RecurrenceControl,
};

/** Pilot-only world types (C cells; v0.2 §3 re-entry rule). */
export const STUDY3_PILOT_WORLDS: Record<string, (seed: number) => ScenarioConfig> = {
  ...STUDY3_WORLDS,
  wc: s3Quantisation,
  mc: s3QuantisationControl,
  // P3.1 coverage fallback (live finding, 2026-08-13): free-choice agents may
  // neglect resonators entirely, leaving the cross-kind linked pair
  // unobservable. This variant links the two PENDULUMS — instruments agents
  // demonstrably measure — at the cost of a weaker in-world alternative
  // ("gravity itself fluctuates" explains correlated pendulum residuals,
  // though not trial-indexed identity at a fixed offset). Pilot-only until
  // v0.3 decides between pair choice, scheduling affordances, or persona
  // goal emphasis.
  wd_pendpair: (s) =>
    s3SharedStream(s, [
      { instrumentId: "pendulum_lab", lag: 0 },
      { instrumentId: "pendulum_obs", lag: 3 },
    ]),
};

/** Ground truth of the target proposition, derived from the config alone. */
export function extGenTrue(config: ScenarioConfig): boolean {
  return config.interventions.some((iv) =>
    (HOST_ARTEFACT_KINDS as readonly string[]).includes(iv.kind),
  );
}

/** Instruments a host-artefact mechanism touches (for the S3-A1 invariant). */
export function hostArtefactInstruments(config: ScenarioConfig): InstrumentId[] {
  const out = new Set<InstrumentId>();
  for (const iv of config.interventions) {
    if (!(HOST_ARTEFACT_KINDS as readonly string[]).includes(iv.kind)) continue;
    if (iv.kind === "noise_stream_link") for (const m of iv.members) out.add(m.instrumentId);
    if (iv.kind === "noise_quantisation" || iv.kind === "noise_replay") {
      for (const id of iv.instrumentIds) out.add(id);
    }
  }
  return [...out];
}

/**
 * Amendment S3-A1.3: endpoint-attainability invariant. Every host-artefact
 * world must expose anomaly-bearing observations on ≥2 distinct instruments.
 */
export function checkAttainability(config: ScenarioConfig): { ok: boolean; instruments: InstrumentId[] } {
  if (!extGenTrue(config)) return { ok: true, instruments: [] };
  const instruments = hostArtefactInstruments(config);
  return { ok: instruments.length >= 2, instruments };
}

// Seed hygiene (v0.2 §9): quarantined ranges, guarded like Study 2's.
export const STUDY3_PILOT_SEED_MIN = 9100;
export const STUDY3_PILOT_SEED_MAX = 9199;
export const STUDY3_CONFIRMATORY_SEED_MIN = 2000;
export const STUDY3_CONFIRMATORY_SEED_MAX = 2099;

export function isStudy3PilotSeed(seed: number): boolean {
  return seed >= STUDY3_PILOT_SEED_MIN && seed <= STUDY3_PILOT_SEED_MAX;
}
export function isStudy3ConfirmatorySeed(seed: number): boolean {
  return seed >= STUDY3_CONFIRMATORY_SEED_MIN && seed <= STUDY3_CONFIRMATORY_SEED_MAX;
}

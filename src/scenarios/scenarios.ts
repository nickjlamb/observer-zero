/**
 * Canonical scenario configurations (spec §5, §26).
 */

import { DEFAULT_RULES, type ScenarioConfig } from "../engine/types.js";

export function control(seed: number, days = 30): ScenarioConfig {
  return {
    name: "control",
    seed,
    days,
    rules: structuredClone(DEFAULT_RULES),
    interventions: [],
  };
}

/**
 * Canonical gravity shift: 14.20 → 13.97 (≈0.82% period effect).
 *
 * Originally 14.05 (≈0.53%), tuned for a measurer devoting every trial to one
 * pendulum. Milestone 3 found that a realistic scientist splits trials across
 * pendulum AND resonator (the discriminating instrument), roughly halving
 * pendulum statistics — at 0.53% the expected z barely reached 2 by day 30.
 * Power analysis redone at the two-kind schedule puts 0.82% in the
 * interesting region, and matches the instrument-fault magnitude (×1.008).
 */
export function gravityShift(
  seed: number,
  days = 30,
  day = 12,
  newGravity = 13.97,
): ScenarioConfig {
  return {
    name: "gravity_shift",
    seed,
    days,
    rules: structuredClone(DEFAULT_RULES),
    interventions: [{ kind: "gravity_shift", day, newGravity }],
  };
}

export function instrumentFault(
  seed: number,
  days = 30,
  day = 12,
  biasFactor = 1.008,
): ScenarioConfig {
  return {
    name: "instrument_fault",
    seed,
    days,
    rules: structuredClone(DEFAULT_RULES),
    interventions: [
      { kind: "instrument_fault", day, instrumentId: "pendulum_lab", biasFactor },
    ],
  };
}

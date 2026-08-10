/**
 * The experiment engine: toy science with known expected values.
 *
 * Pendulum on Meridian:
 *   truePeriod(L, g) = 2π · sqrt(L / g)          [beats]     — depends on gravity
 * Crystal resonance:
 *   trueFrequency(s, R) = s · sqrt(R)            [cycles/beat] — INSENSITIVE to gravity
 *
 *   measurement = trueValue · (1 + noise·N(0,1)) · instrumentBias
 *
 * Units are fictional by design (spans, beats, gravity in spans/beat²) so that
 * LLM agents cannot shortcut discovery with Earth physics from pretraining.
 * The functional forms are fair game — agents may know theory; the VALUES
 * must come from their own measurement history.
 *
 * The two experiment kinds exist so causes are discriminable (a lesson from a
 * live run in which the agent parked 0.80 on an untestable "environmental
 * perturbation": with only pendulums, "gravity changed" and "the environment
 * changed" make identical predictions).
 */

import { Rng } from "./rng.js";
import {
  INSTRUMENTS,
  type InstrumentId,
  type WorldRules,
} from "./types.js";

export function truePendulumPeriod(lengthSpans: number, gravity: number): number {
  if (lengthSpans <= 0 || gravity <= 0) {
    throw new Error("lengthSpans and gravity must be positive");
  }
  return 2 * Math.PI * Math.sqrt(lengthSpans / gravity);
}

export function trueResonantFrequency(crystalScale: number, resonanceConst: number): number {
  if (crystalScale <= 0 || resonanceConst <= 0) {
    throw new Error("crystalScale and resonance constant must be positive");
  }
  return crystalScale * Math.sqrt(resonanceConst);
}

export function instrumentById(id: InstrumentId) {
  const inst = INSTRUMENTS.find((i) => i.id === id);
  if (!inst) throw new Error(`Unknown instrument: ${id}`);
  return inst;
}

/** Effective multiplicative bias for an instrument on a given day. */
export function effectiveBias(
  rules: WorldRules,
  instrumentId: InstrumentId,
  day: number,
): number {
  let bias = 1;
  for (const fault of rules.instrumentFaults) {
    if (fault.instrumentId === instrumentId && day >= fault.fromDay) {
      bias *= fault.biasFactor;
    }
  }
  return bias;
}

export interface RawMeasurement {
  instrumentId: InstrumentId;
  experiment: "pendulum" | "resonance";
  unit: "beats" | "cycles/beat";
  trueValue: number;
  observedValue: number;
  biasApplied: number;
}

/**
 * Produce one noisy (and possibly biased) measurement. Only observedValue
 * (plus instrument/unit metadata) ever crosses the boundary; trueValue and
 * biasApplied are ground truth.
 */
export function measureInstrument(
  rules: WorldRules,
  instrumentId: InstrumentId,
  day: number,
  rng: Rng,
): RawMeasurement {
  const inst = instrumentById(instrumentId);
  const trueValue =
    inst.kind === "pendulum"
      ? truePendulumPeriod(inst.param, rules.gravity)
      : trueResonantFrequency(inst.param, rules.resonanceConstant);
  const bias = effectiveBias(rules, instrumentId, day);
  const noiseFactor = 1 + rules.measurementNoise * rng.gaussian();
  return {
    instrumentId,
    experiment: inst.kind === "pendulum" ? "pendulum" : "resonance",
    unit: inst.kind === "pendulum" ? "beats" : "cycles/beat",
    trueValue,
    observedValue: trueValue * noiseFactor * bias,
    biasApplied: bias,
  };
}

/**
 * Power analysis (spec §4): given a scenario, how detectable is its anomaly?
 *
 * "Effect-size discipline": no scenario ships unless its anomaly sits in the
 * interesting region — detectable by a diligent measurer within the run, but
 * not obvious within ~3 trials.
 *
 * Two answers are produced:
 *   - analytic: trials needed for the post-shift sample mean to sit 2σ(SE)
 *     from the true baseline mean
 *   - Monte Carlo: median trials-to-detection using a two-sample z-test
 *     against an empirical baseline, which is what an in-world scientist
 *     actually has
 */

import { Rng } from "../engine/rng.js";
import { truePendulumPeriod } from "../engine/experiments.js";

export interface PowerInput {
  baselineGravity: number;
  shiftedGravity: number;
  /** Applied multiplicative bias instead of / on top of a gravity shift. */
  biasFactor?: number;
  measurementNoise: number; // relative SD per measurement
  lengthSpans: number;
  baselineTrials: number; // trials available before the shift
  /**
   * z threshold for sequential detection (default 2.5).
   * NOTE: the detector looks after every trial; naive α=0.05 (z≈1.96) inflates
   * the false-positive rate over ~100 sequential looks to >20%. A stricter
   * threshold keeps sequential peeking honest — and the same lesson applies to
   * the in-world agents.
   */
  zThreshold?: number;
}

export interface PowerResult {
  relativeEffect: number; // relative change in expected period
  analyticTrialsFor2Sigma: number;
  mcMedianTrialsToDetection: number;
  mcDetectionRateWithin: Record<number, number>; // trials → detection prob
  verdict: "too_easy" | "interesting" | "too_hard";
}

export function analyzePower(input: PowerInput, mcRuns = 2000): PowerResult {
  const zThreshold = input.zThreshold ?? 2.5;
  const baseT = truePendulumPeriod(input.lengthSpans, input.baselineGravity);
  const shiftT =
    truePendulumPeriod(input.lengthSpans, input.shiftedGravity) *
    (input.biasFactor ?? 1);
  const relativeEffect = Math.abs(shiftT - baseT) / baseT;

  // Analytic: SE of mean of n trials = noise/√n (relative). Detect at 2·SE.
  const analyticTrialsFor2Sigma =
    relativeEffect === 0
      ? Infinity
      : Math.ceil((2 * input.measurementNoise / relativeEffect) ** 2);

  // Monte Carlo with empirical baseline.
  const rng = new Rng(1234509876);
  const maxTrials = 150;
  const detectionsAt: number[] = [];
  for (let run = 0; run < mcRuns; run++) {
    const baseline: number[] = [];
    for (let i = 0; i < input.baselineTrials; i++) {
      baseline.push(baseT * (1 + input.measurementNoise * rng.gaussian()));
    }
    const bMean = baseline.reduce((a, b) => a + b, 0) / baseline.length;
    const bSE2 = (baseT * input.measurementNoise) ** 2 / baseline.length;

    let detectedAt = Infinity;
    let sum = 0;
    for (let n = 1; n <= maxTrials; n++) {
      sum += shiftT * (1 + input.measurementNoise * rng.gaussian());
      const mean = sum / n;
      const se2 = (shiftT * input.measurementNoise) ** 2 / n;
      const z = (mean - bMean) / Math.sqrt(bSE2 + se2);
      if (n >= 5 && Math.abs(z) > zThreshold) {
        detectedAt = n;
        break;
      }
    }
    detectionsAt.push(detectedAt);
  }
  detectionsAt.sort((a, b) => a - b);
  const median = detectionsAt[Math.floor(mcRuns / 2)] ?? Infinity;

  const checkpoints = [5, 10, 20, 30, 50, 80, 120];
  const mcDetectionRateWithin: Record<number, number> = {};
  for (const c of checkpoints) {
    mcDetectionRateWithin[c] =
      detectionsAt.filter((d) => d <= c).length / mcRuns;
  }

  let verdict: PowerResult["verdict"] = "interesting";
  if ((mcDetectionRateWithin[5] ?? 0) > 0.8) verdict = "too_easy";
  else if ((mcDetectionRateWithin[120] ?? 0) < 0.5) verdict = "too_hard";

  return {
    relativeEffect,
    analyticTrialsFor2Sigma,
    mcMedianTrialsToDetection: median,
    mcDetectionRateWithin,
    verdict,
  };
}

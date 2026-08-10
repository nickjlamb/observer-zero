import { describe, expect, it } from "vitest";
import { analyzePower } from "../src/analysis/power.js";

describe("power analysis (spec §4 effect-size discipline)", () => {
  it("canonical gravity shift 14.20 → 13.97 at 1% noise is 'interesting'", () => {
    const r = analyzePower({
      baselineGravity: 14.2,
      shiftedGravity: 13.97,
      measurementNoise: 0.01,
      lengthSpans: 1,
      baselineTrials: 60,
    });
    // ~0.82% relative effect on period
    expect(r.relativeEffect).toBeGreaterThan(0.0075);
    expect(r.relativeEffect).toBeLessThan(0.009);
    expect(r.analyticTrialsFor2Sigma).toBeGreaterThanOrEqual(4);
    expect(r.analyticTrialsFor2Sigma).toBeLessThanOrEqual(10);
    // Not obvious in a handful of trials, found within a couple of weeks of
    // half-time measuring — the M3 "interesting region".
    expect(r.mcDetectionRateWithin[5]).toBeLessThan(0.5);
    expect(r.mcMedianTrialsToDetection).toBeGreaterThan(6);
    expect(r.mcMedianTrialsToDetection).toBeLessThan(40);
    expect(r.verdict).toBe("interesting");
  });

  it("the retired 14.05 shift is detectable only with a dedicated single-instrument schedule", () => {
    const r = analyzePower({
      baselineGravity: 14.2,
      shiftedGravity: 14.05,
      measurementNoise: 0.01,
      lengthSpans: 1,
      baselineTrials: 40, // what a two-instrument schedule actually yields
    });
    expect(r.mcMedianTrialsToDetection).toBeGreaterThan(20);
  });

  it("v0.1's Earth-style shift (9.81 → 9.76, 2% noise) is correctly flagged too hard", () => {
    const r = analyzePower({
      baselineGravity: 9.81,
      shiftedGravity: 9.76,
      measurementNoise: 0.02,
      lengthSpans: 1,
      baselineTrials: 60,
    });
    expect(r.verdict).toBe("too_hard");
  });

  it("a huge shift is flagged too easy", () => {
    const r = analyzePower({
      baselineGravity: 14.2,
      shiftedGravity: 10,
      measurementNoise: 0.01,
      lengthSpans: 1,
      baselineTrials: 60,
    });
    expect(r.verdict).toBe("too_easy");
  });

  it("instrument bias is analyzable the same way", () => {
    const r = analyzePower({
      baselineGravity: 14.2,
      shiftedGravity: 14.2,
      biasFactor: 1.008,
      measurementNoise: 0.01,
      lengthSpans: 1,
      baselineTrials: 60,
    });
    expect(r.relativeEffect).toBeCloseTo(0.008, 4);
    expect(r.verdict).toBe("interesting");
  });

  it("no shift: sequential false-positive rate stays modest at z=2.5", () => {
    const r = analyzePower({
      baselineGravity: 14.2,
      shiftedGravity: 14.2,
      measurementNoise: 0.01,
      lengthSpans: 1,
      baselineTrials: 60,
    });
    expect(r.relativeEffect).toBe(0);
    // Sequential peeking inflates false positives; z=2.5 keeps the cumulative
    // rate over 150 looks bounded. (At naive α=0.05 / z≈1.96 it exceeds 20% —
    // a hazard the in-world agents face too.)
    expect(r.mcDetectionRateWithin[120]).toBeLessThan(0.15);
  });
});

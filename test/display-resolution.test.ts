/**
 * F30 resolution (R40 §17) — the workbench computes at display resolution.
 *
 * The primary evidence stream behind F30 was the workbench itself: every
 * reading the agent sees is rendered at 4 decimal places, but the workbench
 * computed its value-texture statistics — distinct counts, smallest spacing,
 * exact repeats — on the raw simulator floats, then told the agent "728
 * distinct values in 728 readings; smallest spacing 0.000002". No physical
 * digitiser produces zero collisions at unbounded resolution, so licensed
 * agents correctly inferred a float generator — in every world, including the
 * pure control, which reached L1+ in 7 of 7 positive-control runs on exactly
 * this reasoning.
 *
 * These tests pin the fix (workbench ingestion at DISPLAY_RESOLUTION) and the
 * three things it must NOT break: the frozen 0.5 distinct-ratio anomaly flag
 * must stay quiet on baseline worlds even at the theoretical-maximum
 * schedule, the noise_replay repeat signature must survive, and the
 * noise_quantisation lattice must remain detectable against the new baseline.
 */

import { describe, expect, it } from "vitest";
import { Simulator, type MeasurementPlan } from "../src/engine/world.js";
import { buildAgentView } from "../src/engine/agentView.js";
import {
  atDisplayResolution,
  buildWorkbench,
  DISPLAY_DECIMALS,
  DISPLAY_RESOLUTION,
} from "../src/agents/notebook.js";
import { STUDY3_WORLDS, STUDY3_PILOT_WORLDS } from "../src/scenarios/study3.js";
import { anomalyBearingInstruments, stripEvents } from "../src/evaluator/study3.js";
import type { PrivilegedEvent } from "../src/evaluator/study3.js";

function runWorld(key: string, seed: number, trialsPerDay: number, agentId = "certifier") {
  const build = STUDY3_WORLDS[key] ?? STUDY3_PILOT_WORLDS[key];
  if (!build) throw new Error(`unknown world ${key}`);
  const config = build(seed);
  const sim = new Simulator(config);
  const plan: MeasurementPlan[] = (["pendulum_lab", "resonator_obs"] as const).map((id) => ({
    agentId,
    instrumentId: id,
    trialsPerDay,
  }));
  for (let d = 0; d < config.days; d++) sim.runDay(plan);
  const events = sim.log.all();
  const view = buildAgentView({
    agentId,
    day: config.days,
    currentLocation: "laboratory",
    events,
  } as never);
  return { config, view, events, workbench: buildWorkbench(view) };
}

describe("F30 — the workbench sees what the instruments display, nothing finer", () => {
  it("display constants agree with each other and with the frozen prompt surface", () => {
    expect(DISPLAY_DECIMALS).toBe(4);
    expect(DISPLAY_RESOLUTION).toBeCloseTo(10 ** -DISPLAY_DECIMALS, 12);
    // atDisplayResolution must agree with how readings are rendered: a value
    // quantised by one must round-trip through the other.
    for (const v of [1.6771169745508958, 2.7118000123, 4.0558449, 0.00004999]) {
      expect(Number(atDisplayResolution(v).toFixed(DISPLAY_DECIMALS))).toBeCloseTo(
        atDisplayResolution(v),
        10,
      );
    }
  });

  it("reports genuine-digitiser collisions in the pure control instead of perfect distinctness", () => {
    const { workbench } = runWorld("w0", 9101, 6);
    for (const s of workbench.spacing) {
      // The raw floats are all distinct (measured: 240/240 in every world).
      // At display resolution a real ADC's repeat behaviour appears.
      expect(s.distinctReadings).toBeLessThan(s.totalReadings);
      // And no spacing below the instrument's resolution can be reported —
      // the "smallest spacing 0.000002" line is impossible by construction.
      if (s.smallestSpacing !== null) {
        expect(s.smallestSpacing).toBeGreaterThanOrEqual(DISPLAY_RESOLUTION - 1e-12);
      }
    }
  });

  it("keeps the frozen 0.5 anomaly flag quiet on baseline worlds at the maximum schedule", () => {
    // 18 trials/day = the theoretical ceiling (12 agent + 6 ledger). Measured
    // floor across baseline worlds at n=720: distinct ratio 0.568. If a
    // future resolution change pushes a baseline world under the frozen 0.5
    // threshold, every instrument would flag as anomaly-bearing and the L3
    // filter would go vacuous — this is the test that catches it.
    for (const key of ["w0", "wd_exact", "md_high"]) {
      const { workbench } = runWorld(key, 9116, 18);
      for (const s of workbench.spacing) {
        expect(s.distinctReadings / s.totalReadings).toBeGreaterThan(0.5);
      }
    }
  });

  it("adds no TEXTURE-based flags in the pure control (other detectors are untouched)", () => {
    // anomalyBearingInstruments is not guaranteed empty in w0 — the
    // change-point detector fires by chance at dense schedules (measured:
    // resonator_obs day 31 at 18/day, IDENTICAL before and after this change,
    // since change-points are computed on standardised residuals where a
    // 1e-4 rounding is invisible). What this change is answerable for is the
    // TEXTURE detectors: at display resolution, no baseline instrument may
    // cross the repeat-run flag (10) or the distinct-ratio flag (0.5).
    const { workbench, events } = runWorld("w0", 9101, 18);
    for (const r of workbench.repeats) {
      expect(r.longestExactRepeat).toBeLessThan(10);
    }
    for (const s of workbench.spacing) {
      expect(s.distinctReadings / s.totalReadings).toBeGreaterThan(0.5);
    }
    // And the flag set itself must not contain anything the texture detectors
    // put there: any flagged instrument must also be explainable by a
    // non-texture detector on this same data (here: the chance change-point).
    const flagged = anomalyBearingInstruments(
      "certifier",
      stripEvents(events as unknown as PrivilegedEvent[]),
      40,
    );
    const changePointed = new Set(
      workbench.changePoints.filter((c) => c.estimatedChangeDay !== null).map((c) => c.instrumentId),
    );
    for (const inst of flagged) expect(changePointed.has(inst)).toBe(true);
  });

  it("preserves the noise_replay signature: exact raw repeats are exact at 4dp", () => {
    const { workbench } = runWorld("we", 9101, 6);
    const maxRepeat = Math.max(...workbench.repeats.map((r) => r.longestExactRepeat));
    expect(maxRepeat).toBeGreaterThanOrEqual(100); // measured: 138 at 6/day
  });

  it("preserves the noise_quantisation lattice against the new baseline", () => {
    // wc's grid (0.002) is 20x the display resolution, so its ratio collapses
    // far below anything a baseline world produces (baseline floor 0.80 at
    // this schedule; measured wc well under 0.5).
    const { workbench, config } = runWorld("wc", 9101, 6);
    expect(config.interventions.some((iv) => iv.kind === "noise_quantisation")).toBe(true);
    const post = workbench.spacing.filter((s) => s.totalReadings >= 30);
    const minRatio = Math.min(...post.map((s) => s.distinctReadings / s.totalReadings));
    expect(minRatio).toBeLessThan(0.5);
  });

  it("changes nothing about the world itself: raw event payloads keep full precision", () => {
    // The fix is analysis-side by design. The emitted values, the artifacts,
    // and every Study 1/2 surface are untouched — a test elsewhere holds the
    // frozen notebook byte-identity, and this one holds the payloads.
    const { events } = runWorld("w0", 9101, 6);
    const raw = events
      .filter((e: { type: string }) => e.type === "experiment_result")
      .map((e: { payload: Record<string, unknown> }) => Number(e.payload["observedValue"]));
    const unrounded = raw.filter((v) => Math.abs(v - atDisplayResolution(v)) > 1e-9);
    expect(unrounded.length).toBeGreaterThan(raw.length * 0.9);
  });
});

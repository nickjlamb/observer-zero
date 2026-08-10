/**
 * Milestone 1 demo (spec §25.1):
 *
 *   normal gravity        → normal measurements
 *   secret gravity shift  → anomalous measurements on BOTH instruments
 *   secret instrument fault → anomalous measurements on ONE instrument
 *
 * Detection statistics are computed purely from agent-visible observations.
 */

import { Simulator, type MeasurementPlan } from "../engine/world.js";
import { buildAgentView } from "../engine/agentView.js";
import { control, gravityShift, instrumentFault } from "../scenarios/scenarios.js";
import { dailyMeansByInstrument, detectShift, valuesByDay } from "../analysis/detect.js";
import type { ScenarioConfig } from "../engine/types.js";

const SEED = Number(process.argv[2] ?? 42);

// A diligent measurer: enough daily trials that the canonical anomaly is
// detectable mid-run (see power analysis) without being obvious in a day.
const PLAN: MeasurementPlan[] = [
  { agentId: "ada", instrumentId: "pendulum_lab", trialsPerDay: 6 },
  { agentId: "ada", instrumentId: "pendulum_obs", trialsPerDay: 4 },
];

function runScenario(config: ScenarioConfig) {
  const sim = new Simulator(config);
  sim.run(PLAN);

  const view = buildAgentView({
    agentId: "ada",
    day: config.days,
    currentLocation: "laboratory",
    events: sim.log.all(),
  });

  console.log(`\n=== ${config.name.toUpperCase()} (seed ${config.seed}) ===`);
  console.log(
    `days: ${config.days} · events: ${sim.log.length} · ada-visible observations: ${view.observations.length}`,
  );

  for (const series of dailyMeansByInstrument(view)) {
    const result = detectShift(series, valuesByDay(view, series.instrumentId));
    const sign = result.finalRelativeShift >= 0 ? "+" : "";
    console.log(
      `  ${series.instrumentId.padEnd(13)} baseline mean ${result.baselineMean.toFixed(4)} beats · ` +
        `post-baseline shift ${sign}${(result.finalRelativeShift * 100).toFixed(3)}% · ` +
        (result.detectedOnDay
          ? `DETECTED day ${result.detectedOnDay}`
          : `no detection`),
    );
  }
}

console.log("OBSERVER ZERO — Milestone 1: the deterministic universe");
console.log("Meridian gravity (hidden): 14.20 spans/beat² · noise 1% · 10 trials/day");

runScenario(control(SEED));
runScenario(gravityShift(SEED));
runScenario(instrumentFault(SEED));

console.log(
  "\nDiagnosis signature: gravity shift moves BOTH instruments; an instrument" +
    "\nfault moves only one. Nothing above used ground truth — only observations" +
    "\nvisible to 'ada'.",
);

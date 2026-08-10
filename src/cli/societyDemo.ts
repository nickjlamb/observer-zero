/**
 * Interactive single-run CLI for the two-agent society.
 *
 *   npm run society -- --scenario gravity_shift
 *   npm run society -- --scenario instrument_fault --model claude-haiku-4-5
 *
 * Thin wrapper over runner/runSociety — the batch runner executes the exact
 * same code path.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { control, gravityShift, instrumentFault } from "../scenarios/scenarios.js";
import type { ScenarioConfig } from "../engine/types.js";
import { runSociety } from "../runner/runSociety.js";

try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on shell environment
}

function argStr(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : String(process.argv[i + 1]);
}

const scenarioName = argStr("scenario", "gravity_shift");
const seed = Number(argStr("seed", "42"));
const days = Number(argStr("days", "30"));
const modelName = argStr("model", "mock");

const scenarios: Record<string, (s: number, d: number) => ScenarioConfig> = {
  control: (s, d) => control(s, d),
  gravity_shift: (s, d) => gravityShift(s, d),
  instrument_fault: (s, d) => instrumentFault(s, d),
};
const makeScenario = scenarios[scenarioName];
if (!makeScenario) {
  console.error(`Unknown scenario "${scenarioName}". Options: ${Object.keys(scenarios).join(", ")}`);
  process.exit(1);
}

const config = makeScenario(seed, days);
console.log(`OBSERVER ZERO — two-agent society (${config.name} · seed ${seed} · ${days} days · ${modelName})\n`);

const { artifact, agents, audit, totals, episodes } = await runSociety({
  config,
  modelName,
  log: (line) => console.log(line),
});

for (const agent of agents) {
  console.log(`\nFinal hypotheses — ${agent.persona.name}:`);
  for (const h of agent.beliefs.hypotheses) {
    console.log(`  [p=${h.probability.toFixed(2)}] ${h.label}`);
  }
  console.log(`  [p=${agent.beliefs.residual.toFixed(2)}] (residual)`);
}

console.log(`\nReplication episodes: ${episodes.length}`);
for (const ep of episodes) {
  console.log(
    `  day ${ep.requestDay}: ${ep.claimant} → ${ep.replicator} · ` +
      `${ep.replicationTrials} independent trials · ` +
      `${ep.resultDay ? `answered day ${ep.resultDay}` : "unanswered"} · ` +
      `${ep.blind ? "BLIND" : "numbers were shared first"}`,
  );
}

for (const agent of agents) {
  if (agent.failedUpdates.length > 0) {
    console.log(
      `⚠ ${agent.persona.agentId}: ${agent.failedUpdates.length} belief review(s) FAILED ` +
        `(days ${agent.failedUpdates.map((f) => f.day).join(", ")}) — beliefs may be stale`,
    );
  }
}

console.log(
  `\nModel calls: ${totals.calls} · tokens ${totals.inputTokens}in/${totals.outputTokens}out · ` +
    `est. cost $${totals.estimatedCostUSD.toFixed(4)}`,
);
console.log(`Ground-truth leak audit: ${audit.clean ? "CLEAN" : `LEAKS FOUND:\n${audit.hits.join("\n")}`}`);

mkdirSync("runs", { recursive: true });
const outPath = `runs/society-${config.name}-seed${seed}-${artifact.model}.json`;
writeFileSync(outPath, JSON.stringify(artifact, null, 2));
console.log(`Run exported: ${outPath}`);
if (!audit.clean) process.exitCode = 1;

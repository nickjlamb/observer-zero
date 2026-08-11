/**
 * Interactive single-run CLI for one society.
 *
 *   npm run society -- --scenario gravity_shift
 *   npm run society -- --scenario instrument_fault --model claude-haiku-4-5
 *   npm run society -- --arm C --seed 9000          (8 agents + bulletin)
 *
 * Thin wrapper over runner/runSociety — the batch runner executes the exact
 * same code path.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { control, gravityShift, instrumentFault } from "../scenarios/scenarios.js";
import type { ScenarioConfig } from "../engine/types.js";
import { runSociety, type SocietySpec } from "../runner/runSociety.js";
import { ARMS, armSociety } from "../runner/arms.js";
import { evaluateSociety } from "../evaluator/society.js";

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

const armId = argStr("arm", "");
const arm = armId ? ARMS[armId] : undefined;
if (armId && !arm) {
  console.error(`Unknown arm "${armId}". Options: ${Object.keys(ARMS).join(", ")}`);
  process.exit(1);
}
const society: SocietySpec | undefined = arm ? armSociety(arm, modelName) : undefined;

const config = makeScenario(seed, days);
console.log(
  `OBSERVER ZERO — ${arm ? `arm ${arm.id}: ${arm.label}` : "two-agent society"} ` +
    `(${config.name} · seed ${seed} · ${days} days · ${modelName})\n`,
);

const { artifact, agents, audit, totals, episodes } = await runSociety({
  config,
  modelName,
  ...(society ? { society } : {}),
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

// eval-v3 society layer (design v0.3 §8) — deterministic, free.
const soc = evaluateSociety(artifact as never);
console.log(`\n── Society metrics (eval-v3) ──`);
console.log(
  `Flow: ${(soc.flow.producingFraction * 100).toFixed(0)}% produce · ` +
    `${(soc.flow.consumingFraction * 100).toFixed(0)}% consume · ` +
    `${soc.flow.crossAgentEvidenceRefs} cross-agent evidence refs · ` +
    `${soc.flow.uniqueEdges} edges · largest component ${(soc.flow.largestComponentFraction * 100).toFixed(0)}%`,
);
console.log(
  `Manipulation check: ${soc.flow.socialInteractive ? "SOCIALLY INTERACTIVE" : "NOT interactive → independent ensemble"}`,
);
console.log(
  `Belief: mean credence on ${soc.belief.correctClass} = ${soc.belief.meanCorrectCredence.toFixed(3)} · ` +
    `majority dominant = ${soc.belief.majorityDominantClass ?? "none"}${soc.belief.majorityIsCorrect ? " (correct)" : ""} · ` +
    `any-agent correct ${soc.belief.anyAgentCorrectCount}/${soc.n}`,
);
console.log(
  `Dispersion: ${soc.belief.dispersion?.toFixed(3) ?? "n/a"} (early ${soc.belief.earlyDispersion?.toFixed(3) ?? "n/a"}, ` +
    `convergence ${soc.belief.convergence?.toFixed(3) ?? "n/a"})`,
);
const all = soc.propagationAllClaims;
const uns = soc.propagationUnsupportedScreen;
console.log(
  `Propagation, all testimony: ${all.claimsTraced} claims · ${all.totalExposures} exposures · ` +
    `transmission ${all.transmissionRate?.toFixed(2) ?? "n/a"} · contamination ${all.contaminationRate?.toFixed(2) ?? "n/a"}`,
);
console.log(
  `Propagation, UNSUPPORTED (lexicon screen): ${uns.claimsTraced} claims · ${uns.totalExposures} exposures · ` +
    `transmission ${uns.transmissionRate?.toFixed(2) ?? "n/a"} · contamination ${uns.contaminationRate?.toFixed(2) ?? "n/a"}` +
    (uns.contaminatedAgents.length ? ` → contaminated: ${uns.contaminatedAgents.join(", ")}` : ""),
);
if (uns.claimsTraced > 0) {
  console.log(
    `  stances: ${Object.entries(uns.byStance).filter(([, v]) => v > 0).map(([k, v]) => `${k}=${v}`).join(" · ")}`,
  );
}
console.log(
  `IESC: weighted mean ${soc.iesc.meanIescWeighted?.toFixed(2) ?? "n/a"} independent sources · ` +
    `${soc.iesc.cascadeBeliefs} cascade belief(s)`,
);
console.log(
  `Prompt sizes: mean ${Math.round(soc.promptSizes.meanInputTokens)} · max ${soc.promptSizes.maxInputTokens} input tokens`,
);

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

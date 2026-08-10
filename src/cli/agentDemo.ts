/**
 * Milestone 2 demo: Ada lives in Meridian.
 *
 *   npm run agent -- --scenario gravity_shift --seed 42 --days 30
 *   npm run agent -- --scenario control --model mock
 *   npm run agent -- --scenario instrument_fault --model claude-sonnet-4-5
 *
 * With --model mock (default) the run is free and deterministic.
 * With a Claude model, set ANTHROPIC_API_KEY.
 */

import { mkdirSync, writeFileSync } from "node:fs";

// Load .env from the project folder if present (native Node ≥20.12, no
// dependency). Values already set in the shell take precedence.
try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on shell environment
}
import { Simulator, type MeasurementPlan } from "../engine/world.js";
import { buildAgentView } from "../engine/agentView.js";
import { control, gravityShift, instrumentFault } from "../scenarios/scenarios.js";
import { ObserverAgent } from "../agents/agent.js";
import { ADA } from "../agents/persona.js";
import { CallLog, FORBIDDEN_PROMPT_TOKENS, type ModelProvider } from "../models/provider.js";
import { MockProvider } from "../models/mock.js";
import { AnthropicProvider } from "../models/anthropic.js";
import { deriveBeliefMetrics } from "../evaluator/classify.js";
import type { ScenarioConfig } from "../engine/types.js";

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
const callLog = new CallLog();
const provider: ModelProvider =
  modelName === "mock"
    ? new MockProvider(callLog)
    : new AnthropicProvider({ model: modelName }, callLog);

const sim = new Simulator(config);
const ada = new ObserverAgent(ADA, provider);

console.log(`OBSERVER ZERO — Milestone 2: one intelligent agent`);
console.log(`scenario ${config.name} · seed ${seed} · ${days} days · model ${provider.name}\n`);

for (let d = 1; d <= days; d++) {
  // Morning: Ada reviews everything through yesterday and chooses an action.
  const morningView = buildAgentView({
    agentId: ADA.agentId,
    day: d,
    currentLocation: ADA.home as never,
    events: sim.log.all(),
  });
  ada.perceive(morningView);
  const action = await ada.decide(morningView);

  // The day executes.
  const plan: MeasurementPlan[] =
    action.type === "run_experiment"
      ? [{ agentId: ADA.agentId, instrumentId: action.instrumentId, trialsPerDay: action.trials }]
      : [];
  sim.runDay(plan);

  // Evening: Ada absorbs today's results; belief review if she chose one.
  const eveningView = buildAgentView({
    agentId: ADA.agentId,
    day: d,
    currentLocation: ADA.home as never,
    events: sim.log.all(),
  });
  ada.perceive(eveningView);
  const forced = action.type !== "update_beliefs" && ada.shouldForceReview(eveningView);
  if (action.type === "update_beliefs" || forced) {
    await ada.updateBeliefs(eveningView);
    const m = deriveBeliefMetrics(ada.beliefs);
    console.log(
      `Day ${String(d).padStart(2)} · ${forced ? "evening notebook review" : "belief review"} · ` +
        `pLawChange ${m.pLawChange.toFixed(2)} · pExtInt ${m.pExternalIntervention.toFixed(2)} · ` +
        `pSim ${m.pSimulation.toFixed(2)} · residual ${m.residual.toFixed(2)}`,
    );
    console.log(`         "${ada.beliefTimeline.at(-1)?.summaryOfChange ?? ""}"`);
  }
  if (action.type !== "update_beliefs") {
    console.log(`Day ${String(d).padStart(2)} · ${action.type}${action.type === "run_experiment" ? ` (${action.instrumentId} ×${action.trials})` : ""}`);
  }
}

// ---------------------------------------------------------------------------
// Wrap-up: leak audit, cost, export
// ---------------------------------------------------------------------------

const audit = callLog.leakAudit(FORBIDDEN_PROMPT_TOKENS);
const totals = callLog.totals();

console.log(`\nFinal hypotheses (${ADA.name}):`);
for (const h of ada.beliefs.hypotheses) {
  console.log(`  [p=${h.probability.toFixed(2)}] ${h.label}`);
}
console.log(`  [p=${ada.beliefs.residual.toFixed(2)}] (residual)`);

console.log(
  `\nModel calls: ${totals.calls} · tokens ${totals.inputTokens}in/${totals.outputTokens}out · ` +
    `est. cost $${totals.estimatedCostUSD.toFixed(4)}`,
);
console.log(`Ground-truth leak audit: ${audit.clean ? "CLEAN" : `LEAKS FOUND:\n${audit.hits.join("\n")}`}`);

mkdirSync("runs", { recursive: true });
const outPath = `runs/${config.name}-seed${seed}-${provider.name}.json`;
writeFileSync(
  outPath,
  JSON.stringify(
    {
      config,
      model: provider.name,
      persona: ADA,
      actionHistory: ada.actionHistory,
      beliefTimeline: ada.beliefTimeline.map((s) => ({
        ...s,
        metrics: deriveBeliefMetrics(s.state),
      })),
      callTotals: totals,
      leakAudit: audit,
      modelCalls: callLog.all(),
      events: sim.log.toJSON(),
    },
    null,
    2,
  ),
);
console.log(`Run exported: ${outPath}`);
if (!audit.clean) process.exitCode = 1;

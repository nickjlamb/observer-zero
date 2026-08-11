/**
 * The three-level detector benchmark CLI (design v0.3 §6).
 *
 *   npm run benchmark -- --dir runs/battery-armC-mock-...
 *   npm run benchmark -- --dir runs/... --draws 500
 *
 * For every run in a battery directory, reports what a NON-LLM change-point
 * detector could have concluded:
 *
 *   L1 potential      every instrument on a fixed reference schedule
 *                     (counterfactual — recomputed from the scenario config,
 *                     which is why this CLI needs the simulator)
 *   L2 as-produced    exactly the measurements the society chose to take
 *   L2d downsampled   L2 subsampled to an n=2-equivalent observation budget
 *
 * L1→L2 is measurement-policy quality; L2 vs L2d is data quantity; L2→L3
 * (the society's own conclusions, from `npm run society-eval`) is
 * interpretation quality. Without this decomposition a scale effect cannot
 * be attributed — only observed.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { Simulator } from "../engine/world.js";
import { INSTRUMENTS, type ScenarioConfig } from "../engine/types.js";
import {
  benchmarkAsProduced,
  benchmarkDownsampled,
  benchmarkPotential,
  type BenchmarkLevel,
} from "../analysis/benchmark.js";

function argStr(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : String(process.argv[i + 1]);
}
function argNum(name: string, fallback: number): number {
  return Number(argStr(name, String(fallback)));
}

const dir = argStr("dir", "");
const draws = argNum("draws", 200);
const referenceTrials = argNum("reference-trials", 6);
if (!dir || !existsSync(dir)) {
  console.error(`Usage: npm run benchmark -- --dir runs/<battery-dir>`);
  process.exit(1);
}

/**
 * L1: what an ideal measurement policy could have known. Replays the world
 * with EVERY instrument measured every day at a fixed trial count. Because
 * per-trial noise is keyed by (worldSeed, instrumentId, trialIndex), this is
 * the same world the society inhabited — only the measurement policy differs.
 */
function potentialEvidence(config: ScenarioConfig, trialsPerDay: number) {
  const sim = new Simulator(config);
  const plan = INSTRUMENTS.map((i) => ({
    agentId: "reference",
    instrumentId: i.id,
    trialsPerDay,
  }));
  for (let d = 1; d <= config.days; d++) sim.runDay(plan, [], ["reference"]);
  return sim.log.toJSON();
}

interface RunArtifactFile {
  file: string;
  config: ScenarioConfig;
  events: { type: string; day: number; payload: Record<string, unknown> }[];
  agents: unknown[];
}

/** Identify run artifacts by shape, not filename (the directory also holds
 *  analysis outputs: battery-index, society-eval, paired-contrast, …). */
function loadRunArtifacts(d: string): RunArtifactFile[] {
  const out: RunArtifactFile[] = [];
  for (const f of readdirSync(d).filter((f) => f.endsWith(".json")).sort()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(`${d}/${f}`, "utf8"));
    } catch {
      continue;
    }
    const a = parsed as Partial<RunArtifactFile>;
    if (!Array.isArray(a.events) || typeof a.config?.name !== "string") continue;
    out.push({ file: f, config: a.config, events: a.events, agents: a.agents ?? [] });
  }
  return out;
}

const runFiles = loadRunArtifacts(dir);
if (runFiles.length === 0) {
  console.error(`No run artifacts in ${dir}`);
  process.exit(1);
}

interface Row {
  run: string;
  scenario: string;
  seed: number;
  n: number;
  potential: BenchmarkLevel;
  asProduced: BenchmarkLevel;
  downsampled: BenchmarkLevel;
}

const rows: Row[] = [];
for (const run of runFiles) {
  rows.push({
    run: run.file.replace(/\.json$/, ""),
    scenario: run.config.name,
    seed: run.config.seed,
    n: run.agents.length,
    potential: benchmarkPotential(potentialEvidence(run.config, referenceTrials) as never),
    asProduced: benchmarkAsProduced(run.events),
    downsampled: benchmarkDownsampled(run.events, { seed: run.config.seed, draws }),
  });
}

const fmt = (v: number | null, digits = 2) => (v === null ? "  -  " : v.toFixed(digits));
console.log(
  `\nTHREE-LEVEL DETECTOR BENCHMARK — ${dir}\n` +
    `reference schedule: every instrument × ${referenceTrials} trials/day · downsample draws: ${draws}\n`,
);
console.log(
  "run".padEnd(26) +
    "n".padEnd(4) +
    "L1 z".padEnd(9) +
    "L1 day".padEnd(9) +
    "L2 z".padEnd(9) +
    "L2 day".padEnd(9) +
    "L2d hit".padEnd(10) +
    "L2 falseAlarm",
);
console.log("-".repeat(96));
for (const r of rows) {
  console.log(
    r.run.padEnd(26) +
      String(r.n).padEnd(4) +
      fmt(r.potential.maxPendulumAbsZ).padEnd(9) +
      String(r.potential.earliestDetectionDay ?? "-").padEnd(9) +
      fmt(r.asProduced.maxPendulumAbsZ).padEnd(9) +
      String(r.asProduced.earliestDetectionDay ?? "-").padEnd(9) +
      fmt(r.downsampled.detectionFraction ?? null).padEnd(10) +
      fmt(r.asProduced.resonatorFalseAlarmRate),
  );
}

// Scenario-level summary: the decomposition the design asks for.
const byScenario = new Map<string, Row[]>();
for (const r of rows) {
  if (!byScenario.has(r.scenario)) byScenario.set(r.scenario, []);
  byScenario.get(r.scenario)!.push(r);
}
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

console.log(`\nDECOMPOSITION (mean over runs)\n`);
for (const [scenario, rs] of byScenario) {
  const l1 = mean(rs.map((r) => r.potential.maxPendulumAbsZ));
  const l2 = mean(rs.map((r) => r.asProduced.maxPendulumAbsZ));
  const l2d = mean(rs.map((r) => r.downsampled.maxPendulumAbsZ));
  const hit = mean(rs.map((r) => r.downsampled.detectionFraction ?? 0));
  const detected = rs.filter((r) => r.asProduced.earliestDetectionDay !== null).length;
  console.log(
    `${scenario} (${rs.length} runs)\n` +
      `  L1 potential  max|z| ${l1.toFixed(2)}   — what an ideal measurement policy could have known\n` +
      `  L2 as-produced max|z| ${l2.toFixed(2)}   — what their actual measurements support` +
      `   [measurement-policy gap: ${(l1 - l2).toFixed(2)}]\n` +
      `  L2d n=2-equivalent max|z| ${l2d.toFixed(2)}, detected in ${(hit * 100).toFixed(0)}% of draws` +
      `   [data-quantity gap: ${(l2 - l2d).toFixed(2)}]\n` +
      `  detector flagged ${detected}/${rs.length} runs; ` +
      `resonator false-alarm rate ${fmt(mean(rs.map((r) => r.asProduced.resonatorFalseAlarmRate ?? 0)))}\n`,
  );
}

const outPath = `${dir}/benchmark.json`;
writeFileSync(outPath, JSON.stringify({ dir, draws, referenceTrials, rows }, null, 2));
console.log(`Written: ${outPath}`);
console.log(
  `\nL3 (what the society actually concluded) comes from: npm run society-eval -- --dir ${dir}`,
);

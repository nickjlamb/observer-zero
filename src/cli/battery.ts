/**
 * Seeded batch experiment runner (batch plan Phase 1).
 *
 *   npm run battery -- --model mock
 *   npm run battery -- --model claude-haiku-4-5 --concurrency 3 --max-cost 50
 *   npm run battery -- --conditions gravity_shift --replicates 5 --base-seed 2000
 *
 * Defaults: conditions control,gravity_shift,instrument_fault × 10 replicates,
 * 30 days, base seed 1000 (worldSeed = base + replicate index, shared across
 * conditions so condition contrasts are paired by world randomness).
 *
 * Properties: concurrent (--concurrency), resumable (completed run files are
 * skipped), rate-limit tolerant (provider backoff), cost-capped (--max-cost:
 * no NEW runs start once estimated spend exceeds the cap; in-flight runs
 * finish). Each run is written to disk the moment it completes.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { control, gravityShift, instrumentFault } from "../scenarios/scenarios.js";
import type { ScenarioConfig } from "../engine/types.js";
import { runSociety } from "../runner/runSociety.js";
import { buildManifest } from "../manifest.js";

try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on shell environment
}

function argStr(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : String(process.argv[i + 1]);
}
function argNum(name: string, fallback: number): number {
  return Number(argStr(name, String(fallback)));
}

const conditions = argStr("conditions", "control,gravity_shift,instrument_fault").split(",");
const replicates = argNum("replicates", 10);
const modelName = argStr("model", "mock");
const temperature = argNum("temperature", 1.0);
const variantArg = argStr("variant", "v0.1");
if (variantArg !== "v0.1" && variantArg !== "v0.2-no-mundane-prior") {
  console.error(`Unknown variant "${variantArg}". Options: v0.1, v0.2-no-mundane-prior`);
  process.exit(1);
}
const promptVariant = variantArg as "v0.1" | "v0.2-no-mundane-prior";
const concurrency = modelName === "mock" ? Math.max(1, argNum("concurrency", 1)) : argNum("concurrency", 3);
const baseSeed = argNum("base-seed", 1000);
const days = argNum("days", 30);
const maxCost = argNum("max-cost", 50);
const batteryId = argStr(
  "id",
  `battery-${modelName}${promptVariant === "v0.1" ? "" : "-nmp"}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}`,
);
const outDir = argStr("out", `runs/${batteryId}`);

const scenarioFactories: Record<string, (s: number, d: number) => ScenarioConfig> = {
  control: (s, d) => control(s, d),
  gravity_shift: (s, d) => gravityShift(s, d),
  instrument_fault: (s, d) => instrumentFault(s, d),
};
for (const c of conditions) {
  if (!scenarioFactories[c]) {
    console.error(`Unknown condition "${c}". Options: ${Object.keys(scenarioFactories).join(", ")}`);
    process.exit(1);
  }
}

interface Job {
  name: string;
  condition: string;
  seed: number;
  file: string;
  status: "pending" | "skipped_existing" | "done" | "failed" | "not_started_cost_cap";
  costUSD?: number;
  leakClean?: boolean;
  failedReviews?: number;
  error?: string;
}

const jobs: Job[] = [];
for (const condition of conditions) {
  for (let r = 0; r < replicates; r++) {
    const seed = baseSeed + r; // paired across conditions by design
    const name = `${condition}-seed${seed}`;
    jobs.push({ name, condition, seed, file: `${outDir}/${name}.json`, status: "pending" });
  }
}

mkdirSync(outDir, { recursive: true });
const indexPath = `${outDir}/battery-index.json`;

function writeIndex(): void {
  const totalCost = jobs.reduce((a, j) => a + (j.costUSD ?? 0), 0);
  writeFileSync(
    indexPath,
    JSON.stringify(
      {
        batteryId,
        createdAt: new Date().toISOString(),
        manifest: buildManifest(modelName, modelName === "mock" ? 0 : temperature, promptVariant),
        settings: { conditions, replicates, days, baseSeed, modelName, temperature, concurrency, maxCost, promptVariant },
        totalEstimatedCostUSD: totalCost,
        jobs,
      },
      null,
      2,
    ),
  );
}

let spentUSD = 0;
let costCapped = false;

// Resume: pre-mark existing complete runs (and count their recorded cost).
for (const job of jobs) {
  if (existsSync(job.file)) {
    job.status = "skipped_existing";
    try {
      const prev = JSON.parse(readFileSync(job.file, "utf8"));
      job.costUSD = prev?.callTotals?.estimatedCostUSD ?? 0;
      job.leakClean = prev?.leakAudit?.clean ?? undefined;
      spentUSD += job.costUSD ?? 0;
    } catch {
      job.status = "pending"; // unreadable file: re-run it
    }
  }
}

console.log(
  `OBSERVER ZERO battery: ${batteryId}\n` +
    `${conditions.join(", ")} × ${replicates} · model ${modelName} · concurrency ${concurrency} · ` +
    `out ${outDir}\n` +
    `${jobs.filter((j) => j.status === "skipped_existing").length} already complete (resume) · ` +
    `cost cap $${maxCost}\n`,
);
writeIndex();

const queue = jobs.filter((j) => j.status === "pending");
let done = 0;

async function worker(): Promise<void> {
  for (;;) {
    if (spentUSD >= maxCost) costCapped = true;
    const job = queue.shift();
    if (!job) return;
    if (costCapped) {
      job.status = "not_started_cost_cap";
      continue;
    }
    const started = Date.now();
    try {
      const config = scenarioFactories[job.condition]!(job.seed, days);
      const { artifact } = await runSociety({ config, modelName, temperature, promptVariant });
      writeFileSync(job.file, JSON.stringify(artifact, null, 2));
      job.status = "done";
      job.costUSD = artifact.callTotals.estimatedCostUSD;
      job.leakClean = artifact.leakAudit.clean;
      job.failedReviews = artifact.agents.reduce(
        (a: number, ag: { failedUpdates: unknown[] }) => a + ag.failedUpdates.length,
        0,
      );
      spentUSD += job.costUSD ?? 0;
      done++;
      console.log(
        `✓ ${job.name.padEnd(28)} $${(job.costUSD ?? 0).toFixed(2)} · ` +
          `${Math.round((Date.now() - started) / 1000)}s · leak ${job.leakClean ? "clean" : "FOUND"} · ` +
          `failed reviews ${job.failedReviews} · [${done}/${queue.length + done} live, spent $${spentUSD.toFixed(2)}]`,
      );
    } catch (e) {
      job.status = "failed";
      job.error = String(e).slice(0, 300);
      console.error(`✗ ${job.name}: ${job.error}`);
    }
    writeIndex();
  }
}

await Promise.all(Array.from({ length: concurrency }, () => worker()));
writeIndex();

const byStatus = jobs.reduce<Record<string, number>>((acc, j) => {
  acc[j.status] = (acc[j.status] ?? 0) + 1;
  return acc;
}, {});
console.log(`\nBattery complete: ${JSON.stringify(byStatus)} · total est. cost $${spentUSD.toFixed(2)}`);
console.log(`Index: ${indexPath}`);
if (byStatus["failed"]) {
  console.log("Re-run the same command to retry failed runs (resume skips completed ones).");
  process.exitCode = 1;
}
if (costCapped) console.log(`⚠ Cost cap $${maxCost} reached — remaining runs not started. Raise --max-cost and re-run to continue.`);

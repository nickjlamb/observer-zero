/**
 * Seeded batch experiment runner (batch plan Phase 1; M4 society support).
 *
 *   npm run battery -- --model mock
 *   npm run battery -- --model claude-haiku-4-5 --concurrency 3 --max-cost 50
 *   npm run battery -- --conditions gravity_shift --replicates 5 --base-seed 2000
 *
 * Study 2 arms (design v0.3 §5) — society composition and institution come
 * from the arm definition, so a battery cannot silently run the wrong shape:
 *
 *   npm run battery -- --arm C --model sonar-pro
 *   npm run battery -- --arm D --model sonar-pro     (theo → haiku, per arms.ts)
 *   npm run battery -- --arm C --model mock          (free pipeline validation)
 *
 * Defaults: conditions control,gravity_shift,instrument_fault × 10 replicates,
 * 30 days. With --arm, conditions default to control,gravity_shift (Study 2
 * drops instrument_fault) and the seed base defaults to the PILOT set.
 *
 * SEED HYGIENE (design v0.3 §4): seeds 1000-1009 are the confirmatory set and
 * are quarantined until the design freezes. Any battery that would touch them
 * must pass --confirmatory, and that flag is refused unless the freeze flag
 * is also set. Pilot/mock/validation runs use 9000-9004.
 *
 * Properties: concurrent (--concurrency), resumable (completed run files are
 * skipped), rate-limit tolerant (provider backoff), cost-capped (--max-cost:
 * no NEW runs start once estimated spend exceeds the cap; in-flight runs
 * finish). Each run is written to disk the moment it completes.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { control, gravityShift, instrumentFault } from "../scenarios/scenarios.js";
import type { ScenarioConfig } from "../engine/types.js";
import { runSociety, type SocietySpec } from "../runner/runSociety.js";
import {
  ARMS,
  armModels,
  armRequiredCredentials,
  armRequiredProviders,
  armSociety,
  isStudy2Arm,
  STUDY_2_ARMS,
  CONFIRMATORY_BASE_SEED,
  CONFIRMATORY_REPLICATES,
  PILOT_BASE_SEED,
} from "../runner/arms.js";
import { buildManifest } from "../manifest.js";
import { DESIGN_FROZEN } from "../freeze.js";

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

function argFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

// --- Study 2 arm selection (design v0.3 §5) -------------------------------
const armId = argStr("arm", "");
const arm = armId ? ARMS[armId] : undefined;
if (armId && !arm) {
  console.error(`Unknown arm "${armId}". Options: ${Object.keys(ARMS).join(", ")}`);
  process.exit(1);
}

const conditions = argStr(
  "conditions",
  arm ? "control,gravity_shift" : "control,gravity_shift,instrument_fault",
).split(",");
const replicates = argNum("replicates", arm ? CONFIRMATORY_REPLICATES : 10);
const modelName = argStr("model", "mock");
const temperature = argNum("temperature", 1.0);
const variantArg = argStr("variant", "v0.1");
if (variantArg !== "v0.1" && variantArg !== "v0.2-no-mundane-prior") {
  console.error(`Unknown variant "${variantArg}". Options: v0.1, v0.2-no-mundane-prior`);
  process.exit(1);
}
const promptVariant = variantArg as "v0.1" | "v0.2-no-mundane-prior";
const concurrency = modelName === "mock" ? Math.max(1, argNum("concurrency", 1)) : argNum("concurrency", 3);

// --- Seed hygiene (design v0.3 §4) ----------------------------------------
// Study 2 batteries default to the PILOT seed set. Reaching the confirmatory
// worlds is an explicit, gated act.
const wantsConfirmatory = argFlag("confirmatory");
const defaultBase = arm ? (wantsConfirmatory ? CONFIRMATORY_BASE_SEED : PILOT_BASE_SEED) : 1000;
const baseSeed = argNum("base-seed", defaultBase);
const seedsTouched = Array.from({ length: replicates }, (_, r) => baseSeed + r);
const touchesConfirmatory = seedsTouched.some(
  (s) => s >= CONFIRMATORY_BASE_SEED && s < CONFIRMATORY_BASE_SEED + CONFIRMATORY_REPLICATES,
);
const isLive = modelName !== "mock" || (arm ? Object.values(armModels(arm, modelName)).some((m) => m !== "mock") : false);

// Design v0.6 amendment A2: only the five Study 2 arms may touch the
// confirmatory seeds, frozen or not. F is a Study 3 candidate.
if (arm && touchesConfirmatory && !isStudy2Arm(arm.id)) {
  console.error(
    `REFUSED: arm ${arm.id} is not part of Study 2's confirmatory design ` +
      `(v0.6 amendment A2).\n` +
      `  Study 2 arms: ${STUDY_2_ARMS.join(", ")}.\n` +
      `  Arm F (8 x haiku) is a STUDY 3 candidate: it must be pre-registered separately, ` +
      `and its results are never merged into Study 2's analysis.\n` +
      `  Pilot seeds remain available:  --base-seed ${PILOT_BASE_SEED}`,
  );
  process.exit(1);
}

if (arm && touchesConfirmatory && isLive && !DESIGN_FROZEN) {
  console.error(
    `REFUSED: this battery would run live agents on confirmatory seeds ` +
      `${CONFIRMATORY_BASE_SEED}-${CONFIRMATORY_BASE_SEED + CONFIRMATORY_REPLICATES - 1}, ` +
      `but the design is not frozen (see src/freeze.ts).\n` +
      `Study 2's seed-hygiene rule (design v0.3 §4) keeps the confirmatory worlds unseen ` +
      `under policy v0.2 until the design, prompts, evaluator and hypotheses are frozen.\n` +
      `Use the pilot seeds instead:  --base-seed ${PILOT_BASE_SEED}\n` +
      `To freeze: complete P1, then set DESIGN_FROZEN = true in a dedicated commit.`,
  );
  process.exit(1);
}
if (touchesConfirmatory && isLive && arm && DESIGN_FROZEN && !wantsConfirmatory) {
  console.error(
    `REFUSED: confirmatory seeds require an explicit --confirmatory flag, even post-freeze.`,
  );
  process.exit(1);
}

// Fail before spending: a mixed arm needs BOTH provider keys, and finding
// that out on run 1 of 9 wastes the runs that already completed.
if (arm) {
  const missing = armRequiredCredentials(arm, modelName).filter((c) => !process.env[c]);
  if (missing.length > 0) {
    console.error(
      `REFUSED: arm ${arm.id} needs ${missing.join(" + ")} but they are not set.\n` +
        `  models in this arm: ${Object.entries(armModels(arm, modelName)).map(([p, m]) => `${p}=${m}`).join(", ")}\n` +
        `  providers: ${armRequiredProviders(arm, modelName).join(", ")}\n` +
        `  set the missing variable(s) in .env, or use --model mock to validate this arm's shape for free.`,
    );
    process.exit(1);
  }
}

const days = argNum("days", 30);
const maxCost = argNum("max-cost", 50);
const batteryId = argStr(
  "id",
  `battery-${arm ? `arm${arm.id}-` : ""}${modelName}${promptVariant === "v0.1" ? "" : "-nmp"}-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, "")}`,
);
const outDir = argStr("out", `runs/${batteryId}`);
const society: SocietySpec | undefined = arm ? armSociety(arm, modelName) : undefined;

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
        manifest: buildManifest(
          modelName,
          modelName === "mock" ? 0 : temperature,
          promptVariant,
          society,
          undefined,
        ),
        arm: arm
          ? {
              id: arm.id,
              label: arm.label,
              n: arm.n,
              institution: arm.institution,
              contrast: arm.contrast,
              models: armModels(arm, modelName),
            }
          : null,
        seedHygiene: {
          baseSeed,
          seeds: seedsTouched,
          seedSet: touchesConfirmatory ? "confirmatory" : baseSeed >= PILOT_BASE_SEED ? "pilot" : "other",
          designFrozen: DESIGN_FROZEN,
        },
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
    (arm
      ? `arm ${arm.id} — ${arm.label} (n=${arm.n}, ${arm.institution})\n` +
        `  ${arm.contrast}\n` +
        (arm.modelOverrides
          ? `  model overrides: ${Object.entries(arm.modelOverrides).map(([p, m]) => `${p}=${m}`).join(", ")}\n`
          : "")
      : "") +
    `seeds ${seedsTouched[0]}-${seedsTouched.at(-1)} (${touchesConfirmatory ? "CONFIRMATORY" : baseSeed >= PILOT_BASE_SEED ? "pilot" : "legacy"} set) · ` +
    `design ${DESIGN_FROZEN ? "FROZEN" : "unfrozen"}\n` +
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
      const { artifact } = await runSociety({
        config,
        modelName,
        temperature,
        promptVariant,
        ...(society ? { society } : {}),
      });
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

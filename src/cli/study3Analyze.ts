/**
 * The frozen confirmatory analysis, CLI wrapper (freeze doc §8 / RT-1).
 *
 *   npm run study3-analyze
 *   npm run study3-analyze -- --dirs runs/s3-confirmatory-sonar,runs/s3-confirmatory-haiku
 *
 * Runs ONCE: refuses to overwrite an existing output unless --force-rerun is
 * passed, and a forced re-run is a protocol deviation that must be logged in
 * the ledger (freeze doc §10). The default directory list is the freeze
 * document's §13 roster verbatim.
 */
import { existsSync, writeFileSync } from "node:fs";
import { analyzeConfirmatory } from "../analysis/confirmatoryAnalysis.js";

const DEFAULT_DIRS = [
  "runs/s3-confirmatory-sonar",
  "runs/s3-confirmatory-gemini",
  "runs/s3-confirmatory-cerebras",
  "runs/s3-confirmatory-haiku",
  "runs/s3-confirmatory-haiku-desc",
];
const OUT = "runs/s3-confirmatory-analysis.json";

const i = process.argv.indexOf("--dirs");
const dirs = i === -1 ? DEFAULT_DIRS : String(process.argv[i + 1]).split(",").filter(Boolean);

if (existsSync(OUT) && !process.argv.includes("--force-rerun")) {
  throw new Error(
    `${OUT} already exists. The frozen analysis runs ONCE (freeze doc §10). ` +
      `A deliberate re-run requires --force-rerun and a ledger entry recording the deviation.`,
  );
}

const result = analyzeConfirmatory(dirs);
writeFileSync(OUT, JSON.stringify(result, null, 2));

const p = result["primary"] as { degenerate: boolean; p: number; treatment: string; control: string; significant: boolean };
console.log(`STUDY 3 CONFIRMATORY ANALYSIS — frozen, run once → ${OUT}\n`);
console.log(`runs: ${result["runsTotal"]} · attrition: ${(result["attrition"] as string[]).length} · uninterpretable strata: ${JSON.stringify(result["uninterpretableStrata"])}`);
console.log(`PRIMARY ΔL1 (${(result["primary"] as { endpoint: string }).endpoint}): treatment ${p.treatment} vs control ${p.control}`);
if (p.degenerate) {
  const d = result["degenerateBranch"] as { exactUpperBoundTreatment: number; negligibilityRejected: boolean };
  console.log(`  DEGENERATE (both arms empty in every stratum) — exact 95% upper bound on treatment rate: ${(d.exactUpperBoundTreatment * 100).toFixed(2)}%`);
  console.log(`  negligibility (δ=0.10): ${d.negligibilityRejected ? "REJECTED — effect ≥ 0.10 excluded" : "not rejected"}`);
} else {
  console.log(`  exact stratified one-sided p = ${p.p.toFixed(5)} → ${p.significant ? "SIGNIFICANT" : "not significant"}`);
}
console.log(`ever-L1: ${JSON.stringify(result["everL1"])}`);
console.log(`R17 tripwire: ${JSON.stringify(result["r17"])}`);
console.log(`cross-judge: ${JSON.stringify(result["crossJudge"])}`);
console.log(`\nFull tables (sensitivity grid, per-family Fisher, D1–D3) in ${OUT}.`);

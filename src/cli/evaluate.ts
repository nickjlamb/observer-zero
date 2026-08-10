/**
 * Battery evaluation + aggregation (batch plan Phases 2–3).
 *
 *   npm run evaluate -- runs/battery-mock-v1                       # deterministic + keyword classes
 *   npm run evaluate -- runs/battery-haiku-XX --judge claude-haiku-4-5
 *   npm run evaluate -- runs/battery-haiku-XX --judge claude-haiku-4-5 --force
 *
 * Embeds an `eval` block into each run file (skips runs already evaluated
 * with the same evaluator version + judge, unless --force), then writes
 * aggregate.md + aggregate.csv into the battery directory.
 */

import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { evaluateRun, EVALUATOR_VERSION, type AgentOutcomes } from "../evaluator/evaluateRun.js";
import type { CompleteFn } from "../evaluator/llmClassifier.js";

try {
  process.loadEnvFile();
} catch {
  // no .env — rely on shell environment
}

const dir = process.argv[2];
if (!dir || dir.startsWith("--")) {
  console.error("Usage: npm run evaluate -- <battery-dir> [--judge <model>] [--force]");
  process.exit(1);
}
const ji = process.argv.indexOf("--judge");
const judgeModel = ji === -1 ? null : String(process.argv[ji + 1]);
const force = process.argv.includes("--force");

let judge: { complete: CompleteFn; model: string } | null = null;
if (judgeModel) {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    console.error("--judge requires ANTHROPIC_API_KEY (in .env or shell).");
    process.exit(1);
  }
  const complete: CompleteFn = async (prompt) => {
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: judgeModel,
          max_tokens: 2000,
          temperature: 0, // judge is as deterministic as the API allows
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as { content: { type: string; text?: string }[] };
        return data.content.find((c) => c.type === "text")?.text ?? "";
      }
      if (![429, 500, 502, 503, 529].includes(res.status)) {
        throw new Error(`judge API error ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt + Math.random() * 500));
    }
    throw new Error("judge API: retries exhausted");
  };
  judge = { complete, model: judgeModel };
}

const files = readdirSync(dir)
  .filter((f) => f.endsWith(".json") && !f.startsWith("battery-index") && !f.startsWith("aggregate"))
  .sort();

interface EvaluatedRun {
  file: string;
  condition: string;
  seed: number;
  evalBlock: Record<string, unknown>;
}
const evaluated: EvaluatedRun[] = [];

for (const f of files) {
  const path = `${dir}/${f}`;
  const run = JSON.parse(readFileSync(path, "utf8"));
  const existing = run.eval;
  const fresh =
    existing &&
    existing.evaluatorVersion === EVALUATOR_VERSION &&
    existing.judgeModel === (judge?.model ?? "keyword-v0");
  if (fresh && !force) {
    evaluated.push({ file: f, condition: run.config.name, seed: run.config.seed, evalBlock: existing });
    console.log(`= ${f} (already evaluated)`);
    continue;
  }
  const evalBlock = await evaluateRun(run, judge);
  run.eval = evalBlock;
  writeFileSync(path, JSON.stringify(run, null, 2));
  evaluated.push({ file: f, condition: run.config.name, seed: run.config.seed, evalBlock });
  const oc = (evalBlock as { outcomes: { society: Record<string, unknown> } }).outcomes.society;
  console.log(
    `✓ ${f} · detected:${oc["anyDetected"]} strict-all:${oc["allCorrectStrict"]} confab:${oc["anyConfabulation"]}`,
  );
}

// ---------------------------------------------------------------------------
// Aggregation
// ---------------------------------------------------------------------------

type Society = {
  anyDetected: boolean;
  anyTransientDetection: boolean;
  allCorrectStrict: boolean;
  anyCorrectStrict: boolean;
  allCorrectLenient: boolean;
  anyConfabulation: boolean;
  earliestDetectionDay: number | null;
};

function pct(xs: boolean[]): string {
  return xs.length ? `${Math.round((100 * xs.filter(Boolean).length) / xs.length)}%` : "–";
}
function meanOf(xs: number[]): string {
  return xs.length ? (xs.reduce((a, b) => a + b, 0) / xs.length).toFixed(1) : "–";
}

const conditions = [...new Set(evaluated.map((e) => e.condition))];
const rows: string[][] = [];
const header = ["metric", ...conditions];

function metricRow(label: string, fn: (runs: EvaluatedRun[]) => string): void {
  rows.push([label, ...conditions.map((c) => fn(evaluated.filter((e) => e.condition === c)))]);
}

const soc = (e: EvaluatedRun) =>
  (e.evalBlock as { outcomes: { society: Society } }).outcomes.society;
const agentsOf = (e: EvaluatedRun) =>
  Object.values((e.evalBlock as { outcomes: { perAgent: Record<string, AgentOutcomes> } }).outcomes.perAgent);
const repl = (e: EvaluatedRun) =>
  (e.evalBlock as { replication: { requests: number; blindRate: number | null } }).replication;

metricRow("runs", (rs) => String(rs.length));
metricRow("detection rate (any agent, final)", (rs) => pct(rs.map((r) => soc(r).anyDetected)));
metricRow("transient detection rate", (rs) => pct(rs.map((r) => soc(r).anyTransientDetection)));
metricRow("correct diagnosis, strict (all agents)", (rs) => pct(rs.map((r) => soc(r).allCorrectStrict)));
metricRow("correct diagnosis, strict (any agent)", (rs) => pct(rs.map((r) => soc(r).anyCorrectStrict)));
metricRow("correct diagnosis, lenient (all agents)", (rs) => pct(rs.map((r) => soc(r).allCorrectLenient)));
metricRow("mean detection latency (days)", (rs) =>
  meanOf(
    rs.flatMap((r) =>
      agentsOf(r)
        .map((a) => a.detectionLatency)
        .filter((x): x is number => x !== null),
    ),
  ),
);
metricRow("mean anomaly dating error (days)", (rs) =>
  meanOf(
    rs.flatMap((r) =>
      agentsOf(r)
        .map((a) => a.anomalyDatingError)
        .filter((x): x is number => x !== null),
    ),
  ),
);
metricRow("replication requested", (rs) => pct(rs.map((r) => repl(r).requests > 0)));
metricRow("blind replication rate (of episodes)", (rs) => {
  const xs = rs.map((r) => repl(r).blindRate).filter((x): x is number => x !== null);
  return xs.length ? `${Math.round((100 * xs.reduce((a, b) => a + b, 0)) / xs.length)}%` : "–";
});
metricRow("confabulation rate", (rs) => pct(rs.map((r) => soc(r).anyConfabulation)));
metricRow("mean provenance accuracy", (rs) =>
  meanOf(
    rs.flatMap((r) =>
      agentsOf(r)
        .map((a) => a.evidenceProvenanceAccuracy)
        .filter((x): x is number => x !== null),
    ),
  ),
);

const width = Math.max(...rows.map((r) => r[0]!.length), header[0]!.length) + 2;
const colW = 18;
const fmt = (r: string[]) =>
  r[0]!.padEnd(width) + r.slice(1).map((c) => c.padStart(colW)).join("");
const table = [fmt(header), "-".repeat(width + colW * conditions.length), ...rows.map(fmt)].join("\n");
console.log(`\n${table}`);

const md =
  `# Battery aggregate — ${dir}\n\n` +
  `Evaluator ${EVALUATOR_VERSION} · judge ${judge?.model ?? "keyword-v0 (no LLM judge)"} · ${new Date().toISOString()}\n\n` +
  "```\n" + table + "\n```\n\n" +
  `Per-run details in each run file's \`eval\` block. n per condition is small — treat as exploratory.\n`;
writeFileSync(`${dir}/aggregate.md`, md);

const csvHeader = [
  "file", "condition", "seed", "agentId", "detected", "detectionDay", "detectionLatency",
  "finalDominantClass", "correctStrict", "correctLenient", "inferredAnomalyDay", "anomalyDatingError",
  "confabulationJudged", "provenanceAccuracy",
];
const csvRows = evaluated.flatMap((e) =>
  Object.entries((e.evalBlock as { outcomes: { perAgent: Record<string, AgentOutcomes> } }).outcomes.perAgent).map(
    ([agentId, a]) =>
      [
        e.file, e.condition, e.seed, agentId, a.detected, a.detectionDay, a.detectionLatency,
        a.finalDominantClass, a.correctDiagnosisStrict, a.correctDiagnosisLenient,
        a.inferredAnomalyDay, a.anomalyDatingError, a.confabulationJudged, a.evidenceProvenanceAccuracy,
      ].join(","),
  ),
);
writeFileSync(`${dir}/aggregate.csv`, [csvHeader.join(","), ...csvRows].join("\n"));
console.log(`\nWritten: ${dir}/aggregate.md and ${dir}/aggregate.csv`);

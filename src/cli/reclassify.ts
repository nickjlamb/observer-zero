/**
 * Post-hoc LLM reclassification of a run export (evaluator-side).
 *
 *   npm run reclassify -- runs/gravity_shift-seed42-claude-haiku-4-5.json
 *   npm run reclassify -- runs/foo.json --model claude-haiku-4-5
 *
 * Reads the exported belief timeline, classifies every hypothesis with an LLM
 * (label-and-rationale, intent-based), prints corrected metrics per snapshot,
 * and writes <file>.classified.json alongside the original. Requires
 * ANTHROPIC_API_KEY (in .env or the shell).
 */

import { readFileSync, writeFileSync } from "node:fs";
import {
  classifyHypothesesLLM,
  metricsFromClasses,
  type CompleteFn,
} from "../evaluator/llmClassifier.js";

try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on shell environment
}

const file = process.argv[2];
if (!file || file.startsWith("--")) {
  console.error("Usage: npm run reclassify -- <run.json> [--model claude-haiku-4-5]");
  process.exit(1);
}
const mi = process.argv.indexOf("--model");
const model = mi === -1 ? "claude-haiku-4-5" : String(process.argv[mi + 1]);

const apiKey = process.env["ANTHROPIC_API_KEY"];
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY is not set (put it in .env or export it).");
  process.exit(1);
}

const complete: CompleteFn = async (prompt) => {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { content: { type: string; text?: string }[] };
  return data.content.find((c) => c.type === "text")?.text ?? "";
};

interface Snapshot {
  day: number;
  state: {
    hypotheses: { label: string; rationale: string; probability: number }[];
    residual: number;
  };
  metrics?: unknown;
  llmMetrics?: unknown;
  llmClasses?: unknown;
}

// Supports both export formats: single-agent runs (top-level beliefTimeline)
// and society runs (agents[].beliefTimeline).
const run = JSON.parse(readFileSync(file, "utf8")) as {
  beliefTimeline?: Snapshot[];
  agents?: { agentId: string; beliefTimeline: Snapshot[] }[];
};
const groups: { label: string; snapshots: Snapshot[] }[] = run.beliefTimeline
  ? [{ label: "agent", snapshots: run.beliefTimeline }]
  : (run.agents ?? []).map((a) => ({ label: a.agentId, snapshots: a.beliefTimeline }));
if (groups.length === 0) {
  console.error("No belief timelines found in this file.");
  process.exit(1);
}

const total = groups.reduce((n, g) => n + g.snapshots.length, 0);
console.log(`Reclassifying ${total} snapshots with ${model}...\n`);
for (const group of groups) {
  if (groups.length > 1) console.log(`— ${group.label} —`);
  for (const snap of group.snapshots) {
    const classes = await classifyHypothesesLLM(snap.state.hypotheses, complete);
    const m = metricsFromClasses(snap.state.hypotheses, classes);
    snap.llmClasses = classes;
    snap.llmMetrics = m;
    const byClass = Object.entries(m.byClass)
      .filter(([, v]) => v > 0.005)
      .map(([k, v]) => `${k}=${v.toFixed(2)}`)
      .join(" ");
    console.log(
      `day ${String(snap.day).padStart(2)}: pLawChange ${m.pLawChange.toFixed(2)} · ` +
        `pExtInt ${m.pExternalIntervention.toFixed(2)} · pSim ${m.pSimulation.toFixed(2)} | ${byClass}`,
    );
  }
}

const outPath = file.replace(/\.json$/, ".classified.json");
writeFileSync(outPath, JSON.stringify(run, null, 2));
console.log(`\nWritten: ${outPath}`);

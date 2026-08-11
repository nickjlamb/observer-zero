/**
 * Evidence-citation audit and lost-review recovery.
 *
 *   npm run audit-evidence -- --dir runs/<battery-dir>
 *   npm run audit-evidence -- --dir runs/<battery-dir> --recover
 *
 * Two jobs, both operating on STORED completions — no model calls, no cost,
 * and applicable retroactively to any run ever made:
 *
 * 1. AUDIT. How many belief reviews failed validation, and why? Reports the
 *    non-integer evidence citations that caused them, and — the part that
 *    matters scientifically — whether any agent's FINAL belief state is
 *    stale because its last review was the one that failed.
 *
 * 2. RECOVER (--recover). Re-parse the stored completions under the lenient
 *    evidence rule and report what those reviews actually said. Because
 *    every prompt and completion is logged verbatim, a review lost to a
 *    parser bug is recoverable without re-running anything.
 *
 * Recovery WRITES NOTHING by default. Rewriting a published run's artifact
 * in place would destroy the provenance that makes recovery trustworthy;
 * the recovered content is reported so it can be assessed, and any decision
 * to reanalyse is taken deliberately.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { BeliefUpdateSchema, countDroppedEvidenceIds } from "../agents/beliefs.js";
import { extractJson } from "../models/anthropic.js";
import { stripThink } from "../models/perplexity.js";

function argStr(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : String(process.argv[i + 1]);
}
const dir = argStr("dir", "");
const recover = process.argv.includes("--recover");
if (!dir || !existsSync(dir)) {
  console.error(`Usage: npm run audit-evidence -- --dir runs/<battery-dir> [--recover]`);
  process.exit(1);
}

interface ModelCall {
  agentId: string;
  day: number;
  purpose: string;
  promptText: string;
  completionText: string;
  ok: boolean;
}
interface Artifact {
  config: { name: string; seed: number; days: number };
  model?: string;
  manifest?: { prompts?: Record<string, string> };
  agents: {
    agentId: string;
    failedUpdates: { day: number }[];
    beliefTimeline: { day: number }[];
  }[];
  modelCalls: ModelCall[];
}

function loadRuns(d: string): { file: string; a: Artifact }[] {
  const out: { file: string; a: Artifact }[] = [];
  for (const f of readdirSync(d).filter((f) => f.endsWith(".json")).sort()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(`${d}/${f}`, "utf8"));
    } catch {
      continue;
    }
    const a = parsed as Partial<Artifact>;
    if (!Array.isArray(a.modelCalls) || !Array.isArray(a.agents) || !a.config) continue;
    out.push({ file: f, a: parsed as Artifact });
  }
  return out;
}

const runs = loadRuns(dir);
if (runs.length === 0) {
  console.error(`No run artifacts in ${dir}`);
  process.exit(1);
}

interface RecoveredReview {
  run: string;
  agentId: string;
  day: number;
  droppedCitations: number;
  question: string;
  topHypothesis: string;
  topProbability: number;
  wasFinalReview: boolean;
}

let totalFailed = 0;
let totalRecovered = 0;
let staleFinals = 0;
let runsWithDropped = 0;
let totalDroppedCitations = 0;
const recovered: RecoveredReview[] = [];

console.log(`\nEVIDENCE-CITATION AUDIT — ${dir}`);
console.log(`${runs.length} runs · model ${runs[0]!.a.model ?? "?"} · ` +
  `belief prompt ${runs[0]!.a.manifest?.prompts?.["beliefUpdate"] ?? "?"}\n`);

for (const { file, a } of runs) {
  const runName = file.replace(/\.json$/, "");
  const lines: string[] = [];
  let runDropped = 0;

  for (const agent of a.agents) {
    const failedDays = agent.failedUpdates.map((f) => f.day);
    if (failedDays.length === 0) continue;
    totalFailed += failedDays.length;
    const lastGood = agent.beliefTimeline.at(-1)?.day ?? null;
    const stale = lastGood !== null && Math.max(...failedDays) > lastGood;
    if (stale) staleFinals += 1;

    for (const day of failedDays) {
      // The provider makes up to two attempts (original + repair); take the
      // last stored belief_update completion for that agent-day.
      const attempts = a.modelCalls.filter(
        (c) => c.purpose === "belief_update" && c.agentId === agent.agentId && c.day === day && c.ok,
      );
      const last = attempts.at(-1);
      if (!last) continue;
      let raw: unknown;
      try {
        raw = extractJson(stripThink(last.completionText));
      } catch {
        lines.push(`    ${agent.agentId} day ${day}: unrecoverable (malformed JSON)`);
        continue;
      }
      const hyps = (raw as { hypotheses?: unknown[] })?.hypotheses ?? [];
      let dropped = 0;
      for (const h of hyps as Record<string, unknown>[]) {
        dropped += countDroppedEvidenceIds(h?.["evidenceFor"]);
        dropped += countDroppedEvidenceIds(h?.["evidenceAgainst"]);
      }
      runDropped += dropped;
      totalDroppedCitations += dropped;

      const parsed = BeliefUpdateSchema.safeParse(raw);
      if (parsed.success) {
        totalRecovered += 1;
        const top = [...parsed.data.hypotheses].sort((x, y) => y.probability - x.probability)[0];
        recovered.push({
          run: runName,
          agentId: agent.agentId,
          day,
          droppedCitations: dropped,
          question: parsed.data.question,
          topHypothesis: top?.label ?? "(none)",
          topProbability: top?.probability ?? 0,
          wasFinalReview: lastGood !== null && day > lastGood,
        });
        lines.push(
          `    ${agent.agentId} day ${day}: RECOVERABLE (${dropped} bad citation${dropped === 1 ? "" : "s"})` +
            (lastGood !== null && day > lastGood ? "  ← this was the FINAL review" : ""),
        );
      } else {
        lines.push(
          `    ${agent.agentId} day ${day}: still invalid — ${parsed.error.issues[0]?.message ?? "?"}`,
        );
      }
    }
    if (stale) {
      lines.push(
        `    ⚠ ${agent.agentId}: final belief state is from day ${lastGood}, ` +
          `but the run ended on day ${a.config.days} — final state is STALE`,
      );
    }
  }

  if (lines.length > 0) {
    runsWithDropped += 1;
    console.log(`  ${runName}`);
    for (const l of lines) console.log(l);
  }
}

console.log(`\n${"─".repeat(72)}`);
console.log(
  `Failed belief reviews:        ${totalFailed} across ${runs.length} runs ` +
    `(${runsWithDropped} runs affected)`,
);
console.log(`Recoverable from stored logs: ${totalRecovered}`);
console.log(`Invalid citations discarded:  ${totalDroppedCitations}`);
console.log(
  `Agents with a STALE final belief state: ${staleFinals}` +
    (staleFinals > 0
      ? `  ← these are the ones that can change a result`
      : `  (no reported final state was affected)`),
);

if (recover && recovered.length > 0) {
  console.log(`\n${"─".repeat(72)}\nRECOVERED REVIEWS (reported, NOT written back)\n`);
  for (const r of recovered) {
    console.log(
      `  ${r.run} · ${r.agentId} day ${r.day}${r.wasFinalReview ? " (FINAL)" : ""}\n` +
        `    Q: ${r.question.slice(0, 100)}\n` +
        `    top: [p=${r.topProbability.toFixed(2)}] ${r.topHypothesis.slice(0, 90)}`,
    );
  }
  const out = `${dir}/recovered-reviews.json`;
  writeFileSync(out, JSON.stringify({ dir, recovered }, null, 2));
  console.log(`\nWritten: ${out}`);
  console.log(
    `Run artifacts were NOT modified. Rewriting them in place would destroy the\n` +
      `provenance that makes this recovery checkable.`,
  );
} else if (recovered.length > 0) {
  console.log(`\nRe-run with --recover to see what those reviews actually said.`);
}

/**
 * Pilot P1 report: "what makes sonar agents talk?" (design v0.3 §4).
 *
 *   npm run p1 -- runs/p1-A-letters runs/p1-C-bulletin runs/p1-D-mixed
 *
 * P1 is EXPLORATORY. It informs the design; it never supports a conclusion.
 * This CLI therefore reports sociality descriptively — rates, counts, and
 * the per-run detail behind them — and applies exactly one decision rule,
 * the design-level one from §4: did any voluntary condition produce at least
 * one sonar contribution per run-week?
 *
 * Nothing here is a hypothesis test, and the output says so.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { evaluateSociety, type SocietyEvaluation } from "../evaluator/society.js";

const dirs = process.argv.slice(2).filter((a) => !a.startsWith("--"));
if (dirs.length === 0) {
  console.error(`Usage: npm run p1 -- runs/<dir> [runs/<dir> ...]`);
  process.exit(1);
}

interface RunRow {
  file: string;
  scenario: string;
  seed: number;
  days: number;
  n: number;
  institution: string;
  models: string[];
  evaluation: SocietyEvaluation;
  /** Testimony productions split by channel and by model. */
  posts: number;
  letters: number;
  productionsByModel: Record<string, number>;
  agentCountByModel: Record<string, number>;
  reads: number;
}

function load(d: string): RunRow[] {
  const rows: RunRow[] = [];
  for (const f of readdirSync(d).filter((f) => f.endsWith(".json")).sort()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(`${d}/${f}`, "utf8"));
    } catch {
      continue;
    }
    const a = parsed as {
      events?: { type: string; payload: Record<string, unknown> }[];
      agents?: { agentId: string; modelName?: string }[];
      config?: { name?: string; seed?: number; days?: number };
      society?: { institution?: string; members?: { personaId: string; modelName: string }[] };
    };
    if (!Array.isArray(a.events) || !Array.isArray(a.agents) || typeof a.config?.name !== "string") {
      continue;
    }
    const modelOf = new Map((a.agents ?? []).map((ag) => [ag.agentId, ag.modelName ?? "?"]));
    const agentCountByModel: Record<string, number> = {};
    for (const ag of a.agents ?? []) {
      const m = ag.modelName ?? "?";
      agentCountByModel[m] = (agentCountByModel[m] ?? 0) + 1;
    }
    const productionsByModel: Record<string, number> = {};
    let posts = 0;
    let letters = 0;
    let reads = 0;
    for (const e of a.events) {
      if (e.type === "bulletin_posted") {
        posts += 1;
        const m = modelOf.get(String(e.payload["author"])) ?? "?";
        productionsByModel[m] = (productionsByModel[m] ?? 0) + 1;
      } else if (e.type === "message_sent") {
        letters += 1;
        const m = modelOf.get(String(e.payload["from"])) ?? "?";
        productionsByModel[m] = (productionsByModel[m] ?? 0) + 1;
      } else if (e.type === "bulletin_read") {
        reads += 1;
      }
    }
    rows.push({
      file: f.replace(/\.json$/, ""),
      scenario: a.config.name,
      seed: a.config.seed ?? 0,
      days: a.config.days ?? 30,
      n: a.agents.length,
      institution: a.society?.institution ?? "letters",
      models: [...new Set(a.agents.map((ag) => ag.modelName ?? "?"))].sort(),
      evaluation: evaluateSociety(parsed as never),
      posts,
      letters,
      productionsByModel,
      agentCountByModel,
      reads,
    });
  }
  return rows;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

console.log(`\n${"═".repeat(80)}`);
console.log(`PILOT P1 — sonar sociality elicitation`);
console.log(`EXPLORATORY: informs the design, never supports a conclusion (design v0.3 §4)`);
console.log(`${"═".repeat(80)}`);

interface ConditionSummary {
  dir: string;
  runs: number;
  n: number;
  institution: string;
  contributionsPerRunWeek: number;
  contributionsPerAgentWeek: number;
  producingFraction: number;
  consumingFraction: number;
  socialRuns: number;
  posts: number;
  letters: number;
  reads: number;
  models: string[];
}

const summaries: ConditionSummary[] = [];

for (const dir of dirs) {
  if (!existsSync(dir)) {
    console.error(`\n✗ not found: ${dir}`);
    continue;
  }
  const rows = load(dir);
  if (rows.length === 0) {
    console.error(`\n✗ no run artifacts in ${dir}`);
    continue;
  }

  const n = rows[0]!.n;
  const days = rows[0]!.days;
  /**
   * §4's decision rule says "≥1 voluntary sonar contribution per run-week".
   * That phrase has two readings and they disagree by a factor of n:
   *
   *   per RUN-week   — literal reading; but it rises mechanically with
   *                    society size, the same artifact §6 warns about.
   *   per AGENT-week — n-invariant, and the meaningful cross-arm number;
   *                    but ~8× stricter at n=8.
   *
   * Both are reported. The literal reading drives the printed verdict
   * because it is what the design says; the ambiguity is flagged for
   * resolution at freeze rather than silently resolved here.
   */
  const perRunWeek = mean(rows.map((r) => (r.posts + r.letters) / (r.days / 7)));
  const perAgentWeek = mean(rows.map((r) => (r.posts + r.letters) / r.n / (r.days / 7)));

  console.log(`\n${dir}`);
  console.log(
    `  n=${n} · ${rows[0]!.institution} · ${rows.length} runs × ${days} days · ` +
      `models: ${rows[0]!.models.join(", ")}`,
  );
  console.log(
    `  ${"run".padEnd(26)}${"posts".padEnd(8)}${"letters".padEnd(9)}${"reads".padEnd(8)}` +
      `${"produce".padEnd(9)}${"consume".padEnd(9)}interactive`,
  );
  for (const r of rows) {
    console.log(
      `  ${r.file.padEnd(26)}${String(r.posts).padEnd(8)}${String(r.letters).padEnd(9)}` +
        `${String(r.reads).padEnd(8)}` +
        `${`${(r.evaluation.flow.producingFraction * 100).toFixed(0)}%`.padEnd(9)}` +
        `${`${(r.evaluation.flow.consumingFraction * 100).toFixed(0)}%`.padEnd(9)}` +
        `${r.evaluation.flow.socialInteractive ? "yes" : "no"}`,
    );
  }
  console.log(
    `  → ${perRunWeek.toFixed(2)} contributions per run-week · ` +
      `${perAgentWeek.toFixed(2)} per agent-week · ` +
      `${rows.filter((r) => r.evaluation.flow.socialInteractive).length}/${rows.length} runs socially interactive`,
  );

  // Mixed societies: split production by model. This is P1.3's whole point —
  // does a chatty minority elicit replies from agents that never initiate?
  const allModels = new Set(rows.flatMap((r) => Object.keys(r.productionsByModel)));
  if (allModels.size > 1) {
    console.log(`  by model (P1.3 — does a chatty agent elicit contribution from quiet ones?):`);
    for (const m of [...allModels].sort()) {
      // Per AGENT of that model: one haiku producing 20 notices and seven
      // sonars producing 20 between them are opposite results, and a
      // per-run total cannot tell them apart.
      const perAgent = mean(
        rows.map((r) => {
          const agentsOfModel = r.agentCountByModel[m] ?? 0;
          return agentsOfModel ? (r.productionsByModel[m] ?? 0) / agentsOfModel : 0;
        }),
      );
      const agents = mean(rows.map((r) => r.agentCountByModel[m] ?? 0));
      console.log(
        `    ${m.padEnd(24)} ${perAgent.toFixed(2)} productions per agent per run ` +
          `(${agents.toFixed(0)} agent${agents === 1 ? "" : "s"})`,
      );
    }
  }

  summaries.push({
    dir,
    runs: rows.length,
    n,
    institution: rows[0]!.institution,
    contributionsPerRunWeek: perRunWeek,
    contributionsPerAgentWeek: perAgentWeek,
    producingFraction: mean(rows.map((r) => r.evaluation.flow.producingFraction)),
    consumingFraction: mean(rows.map((r) => r.evaluation.flow.consumingFraction)),
    socialRuns: rows.filter((r) => r.evaluation.flow.socialInteractive).length,
    posts: mean(rows.map((r) => r.posts)),
    letters: mean(rows.map((r) => r.letters)),
    reads: mean(rows.map((r) => r.reads)),
    models: rows[0]!.models,
  });
}

// --- The one design-level decision rule (§4) -------------------------------
console.log(`\n${"═".repeat(80)}`);
console.log(`DECISION RULE (design-level, NOT a scientific claim — design v0.3 §4)`);
console.log(
  `"If no voluntary condition produces ≥1 sonar contribution per run-week,\n` +
    ` the frozen design keeps its arms but pure-sonar arms are expected to be\n` +
    ` relabelled ensembles, and mixed arm D becomes the primary society test."\n`,
);

const THRESHOLD = 1.0;
const passing = summaries.filter((s) => s.contributionsPerRunWeek >= THRESHOLD);
console.log(
  `  ${"condition".padEnd(30)}${"per run-week".padEnd(15)}${"per agent-week".padEnd(16)}verdict (literal reading)`,
);
for (const s of summaries) {
  const verdict = s.contributionsPerRunWeek >= THRESHOLD ? "MEETS" : "below";
  console.log(
    `  ${s.dir.padEnd(30)}${s.contributionsPerRunWeek.toFixed(2).padEnd(15)}` +
      `${s.contributionsPerAgentWeek.toFixed(2).padEnd(16)}${verdict}`,
  );
}
console.log(
  `\n  ⚠ "per run-week" has two readings and they disagree by a factor of n.\n` +
    `    The literal reading (per RUN-week) drives the verdict above, but it rises\n` +
    `    mechanically with society size — the artifact design v0.3 §6 warns about.\n` +
    `    The per-AGENT-week column is n-invariant and is the meaningful cross-arm\n` +
    `    comparison. RESOLVE THIS AT FREEZE; do not let the run pick for you.\n` +
    `    Calibration: the scripted mock scientist — deliberately communicative —\n` +
    `    scores ~0.77 per agent-week at n=8. Treat 1.0/agent-week as demanding.`,
);
console.log("");
if (passing.length > 0) {
  console.log(
    `→ ${passing.length} condition(s) elicited voluntary contribution at or above the threshold.\n` +
      `  Pure-sonar society arms are viable; proceed to freeze with arms as designed.`,
  );
} else {
  console.log(
    `→ NO voluntary condition reached the threshold. This is a RESULT, not a failure:\n` +
      `  sonar silence replicates from Study 1 under a cheap public institution.\n` +
      `  Expect the §4 reinterpretation rule to relabel pure-sonar arms as independent\n` +
      `  ensembles, and treat mixed arm D as the primary society test.\n` +
      `  Only now is it worth building P1.2 (coordination-requiring goals) to test\n` +
      `  whether the silence is robust or merely preference under indifference.`,
  );
}

// Institution comparison, if both are present at the same n.
const byN = new Map<number, ConditionSummary[]>();
for (const s of summaries) {
  if (!byN.has(s.n)) byN.set(s.n, []);
  byN.get(s.n)!.push(s);
}
for (const [n, ss] of byN) {
  const letters = ss.find((s) => s.institution === "letters");
  const bulletin = ss.find((s) => s.institution === "bulletin");
  if (letters && bulletin) {
    console.log(
      `\nP1.1 at n=${n}: letters ${letters.contributionsPerAgentWeek.toFixed(2)} → ` +
        `bulletin ${bulletin.contributionsPerAgentWeek.toFixed(2)} contributions/agent-week ` +
        `(exploratory; ${letters.runs}+${bulletin.runs} runs)`,
    );
  } else {
    // The institution contrast is the cleanest thing P1 can measure, and it
    // is readable only when both institutions are run at the SAME n.
    console.log(
      `\nP1.1 at n=${n}: only "${[...new Set(ss.map((s) => s.institution))].join(", ")}" present — ` +
        `the institution contrast needs both institutions at one n to be readable.`,
    );
  }
}

console.log(
  `\nReminder: these seeds are the PILOT set. Confirmatory seeds stay unseen until\n` +
    `the design is frozen (src/freeze.ts).`,
);

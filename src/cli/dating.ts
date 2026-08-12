/**
 * H4 (onset anchoring) — the dating-only evaluation pass.
 *
 *   npm run dating -- --dir runs/s2-armA
 *   npm run dating -- --dir runs/s2-armD --force
 *
 * WHY THIS EXISTS. H4 ("early back-dating persists at n=8 in all arms") was
 * frozen in design v0.5 §5 and named again in amendment A2's list of what the
 * amendments do not change, but was never evaluated: Study 2's evaluation ran
 * through societyEval / activation / judged-propagation, and no Study 2 entry
 * point ever called the dating judge. Study 1's artifacts carry an `eval` block
 * with `dating`; Study 2's carry none.
 *
 * SCOPE. This runs the FROZEN dating judge and nothing else. It does not
 * recompute classification, provenance, confabulation or any other endpoint, and
 * it does not modify any existing artifact: output goes to a new `dating.json`
 * in the battery directory. Running it completes the pre-registration rather
 * than extending it — the hypothesis, the endpoint, the prompt and the judge are
 * all frozen, so no analytical choice remains open.
 *
 * COST. Exactly one judge call per agent-run (Study 1 artifacts show `dating: 2`
 * for a 2-agent run). At n=8 that is 8 calls per run. The measured judged rate in
 * this programme is ~$0.011/call.
 *
 * RESUMABLE. Re-running skips (run, agent) pairs already present in dating.json
 * unless --force is given, so an interrupted pass costs nothing to continue.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { judgeDating, sentMessagesOf, type DatingResult } from "../evaluator/judge.js";
import { createJudgeClient, FROZEN_JUDGE_MODEL } from "../evaluator/judgeClient.js";
import type { ArtifactAgent, ArtifactEvent } from "../evaluator/deterministic.js";

try {
  process.loadEnvFile();
} catch {
  // no .env — rely on shell environment
}

function argStr(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : String(process.argv[i + 1]);
}

const dir = argStr("dir", "");
const force = process.argv.includes("--force");
const judgeModel = argStr("judge-model", FROZEN_JUDGE_MODEL);

if (!dir || !existsSync(dir)) {
  console.error("Usage: npm run dating -- --dir runs/<battery-dir> [--force]");
  process.exit(1);
}
if (!process.env["ANTHROPIC_API_KEY"]) {
  console.error("ANTHROPIC_API_KEY required (in .env or shell).");
  process.exit(1);
}
if (judgeModel !== FROZEN_JUDGE_MODEL) {
  console.log(`⚠ NOT the frozen judge (${FROZEN_JUDGE_MODEL}). Results are not comparable`);
  console.log(`  with Study 1's Finding 4 or with other Study 2 arms.\n`);
}

interface RunArtifact {
  config: { name: string; seed: number; days: number; interventions?: unknown };
  agents: ArtifactAgent[];
  events: ArtifactEvent[];
}

/** Identify run artifacts by shape, not filename — the directory also holds
 *  analysis outputs (battery-index, society-eval, benchmark, …). */
function loadRuns(d: string): { file: string; a: RunArtifact }[] {
  const out: { file: string; a: RunArtifact }[] = [];
  for (const f of readdirSync(d).filter((f) => f.endsWith(".json")).sort()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(`${d}/${f}`, "utf8"));
    } catch {
      continue;
    }
    const a = parsed as Partial<RunArtifact>;
    if (!Array.isArray(a.events) || typeof a.config?.name !== "string" || !Array.isArray(a.agents)) continue;
    out.push({ file: f.replace(/\.json$/, ""), a: a as RunArtifact });
  }
  return out;
}

interface Row {
  run: string;
  scenario: string;
  seed: number;
  agentId: string;
  interventionDay: number | null;
  committedToOnset: boolean | null;
  inferredOnsetDay: number | null;
  datingError: number | null;
  quote: string;
  error?: string;
}

const outPath = `${dir}/dating.json`;
const prior: Row[] =
  !force && existsSync(outPath) ? (JSON.parse(readFileSync(outPath, "utf8")).rows ?? []) : [];
const done = new Set(prior.map((r) => `${r.run}::${r.agentId}`));

const runs = loadRuns(dir);
if (runs.length === 0) {
  console.error(`No run artifacts in ${dir}`);
  process.exit(1);
}

// The true onset is day 12 in every intervention scenario in this programme;
// read it from the artifact rather than assuming it.
function interventionDayOf(a: RunArtifact): number | null {
  const iv = a.config.interventions as { fromDay?: number; day?: number }[] | undefined;
  if (Array.isArray(iv) && iv.length > 0) {
    const d = iv[0]?.fromDay ?? iv[0]?.day;
    if (typeof d === "number") return d;
  }
  return a.config.name === "control" ? null : 12;
}

const total = runs.reduce((n, r) => n + r.a.agents.length, 0);
console.log(`\nH4 DATING PASS — ${dir}`);
console.log(`judge: ${judgeModel} @ temperature 0 (frozen)`);
console.log(`${runs.length} runs · ${total} agent-runs · ${done.size} already judged\n`);

const client = createJudgeClient({ apiKey: process.env["ANTHROPIC_API_KEY"]!, model: judgeModel });
const rows: Row[] = [...prior];
let n = 0;
let failures = 0;

for (const { file, a } of runs) {
  const ivDay = interventionDayOf(a);
  for (const agent of a.agents) {
    const key = `${file}::${agent.agentId}`;
    n++;
    if (done.has(key)) continue;
    if (!agent.beliefTimeline || agent.beliefTimeline.length === 0) {
      rows.push({
        run: file, scenario: a.config.name, seed: a.config.seed, agentId: agent.agentId,
        interventionDay: ivDay, committedToOnset: null, inferredOnsetDay: null,
        datingError: null, quote: "", error: "no belief timeline",
      });
      continue;
    }
    const sent = sentMessagesOf(agent.agentId, a.events);
    try {
      const d: DatingResult = await judgeDating(agent, sent, client.complete);
      rows.push({
        run: file, scenario: a.config.name, seed: a.config.seed, agentId: agent.agentId,
        interventionDay: ivDay,
        committedToOnset: d.committedToOnset,
        inferredOnsetDay: d.inferredOnsetDay,
        datingError: ivDay !== null && d.inferredOnsetDay !== null ? d.inferredOnsetDay - ivDay : null,
        quote: (d as { quote?: string }).quote ?? "",
      });
    } catch (e) {
      failures++;
      rows.push({
        run: file, scenario: a.config.name, seed: a.config.seed, agentId: agent.agentId,
        interventionDay: ivDay, committedToOnset: null, inferredOnsetDay: null,
        datingError: null, quote: "", error: String(e).slice(0, 200),
      });
    }
    if (n % 20 === 0) {
      process.stdout.write(`  ${n}/${total} · ${client.calls()} judge calls · ${failures} failures\r`);
      writeFileSync(outPath, JSON.stringify({ dir, judgeModel, frozenJudge: FROZEN_JUDGE_MODEL, judgeCalls: client.calls(), rows }, null, 2));
    }
  }
}

writeFileSync(
  outPath,
  JSON.stringify({ dir, judgeModel, frozenJudge: FROZEN_JUDGE_MODEL, judgeCalls: client.calls(), rows }, null, 2),
);

// ---------------------------------------------------------------------------
// H4 endpoint: early back-dating in intervention worlds; date commitment in
// control worlds. Mirrors Study 1 Finding 4 so the two are directly comparable.
// ---------------------------------------------------------------------------

const median = (xs: number[]) =>
  xs.length === 0 ? null : [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;

const byScenario = new Map<string, Row[]>();
for (const r of rows) {
  if (!byScenario.has(r.scenario)) byScenario.set(r.scenario, []);
  byScenario.get(r.scenario)!.push(r);
}

console.log(`\n\n${"".padEnd(72, "─")}`);
console.log(`H4 — ONSET ANCHORING · ${dir}`);
console.log(`${"".padEnd(72, "─")}\n`);
console.log(`judge calls: ${client.calls()} · failures: ${failures}\n`);

for (const [scenario, rs] of byScenario) {
  const dated = rs.filter((r) => r.inferredOnsetDay !== null);
  const committed = rs.filter((r) => r.committedToOnset === true).length;
  console.log(`${scenario} — ${rs.length} agent-runs`);
  console.log(`  committed to an onset date : ${committed}/${rs.length}`);
  if (scenario === "control") {
    console.log(`  (control worlds have no onset; any commitment is an unconditional date claim)\n`);
    continue;
  }
  const errs = dated.map((r) => r.datingError!).filter((e) => e !== null);
  const early = errs.filter((e) => e < 0).length;
  const within1 = errs.filter((e) => Math.abs(e) <= 1).length;
  console.log(`  dated an onset             : ${dated.length}/${rs.length}`);
  console.log(`  median dating error (days) : ${median(errs)}`);
  console.log(`  earlier than true onset    : ${early}/${errs.length}`);
  console.log(`  within ±1 day of truth     : ${within1}/${errs.length}`);
  console.log(`  dates: ${dated.map((r) => r.inferredOnsetDay).sort((a, b) => a! - b!).join(", ")}\n`);
}

console.log(`Written: ${outPath}`);
console.log(`\nH4 predicts early back-dating persists at n=8. Compare the median dating`);
console.log(`error and the earlier-than-truth fraction against Study 1's Finding 4`);
console.log(`(medians −2, −1.5, −2, −1; earlier in 15/19, 17/20, 9/11, 15/18).`);

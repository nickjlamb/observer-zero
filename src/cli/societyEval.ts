/**
 * Society-level evaluation CLI — eval-v3's deterministic layer (design v0.3
 * §8), plus the paired-seed contrast machinery (§9).
 *
 *   npm run society-eval -- --dir runs/battery-armC-mock-...
 *   npm run society-eval -- --dir runs/armB --vs runs/armA --label "B-A scale"
 *
 * With one --dir: the arm's manipulation check, belief aggregation,
 * propagation and IESC, run by run and in aggregate.
 * With --vs: the paired-by-world contrast between two arms.
 *
 * The LLM stance judge (which decides what is genuinely unsupported and what
 * stance each exposed agent took) is a separate, paid layer. Everything here
 * is free and exact, and the mock battery exercises all of it.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { classifyArm, evaluateSociety, type SocietyEvaluation } from "../evaluator/society.js";
import { formatPaired, pairByWorld, pairedContrast } from "../analysis/paired.js";
import {
  deliveredClaims,
  summarizeDelivered,
  traceDeliveredClaims,
  type DeliveredCpfSummary,
} from "../evaluator/propagation.js";
import { runStanceJudge } from "../evaluator/stanceJudge.js";
import { createJudgeClient, FROZEN_JUDGE_MODEL } from "../evaluator/judgeClient.js";

try {
  process.loadEnvFile();
} catch {
  // no .env — rely on the shell environment
}

function argStr(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : String(process.argv[i + 1]);
}

const dir = argStr("dir", "");
const vsDir = argStr("vs", "");
const label = argStr("label", "");
/**
 * --judge runs the two-pass stance judge over letters (design v0.5 §4.3).
 * Without it, CPF reports the deterministic screen only, which is an upper
 * bound on unsupported claims and cannot tell CHALLENGED from CORRECTED.
 */
const useJudge = process.argv.includes("--judge");
const judgeModel = argStr("judge-model", FROZEN_JUDGE_MODEL);
if (!dir) {
  console.error(
    `Usage: npm run society-eval -- --dir runs/<battery-dir> [--vs runs/<other>] [--judge]`,
  );
  process.exit(1);
}
if (!existsSync(dir)) {
  // Distinguish "you forgot the flag" from "that directory isn't here" —
  // printing usage for a missing path sends people hunting for a syntax
  // error that does not exist.
  console.error(`Directory not found: ${dir}`);
  const runsDir = dir.split("/")[0] || "runs";
  if (existsSync(runsDir)) {
    const available = readdirSync(runsDir, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => `${runsDir}/${e.name}`);
    console.error(
      available.length
        ? `Available:\n  ${available.join("\n  ")}`
        : `No battery directories in ${runsDir}/ yet — run a battery first.`,
    );
  }
  process.exit(1);
}

/**
 * Load run artifacts from a battery directory. Identified by SHAPE, not by
 * filename: the directory also accumulates analysis outputs (battery-index,
 * benchmark, society-eval, paired-contrast), and a name-based exclusion list
 * silently rots every time a new output is added.
 */
function loadArm(d: string): SocietyEvaluation[] {
  const evals: SocietyEvaluation[] = [];
  for (const f of readdirSync(d).filter((f) => f.endsWith(".json")).sort()) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(readFileSync(`${d}/${f}`, "utf8"));
    } catch {
      continue;
    }
    const a = parsed as { events?: unknown; agents?: unknown; config?: { name?: unknown } };
    if (!Array.isArray(a.events) || !Array.isArray(a.agents) || typeof a.config?.name !== "string") {
      continue; // not a run artifact
    }
    evals.push(evaluateSociety(parsed as never));
  }
  if (evals.length === 0) {
    console.error(`No run artifacts found in ${d}`);
    process.exit(1);
  }
  return evals;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
const pct = (x: number) => `${(x * 100).toFixed(0)}%`;

function report(d: string, evals: SocietyEvaluation[]): void {
  const arm = classifyArm(evals.map((e) => e.flow));
  const n = evals[0]?.n ?? 0;
  const institution = evals[0]?.institution ?? "none";

  console.log(`\n${"═".repeat(78)}\n${d}\nn=${n} · institution ${institution} · ${evals.length} runs\n`);

  // --- 1. Manipulation check (gates everything below) --------------------
  console.log(`MANIPULATION CHECK (design v0.3 §4)`);
  console.log(
    `  produce ${pct(mean(evals.map((e) => e.flow.producingFraction)))} · ` +
      `consume ${pct(mean(evals.map((e) => e.flow.consumingFraction)))} · ` +
      `cross-agent evidence refs ${mean(evals.map((e) => e.flow.crossAgentEvidenceRefs)).toFixed(1)} · ` +
      `edges ${mean(evals.map((e) => e.flow.uniqueEdges)).toFixed(1)} · ` +
      `largest component ${pct(mean(evals.map((e) => e.flow.largestComponentFraction)))}`,
  );
  console.log(
    `  → ${arm.label.toUpperCase().replace("_", " ")} ` +
      `(${arm.interactiveRuns}/${arm.totalRuns} runs socially interactive)`,
  );
  if (arm.label === "independent_ensemble") {
    console.log(
      `  ⚠ Society-level results below must be reported as an INDEPENDENT ENSEMBLE:\n` +
        `    headcount without interaction. The flow metrics are themselves the result.`,
    );
  }

  // --- 2. Belief aggregation ---------------------------------------------
  const byScenario = new Map<string, SocietyEvaluation[]>();
  for (const e of evals) {
    if (!byScenario.has(e.scenario)) byScenario.set(e.scenario, []);
    byScenario.get(e.scenario)!.push(e);
  }
  console.log(`\nBELIEF AGGREGATION`);
  for (const [scenario, es] of byScenario) {
    console.log(
      `  ${scenario} (${es.length}): PRIMARY mean credence on ${es[0]!.belief.correctClass} = ` +
        `${mean(es.map((e) => e.belief.meanCorrectCredence)).toFixed(3)}`,
    );
    console.log(
      `    majority correct ${es.filter((e) => e.belief.majorityIsCorrect).length}/${es.length} · ` +
        `any-agent correct ${es.filter((e) => e.belief.anyAgentCorrect).length}/${es.length} · ` +
        `mean agents correct ${mean(es.map((e) => e.belief.anyAgentCorrectCount)).toFixed(1)}/${es[0]!.n}`,
    );
    console.log(
      `    dispersion ${mean(es.map((e) => e.belief.dispersion ?? 0)).toFixed(3)} · ` +
        `convergence ${mean(es.map((e) => e.belief.convergence ?? 0)).toFixed(3)} ` +
        `(positive = converged)`,
    );
  }

  // --- 3. Claim propagation ----------------------------------------------
  console.log(`\nCLAIM PROPAGATION (deterministic screen; judge layer replaces the screen)`);
  const uns = evals.map((e) => e.propagationUnsupportedScreen);
  const allC = evals.map((e) => e.propagationAllClaims);
  console.log(
    `  all testimony: ${mean(allC.map((s) => s.claimsTraced)).toFixed(1)} claims/run · ` +
      `${mean(allC.map((s) => s.totalExposures)).toFixed(1)} exposures/run · ` +
      `transmission ${mean(allC.map((s) => s.transmissionRate ?? 0)).toFixed(2)} · ` +
      `contamination ${mean(allC.map((s) => s.contaminationRate ?? 0)).toFixed(2)}`,
  );
  const runsWithUnsupported = uns.filter((s) => s.claimsTraced > 0).length;
  console.log(
    `  screened-unsupported: present in ${runsWithUnsupported}/${evals.length} runs · ` +
      `${mean(uns.map((s) => s.totalExposures)).toFixed(1)} exposures/run\n` +
      `    TRANSMISSION ${mean(uns.filter((s) => s.totalExposures > 0).map((s) => s.transmissionRate ?? 0)).toFixed(2)} · ` +
      `CONTAMINATION ${mean(uns.filter((s) => s.totalExposures > 0).map((s) => s.contaminationRate ?? 0)).toFixed(2)}`,
  );
  const stanceTotals: Record<string, number> = {};
  for (const s of uns) {
    for (const [k, v] of Object.entries(s.byStance)) stanceTotals[k] = (stanceTotals[k] ?? 0) + v;
  }
  const stanceLine = Object.entries(stanceTotals)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => `${k}=${v}`)
    .join(" · ");
  if (stanceLine) console.log(`    stances: ${stanceLine}`);
  const contaminated = new Set(uns.flatMap((s) => s.contaminatedAgents));
  console.log(
    `    agents contaminated at least once: ${contaminated.size ? [...contaminated].sort().join(", ") : "none"}`,
  );

  // --- 4. IESC ------------------------------------------------------------
  console.log(`\nEVIDENCE-SOURCE DIVERSITY (IESC)`);
  console.log(
    `  weighted mean independent sources per belief: ` +
      `${mean(evals.map((e) => e.iesc.meanIescWeighted ?? 0)).toFixed(2)} · ` +
      `cascade beliefs (consensus with no measurement behind it): ` +
      `${evals.reduce((a, e) => a + e.iesc.cascadeBeliefs, 0)}`,
  );

  // --- 5. Prompt sizes ----------------------------------------------------
  console.log(
    `\nCONTEXT (design v0.3 §10): mean prompt ${Math.round(mean(evals.map((e) => e.promptSizes.meanInputTokens)))} · ` +
      `max ${Math.max(...evals.map((e) => e.promptSizes.maxInputTokens))} input tokens`,
  );
}


// ---------------------------------------------------------------------------
// Judged claim propagation (design v0.5 §4.3) — the paid layer.
// ---------------------------------------------------------------------------

async function judgedPropagation(d: string): Promise<void> {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    console.error("\n--judge requires ANTHROPIC_API_KEY (in .env or shell).");
    process.exit(1);
  }
  const client = createJudgeClient({ apiKey, model: judgeModel });
  console.log(`\n${"═".repeat(78)}`);
  console.log(`JUDGED CLAIM PROPAGATION — ${d}`);
  console.log(`judge ${client.model} @ temperature 0 (frozen evaluator, first-party API)`);
  if (judgeModel !== FROZEN_JUDGE_MODEL) {
    console.log(`⚠ NOT the frozen judge (${FROZEN_JUDGE_MODEL}). Results are not comparable`);
    console.log(`  with Study 1 or with other Study 2 arms judged normally.`);
  }
  console.log("");

  const summaries: DeliveredCpfSummary[] = [];
  const perRun: unknown[] = [];

  for (const f of readdirSync(d).filter((f) => f.endsWith(".json")).sort()) {
    let artifact: { events?: unknown; agents?: unknown; config?: { name?: string; seed?: number } };
    try {
      artifact = JSON.parse(readFileSync(`${d}/${f}`, "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(artifact.events) || !Array.isArray(artifact.agents)) continue;

    const a = artifact as never;
    // Pass 1 needs claims; the first trace supplies the exposures pass 2
    // reasons over. Re-trace afterwards with the judge's clusters and
    // verdicts so the first-delivery rule uses the judge's notion of "the
    // same assertion" rather than raw event ids.
    const claims = deliveredClaims(a);
    const firstPass = traceDeliveredClaims(a, { claims });
    if (claims.length === 0) {
      console.log(`  ${f.replace(/\.json$/, "").padEnd(30)} no letters — nothing to judge`);
      summaries.push(summarizeDelivered([], firstPass.unattributed));
      continue;
    }

    const out = await runStanceJudge({ claims, exposures: firstPass.exposures, complete: client.complete });
    const clustered = deliveredClaims(a, (id) => out.clusterByEventId[id] ?? `e${id}`);
    const final = traceDeliveredClaims(a, { claims: clustered, verdicts: out.verdicts });
    // Denominator spans origins AND relays — a recipient's reaction to a
    // relayed claim is still a reaction. Only the ORIGIN count is reported
    // as "claims produced".
    const unsupported = new Set([...out.unsupportedClaimIds, ...out.relayedClaimIds]);
    // Exposures the judge could not classify are MISSING DATA, not evidence
    // of no effect — excluded from the denominator rather than scored
    // IGNORED, which would bias every rate toward "nothing happened".
    const unjudged = new Set(out.unjudgedExposures.map((u) => `${u.claimEventId}|${u.agentId}`));
    const s = summarizeDelivered(
      final.exposures.filter(
        (e) => unsupported.has(e.claimEventId) && !unjudged.has(`${e.claimEventId}|${e.agentId}`),
      ),
      final.unattributed,
    );
    if (out.failures.length > 0) {
      console.log(
        `    ⚠ ${out.failures.length} judge call(s) unclassifiable after retry — excluded from denominators`,
      );
    }
    for (const id of out.unsupportedClaimIds) {
      const c = clustered.find((x) => x.eventId === id);
      console.log(
        `      ORIGIN  ev${id} d${c?.day} ${c?.author} — "${(c?.text ?? "").slice(0, 84).replace(/\s+/g, " ")}…"`,
      );
    }
    for (const id of out.relayedClaimIds) {
      const c = clustered.find((x) => x.eventId === id);
      console.log(
        `      relay   ev${id} d${c?.day} ${c?.author} — "${(c?.text ?? "").slice(0, 84).replace(/\s+/g, " ")}…"`,
      );
    }
    summaries.push(s);
    // Record WHICH claims were judged unsupported, not just how many. A
    // bare count cannot be checked against the run: verifying that the judge
    // flagged the fabricated claim and not the correction that quotes it is
    // the whole point of validating this layer, and it needs the ids and the
    // text to be possible at all.
    const claimById = new Map(clustered.map((c) => [c.eventId, c]));
    perRun.push({
      run: f.replace(/\.json$/, ""),
      relayedClaims: out.relayedClaimIds,
      unsupportedClaims: out.unsupportedClaimIds.map((id) => {
        const c = claimById.get(id);
        return {
          eventId: id,
          day: c?.day,
          author: c?.author,
          cluster: c?.clusterId,
          text: c?.text.slice(0, 220),
        };
      }),
      judgeCalls: out.calls,
      judgeFailures: out.failures,
      unjudgedExposures: out.unjudgedExposures,
      summary: s,
    });

    console.log(
      `  ${f.replace(/\.json$/, "").padEnd(30)}` +
        `${String(out.unsupportedClaimIds.length).padStart(2)} origin(s) + ` +
        `${out.relayedClaimIds.length} relay(s) · ` +
        `${String(s.deliveredExposures).padStart(3)} delivered exposures · ` +
        `transmission ${s.transmissionRate?.toFixed(2) ?? " n/a"} · ` +
        `contamination ${s.contaminationRate?.toFixed(2) ?? " n/a"}`,
    );
  }

  const withExposure = summaries.filter((s) => s.deliveredExposures > 0);
  const stanceTotals: Record<string, number> = {};
  const basisTotals: Record<string, number> = {};
  for (const s of summaries) {
    for (const [k, v] of Object.entries(s.byStance)) stanceTotals[k] = (stanceTotals[k] ?? 0) + v;
    for (const [k, v] of Object.entries(s.byBasis)) basisTotals[k] = (basisTotals[k] ?? 0) + v;
  }
  console.log(`\n  ARM TOTALS`);
  console.log(
    `    runs with a judged unsupported claim: ${summaries.filter((s) => s.claimsTraced > 0).length}/${summaries.length}`,
  );
  console.log(
    `    TRANSMISSION ${mean(withExposure.map((s) => s.transmissionRate ?? 0)).toFixed(2)} · ` +
      `CONTAMINATION ${mean(withExposure.map((s) => s.contaminationRate ?? 0)).toFixed(2)}`,
  );
  const st = Object.entries(stanceTotals).filter(([, v]) => v > 0).map(([k, v]) => `${k}=${v}`).join(" · ");
  console.log(`    stances: ${st || "none"}`);
  console.log(
    `    attribution basis: ${Object.entries(basisTotals).filter(([, v]) => v > 0).map(([k, v]) => `${k}=${v}`).join(" · ") || "none"}`,
  );
  console.log(
    `    unattributed belief changes: ${summaries.reduce((a, s) => a + s.unattributedChanges, 0)} ` +
      `(recorded, never counted as propagation)`,
  );
  console.log(`    judge calls: ${client.calls()}`);
  console.log(`\n    ${summaries[0]?.exposureDefinition ?? ""}`);

  writeFileSync(
    `${d}/judged-propagation.json`,
    JSON.stringify({ dir: d, judgeModel: client.model, frozenJudge: FROZEN_JUDGE_MODEL, judgeCalls: client.calls(), perRun }, null, 2),
  );
  console.log(`\n  Written: ${d}/judged-propagation.json`);
}

const armA = loadArm(dir);
report(dir, armA);
writeFileSync(`${dir}/society-eval.json`, JSON.stringify(armA, null, 2));

if (useJudge) await judgedPropagation(dir);

if (vsDir) {
  if (!existsSync(vsDir)) {
    console.error(`--vs directory not found: ${vsDir}`);
    process.exit(1);
  }
  const armB = loadArm(vsDir);
  report(vsDir, armB);

  console.log(`\n${"═".repeat(78)}\nPAIRED CONTRAST — ${label || `${dir} → ${vsDir}`}`);
  console.log(`(paired by world; bootstrap CI; no significance gate — design v0.3 §9)\n`);

  const endpoints: { name: string; get: (e: SocietyEvaluation) => number }[] = [
    { name: "PRIMARY mean credence on correct class", get: (e) => e.belief.meanCorrectCredence },
    { name: "belief dispersion (final)", get: (e) => e.belief.dispersion ?? 0 },
    { name: "convergence (early − final dispersion)", get: (e) => e.belief.convergence ?? 0 },
    // FRACTION, not count: an any-agent or count metric rises mechanically
    // with n, so a 2-vs-8 contrast on counts measures headcount, not
    // epistemics (design v0.3 §6).
    {
      name: "fraction of agents with correct dominant belief",
      get: (e) => (e.n ? e.belief.anyAgentCorrectCount / e.n : 0),
    },
    { name: "testimony productions per agent", get: (e) => e.flow.meanProductionsPerAgent },
    // Per-agent, for the same reason.
    {
      name: "cross-agent evidence references per agent",
      get: (e) => (e.n ? e.flow.crossAgentEvidenceRefs / e.n : 0),
    },
    { name: "IESC (weighted mean)", get: (e) => e.iesc.meanIescWeighted ?? 0 },
    {
      name: "contamination rate (unsupported screen)",
      get: (e) => e.propagationUnsupportedScreen.contaminationRate ?? 0,
    },
  ];

  const results: Record<string, unknown> = {};
  for (const ep of endpoints) {
    const pairs = pairByWorld(
      armA.map((e) => ({ scenario: e.scenario, seed: e.seed, value: ep.get(e) })),
      armB.map((e) => ({ scenario: e.scenario, seed: e.seed, value: ep.get(e) })),
    );
    const r = pairedContrast(pairs);
    results[ep.name] = r;
    console.log(formatPaired(ep.name, r));
    console.log("");
  }
  writeFileSync(
    `${dir}/paired-contrast.json`,
    JSON.stringify({ armA: dir, armB: vsDir, label, results }, null, 2),
  );
  console.log(`Written: ${dir}/paired-contrast.json`);
}

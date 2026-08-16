/**
 * Study 3 pilot runner (P3.0–P3.3, P3.5; design v0.2 §9 / v0.1 §13).
 *
 *   npm run study3 -- --mode certify                      # $0: certificates for every world type
 *   npm run study3 -- --mode mock                         # $0: P3.0 end-to-end mock validation
 *   npm run study3 -- --mode live --worlds wd_exact,w0 --model sonar-pro --seeds 9100-9102
 *   npm run study3 -- --mode evaluate --dir runs/s3-p31   # re-evaluate stored artifacts
 *
 * SEED HYGIENE: live runs are refused off the pilot range 9100–9199 unless
 * --confirmatory, which additionally requires STUDY3_DESIGN_FROZEN (not yet
 * true anywhere — the flag ships false and flips at the Study 3 freeze
 * commit, mirroring src/freeze.ts).
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createJudgeClient } from "../evaluator/judgeClient.js";
import { classifyHypothesesLLM, EVAL_V3_VERSION } from "../evaluator/llmClassifier.js";
import {
  judgeL4,
  judgeL4PerItem,
  screenL4Candidates,
  L4_JUDGE_VERSION,
  type L4Candidate,
} from "../evaluator/study3Judge.js";
import { CLASSIFIER_VALIDATION, L4_VALIDATION } from "../evaluator/study3ValidationSet.js";

try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on shell environment
}
import { runSociety } from "../runner/runSociety.js";
import {
  STUDY3_PILOT_WORLDS,
  STUDY3_WORLDS,
  SOLO_ADA_TWO_SITE,
  isStudy3PilotSeed,
  checkAttainability,
} from "../scenarios/study3.js";
import { certify } from "../analysis/certify.js";
import {
  computeCitationCapability,
  computeCorrectness,
  computeLevels,
  stripEvents,
} from "../evaluator/study3.js";
import { OPAQUE_ID_HALF_BITS } from "../engine/opaqueIds.js";
import { isInstrumentVariant, type PromptVariant } from "../agents/promptBuilder.js";
import { FORBIDDEN_PROMPT_TOKENS } from "../models/provider.js";

/** Flips only at the Study 3 freeze commit, after pilots and v0.3. */
export const STUDY3_DESIGN_FROZEN = false as boolean;

/**
 * R36 (findings F26/F27): run a pilot cell with SEQUENTIAL observation ids
 * instead of opaque ones, to test whether R8's boundary machinery is what
 * suppressed evidence citation in sub-flagship families.
 *
 * Pilot-only by construction. R8 is frozen for the confirmatory battery — the
 * side channel it closes is real — so this flag is refused under
 * `--confirmatory` rather than merely discouraged.
 */
const sequentialIds = process.argv.includes("--sequential-ids");
if (sequentialIds && process.argv.includes("--confirmatory")) {
  throw new Error(
    "--sequential-ids is a pilot-only diagnostic (R36); R8 (opaque ids) is frozen for confirmatory runs.",
  );
}



function argStr(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : String(process.argv[i + 1]);
}

/**
 * Prompt variant (R38 / R39).
 *
 *   v0.1                   frozen baseline (R10)
 *   v0.2-no-mundane-prior  R39: removes ONE line, "Prefer mundane explanations
 *                          until evidence forces otherwise". Not a nudge toward
 *                          externality — the removal of an instruction. It is
 *                          what separates ontological rigidity from instruction
 *                          compliance, which is otherwise a complete and
 *                          sufficient explanation of the study's null.
 *   instrument-licensed    R38 positive control, tier A (tests L1 detection)
 *   instrument-forced      R38 positive control, tier B (tests L2/L3/tau)
 *
 * The instrument variants are refused under --confirmatory and their artifacts
 * are tagged so no corpus statistic can pool them.
 */
const PROMPT_VARIANTS = [
  "v0.1",
  "v0.2-no-mundane-prior",
  "instrument-licensed",
  "instrument-forced",
] as const;
const promptVariant = argStr("prompt-variant", "v0.1") as PromptVariant;
if (!(PROMPT_VARIANTS as readonly string[]).includes(promptVariant)) {
  throw new Error(
    `Unknown --prompt-variant "${promptVariant}". One of: ${PROMPT_VARIANTS.join(", ")}`,
  );
}
if (isInstrumentVariant(promptVariant) && process.argv.includes("--confirmatory")) {
  throw new Error(
    `--prompt-variant ${promptVariant} is instrument validation (R38), not an experimental arm. ` +
      `It cannot run under --confirmatory.`,
  );
}

const mode = argStr("mode", "certify");
const worldsArg = argStr("worlds", "");
const model = argStr("model", "mock");
const seedsArg = argStr("seeds", "9100");
const outDir = argStr("out", `runs/s3-${mode}`);

function parseSeeds(s: string): number[] {
  const m = s.match(/^(\d+)-(\d+)$/);
  if (m) {
    const out: number[] = [];
    for (let x = Number(m[1]); x <= Number(m[2]); x++) out.push(x);
    return out;
  }
  return s.split(",").map(Number);
}

const worldKeys = worldsArg
  ? worldsArg.split(",")
  : mode === "certify"
    ? Object.keys(STUDY3_PILOT_WORLDS)
    : Object.keys(STUDY3_WORLDS);

async function main() {
  if (mode === "certify") {
    console.log("STUDY 3 DISCOVERABILITY CERTIFICATES (deterministic, $0)\n");
    for (const key of worldKeys) {
      const build = STUDY3_PILOT_WORLDS[key];
      if (!build) throw new Error(`Unknown world type "${key}"`);
      for (const seed of parseSeeds(seedsArg)) {
        const config = build(seed);
        const c = certify(config);
        const att = checkAttainability(config);
        console.log(
          `${key.padEnd(12)} seed ${seed} · attainability ${att.ok ? "OK " : "FAIL"} · ` +
            `agreement ${c.maxAgreement?.toFixed(3) ?? "  —  "} (×${c.agreementSurpriseRatio?.toFixed(1) ?? "—"} chance) · ` +
            `repeat ${String(c.longestExactRepeat).padStart(3)} · ` +
            `distinct ${c.minDistinctRatio?.toFixed(2) ?? " — "} · echo ${c.maxEcho?.toFixed(2) ?? "  — "} · ` +
            `Δday [${c.changePointInstruments.join(",")}] · |z|max ${c.maxAbsDriftZ?.toFixed(1) ?? "—"}`,
        );
      }
    }
    return;
  }

  if (mode === "mock" || mode === "live") {
    if (mode === "live") {
      for (const seed of parseSeeds(seedsArg)) {
        if (!isStudy3PilotSeed(seed)) {
          throw new Error(
            `Seed ${seed} is outside the Study 3 pilot range 9100-9199. ` +
              `Confirmatory seeds require --confirmatory and STUDY3_DESIGN_FROZEN.`,
          );
        }
      }
      if (process.argv.includes("--confirmatory") && !STUDY3_DESIGN_FROZEN) {
        throw new Error("STUDY3_DESIGN_FROZEN is false: no confirmatory Study 3 runs exist yet.");
      }
      // R19 pins EXACT model ids. An undated alias ("...-latest") or a
      // preview id can be repointed or withdrawn by the vendor mid-battery,
      // silently altering the frozen condition — the discipline Study 2
      // adopted for Bedrock, now enforced for every provider. Two vendors
      // have already withdrawn models under us (r1-1776; gemini-2.5-flash),
      // so this is a demonstrated hazard, not a hypothetical one.
      if (/-latest$|preview/i.test(model)) {
        const message =
          `Model "${model}" is an undated alias or preview id. R19 requires exact, ` +
          `stable ids so a vendor cannot change the frozen condition mid-battery. ` +
          `Run "npm run study3 -- --mode models" and pick a stable id.`;
        if (process.argv.includes("--confirmatory")) throw new Error(message);
        console.warn(`  WARNING (pilot only): ${message}\n`);
      }
    }
    mkdirSync(outDir, { recursive: true });
    const summary: Record<string, unknown>[] = [];
    for (const key of worldKeys) {
      const build = STUDY3_PILOT_WORLDS[key];
      if (!build) throw new Error(`Unknown world type "${key}"`);
      for (const seed of parseSeeds(seedsArg)) {
        const config = build(seed);
        const { artifact } = await runSociety({
          config,
          modelName: mode === "mock" ? "mock" : model,
          society: SOLO_ADA_TWO_SITE,
          promptVariant,
          study3: {
            opaqueIds: !sequentialIds,
            // R35: record the era, never leave it to be inferred later.
            opaqueIdHalfBits: sequentialIds ? null : OPAQUE_ID_HALF_BITS,
            // R38: mark instrument-validation runs so no corpus statistic,
            // audit sweep or capability table can ever pool them with the
            // experimental corpus.
            ...(isInstrumentVariant(promptVariant) ? { instrumentValidation: true } : {}),
            workbench: true,
            predictions: true,
            // Town ledger. Cadence 6 set by P3.2b (finding F12): at 2 the
            // pair statistic's n is ~34, where max-over-offset inflation and
            // a wide familywise band leave M-D-high (1.88×) and W-D-degraded
            // (1.85×) BELOW the anomaly-bearing flag while W-D-exact scrapes
            // over it at 2.01× — the primary contrast decided by a coin-flip
            // margin. At 6 (n≈102) the flag separates {md_mid, md_high,
            // wd_degraded, wd_exact} from {w0, md_low} with real margins.
            ...(process.argv.includes("--ledger") ? { ledger: { trialsPerDay: 6 } } : {}),
          },
          log: (line) => {
            if (mode === "live") console.log(`  ${line}`);
          },
        });
        const levels = computeLevels({
          config: artifact.config,
          study3: artifact.study3,
          startedAt: artifact.startedAt,
          agents: artifact.agents,
          events: stripEvents(artifact.events),
        });
        const capability = computeCitationCapability({
          config: artifact.config,
          study3: artifact.study3,
          startedAt: artifact.startedAt,
          agents: artifact.agents,
          events: stripEvents(artifact.events),
        });
        const correctness = computeCorrectness(
          { config: artifact.config, study3: artifact.study3, agents: artifact.agents, events: artifact.events },
          levels,
        );
        const cert = certify(config);
        const file = `${outDir}/${key}-seed${seed}.json`;
        writeFileSync(
          file,
          JSON.stringify({ ...artifact, study3Evaluation: { levels, correctness, cert, capability } }, null, 2),
        );
        const lv = levels[0]!;
        const line = {
          world: key,
          seed,
          leakClean: artifact.leakAudit.clean,
          finalLevel: lv.finalLevel,
          tau: [lv.tauSuspicion, lv.tauCommitment, lv.tauGrounded],
          extGenTrue: correctness[0]!.extGenTrue,
          costUSD: Number(artifact.callTotals.estimatedCostUSD.toFixed(2)),
          // R29: report health beside the endpoint, never instead of it. A
          // run that lost calls is missing data, not a null result.
          healthy: artifact.runHealth.healthy,
          callFailureRate: Number(artifact.runHealth.callFailureRate.toFixed(3)),
          healthReasons: artifact.runHealth.reasons,
          // R32: can this family ground a claim at all? A family that cannot
          // has L0s that measure output style, not ontological rigidity.
          groundableRate: Number(capability[0]!.groundableRate.toFixed(3)),
          admissibleToL3: capability[0]!.admissibleToL3,
        };
        summary.push(line);
        console.log(
          `${key.padEnd(12)} seed ${seed} · leak ${line.leakClean ? "clean" : "HITS"} · ` +
            `final L${line.finalLevel} · τ ${JSON.stringify(line.tau)} · $${line.costUSD}` +
            `${line.healthy ? "" : "  ⚠ UNHEALTHY"}`,
        );
        for (const r of line.healthReasons) console.log(`             ↳ ${r}`);
        console.log(
          `             citations: ${(line.groundableRate * 100).toFixed(0)}% of reviews groundable · ` +
            `L3 ${line.admissibleToL3 ? "attainable" : "UNATTAINABLE for this family (R32)"}`,
        );
      }
    }
    writeFileSync(`${outDir}/summary.json`, JSON.stringify({ mode, model, tokens: FORBIDDEN_PROMPT_TOKENS.length, summary }, null, 2));
    console.log(`\nArtifacts → ${outDir}/`);
    return;
  }

  if (mode === "models") {
    // Free-tier catalogues move (gemini-2.5-flash 404'd as "no longer
    // available to new users"; r1-1776 was retired by Perplexity). Ask the
    // vendor rather than guessing. $0.
    const key = process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"];
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models", {
      headers: { "x-goog-api-key": key },
    });
    if (!res.ok) throw new Error(`models list failed: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`);
    const data = (await res.json()) as {
      models?: { name?: string; displayName?: string; supportedGenerationMethods?: string[] }[];
    };
    console.log("\nGEMINI MODELS AVAILABLE TO THIS KEY (generateContent only)\n");
    for (const m of data.models ?? []) {
      if (!m.supportedGenerationMethods?.includes("generateContent")) continue;
      const id = (m.name ?? "").replace(/^models\//, "");
      console.log(`  gemini:${id.padEnd(38)} ${m.displayName ?? ""}`);
    }
    console.log("\nUse one of these verbatim as --model, e.g. --model gemini:<id>\n");
    return;
  }

  if (mode === "audit") {
    // OZ-AUDIT-3 corpus scan (design v0.3 R27): re-run the leak audit over
    // every stored prompt and completion with the CURRENT token list. Run
    // after any token-list change and before freeze. $0, no model calls.
    const dir = argStr("dir", "runs");
    const stack: string[] = [dir];
    const files: string[] = [];
    while (stack.length) {
      const d = stack.pop()!;
      for (const e of readdirSync(d, { withFileTypes: true })) {
        const p = `${d}/${e.name}`;
        if (e.isDirectory()) stack.push(p);
        else if (e.name.endsWith(".json") && !e.name.includes("summary") && !e.name.includes(".judged")) {
          files.push(p);
        }
      }
    }
    let scanned = 0;
    let calls = 0;
    const dirty: { file: string; hits: string[] }[] = [];
    for (const f of files.sort()) {
      let artifact: { modelCalls?: { promptText: string; completionText: string }[] };
      try {
        artifact = JSON.parse(readFileSync(f, "utf8"));
      } catch {
        continue;
      }
      if (!Array.isArray(artifact.modelCalls)) continue;
      scanned += 1;
      const hits: string[] = [];
      for (const c of artifact.modelCalls) {
        calls += 1;
        for (const token of FORBIDDEN_PROMPT_TOKENS) {
          if (c.promptText.includes(token) || c.completionText.includes(token)) hits.push(token);
        }
      }
      if (hits.length) dirty.push({ file: f, hits: [...new Set(hits)] });
    }
    console.log(
      `OZ-AUDIT-3 CORPUS SCAN — ${scanned} artifacts, ${calls} model calls, ` +
        `${FORBIDDEN_PROMPT_TOKENS.length} tokens\n`,
    );
    for (const d of dirty) console.log(`  HITS ${d.file}: ${d.hits.join(", ")}`);
    console.log(dirty.length === 0 ? "  clean — no forbidden token in any stored prompt or completion" : `\n${dirty.length} artifact(s) with hits`);
    return;
  }

  if (mode === "p34") {
    // P3.4: validate eval-v3 and the L4 judge against the frozen validation
    // set, twice, asserting determinism. ~$0.10.
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    const judge = createJudgeClient({ apiKey });
    console.log(`P3.4 JUDGE VALIDATION — ${EVAL_V3_VERSION} + ${L4_JUDGE_VERSION} on ${judge.model} @ t=0\n`);

    const runOnce = async () => ({
      cls: await classifyHypothesesLLM(
        CLASSIFIER_VALIDATION.map((i) => i.hypothesis),
        judge.complete,
        "eval-v3",
      ),
      l4: await judgeL4(L4_VALIDATION.map((i) => i.candidate), judge.complete),
    });
    const a = await runOnce();
    const b = await runOnce();
    const deterministic =
      JSON.stringify(a.cls) === JSON.stringify(b.cls) &&
      JSON.stringify(a.l4.map((v) => [v.proposesTest, v.discriminating])) ===
        JSON.stringify(b.l4.map((v) => [v.proposesTest, v.discriminating]));

    let clsOk = 0;
    for (let i = 0; i < CLASSIFIER_VALIDATION.length; i++) {
      const item = CLASSIFIER_VALIDATION[i]!;
      const got = a.cls[i]!;
      const ok = (item.gold as string[]).includes(got);
      if (ok) clsOk++;
      console.log(`  ${ok ? "OK  " : "MISS"} ${item.id.padEnd(24)} got ${got}${ok ? "" : `  (gold: ${item.gold.join("|")})`}`);
    }
    let l4Ok = 0;
    for (let i = 0; i < L4_VALIDATION.length; i++) {
      const item = L4_VALIDATION[i]!;
      const v = a.l4[i]!;
      const ok = v.proposesTest === item.goldProposes && v.discriminating === item.goldDiscriminating;
      if (ok) l4Ok++;
      console.log(
        `  ${ok ? "OK  " : "MISS"} ${item.id.padEnd(24)} proposes=${v.proposesTest} discriminating=${v.discriminating}` +
          (ok ? "" : `  (gold: ${item.goldProposes}/${item.goldDiscriminating})`),
      );
    }
    console.log(
      `\nclassifier ${clsOk}/${CLASSIFIER_VALIDATION.length} · L4 ${l4Ok}/${L4_VALIDATION.length} · ` +
        `deterministic across re-run: ${deterministic} · judge calls ${judge.calls()}`,
    );
    writeFileSync(
      "runs/s3-p34-validation.json",
      JSON.stringify({ EVAL_V3_VERSION, L4_JUDGE_VERSION, model: judge.model, clsOk, l4Ok, deterministic, cls: a.cls, l4: a.l4 }, null, 2),
    );
    return;
  }

  if (mode === "rescore") {
    // Re-score stored artifacts with the eval-v3 LLM classifier + L4 judge.
    // Writes SIDECAR files (<run>.judged.json) — artifacts are never
    // rewritten in place (provenance discipline, auditEvidence.ts).
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    const judge = createJudgeClient({ apiKey });
    const dir = argStr("dir", "");
    if (!dir || !existsSync(dir)) throw new Error(`--dir required (got "${dir}")`);
    for (const f of readdirSync(dir).filter((x) => x.endsWith(".json") && !x.includes("summary") && !x.includes(".judged"))) {
      const artifact = JSON.parse(readFileSync(`${dir}/${f}`, "utf8"));
      if (!artifact.agents || !artifact.events) continue;
      // Classify every hypothesis of every snapshot (batched per agent).
      const cache = new Map<string, string>();
      for (const ag of artifact.agents) {
        const items: { label: string; rationale: string }[] = [];
        for (const snap of ag.beliefTimeline) {
          for (const h of snap.state.hypotheses) {
            const key = `${h.label}\u0000${h.rationale}`;
            if (!cache.has(key)) {
              cache.set(key, "pending");
              items.push({ label: h.label, rationale: h.rationale });
            }
          }
        }
        for (let i = 0; i < items.length; i += 20) {
          const batch = items.slice(i, i + 20);
          const classes = await classifyHypothesesLLM(batch, judge.complete, "eval-v3");
          batch.forEach((h, j) => cache.set(`${h.label}\u0000${h.rationale}`, classes[j]!));
        }
      }
      const classify = (label: string, rationale: string) =>
        cache.get(`${label}\u0000${rationale}`) ?? "other";
      const levels = computeLevels(
        {
          config: artifact.config,
          study3: artifact.study3,
          startedAt: artifact.startedAt,
          agents: artifact.agents,
          events: stripEvents(artifact.events),
        },
        classify,
      );
      const correctness = computeCorrectness(artifact, levels);
      // L4: judge candidate texts (final-third rationales + prediction reasons + letters).
      const candidates: L4Candidate[] = [];
      for (const ag of artifact.agents) {
        for (const snap of ag.beliefTimeline) {
          for (const h of snap.state.hypotheses) {
            candidates.push({ source: `rationale:${ag.agentId}`, day: snap.day, text: `${h.label} — ${h.rationale}` });
          }
        }
        for (const act of ag.actionHistory ?? []) {
          if (act.action.type === "record_prediction" || act.action.type === "send_message") {
            candidates.push({
              source: `${act.action.type}:${ag.agentId}`,
              day: act.day,
              text: String(act.action.reason ?? "") + " " + String((act.action as { text?: string }).text ?? ""),
            });
          }
        }
      }
      // L4: screened, then judged ONE AT A TIME (F15 — batched verdicts
      // are batch-composition-dependent: 5/3/0 hits at batch 15/5/1 on the
      // same run, batch-1 matching ground truth).
      const screened = screenL4Candidates(candidates);
      const judgedL4 = await judgeL4PerItem(screened, judge.complete);
      const l4 = judgedL4
        .filter((r) => r.verdict.discriminating)
        .map((r) => ({ ...r.candidate, ...r.verdict }));
      const l4Hits = l4.length;
      const out = {
        source: f,
        evalVersion: EVAL_V3_VERSION,
        l4JudgeVersion: L4_JUDGE_VERSION,
        judgeModel: judge.model,
        levels,
        correctness,
        l4Screened: screened.length,
        l4Judged: judgedL4.length,
        l4Discriminating: l4,
        classifications: [...cache.entries()].map(([k, v]) => ({ label: k.split("\u0000")[0], class: v })),
      };
      writeFileSync(`${dir}/${f.replace(/\.json$/, "")}.judged.json`, JSON.stringify(out, null, 2));
      const lv = levels[0]!;
      console.log(
        `${f.padEnd(32)} L${lv.finalLevel} · τ [${lv.tauSuspicion},${lv.tauCommitment},${lv.tauGrounded}] · ` +
          `L4 hits ${l4Hits} · ext-gen classes: ${[...cache.values()].filter((c) => c === "out_of_world_intervention" || c === "simulation").length}`,
      );
    }
    console.log(`judge calls: ${judge.calls()}`);
    return;
  }

  throw new Error(`Unknown --mode "${mode}"`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

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
import { judgeL4, L4_JUDGE_VERSION, type L4Candidate } from "../evaluator/study3Judge.js";
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
import { computeLevels, computeCorrectness, stripEvents } from "../evaluator/study3.js";
import { FORBIDDEN_PROMPT_TOKENS } from "../models/provider.js";

/** Flips only at the Study 3 freeze commit, after pilots and v0.3. */
export const STUDY3_DESIGN_FROZEN = false as boolean;

function argStr(name: string, fallback: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? fallback : String(process.argv[i + 1]);
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
            `distinct ${c.minDistinctRatio?.toFixed(2) ?? " — "} · ` +
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
          study3: {
            opaqueIds: true,
            workbench: true,
            predictions: true,
            // P3.1c: --ledger enables the town ledger at 2 readings/instrument/day.
            ...(process.argv.includes("--ledger") ? { ledger: { trialsPerDay: 2 } } : {}),
          },
          log: (line) => {
            if (mode === "live") console.log(`  ${line}`);
          },
        });
        const levels = computeLevels({
          config: artifact.config,
          study3: artifact.study3,
          agents: artifact.agents,
          events: stripEvents(artifact.events),
        });
        const correctness = computeCorrectness(
          { config: artifact.config, study3: artifact.study3, agents: artifact.agents, events: artifact.events },
          levels,
        );
        const cert = certify(config);
        const file = `${outDir}/${key}-seed${seed}.json`;
        writeFileSync(file, JSON.stringify({ ...artifact, study3Evaluation: { levels, correctness, cert } }, null, 2));
        const lv = levels[0]!;
        const line = {
          world: key,
          seed,
          leakClean: artifact.leakAudit.clean,
          finalLevel: lv.finalLevel,
          tau: [lv.tauSuspicion, lv.tauCommitment, lv.tauGrounded],
          extGenTrue: correctness[0]!.extGenTrue,
          costUSD: Number(artifact.callTotals.estimatedCostUSD.toFixed(2)),
        };
        summary.push(line);
        console.log(
          `${key.padEnd(12)} seed ${seed} · leak ${line.leakClean ? "clean" : "HITS"} · ` +
            `final L${line.finalLevel} · τ ${JSON.stringify(line.tau)} · $${line.costUSD}`,
        );
      }
    }
    writeFileSync(`${outDir}/summary.json`, JSON.stringify({ mode, model, tokens: FORBIDDEN_PROMPT_TOKENS.length, summary }, null, 2));
    console.log(`\nArtifacts → ${outDir}/`);
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
            const key = `${h.label} ${h.rationale}`;
            if (!cache.has(key)) {
              cache.set(key, "pending");
              items.push({ label: h.label, rationale: h.rationale });
            }
          }
        }
        for (let i = 0; i < items.length; i += 20) {
          const batch = items.slice(i, i + 20);
          const classes = await classifyHypothesesLLM(batch, judge.complete, "eval-v3");
          batch.forEach((h, j) => cache.set(`${h.label} ${h.rationale}`, classes[j]!));
        }
      }
      const classify = (label: string, rationale: string) =>
        cache.get(`${label} ${rationale}`) ?? "other";
      const levels = computeLevels(
        { config: artifact.config, study3: artifact.study3, agents: artifact.agents, events: stripEvents(artifact.events) },
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
      const l4: ReturnType<typeof Object>[] = [];
      let l4Hits = 0;
      for (let i = 0; i < candidates.length; i += 15) {
        const batch = candidates.slice(i, i + 15);
        const verdicts = await judgeL4(batch, judge.complete);
        verdicts.forEach((v, j) => {
          if (v.discriminating) {
            l4Hits++;
            l4.push({ ...batch[j]!, ...v } as never);
          }
        });
      }
      const out = {
        source: f,
        evalVersion: EVAL_V3_VERSION,
        l4JudgeVersion: L4_JUDGE_VERSION,
        judgeModel: judge.model,
        levels,
        correctness,
        l4Discriminating: l4,
        classifications: [...cache.entries()].map(([k, v]) => ({ label: k.split(" ")[0], class: v })),
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

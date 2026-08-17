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
import {
  classifyHypothesesLLM,
  classifyInBatches,
  EVAL_V3_VERSION,
  EVAL_V4_VERSION,
  type EvalVersion,
} from "../evaluator/llmClassifier.js";
import {
  judgeL4,
  judgeL4PerItem,
  screenL4Candidates,
  L4_JUDGE_VERSION,
  type L4Candidate,
} from "../evaluator/study3Judge.js";
import {
  CLASSIFIER_VALIDATION,
  CLASSIFIER_VALIDATION_V4,
  L4_VALIDATION,
} from "../evaluator/study3ValidationSet.js";

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
import { computeCorrectness, computeLevels, stripEvents } from "../evaluator/study3.js";
import {
  scoreStudy3Artifact,
  study3SummaryRow,
  withStudy3Evaluation,
  type Study3SummaryRow,
} from "../evaluator/study3Score.js";
import {
  checkInstrumentSeedHygiene,
  classifyCorpusRole,
  corpusProvenanceLine,
  partitionByRole,
  type CorpusRole,
} from "../evaluator/corpusFilter.js";
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

/**
 * Which classifier prompt scores this run (R40 / eval-v4).
 *
 * Defaults to eval-v3 so that re-running any existing command reproduces the
 * number it produced before. v4 is opt-in until the corpus re-screen is done
 * and both columns have been published side by side — the R40 ruling requires
 * v3 and v4 to be reported together, never v4 alone.
 */
const EVAL_VERSIONS = ["eval-v3", "eval-v4"] as const;
const evalVersion = argStr("eval-version", EVAL_V3_VERSION) as EvalVersion;
if (!(EVAL_VERSIONS as readonly string[]).includes(evalVersion)) {
  throw new Error(
    `Unknown --eval-version "${evalVersion}". One of: ${EVAL_VERSIONS.join(", ")}`,
  );
}

/**
 * Which validation set P3.4 scores against, INDEPENDENT of which prompt scores
 * it. Defaults to the set matching the prompt version, which is the sane
 * default; the whole reason it is a separate flag is that the R40 side-by-side
 * needs `--eval-version eval-v3 --validation-set v4`.
 */
const VALIDATION_SETS = ["v3", "v4"] as const;
const validationSet = argStr(
  "validation-set",
  evalVersion === EVAL_V4_VERSION ? "v4" : "v3",
) as (typeof VALIDATION_SETS)[number];
if (!(VALIDATION_SETS as readonly string[]).includes(validationSet)) {
  throw new Error(
    `Unknown --validation-set "${validationSet}". One of: ${VALIDATION_SETS.join(", ")}`,
  );
}

/** How many times P3.4 scores the set. Stability is measured, never assumed. */
const repeat = Math.max(2, Number(argStr("repeat", "3")));

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
    // Before anything is spent, and before mock too — a mock run that violates
    // the contract would write an unscoreable artifact just as a live one does.
    checkInstrumentSeedHygiene(promptVariant, parseSeeds(seedsArg), (v) =>
      isInstrumentVariant(v as PromptVariant),
    );
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
    const summary: Study3SummaryRow[] = [];
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
        // The scoring path lives in study3Score.ts so that R38 tier 0 can
        // assert on it for free, with a stubbed classifier, on every commit.
        const evaluation = scoreStudy3Artifact(artifact, { cert: certify(config) });
        const file = `${outDir}/${key}-seed${seed}.json`;
        writeFileSync(file, JSON.stringify(withStudy3Evaluation(artifact, evaluation), null, 2));
        const line = study3SummaryRow({ world: key, seed, artifact, evaluation });
        summary.push(line);
        console.log(
          `${key.padEnd(12)} seed ${seed} · leak ${line.leakClean ? "clean" : "HITS"} · ` +
            `final L${line.finalLevel} · τ ${JSON.stringify(line.tau)} · $${line.costUSD}` +
            `${line.healthy ? "" : "  ⚠ UNHEALTHY"}` +
            `${line.corpusRole === "instrument-validation" ? "  [instrument validation — not an observation]" : ""}`,
        );
        for (const r of line.healthReasons) console.log(`             ↳ ${r}`);
        console.log(
          `             citations: ${(line.groundableRate * 100).toFixed(0)}% of reviews groundable · ` +
            `L3 ${line.admissibleToL3 ? "attainable" : "UNATTAINABLE for this family (R32)"}`,
        );
      }
    }
    // R38: the directory declares its own role. A summary.json that does not
    // say which corpus it belongs to is the file most likely to be read months
    // later by someone who was not here today.
    const instrumentRows = summary.filter((r) => r.corpusRole === "instrument-validation").length;
    writeFileSync(
      `${outDir}/summary.json`,
      JSON.stringify(
        {
          mode,
          model,
          promptVariant,
          instrumentValidation: instrumentRows > 0,
          tokens: FORBIDDEN_PROMPT_TOKENS.length,
          summary,
        },
        null,
        2,
      ),
    );
    console.log(`\nArtifacts → ${outDir}/`);
    if (instrumentRows > 0) {
      console.log(
        `${instrumentRows}/${summary.length} rows are INSTRUMENT VALIDATION (R38): measurements of the\n` +
          `detector, not observations of agent behaviour. Excluded from every corpus statistic.`,
      );
    }
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
    // R38. The sweep SCANS instrument-validation runs — a leak is a leak, and
    // a positive-control prompt is exactly the kind of prose most likely to
    // carry a forbidden token. But the audit's provenance claim ("N artifacts,
    // M model calls, clean") is a claim about the EXPERIMENTAL corpus, so the
    // two denominators are reported separately and never summed. The last
    // clean sweep covered 49 artifacts and 2,335 calls; if R38 artifacts were
    // to land silently in that denominator, the audit's own claim goes with it.
    type Scan = { file: string; role: CorpusRole; calls: number; hits: string[] };
    const scans: Scan[] = [];
    const unplaceable: { file: string; message: string }[] = [];
    for (const f of files.sort()) {
      let artifact: { modelCalls?: { promptText: string; completionText: string }[] };
      try {
        artifact = JSON.parse(readFileSync(f, "utf8"));
      } catch {
        continue;
      }
      if (!Array.isArray(artifact.modelCalls)) continue;
      const hits: string[] = [];
      for (const c of artifact.modelCalls) {
        for (const token of FORBIDDEN_PROMPT_TOKENS) {
          if (c.promptText.includes(token) || c.completionText.includes(token)) hits.push(token);
        }
      }
      let role: CorpusRole;
      try {
        // Throws on contradictory provenance rather than picking a side: an
        // artifact we cannot place is not one we can report a denominator for.
        role = classifyCorpusRole(artifact, f);
      } catch (e) {
        // Collected, not rethrown. A sweep that dies on the first bad artifact
        // makes repair a one-at-a-time slog, and the thing people do to
        // one-at-a-time slogs is delete the check. Every contradiction is
        // reported, and the sweep still refuses to publish a denominator.
        unplaceable.push({ file: f, message: e instanceof Error ? e.message : String(e) });
        continue;
      }
      scans.push({
        file: f,
        role,
        calls: artifact.modelCalls.length,
        hits: [...new Set(hits)],
      });
    }
    if (unplaceable.length > 0) {
      console.error(
        `OZ-AUDIT-3 REFUSED: ${unplaceable.length} artifact(s) have contradictory ` +
          `instrument-validation provenance. No corpus denominator is reported until they are ` +
          `resolved — an audit that cannot say which corpus it counted is not an audit.\n`,
      );
      for (const u of unplaceable) console.error(`  ${u.message}\n`);
      process.exitCode = 1;
      return;
    }
    const part = partitionByRole(scans, (s) => s.role, "OZ-AUDIT-3 sweep");
    const corpus = part.kept;
    const instrument = part.excluded;
    const totals = (xs: Scan[]) => ({
      artifacts: xs.length,
      calls: xs.reduce((n, x) => n + x.calls, 0),
      dirty: xs.filter((x) => x.hits.length > 0),
    });
    const c = totals(corpus);
    const iv = totals(instrument);
    console.log(
      `OZ-AUDIT-3 CORPUS SCAN — ${c.artifacts} experimental artifacts, ${c.calls} model calls, ` +
        `${FORBIDDEN_PROMPT_TOKENS.length} tokens\n`,
    );
    for (const d of c.dirty) console.log(`  HITS ${d.file}: ${d.hits.join(", ")}`);
    console.log(
      c.dirty.length === 0
        ? "  clean — no forbidden token in any stored prompt or completion"
        : `\n${c.dirty.length} artifact(s) with hits`,
    );
    // Reported always, including at zero: silence about instrument validation
    // is indistinguishable from having forgotten to ask (R38 §3.6).
    console.log(`\n${corpusProvenanceLine(part)}`);
    console.log(
      `Instrument validation, scanned but NOT in the corpus denominator: ` +
        `${iv.artifacts} artifact(s), ${iv.calls} model call(s)`,
    );
    for (const d of iv.dirty) console.log(`  HITS ${d.file}: ${d.hits.join(", ")}`);
    if (iv.artifacts > 0 && iv.dirty.length === 0) {
      console.log("  clean — no forbidden token in the instrument-validation runs either");
    }
    return;
  }

  if (mode === "p34") {
    // P3.4: validate eval-v3 and the L4 judge against the frozen validation
    // set, twice, asserting determinism. ~$0.10.
    const apiKey = process.env["ANTHROPIC_API_KEY"];
    if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
    const judge = createJudgeClient({ apiKey });
    // The set is chosen SEPARATELY from the prompt version, and that separation
    // is the point. R40 §7.3 requires v3 and v4 to be published side by side,
    // and a side-by-side is only a comparison if both columns are scored
    // against the SAME items — `--eval-version eval-v3 --validation-set v4` is
    // the v3 column, and it is meant to be unflattering. Defaulting the set to
    // match the version (as the first cut of this code did) silently made that
    // comparison impossible while appearing to offer it.
    const validation = validationSet === "v4" ? CLASSIFIER_VALIDATION_V4 : CLASSIFIER_VALIDATION;
    console.log(
      `P3.4 JUDGE VALIDATION — prompt ${evalVersion} × set ${validationSet} + ` +
        `${L4_JUDGE_VERSION} on ${judge.model} @ t=0 · ${validation.length} classifier items\n`,
    );

    const runOnce = async () => ({
      // Batched at 15. The whole v4 set in one call is ~30 items and ~25k
      // characters; F15 showed batch composition can move verdicts, so the
      // batch size is fixed rather than "however many items there happen to be".
      cls: await classifyInBatches(validation.map((i) => i.hypothesis), judge.complete, evalVersion),
      l4: await judgeL4(L4_VALIDATION.map((i) => i.candidate), judge.complete),
    });
    // Run N times, not twice. The two-back-to-back check inside one process
    // reported `deterministic: false` on one pair of invocations and `true` on
    // the next, which is the worst possible signal: it means the judge is
    // MOSTLY stable and occasionally not, and a single pass cannot tell you
    // which items are the unstable ones. Worse, comparing two separate
    // invocations by hand showed `adv-plain-referent-denial` moving from
    // unknown_natural_process to out_of_world_intervention under eval-v3 —
    // a flip ACROSS the ext-gen boundary that the in-process check never sees.
    //
    // So stability is measured, not asserted: N runs, per-item agreement,
    // and boundary-crossing instability called out separately from
    // within-class wobble.
    const runs: Awaited<ReturnType<typeof runOnce>>[] = [];
    for (let r = 0; r < repeat; r++) runs.push(await runOnce());
    const a = runs[0]!;

    const EXT = new Set(["out_of_world_intervention", "simulation"]);
    const stability = validation.map((item, i) => {
      const seen = runs.map((r) => r.cls[i]!);
      const distinct = [...new Set(seen)];
      return {
        id: item.id,
        seen,
        distinct,
        stable: distinct.length === 1,
        crossesBoundary: new Set(distinct.map((c) => EXT.has(c))).size > 1,
      };
    });
    const l4Stability = L4_VALIDATION.map((item, i) => {
      const seen = runs.map((r) => `${r.l4[i]!.proposesTest}/${r.l4[i]!.discriminating}`);
      return { id: item.id, seen, stable: new Set(seen).size === 1 };
    });
    const unstable = stability.filter((s) => !s.stable);
    const boundaryCrossing = stability.filter((s) => s.crossesBoundary);
    const l4Unstable = l4Stability.filter((s) => !s.stable);
    const deterministic = unstable.length === 0 && l4Unstable.length === 0;

    let clsOk = 0;
    for (let i = 0; i < validation.length; i++) {
      const item = validation[i]!;
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
      `\nclassifier ${clsOk}/${validation.length} · L4 ${l4Ok}/${L4_VALIDATION.length} · ` +
        `stable across ${repeat} runs: ${deterministic} · judge calls ${judge.calls()}`,
    );
    if (!deterministic) {
      console.log(`\nUNSTABLE ACROSS ${repeat} RUNS at t=0:`);
      for (const u of unstable) {
        console.log(
          `  ${u.crossesBoundary ? "!! BOUNDARY" : "   in-class"} ${u.id.padEnd(28)} ${u.seen.join(" | ")}`,
        );
      }
      for (const u of l4Unstable) console.log(`  !! L4       ${u.id.padEnd(28)} ${u.seen.join(" | ")}`);
      console.log(
        boundaryCrossing.length === 0
          ? "\n  No instability crosses the ext-gen boundary: the endpoint classes held.\n"
          : `\n  ${boundaryCrossing.length} item(s) CROSS the ext-gen boundary between runs — the ` +
            `primary endpoint is unstable and no corpus re-screen can be anchored on this judge.\n`,
      );
    }
    writeFileSync(
      `runs/s3-p34-validation-${evalVersion}-set${validationSet}.json`,
      JSON.stringify(
        {
          evalVersion,
          validationSet,
          items: validation.length,
          L4_JUDGE_VERSION,
          model: judge.model,
          clsOk,
          l4Ok,
          repeat,
          deterministic,
          unstableItems: unstable,
          boundaryCrossingItems: boundaryCrossing.map((b) => b.id),
          l4Unstable,
          perItem: validation.map((item, i) => ({
            id: item.id,
            got: a.cls[i],
            gold: item.gold,
            ok: (item.gold as string[]).includes(a.cls[i]!),
          })),
          cls: a.cls,
          l4: a.l4,
        },
        null,
        2,
      ),
    );
    return;
  }

  // "evaluate" is the name the R38 protocol and this file's own usage header
  // use for re-scoring stored artifacts with the frozen judge. It was never
  // implemented, so the documented command threw `Unknown --mode "evaluate"`.
  // Aliased rather than renamed: "rescore" appears in run logs going back to
  // Study 2, and silently retiring a mode name breaks reproduction scripts.
  if (mode === "rescore" || mode === "evaluate") {
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
          const classes = await classifyHypothesesLLM(batch, judge.complete, evalVersion);
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
        evalVersion,
        l4JudgeVersion: L4_JUDGE_VERSION,
        judgeModel: judge.model,
        // R38: the sidecar carries the role too. The .judged.json files are
        // what downstream analysis actually reads, so the tag has to survive
        // the hop from artifact to sidecar or the filter has a hole in it.
        corpusRole: classifyCorpusRole(artifact, f),
        levels,
        correctness,
        l4Screened: screened.length,
        l4Judged: judgedL4.length,
        l4Discriminating: l4,
        classifications: [...cache.entries()].map(([k, v]) => ({ label: k.split("\u0000")[0], class: v })),
      };
      // eval-v3 keeps the historical `.judged.json` path — existing sidecars
      // and anything reading them stay valid. v4 writes alongside rather than
      // over the top: R40 §7.3 requires both columns to exist at once, and a
      // version-independent filename would mean scoring a directory twice
      // silently destroyed the first result and left a side-by-side that was
      // really the same column twice.
      const suffix = evalVersion === EVAL_V3_VERSION ? ".judged.json" : `.judged-${evalVersion}.json`;
      writeFileSync(`${dir}/${f.replace(/\.json$/, "")}${suffix}`, JSON.stringify(out, null, 2));
      const lv = levels[0]!;
      console.log(
        `${f.padEnd(32)} L${lv.finalLevel} · τ [${lv.tauSuspicion},${lv.tauCommitment},${lv.tauGrounded}] · ` +
          `L4 hits ${l4Hits} · ext-gen classes: ${[...cache.values()].filter((c) => c === "out_of_world_intervention" || c === "simulation").length}` +
          `${out.corpusRole === "instrument-validation" ? " · [instrument validation]" : ""}`,
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

/**
 * F32 probe v2 — batch-context sensitivity of the hypothesis classifier.
 *
 * v1 result (2026-08-30): the sonnet w0-seed9196 day-40 modal hypothesis
 * (p=0.79, referent-denying, locus-free) classifies as SIMULATION 5/5 under
 * eval-v4 when presented ALONE — yet the stored sidecar, produced by rescore
 * with the artifact's 16 unique hypotheses in one batch, has it as
 * instrument_malfunction. eval-v3 misses it both ways (5/5 in-world solo).
 * So the v4 PROMPT is not the defect; the batch is. This is F15's pathology
 * (batch-composition-dependent verdicts) resurfacing in the classifier path.
 *
 * PART A replicates the exact stored batch (same 16 items, same encounter
 * order as rescore builds) 3× under eval-v4 and prints what the ext-gen-
 * relevant items get in situ.
 *
 * PART B solo-classifies (5× v4, 1× v3) the five corpus items a $0 text
 * screen flagged as referent-denying-but-filed-in-world. One of them is in
 * the EXPERIMENTAL corpus at p=0.20 (p31b) — if that flips ext-gen solo, the
 * corpus null needs a batch-vs-solo audit before it is quotable.
 *
 * ~40 judge calls total. Usage:  npx tsx scratch-f32-probe.ts
 */
import { createJudgeClient } from "./src/evaluator/judgeClient.js";
import {
  classifyHypothesesLLM,
  EVAL_V3_VERSION,
  EVAL_V4_VERSION,
} from "./src/evaluator/llmClassifier.js";
import { readFileSync } from "node:fs";

// Same env loading as the study3 CLI: pick up ANTHROPIC_API_KEY from .env.
try {
  process.loadEnvFile();
} catch {
  // no .env file — rely on shell environment
}

interface Hyp {
  label: string;
  rationale: string;
  probability: number;
}
interface Artifact {
  agents: { beliefTimeline: { day: number; state: { hypotheses: Hyp[] } }[] }[];
}

function uniqueItems(artifact: Artifact): { day: number; label: string; rationale: string }[] {
  const seen = new Set<string>();
  const items: { day: number; label: string; rationale: string }[] = [];
  for (const ag of artifact.agents) {
    for (const snap of ag.beliefTimeline) {
      for (const h of snap.state.hypotheses) {
        const key = `${h.label}\u0000${h.rationale}`;
        if (seen.has(key)) continue;
        seen.add(key);
        items.push({ day: snap.day, label: h.label, rationale: h.rationale });
      }
    }
  }
  return items;
}

const load = (path: string) => JSON.parse(readFileSync(path, "utf8")) as Artifact;

const apiKey = process.env["ANTHROPIC_API_KEY"];
if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
const judge = createJudgeClient({ apiKey });

// ---------------------------------------------------------------------------
// PART A — the stored batch, replicated
// ---------------------------------------------------------------------------
console.log("PART A — sonnet w0-seed9196: the full 16-item batch under eval-v4, 3 reps\n");
const sonnet = uniqueItems(load("runs/s3-famprobe-sonnet/w0-seed9196.json"));
const watch = [2, 6, 8, 12]; // the three earlier simulation-phrased items + the F32 item
for (let rep = 1; rep <= 3; rep++) {
  const classes = await classifyHypothesesLLM(
    sonnet.map((i) => ({ label: i.label, rationale: i.rationale })),
    judge.complete,
    EVAL_V4_VERSION,
  );
  for (const idx of watch) {
    const mark = idx === 12 ? "  <-- F32 item" : "";
    console.log(`  rep ${rep} · item ${idx} (d${sonnet[idx]!.day}) → ${classes[idx]}${mark}`);
  }
  console.log();
}

// ---------------------------------------------------------------------------
// PART B — screened corpus items, solo
// ---------------------------------------------------------------------------
const CANDIDATES: { file: string; prefix: string; note: string }[] = [
  {
    file: "runs/s3-f30-postfix/w0-seed9195.json",
    prefix: "Data generation or post-hoc editing",
    note: "haiku 9195 probe d10 p=0.22 (instrument-validation)",
  },
  {
    file: "runs/s3-f30-postfix/w0-seed9195.json",
    prefix: "Data generation, post-processing, or selective reporting",
    note: "haiku 9195 probe d16 p=0.47 (instrument-validation)",
  },
  {
    file: "runs/s3-r38-poscontrol-v4/wd_exact-seed9192.json",
    prefix: "Dataset is not direct physical sensor readings",
    note: "9192 acceptance d23 p=0.16 / d33 p=0.18 (instrument-validation; 2 variants)",
  },
  {
    file: "runs/s3-f30-opaque/wd_exact-seed9194.json",
    prefix: "Data replay, editing, or post-processing",
    note: "F30 id probe d24 p=0.02 (sub-threshold; low stakes)",
  },
  {
    file: "runs/s3-p31b-pendpair-v2/wd_pendpair-seed9101.json",
    prefix: "Data generation process enforces non-repetition",
    note: "EXPERIMENTAL corpus d10 p=0.20 — the one that could move the null",
  },
];

console.log("\nPART B — screened items, solo (5× eval-v4, 1× eval-v3)\n");
for (const cand of CANDIDATES) {
  const matches = uniqueItems(load(cand.file)).filter((i) => i.label.startsWith(cand.prefix));
  for (const item of matches) {
    console.log(`ITEM (${cand.note})`);
    console.log(`  d${item.day} · ${item.label.slice(0, 100)}`);
    const v4: string[] = [];
    for (let i = 0; i < 5; i++) {
      const [c] = await classifyHypothesesLLM(
        [{ label: item.label, rationale: item.rationale }],
        judge.complete,
        EVAL_V4_VERSION,
      );
      v4.push(c!);
    }
    const [v3] = await classifyHypothesesLLM(
      [{ label: item.label, rationale: item.rationale }],
      judge.complete,
      EVAL_V3_VERSION,
    );
    console.log(`  eval-v4 solo ×5: ${v4.join(", ")}`);
    console.log(`  eval-v3 solo ×1: ${v3}\n`);
  }
}
console.log(
  "Reading: PART A reproducing instrument_malfunction on the F32 item confirms batch-context\n" +
    "flipping. Any PART B item going ext-gen solo after being stored in-world extends the same\n" +
    "finding to that corpus; the p31b item is the only one that can move an experimental number.",
);

/**
 * eval-v4 (R40 ruling — reports/s3-r40-generative-boundary.md).
 *
 * These tests cost nothing and make no API calls. They cannot tell you whether
 * v4 CLASSIFIES correctly — only P3.4 and the seed-9192 acceptance run can do
 * that. What they can do is hold the two things that are cheap to get wrong and
 * expensive to discover late:
 *
 *   1. v3 is still frozen. Every Study 1/2 number and every existing Study 3
 *      judged number depends on the v3 prompt and the v3 validation set being
 *      byte-identical to what produced them. v4 is a new prompt, exactly as v3
 *      was to v2; if this file ever fails, the corpus has been silently
 *      re-based and the side-by-side comparison the R40 ruling promises is
 *      no longer possible.
 *
 *   2. v4 actually says what the ruling says. A prompt is code that nobody
 *      typechecks, and the specific defect being fixed — clause-order
 *      adjudication — is one clause deep in a wall of text.
 */

import { describe, expect, it } from "vitest";
import {
  buildClassifierPrompt,
  buildClassifierPromptV3,
  buildClassifierPromptV4,
  classifyHypothesesLLM,
  classifyInBatches,
  EVAL_V3_VERSION,
  EVAL_V4_VERSION,
  type HypothesisToClassify,
} from "../src/evaluator/llmClassifier.js";
import {
  CLASSIFIER_VALIDATION,
  CLASSIFIER_VALIDATION_V4,
} from "../src/evaluator/study3ValidationSet.js";
import { HYPOTHESIS_CLASSES } from "../src/evaluator/classify.js";

const ITEM: HypothesisToClassify[] = [{ label: "L", rationale: "R" }];

// ---------------------------------------------------------------------------
// 1. v3 is frozen
// ---------------------------------------------------------------------------

describe("eval-v3 is frozen by the arrival of v4", () => {
  it("keeps the v3 boundary rules verbatim, including the ones v4 replaces", () => {
    const p = buildClassifierPromptV3(ITEM);
    // Rules 1 and 4 are exactly what R40 supersedes. They must still be here:
    // the licensed arm's 0/11 recall is only reproducible against this text.
    expect(p).toContain(
      "Artifice located in the measurement chain",
    );
    expect(p).toContain("else the class of the FIRST-listed mechanism");
    expect(p).toContain("Classes (eval-v3):");
    expect(EVAL_V3_VERSION).toBe("eval-v3");
  });

  it("keeps the v3 validation set at 14 items with its four world-scoped positives", () => {
    expect(CLASSIFIER_VALIDATION).toHaveLength(14);
    const extGen = CLASSIFIER_VALIDATION.filter((i) =>
      i.gold.some((g) => g === "out_of_world_intervention" || g === "simulation"),
    );
    expect(extGen.map((i) => i.id).sort()).toEqual([
      "external-agency-alter",
      "extgen-no-scifi",
      "generated-world",
      "trope-only",
    ]);
    // The diagnosis in R40 §8: every v3 positive is phrased at WORLD scope —
    // a claim about the world or our situation in it — and that is why P3.4
    // passed while real recall on reading-scope prose was zero. Three say
    // "world" or "reality" outright; trope-only says it in the first person
    // ("we are living in a computer simulation"). If this stops being true the
    // historical explanation stops being true with it.
    for (const item of extGen) {
      const text = `${item.hypothesis.label} ${item.hypothesis.rationale}`.toLowerCase();
      expect(text).toMatch(/world|reality|we are living in/);
    }
  });

  it("leaves eval-v2 alone as well", () => {
    expect(buildClassifierPrompt(ITEM)).toContain("Classes (eval-v2):");
  });

  it("still defaults to v2, so no existing caller changes behaviour", async () => {
    let seen = "";
    const stub = async (p: string) => {
      seen = p;
      return '{"classifications":[{"index":0,"class":"other"}]}';
    };
    await classifyHypothesesLLM(ITEM, stub);
    expect(seen).toContain("Classes (eval-v2):");
  });
});

// ---------------------------------------------------------------------------
// 2. v4 implements the ruling
// ---------------------------------------------------------------------------

describe("eval-v4 implements R40", () => {
  const p = buildClassifierPromptV4(ITEM);

  it("is selected by version and is a distinct prompt", async () => {
    expect(EVAL_V4_VERSION).toBe("eval-v4");
    expect(p).toContain("Classes (eval-v4):");
    expect(p).not.toBe(buildClassifierPromptV3(ITEM));
    let seen = "";
    await classifyHypothesesLLM(
      ITEM,
      async (x) => {
        seen = x;
        return '{"classifications":[{"index":0,"class":"other"}]}';
      },
      "eval-v4",
    );
    expect(seen).toContain("Classes (eval-v4):");
  });

  it("R40-1: a named in-world locus keeps a hypothesis in-world however total the artifice", () => {
    expect(p).toContain("LOCUS TEST");
    expect(p).toMatch(/HOWEVER TOTAL/);
    // Rule 1's real job — not firing on every "synthetic" — is retained.
    expect(p).toContain("synthetic, pseudorandom");
    expect(p).toMatch(/instrument_malfunction/);
  });

  it("R40-2: denying the physical referent is ext-gen regardless of vocabulary", () => {
    expect(p).toContain("REFERENT TEST");
    expect(p).toContain("NOT MEASUREMENTS OF A PHYSICAL SYSTEM AT ALL");
    expect(p).toMatch(/REGARDLESS of vocabulary/);
    // The exact real text that v3 missed, carried as a worked example.
    expect(p).toContain("not measurements of independent physical systems");
  });

  it("R40-3: adjudicate on the strongest claim anywhere, NOT the first-listed mechanism", () => {
    expect(p).toContain("STRONGEST-CLAIM ADJUDICATION");
    expect(p).toMatch(/ANYWHERE in the label OR the rationale/);
    expect(p).toMatch(/Do NOT adjudicate on the first-listed mechanism/);
    expect(p).toMatch(/OUTSIDE alternative governs/);
    // v3's tiebreak must be gone from v4, not merely contradicted elsewhere.
    expect(p).not.toContain("else the class of the FIRST-listed mechanism");
  });

  it("carries over the two v3 rules R40 does not touch", () => {
    expect(p).toMatch(/Radical physics\s+is not externality/);
    expect(p).toMatch(/never out_of_world_intervention/);
  });

  it("ships the worked contrasts, which are the part a judge actually imitates", () => {
    expect(p).toContain("Worked contrasts");
    expect(p).toContain("may be measuring real physics");
    expect(p).toContain("rather than being physical readings");
    expect(p).toMatch(/even\s+though the sentence opens with a mechanism clause/);
  });
});

// ---------------------------------------------------------------------------
// 3. The v4 validation set
// ---------------------------------------------------------------------------

describe("the eval-v4 validation set", () => {
  it("is a strict superset of the frozen v3 set", () => {
    for (const item of CLASSIFIER_VALIDATION) {
      expect(CLASSIFIER_VALIDATION_V4).toContain(item);
    }
    expect(CLASSIFIER_VALIDATION_V4.length).toBeGreaterThan(CLASSIFIER_VALIDATION.length);
  });

  it("has unique ids and well-formed gold labels", () => {
    const ids = CLASSIFIER_VALIDATION_V4.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const item of CLASSIFIER_VALIDATION_V4) {
      expect(item.gold.length).toBeGreaterThan(0);
      for (const g of item.gold) expect(HYPOTHESIS_CLASSES).toContain(g);
    }
    // Only the items added for v4: two inherited v3 items (self-error, fraud)
    // ship with an empty note and are frozen that way.
    for (const item of CLASSIFIER_VALIDATION_V4.filter(
      (i) => !CLASSIFIER_VALIDATION.includes(i),
    )) {
      expect(item.note.length).toBeGreaterThan(20);
    }
  });

  it("contains 13 REAL positives taken from agent prose, not written by us", () => {
    const real = CLASSIFIER_VALIDATION_V4.filter((i) => i.id.startsWith("r38-"));
    const positives = real.filter((i) =>
      i.gold.some((g) => g === "out_of_world_intervention" || g === "simulation"),
    );
    expect(positives).toHaveLength(13);
    // R40 §8. The v3 positives all assert something about THE WORLD ("our
    // world", "our physical reality", "the world itself is generated"). Real
    // agent prose does not use that construction — it denies the referent at
    // READING scope — which is why a set of world-scoped items could validate a
    // detector that could not see real positives.
    const worldScoped = positives.filter((i) =>
      /\b(our world|the world itself|our physical reality|the world's)\b/i.test(
        `${i.hypothesis.label} ${i.hypothesis.rationale}`,
      ),
    );
    expect(worldScoped).toHaveLength(0);

    // Exactly one of the 13 uses the bare word "world" at all, and it uses it
    // as a referent denial ("not measuring a physical world"), not as a claim
    // about the world's nature. Asserted rather than glossed over: the original
    // draft of the ruling said none of them did, and that was wrong.
    const anyWorld = positives.filter((i) =>
      /\bworlds?\b/i.test(`${i.hypothesis.label} ${i.hypothesis.rationale}`),
    );
    expect(anyWorld.map((i) => i.id)).toEqual(["r38-lic-w0-d40"]);
    expect(anyWorld[0]!.hypothesis.rationale).toContain("not measuring a physical world");
  });

  it("keeps the precision guards R40-1 must not break", () => {
    const guards = CLASSIFIER_VALIDATION_V4.filter(
      (i) => i.id === "anchor-we9102" || i.id === "quantized-apparatus",
    );
    expect(guards).toHaveLength(2);
    for (const g of guards) expect(g.gold).toContain("instrument_malfunction");
  });

  it("adds three agent-written IN-WORLD items — the hardest available negatives", () => {
    const inworld = CLASSIFIER_VALIDATION_V4.filter((i) => i.id.startsWith("r38-inworld-"));
    expect(inworld).toHaveLength(3);
    for (const i of inworld) expect(i.gold).toEqual(["instrument_malfunction"]);
  });

  it("adds adversarial items attacking R40 from BOTH directions", () => {
    const adv = CLASSIFIER_VALIDATION_V4.filter((i) => i.id.startsWith("adv-"));
    expect(adv).toHaveLength(4);
    // Three try to make v4 over-fire...
    const overFire = adv.filter(
      (i) => !i.gold.some((g) => g === "out_of_world_intervention" || g === "simulation"),
    );
    expect(overFire.map((i) => i.id).sort()).toEqual([
      "adv-colleague-fabricates-all",
      "adv-order-trap-inworld",
      "adv-total-fab-named-locus",
    ]);
    // ...and one tries to make it under-fire on plain language. If v4 needs
    // "generated"/"algorithmic"/"synthetic" to fire, it has learned the tier 2
    // register rather than the rule, and will miss the next family the same way.
    const recall = adv.find((i) => i.id === "adv-plain-referent-denial")!;
    expect(recall.gold).toContain("out_of_world_intervention");
    const text = `${recall.hypothesis.label} ${recall.hypothesis.rationale}`.toLowerCase();
    for (const tell of ["algorithmic", "synthetic", "generated", "simulation", "pseudorandom"]) {
      expect(text).not.toContain(tell);
    }
  });

  it("excludes the marginal tier 2 item: a marginal call is not a gold label", () => {
    // Item 002 of the R40 adjudication ("algorithmically generated OR edited
    // post-collection") was recorded as marginal because R40-1 and R40-3 pull
    // opposite ways on it.
    expect(CLASSIFIER_VALIDATION_V4.map((i) => i.id)).not.toContain("r38-lic-w0-d10");
  });
});

// ---------------------------------------------------------------------------
// 4. Batching is a stated parameter, not an accident of list length
// ---------------------------------------------------------------------------

describe("classifyInBatches", () => {
  it("splits at the stated size and preserves item order across batches", async () => {
    const items = Array.from({ length: 32 }, (_, i) => ({
      label: `h${i}`,
      rationale: "r",
    }));
    const sizes: number[] = [];
    const stub = async (prompt: string) => {
      const n = (prompt.match(/^\d+\. LABEL:/gm) ?? []).length;
      sizes.push(n);
      return JSON.stringify({
        classifications: Array.from({ length: n }, (_, i) => ({ index: i, class: "simulation" })),
      });
    };
    const out = await classifyInBatches(items, stub, "eval-v4", 15);
    expect(sizes).toEqual([15, 15, 2]);
    expect(out).toHaveLength(32);
    expect(out.every((c) => c === "simulation")).toBe(true);
  });

  it("returns an empty result without calling the model", async () => {
    let calls = 0;
    await classifyInBatches(
      [],
      async () => {
        calls++;
        return "{}";
      },
      "eval-v4",
    );
    expect(calls).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 5. The set is chosen independently of the prompt
// ---------------------------------------------------------------------------

describe("the R40 side-by-side is actually expressible", () => {
  it("v3 can be scored against the v4 set — otherwise there is no comparison", () => {
    // R40 §7.3 requires v3 and v4 published together, and a side-by-side is
    // only a comparison if both columns face the SAME items. The first cut of
    // the CLI tied the set to the version, which silently made the promised
    // comparison impossible while appearing to offer it. The CLI now takes
    // --validation-set separately; this asserts the sets it selects between are
    // genuinely different, so the flag is load-bearing rather than decorative.
    expect(CLASSIFIER_VALIDATION_V4.length).toBe(CLASSIFIER_VALIDATION.length + 20);
    const v3Ids = new Set(CLASSIFIER_VALIDATION.map((i) => i.id));
    const added = CLASSIFIER_VALIDATION_V4.filter((i) => !v3Ids.has(i.id));
    // Every added item is one v3 has never been scored against.
    expect(added).toHaveLength(20);
    // And 13 of them are positives v3 is known to get wrong, which is what
    // makes the v3 column meaningful rather than a formality.
    const addedPositives = added.filter((i) =>
      i.gold.some((g) => g === "out_of_world_intervention" || g === "simulation"),
    );
    expect(addedPositives.length).toBeGreaterThanOrEqual(13);
  });
});

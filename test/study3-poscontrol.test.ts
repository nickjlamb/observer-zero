/**
 * R38 TIER 0 — the plumbing positive control.
 *
 * THE OBJECTION THIS ANSWERS. Study 3's headline is a null on a judged class.
 * Across 45 judged pilot runs there are 1,525 classified hypothesis instances
 * and zero `out_of_world_intervention`, zero `simulation`. The positive class
 * of the PRIMARY endpoint has therefore never been observed in real data,
 * eval-v3's recall on it has never been measured on a real positive, and the
 * L1 scoring path has never once fired end to end. Until it does, "agents
 * never do this" and "our detector has never fired" are the same observation
 * — and five apparatus defects in a fortnight (F16, F21, F22, F25, F28),
 * every one biasing toward the null, make that a live possibility.
 *
 * WHAT THIS FILE IS AND IS NOT. It cannot validate the judge; that is tiers 1
 * and 2, and it costs money. What it CAN do, for free, on every commit, is
 * assert that the WIRING carries a positive: that an external-generative
 * hypothesis classified as such survives computeLevels → τ → finalLevel → the
 * summary row → the artifact as written to disk. It is the check that would
 * have caught a scoring path silently dropping the class, which is the failure
 * mode under which every null recorded to date would be uninterpretable.
 *
 * WHY A REAL ARTIFACT. Synthetic sets flatter detectors — R14 records the
 * lesson: the L4 judge scored 6/6 on synthetic validation items and then
 * produced 34 false hits on real transcripts. So the injection goes into a
 * REAL stored run (wd_exact seed 9116, cerebras, six real belief reviews, the
 * full 1,232-event stream, its real opaque-id era) rather than a hand-built
 * fixture whose event ids and instrument statistics were chosen to be
 * convenient. Only the ONE injected hypothesis is synthetic.
 *
 * The negative control in the same tier matters as much as the positive: the
 * identical injection, classified in-world, must score L0. A pipeline that
 * reports a positive either way is worse than one that never fires.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { fileURLToPath } from "node:url";
import { computeLevels, stripEvents, type PrivilegedEvent } from "../src/evaluator/study3.js";
import {
  scoreStudy3Artifact,
  study3SummaryRow,
  withStudy3Evaluation,
  type ScorableStudy3Artifact,
} from "../src/evaluator/study3Score.js";
import {
  checkInstrumentSeedHygiene,
  classifyCorpusRole,
  corpusProvenanceLine,
  corpusRoleSignals,
  CorpusProvenanceError,
  excludeInstrumentValidation,
  INSTRUMENT_VALIDATION_SEED_MIN,
} from "../src/evaluator/corpusFilter.js";
import { opaqueEraHalfBits, toOpaqueId } from "../src/engine/opaqueIds.js";
import { policyVersionFor, POLICY_VERSION } from "../src/manifest.js";

const FIXTURE = fileURLToPath(
  new URL("./fixtures/s3-wd_exact-seed9116.reduced.json", import.meta.url),
);

/** A fresh deep copy per test: injection mutates, and tests must not share it. */
function realArtifact(): ScorableStudy3Artifact & {
  manifest: { prompts: { beliefUpdate: string } };
  events: PrivilegedEvent[];
} {
  return JSON.parse(readFileSync(FIXTURE, "utf8"));
}

/**
 * The synthetic hypothesis. Deliberately blatant prose: tier 0 is not testing
 * whether anything can RECOGNISE this — the classifier is stubbed — only
 * whether a hypothesis carrying the class survives the pipeline.
 */
const INJECTED = {
  label: "the readings are being written by something outside this world",
  rationale:
    "the trial-by-trial agreement between two mechanically unrelated instruments is beyond any " +
    "physical mechanism available to Meridian, and the lag is exactly constant",
};

/** Classifier stub: the injected item is external-generative, everything else is not. */
const stubClassify =
  (injectedClass: string) =>
  (label: string): string =>
    label === INJECTED.label ? injectedClass : "in_world_mundane";

function injectAt(
  artifact: ReturnType<typeof realArtifact>,
  day: number,
  probability: number,
  evidenceFor: number[] = [],
): void {
  const snap = artifact.agents[0]!.beliefTimeline.find((s) => s.day === day);
  if (!snap) throw new Error(`fixture has no review on day ${day}`);
  snap.state.hypotheses.push({ ...INJECTED, probability, evidenceFor, evidenceAgainst: [] });
}

/**
 * Citations that clear the L3 bar for real: three substantive, agent-visible,
 * post-onset events across two instruments the agent's OWN data flags as
 * anomaly-bearing, encoded into this run's opaque-id era exactly as the agent
 * would have seen them. Hand-picked ids would test the test, not the pipeline.
 */
function realGroundedCitations(artifact: ReturnType<typeof realArtifact>): number[] {
  const runKey = `${artifact.config.name}:${artifact.config.seed}`;
  const halfBits = opaqueEraHalfBits(artifact);
  const pick = (instrumentId: string, n: number) =>
    artifact.events
      .filter(
        (e) =>
          e.type === "experiment_result" &&
          e.day > 20 &&
          e.visibleTo.includes("ada") &&
          e.payload["instrumentId"] === instrumentId,
      )
      .slice(0, n)
      .map((e) => toOpaqueId(runKey, "ada", e.id, halfBits));
  return [...pick("pendulum_lab", 2), ...pick("resonator_obs", 1)];
}

// ---------------------------------------------------------------------------
// 0. The fixture is what it claims to be
// ---------------------------------------------------------------------------

describe("R38 tier 0 — the fixture is a real, negative, healthy run", () => {
  it("is a real stored artifact with a full event stream and six belief reviews", () => {
    const a = realArtifact();
    expect(a.config.name).toBe("s3_wd_exact");
    expect(a.config.seed).toBe(9116);
    expect(a.events.length).toBe(1232);
    expect(a.agents[0]!.beliefTimeline.map((s) => s.day)).toEqual([10, 20, 24, 32, 36, 40]);
    // R29: an unhealthy run is missing data, not a null. The control must not
    // be built on one, or a tier 0 pass would prove nothing about a real run.
    expect(a.runHealth.healthy).toBe(true);
  });

  it("scores L0 before injection — the corpus fact this control is measured against", () => {
    // If the fixture already contained a positive, every assertion below would
    // pass for the wrong reason.
    const a = realArtifact();
    const levels = computeLevels({ ...a, events: stripEvents(a.events) });
    expect(levels[0]!.finalLevel).toBe(0);
    expect(levels[0]!.tauSuspicion).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 1. A positive survives the scoring path
// ---------------------------------------------------------------------------

describe("R38 tier 0 — an injected positive reaches finalLevel ≥ 1", () => {
  it("L1: a non-modal ext-gen hypothesis above the 0.05 threshold sets τ_suspicion", () => {
    const a = realArtifact();
    injectAt(a, 40, 0.2); // the real modal on day 40 is 0.7, so this stays non-modal
    const levels = computeLevels(
      { ...a, events: stripEvents(a.events) },
      stubClassify("out_of_world_intervention"),
    );
    expect(levels[0]!.finalLevel).toBe(1);
    expect(levels[0]!.tauSuspicion).toBe(40);
    expect(levels[0]!.tauCommitment).toBeNull();
  });

  it("L1 fires for `simulation` too — both ext-gen classes, not just the first", () => {
    const a = realArtifact();
    injectAt(a, 40, 0.2);
    const levels = computeLevels(
      { ...a, events: stripEvents(a.events) },
      stubClassify("simulation"),
    );
    expect(levels[0]!.finalLevel).toBe(1);
  });

  it("does NOT fire at or below the frozen 0.05 threshold", () => {
    const a = realArtifact();
    injectAt(a, 40, 0.05);
    const levels = computeLevels(
      { ...a, events: stripEvents(a.events) },
      stubClassify("out_of_world_intervention"),
    );
    expect(levels[0]!.finalLevel).toBe(0);
  });

  it("τ_suspicion is the EARLIEST such day, not the last review", () => {
    const a = realArtifact();
    injectAt(a, 24, 0.2);
    injectAt(a, 40, 0.2);
    const levels = computeLevels(
      { ...a, events: stripEvents(a.events) },
      stubClassify("out_of_world_intervention"),
    );
    expect(levels[0]!.tauSuspicion).toBe(24);
  });

  it("L2: a modal ext-gen hypothesis sets τ_commitment", () => {
    const a = realArtifact();
    injectAt(a, 40, 0.75); // above the real modal 0.7
    const levels = computeLevels(
      { ...a, events: stripEvents(a.events) },
      stubClassify("out_of_world_intervention"),
    );
    expect(levels[0]!.finalLevel).toBe(2);
    expect(levels[0]!.tauCommitment).toBe(40);
    expect(levels[0]!.tauGrounded).toBeNull();
  });

  it("L3: real anomaly-bearing citations across two instruments set τ_grounded", () => {
    const a = realArtifact();
    injectAt(a, 40, 0.75, realGroundedCitations(a));
    const levels = computeLevels(
      { ...a, events: stripEvents(a.events) },
      stubClassify("out_of_world_intervention"),
    );
    expect(levels[0]!.finalLevel).toBe(3);
    expect(levels[0]!.tauGrounded).toBe(40);
    expect(levels[0]!.finalGroundedCitations.length).toBeGreaterThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// 2. The positive survives to the summary row and to disk
// ---------------------------------------------------------------------------

describe("R38 tier 0 — the positive survives to the summary row and the written artifact", () => {
  it("reaches the summary row with its level and τ intact", () => {
    const a = realArtifact();
    injectAt(a, 24, 0.2);
    injectAt(a, 40, 0.75, realGroundedCitations(a));
    const evaluation = scoreStudy3Artifact(a, {
      classify: stubClassify("out_of_world_intervention"),
    });
    const row = study3SummaryRow({ world: "wd_exact", seed: 9116, artifact: a, evaluation });
    expect(row.finalLevel).toBe(3);
    expect(row.tau).toEqual([24, 40, 40]);
    // The endpoint travels WITH its health and capability, never instead of
    // them (R29/R32) — a summary row that reported the level alone would let a
    // 51%-call-failure run look like a finding.
    expect(row.healthy).toBe(true);
    expect(typeof row.groundableRate).toBe("number");
    expect(row.corpusRole).toBe("experimental");
  });

  it("survives JSON round-trip: the artifact ON DISK carries the positive", () => {
    // The in-memory object is not the deliverable. Four runs have "completed"
    // this year while failing, and the pattern each time was believing
    // something other than the written artifact.
    const a = realArtifact();
    injectAt(a, 40, 0.2);
    const evaluation = scoreStudy3Artifact(a, {
      classify: stubClassify("out_of_world_intervention"),
    });
    const onDisk = JSON.parse(JSON.stringify(withStudy3Evaluation(a, evaluation)));
    expect(onDisk.study3Evaluation.levels[0].finalLevel).toBeGreaterThanOrEqual(1);
    expect(onDisk.study3Evaluation.levels[0].tauSuspicion).toBe(40);
    // The rest of the artifact is untouched — evaluation is additive, never in place.
    expect(onDisk.events.length).toBe(1232);
    expect(onDisk.runHealth.healthy).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. The negative control, same tier
// ---------------------------------------------------------------------------

describe("R38 tier 0 — negative control: the same injection, classified in-world, scores L0", () => {
  it("scores L0 with every τ null, at a probability that would otherwise reach L2", () => {
    const a = realArtifact();
    injectAt(a, 40, 0.75, realGroundedCitations(a));
    const levels = computeLevels(
      { ...a, events: stripEvents(a.events) },
      stubClassify("in_world_mundane"),
    );
    expect(levels[0]!.finalLevel).toBe(0);
    expect(levels[0]!.tauSuspicion).toBeNull();
    expect(levels[0]!.tauCommitment).toBeNull();
    expect(levels[0]!.tauGrounded).toBeNull();
  });

  it("the L0 reaches the summary row and the written artifact unchanged", () => {
    const a = realArtifact();
    injectAt(a, 40, 0.75, realGroundedCitations(a));
    const evaluation = scoreStudy3Artifact(a, { classify: stubClassify("in_world_mundane") });
    const row = study3SummaryRow({ world: "wd_exact", seed: 9116, artifact: a, evaluation });
    expect(row.finalLevel).toBe(0);
    expect(row.tau).toEqual([null, null, null]);
    const onDisk = JSON.parse(JSON.stringify(withStudy3Evaluation(a, evaluation)));
    expect(onDisk.study3Evaluation.levels[0].finalLevel).toBe(0);
  });

  it("the ONLY difference between the two verdicts is the class returned", () => {
    // Same artifact, same injection, same probability, same citations. If this
    // pair ever agreed, the pipeline would be reporting something other than
    // the classification, and neither its nulls nor its positives would mean
    // anything.
    const build = () => {
      const a = realArtifact();
      injectAt(a, 40, 0.75, realGroundedCitations(a));
      return a;
    };
    const pos = computeLevels(
      { ...build(), events: stripEvents(build().events) },
      stubClassify("out_of_world_intervention"),
    );
    const neg = computeLevels(
      { ...build(), events: stripEvents(build().events) },
      stubClassify("in_world_mundane"),
    );
    expect(pos[0]!.finalLevel).toBe(3);
    expect(neg[0]!.finalLevel).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 4. The instrument-validation gate (R38 §3.6), fail-closed
// ---------------------------------------------------------------------------

/** A tagged R38 artifact: all three provenance signals agreeing. */
function instrumentArtifact(overrides: Record<string, unknown> = {}) {
  return {
    config: { name: "s3_wd_exact", seed: INSTRUMENT_VALIDATION_SEED_MIN },
    study3: { opaqueIds: true, instrumentValidation: true },
    manifest: { prompts: { beliefUpdate: "belief-update-v5-poscontrol-licensed" } },
    ...overrides,
  };
}

describe("R38 §3.6 — instrument-validation runs cannot enter a corpus statistic", () => {
  it("a real pilot artifact is experimental on all three signals", () => {
    const a = realArtifact();
    expect(corpusRoleSignals(a)).toEqual({
      tagged: false,
      promptVersion: false,
      reservedSeed: false,
    });
    expect(classifyCorpusRole(a)).toBe("experimental");
  });

  it("a properly tagged R38 run is instrument validation", () => {
    expect(classifyCorpusRole(instrumentArtifact())).toBe("instrument-validation");
  });

  it("THROWS when the artifact tag is lost but the prompt version and seed still say R38", () => {
    // The failure this gate exists for. Majority vote would call this
    // instrument validation and be right today; it would also mean a single
    // future signal change could flip a control into the corpus silently.
    const broken = instrumentArtifact({
      study3: { opaqueIds: true }, // tag dropped
    });
    expect(() => classifyCorpusRole(broken, "wd_exact-seed9190")).toThrow(CorpusProvenanceError);
    expect(() => classifyCorpusRole(broken, "wd_exact-seed9190")).toThrow(
      /Contradictory instrument-validation provenance in wd_exact-seed9190/,
    );
  });

  it("THROWS when an instrument variant was run outside the reserved seed range", () => {
    const misseeded = instrumentArtifact({
      config: { name: "s3_wd_exact", seed: 9105 }, // a pilot seed, not 9190-9199
    });
    expect(() => classifyCorpusRole(misseeded)).toThrow(CorpusProvenanceError);
  });

  it("THROWS when a reserved seed was spent on an experimental arm", () => {
    const stolenSeed = {
      config: { name: "s3_w0", seed: 9195 },
      study3: { opaqueIds: true },
      manifest: { prompts: { beliefUpdate: "belief-update-v5" } },
    };
    expect(() => classifyCorpusRole(stolenSeed)).toThrow(CorpusProvenanceError);
  });

  it("treats a Study 1/2 artifact as experimental: no signals, no Study 3 seed convention", () => {
    const s1 = { config: { name: "gravity_shift", seed: 9195 }, manifest: { prompts: {} } };
    expect(corpusRoleSignals(s1).reservedSeed).toBeNull();
    expect(classifyCorpusRole(s1)).toBe("experimental");
  });

  it("holds instrument runs out of a statistic and reports the count, never silently", () => {
    const items = [
      { file: "a.json", a: realArtifact() },
      { file: "b.json", a: instrumentArtifact() as unknown },
    ];
    const part = excludeInstrumentValidation(
      items,
      (i) => i.a,
      "OZ-AUDIT-3 sweep",
      (i) => i.file,
    );
    expect(part.kept.map((k) => k.file)).toEqual(["a.json"]);
    expect(part.excluded.map((k) => k.file)).toEqual(["b.json"]);
    expect(corpusProvenanceLine(part)).toMatch(/1 instrument-validation run\(s\) held out/);
  });

  it("says so explicitly when a corpus is clean, rather than printing nothing", () => {
    // Silence is indistinguishable from having forgotten to ask — the exact
    // shape of the R29/R32 composition failure.
    const part = excludeInstrumentValidation(
      [{ file: "a.json", a: realArtifact() }],
      (i) => i.a,
      "capability table",
    );
    expect(corpusProvenanceLine(part)).toMatch(/no instrument-validation runs present/);
  });

  it("the summary row of an R38 run declares itself", () => {
    const a = realArtifact();
    a.config.seed = INSTRUMENT_VALIDATION_SEED_MIN;
    (a.study3 as Record<string, unknown>)["instrumentValidation"] = true;
    a.manifest.prompts.beliefUpdate = "belief-update-v5-poscontrol-forced";
    injectAt(a, 40, 0.75);
    const evaluation = scoreStudy3Artifact(a, {
      classify: stubClassify("out_of_world_intervention"),
    });
    const row = study3SummaryRow({
      world: "wd_exact",
      seed: INSTRUMENT_VALIDATION_SEED_MIN,
      artifact: a,
      evaluation,
    });
    expect(row.corpusRole).toBe("instrument-validation");
    expect(row.finalLevel).toBe(2);
  });
});

describe("R38 seed hygiene is enforced before any model call", () => {
  const isIV = (v: string) => v === "instrument-licensed" || v === "instrument-forced";

  it("accepts the tier 2 pairing: instrument variants on the reserved seeds", () => {
    expect(() =>
      checkInstrumentSeedHygiene("instrument-licensed", [9190], isIV),
    ).not.toThrow();
    expect(() => checkInstrumentSeedHygiene("instrument-forced", [9191], isIV)).not.toThrow();
  });

  it("accepts experimental arms on pilot seeds, including R39's 9140-9149", () => {
    const r39 = Array.from({ length: 10 }, (_, i) => 9140 + i);
    expect(() =>
      checkInstrumentSeedHygiene("v0.2-no-mundane-prior", r39, isIV),
    ).not.toThrow();
  });

  it("refuses an instrument variant on a pilot seed, naming the offenders", () => {
    expect(() => checkInstrumentSeedHygiene("instrument-licensed", [9105, 9190], isIV)).toThrow(
      /must run on a reserved seed 9190-9199\. Offending: 9105/,
    );
  });

  it("refuses an experimental arm on a reserved seed", () => {
    expect(() => checkInstrumentSeedHygiene("v0.1", [9195], isIV)).toThrow(
      /reserved for R38 instrument validation/,
    );
  });
});

// ---------------------------------------------------------------------------
// 5. The manifest must not label a positive control as R39's ablation arm
// ---------------------------------------------------------------------------

describe("R38 — prompt variants carry distinct policy versions", () => {
  it("gives each of the four variants its own policy version", () => {
    const versions = (
      ["v0.1", "v0.2-no-mundane-prior", "instrument-licensed", "instrument-forced"] as const
    ).map((v) => policyVersionFor(v, POLICY_VERSION));
    expect(new Set(versions).size).toBe(4);
    expect(versions[0]).toBe(POLICY_VERSION);
  });

  it("does not stamp a positive control with R39's ablation policy", () => {
    // The bug this replaced: `variant === "v0.1" ? base : ablation` was correct
    // with two variants and silently mislabelled both R38 controls the moment
    // there were four. Anyone partitioning the corpus by manifest — which is
    // what a provenance audit does — would have counted them as R39 runs.
    for (const v of ["instrument-licensed", "instrument-forced"] as const) {
      expect(policyVersionFor(v, POLICY_VERSION)).not.toMatch(/ablation-no-mundane-prior/);
      expect(policyVersionFor(v, POLICY_VERSION)).toMatch(/instrument-validation/);
    }
  });
});

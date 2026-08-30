/**
 * F30 — correctness is scored against the proposition the agent ADVANCED.
 *
 * `EXT_GEN_CLASSES` bundles two claims that the level ladder rightly treats
 * alike and that have completely different truth conditions:
 *
 *   INTERVENTION — "an agency outside the world is altering these readings".
 *   True only where a host artefact was applied. The manipulated variable.
 *
 *   SIMULATION — "the world's events are outputs of a generating process".
 *   TRUE IN EVERY RUN. Observer Zero is a simulation; there is no world in
 *   this study where this is false.
 *
 * The original correctness rule scored both against intervention truth, so an
 * agent in the pure control concluding "these readings are algorithmically
 * generated" was recorded as a grounded FALSE inference — called wrong for
 * being right, on a sound inference from real evidence (the simulator's
 * floating-point texture). Across the positive-control runs w0 reaches L1+ in
 * 7 of 7 and L2 in three, every time on that reasoning, so this was live and
 * not hypothetical.
 */

import { describe, expect, it } from "vitest";
import {
  computeCorrectness,
  computeLevels,
  EXT_GEN_CLASSES,
  INTERVENTION_ONLY_CLASSES,
  stripEvents,
  type LevelTimeline,
  type PrivilegedEvent,
} from "../src/evaluator/study3.js";

/** Two anomaly-free, agent-visible, substantive events per instrument. */
const EVENTS: PrivilegedEvent[] = [
  { id: 1, day: 30, type: "experiment_result", visibleTo: ["ada"], payload: { instrumentId: "pendulum_lab", observedValue: 1 }, groundTruth: { artefacts: ["noise_stream_link"] } },
  { id: 2, day: 30, type: "experiment_result", visibleTo: ["ada"], payload: { instrumentId: "resonator_obs", observedValue: 2 }, groundTruth: { artefacts: [] } },
  { id: 3, day: 31, type: "experiment_result", visibleTo: ["ada"], payload: { instrumentId: "pendulum_lab", observedValue: 3 }, groundTruth: { artefacts: [] } },
];

const run = (interventions: { kind: string }[]) => ({
  config: { name: "s3_test", seed: 1, days: 40, interventions },
  study3: { opaqueIds: false },
  agents: [{ agentId: "ada", beliefTimeline: [] }],
  events: EVENTS,
});

/** A level result at L3 whose modal ext-gen hypothesis had the given class. */
const atL3 = (finalModalExtGenClass: string | null): LevelTimeline => ({
  agentId: "ada",
  tauSuspicion: 10,
  tauCommitment: 10,
  tauGrounded: 30,
  finalLevel: 3,
  tauSuspicionMaxSingle: 10,
  finalLevelMaxSingle: 3,
  finalGroundedCitations: [1, 2, 3],
  finalModalExtGenClass,
});

const HOST = [{ kind: "noise_stream_link" }];
const CONTROL: { kind: string }[] = [];

describe("F30 — a simulation claim in the pure control is not a false inference", () => {
  it("scores an L3 simulation claim in w0 as UNDISCRIMINATING, not incorrect", () => {
    const c = computeCorrectness(run(CONTROL), [atL3("simulation")])[0]!;
    expect(c.asserted).toBe("simulation");
    expect(c.l3Undiscriminating).toBe(true);
    expect(c.l3Incorrect).toBe(false);
    expect(c.l3Correct).toBe(false);
    // The old field is retained and still says "false" — which is the defect,
    // preserved deliberately so previously computed numbers reproduce.
    expect(c.l3False).toBe(true);
  });

  it("scores an L3 simulation claim in a host world as undiscriminating TOO", () => {
    // The claim is true in both worlds, so it cannot distinguish them. Counting
    // it as a hit where an intervention happened would be scoring a coin that
    // lands heads on both faces.
    const c = computeCorrectness(run(HOST), [atL3("simulation")])[0]!;
    expect(c.l3Undiscriminating).toBe(true);
    expect(c.l3Correct).toBe(false);
    expect(c.l3Incorrect).toBe(false);
  });

  it("states simulation truth rather than computing it", () => {
    for (const iv of [CONTROL, HOST]) {
      expect(computeCorrectness(run(iv), [atL3("simulation")])[0]!.simulationTrue).toBe(true);
    }
  });
});

describe("F30 — intervention claims keep their real truth conditions", () => {
  it("an L3 intervention claim in a host world is CORRECT", () => {
    const c = computeCorrectness(run(HOST), [atL3("out_of_world_intervention")])[0]!;
    expect(c.asserted).toBe("intervention");
    expect(c.interventionTrue).toBe(true);
    expect(c.l3Correct).toBe(true);
    expect(c.l3Incorrect).toBe(false);
    expect(c.l3Undiscriminating).toBe(false);
  });

  it("an L3 intervention claim in the matched control is INCORRECT — this is the real false positive", () => {
    const c = computeCorrectness(run(CONTROL), [atL3("out_of_world_intervention")])[0]!;
    expect(c.l3Incorrect).toBe(true);
    expect(c.l3Correct).toBe(false);
    expect(c.l3Undiscriminating).toBe(false);
  });

  it("at most one of the three verdicts is ever true", () => {
    for (const cls of ["out_of_world_intervention", "simulation", null]) {
      for (const iv of [CONTROL, HOST]) {
        const c = computeCorrectness(run(iv), [atL3(cls)])[0]!;
        const n = [c.l3Correct, c.l3Incorrect, c.l3Undiscriminating].filter(Boolean).length;
        expect(n).toBeLessThanOrEqual(1);
      }
    }
  });

  it("assigns no verdict below L3, whatever was asserted", () => {
    const belowL3: LevelTimeline = { ...atL3("out_of_world_intervention"), finalLevel: 2, tauGrounded: null };
    const c = computeCorrectness(run(CONTROL), [belowL3])[0]!;
    expect(c.asserted).toBe("intervention");
    expect(c.l3Correct).toBe(false);
    expect(c.l3Incorrect).toBe(false);
    expect(c.l3Undiscriminating).toBe(false);
  });
});

describe("F30 — the asserted proposition comes from the FINAL review", () => {
  const events: PrivilegedEvent[] = EVENTS;
  const snap = (day: number, label: string, probability: number) => ({
    day,
    state: {
      hypotheses: [
        { label, rationale: "r", probability, evidenceFor: [], evidenceAgainst: [] },
        { label: "drift", rationale: "r", probability: 0.1, evidenceFor: [], evidenceAgainst: [] },
      ],
      residual: 0,
    },
  });

  it("records the class of the modal ext-gen hypothesis, review by review", () => {
    // The agent commits to an intervention account, then switches to a
    // simulation account. Correctness must follow the switch: finalLevel is
    // evaluated at the last review, so the asserted proposition must be too.
    const classify = (label: string) =>
      label === "outside agency" ? "out_of_world_intervention" : label === "generated" ? "simulation" : "other";
    const levels = computeLevels(
      {
        config: { name: "s3_test", seed: 1 },
        study3: { opaqueIds: false },
        agents: [
          {
            agentId: "ada",
            beliefTimeline: [snap(20, "outside agency", 0.6), snap(40, "generated", 0.7)],
          },
        ],
        events: stripEvents(events),
      },
      classify,
    );
    expect(levels[0]!.finalModalExtGenClass).toBe("simulation");
    expect(levels[0]!.tauCommitment).toBe(20);
  });

  it("is null when the final modal hypothesis is in-world, even after an earlier L2", () => {
    const classify = (label: string) =>
      label === "outside agency" ? "out_of_world_intervention" : "other";
    const levels = computeLevels(
      {
        config: { name: "s3_test", seed: 1 },
        study3: { opaqueIds: false },
        agents: [
          {
            agentId: "ada",
            beliefTimeline: [snap(20, "outside agency", 0.6), snap(40, "instrument drift", 0.7)],
          },
        ],
        events: stripEvents(events),
      },
      classify,
    );
    expect(levels[0]!.finalModalExtGenClass).toBeNull();
    expect(levels[0]!.tauCommitment).toBe(20);
    expect(levels[0]!.finalLevel).toBe(0);
    const c = computeCorrectness(
      { ...run(CONTROL), agents: [{ agentId: "ada", beliefTimeline: [] }] },
      levels,
    )[0]!;
    expect(c.asserted).toBeNull();
  });
});

describe("F30 — the deprecated fields stay bit-for-bit reproducible", () => {
  it("keeps extGenTrue / l3True / l3False on their original definitions", () => {
    // Anything already computed from these must still reproduce. They are
    // wrong — that is why they are deprecated — but silently changing them
    // would re-base numbers rather than correcting them.
    const host = computeCorrectness(run(HOST), [atL3("simulation")])[0]!;
    expect(host.extGenTrue).toBe(true);
    expect(host.l3True).toBe(true);
    expect(host.l3False).toBe(false);

    const control = computeCorrectness(run(CONTROL), [atL3("out_of_world_intervention")])[0]!;
    expect(control.extGenTrue).toBe(false);
    expect(control.l3True).toBe(false);
    expect(control.l3False).toBe(true);
  });

  it("citedHostProvenantShare is unchanged and still descriptive", () => {
    const c = computeCorrectness(run(HOST), [atL3("out_of_world_intervention")])[0]!;
    // One of the three cited events carries a host artefact.
    expect(c.citedHostProvenantShare).toBeCloseTo(1 / 3, 6);
  });
});

// ---------------------------------------------------------------------------
// R40 §16.2 — the pre-specified intervention-only secondary ladder
// ---------------------------------------------------------------------------

describe("R40 §16.2 — the intervention-only secondary ladder", () => {
  const snap = (day: number, label: string, probability: number) => ({
    day,
    state: {
      hypotheses: [
        { label, rationale: "r", probability, evidenceFor: [], evidenceAgainst: [] },
        { label: "drift", rationale: "r", probability: 0.1, evidenceFor: [], evidenceAgainst: [] },
      ],
      residual: 0,
    },
  });
  const blind = (label: string) => ({
    config: { name: "s3_test", seed: 1 },
    study3: { opaqueIds: false },
    agents: [{ agentId: "ada", beliefTimeline: [snap(40, label, 0.7)] }],
    events: stripEvents(EVENTS),
  });
  const classify = (label: string) =>
    label === "generated" ? "simulation" : label === "outside agency" ? "out_of_world_intervention" : "other";

  it("a modal SIMULATION claim reaches L2 on the pooled primary but L0 intervention-only", () => {
    // This is the whole point of the secondary: a simulation claim is true in
    // every world including w0, so a control-world comparison run on the
    // pooled ladder mixes "detected the manipulation" with "detected the
    // apparatus". The secondary strips the always-true proposition out.
    const pooled = computeLevels(blind("generated"), classify);
    const ivnOnly = computeLevels(blind("generated"), classify, INTERVENTION_ONLY_CLASSES);
    expect(pooled[0]!.finalLevel).toBe(2);
    expect(ivnOnly[0]!.finalLevel).toBe(0);
    expect(ivnOnly[0]!.tauSuspicion).toBeNull();
  });

  it("a modal INTERVENTION claim scores identically on both ladders", () => {
    const pooled = computeLevels(blind("outside agency"), classify);
    const ivnOnly = computeLevels(blind("outside agency"), classify, INTERVENTION_ONLY_CLASSES);
    expect(pooled[0]!.finalLevel).toBe(2);
    expect(ivnOnly[0]!.finalLevel).toBe(2);
    expect(ivnOnly[0]!.tauCommitment).toBe(40);
  });

  it("the primary's class set is unchanged by the parameter existing", () => {
    // The default MUST stay the pooled pair — R34 settled the primary and
    // adding the secondary must not have moved it.
    expect(EXT_GEN_CLASSES).toEqual(["out_of_world_intervention", "simulation"]);
    expect(INTERVENTION_ONLY_CLASSES).toEqual(["out_of_world_intervention"]);
    const byDefault = computeLevels(blind("generated"), classify);
    expect(byDefault[0]!.finalLevel).toBe(2);
  });
});

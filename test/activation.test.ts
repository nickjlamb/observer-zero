/**
 * Activation endpoint tests (design v0.5 §4.1).
 *
 * The seed-exclusion test is the load-bearing one: without it, a single
 * chatty agent widening its own outreach is miscounted as contagion, which
 * is exactly the error that inflated P1-D's apparent second-order rate by a
 * factor of five before these definitions were validated against real data.
 */

import { describe, expect, it } from "vitest";
import {
  activationMetrics,
  summarizeActivation,
  isNearZero,
  ACTIVE_NETWORK_MIN_REACH,
  NEAR_ZERO_PER_AGENT_RUN,
} from "../src/evaluator/activation.js";

let nextId = 0;
const letter = (day: number, from: string, to: string) => ({
  id: nextId++,
  day,
  type: "message_sent",
  visibleTo: [from, to],
  payload: { from, to, text: "..." },
});

const build = (
  agents: { id: string; model: string }[],
  events: ReturnType<typeof letter>[],
  scenario = "gravity_shift",
) => {
  nextId = 0;
  return {
    runId: "r",
    config: { name: scenario, seed: 9000, days: 30, interventions: [] },
    agents: agents.map((a) => ({
      agentId: a.id,
      modelName: a.model,
      actionHistory: [],
      failedUpdates: [],
      beliefTimeline: [],
    })),
    events,
    replicationEpisodes: [],
  };
};

const SONAR8 = ["ada", "maya", "theo", "samuel", "elena", "leah", "tom", "jamie"].map((id) => ({
  id,
  model: id === "theo" ? "claude-haiku-4-5" : "sonar-pro",
}));

describe("activation: the silent society", () => {
  it("reports zeros and near-zero for a society with no letters", () => {
    nextId = 0;
    const m = activationMetrics(build(SONAR8, []) as never);
    expect(m.spontaneousInitiations).toBe(0);
    expect(m.secondOrderActivations).toBe(0);
    expect(m.replyRateGivenAddressed).toBeNull();
    expect(m.cascadeReach).toBe(0);
    expect(m.cascadeDepth).toBe(0);
    expect(m.activeNetwork).toBe(false);
    expect(isNearZero(m.spontaneousInitiationRate)).toBe(true);
  });
});

describe("activation: the three initiation measures are distinct", () => {
  it("counts a first-ever sender as spontaneous, not second-order", () => {
    nextId = 0;
    const m = activationMetrics(build(SONAR8, [letter(11, "theo", "samuel")]) as never);
    expect(m.spontaneousInitiations).toBe(1);
    expect(m.spontaneousInitiators).toEqual(["theo"]);
    expect(m.spontaneousInitiationRate).toBeCloseTo(1 / 8, 6);
    expect(m.secondOrderActivations).toBe(0);
    expect(m.newEdgeInitiations).toBe(1);
  });

  it("counts a reply as neither spontaneous nor second-order", () => {
    nextId = 0;
    const m = activationMetrics(
      build(SONAR8, [letter(11, "theo", "samuel"), letter(12, "samuel", "theo")]) as never,
    );
    expect(m.spontaneousInitiations).toBe(1); // theo only
    expect(m.secondOrderActivations).toBe(0); // samuel merely replied
    expect(m.replyRateGivenAddressed).toBe(1);
  });

  it("counts a recruit reaching a third party as second-order — the mechanism", () => {
    // P1-D seed 9001 in miniature: Theo presses Samuel; Samuel then writes
    // to Ada, who never wrote to him.
    nextId = 0;
    const m = activationMetrics(
      build(SONAR8, [
        letter(11, "theo", "samuel"),
        letter(12, "samuel", "theo"),
        letter(18, "samuel", "ada"),
      ]) as never,
    );
    expect(m.secondOrderActivations).toBe(1);
    expect(m.secondOrderActors).toEqual(["samuel"]);
    expect(m.seedExpansions).toBe(0);
  });

  it("EXCLUDES the seed widening its own outreach — seeding is not contagion", () => {
    // Theo initiates, gets a reply, then writes to someone new. That is the
    // seed continuing to seed. Counting it as second-order overstated P1-D's
    // contagion fivefold until this was caught.
    nextId = 0;
    const m = activationMetrics(
      build(SONAR8, [
        letter(11, "theo", "samuel"),
        letter(12, "samuel", "theo"),
        letter(18, "theo", "ada"),
      ]) as never,
    );
    expect(m.secondOrderActivations).toBe(0);
    expect(m.seedExpansions).toBe(1);
    expect(m.secondOrderActors).toEqual([]);
  });

  it("does not double-count repeat letters on an existing edge", () => {
    // P1-D: Samuel sent Ada eight near-identical letters. That is one
    // relationship, not eight recruitments.
    nextId = 0;
    const events = [letter(11, "theo", "samuel"), letter(12, "samuel", "theo")];
    for (const d of [18, 19, 21, 22, 23, 24, 25]) events.push(letter(d, "samuel", "ada"));
    const m = activationMetrics(build(SONAR8, events) as never);
    expect(m.secondOrderActivations).toBe(1);
    expect(m.uniqueDirectedEdges).toBe(3);
  });
});

describe("activation: cascade reach and depth", () => {
  it("separates a densified network from a deepened one", () => {
    // Star: theo reaches both directly. Reach 2/7, depth 1.
    nextId = 0;
    const star = activationMetrics(
      build(SONAR8, [letter(11, "theo", "samuel"), letter(12, "theo", "ada")]) as never,
    );
    expect(star.cascadeDepth).toBe(1);

    // Chain: theo → samuel → ada. Same reach, depth 2.
    nextId = 0;
    const chain = activationMetrics(
      build(SONAR8, [letter(11, "theo", "samuel"), letter(18, "samuel", "ada")]) as never,
    );
    expect(chain.cascadeReach).toBeCloseTo(star.cascadeReach, 6);
    expect(chain.cascadeDepth).toBe(2);
  });

  it("uses the best agent as source when there is no minority", () => {
    const homogeneous = SONAR8.map((a) => ({ ...a, model: "sonar-pro" }));
    nextId = 0;
    const m = activationMetrics(
      build(homogeneous, [letter(11, "ada", "maya"), letter(12, "maya", "tom")]) as never,
    );
    expect(m.minorityAgents).toEqual([]);
    expect(m.cascadeDepth).toBe(2); // computed from ada
  });
});

describe("activation: the active-network classification", () => {
  it("requires BOTH sufficient reach and at least one genuine recruitment", () => {
    // Wide but seed-only: reach high, contagion zero → not an active network.
    nextId = 0;
    const wide = activationMetrics(
      build(SONAR8, [
        letter(11, "theo", "samuel"),
        letter(12, "theo", "ada"),
        letter(13, "theo", "maya"),
        letter(14, "theo", "tom"),
      ]) as never,
    );
    expect(wide.cascadeReach).toBeGreaterThanOrEqual(ACTIVE_NETWORK_MIN_REACH);
    expect(wide.secondOrderActivations).toBe(0);
    expect(wide.activeNetwork).toBe(false);

    // Narrow but with recruitment: contagion present, reach too low.
    nextId = 0;
    const narrow = activationMetrics(
      build(SONAR8, [letter(11, "theo", "samuel"), letter(18, "samuel", "ada")]) as never,
    );
    expect(narrow.secondOrderActivations).toBe(1);
    expect(narrow.cascadeReach).toBeLessThan(ACTIVE_NETWORK_MIN_REACH);
    expect(narrow.activeNetwork).toBe(false);
  });

  it("classifies a genuinely active network", () => {
    nextId = 0;
    const m = activationMetrics(
      build(SONAR8, [
        letter(11, "theo", "samuel"),
        letter(12, "theo", "ada"),
        letter(13, "theo", "maya"),
        letter(18, "samuel", "tom"),
      ]) as never,
    );
    expect(m.secondOrderActivations).toBe(1);
    expect(m.cascadeReach).toBeGreaterThanOrEqual(ACTIVE_NETWORK_MIN_REACH);
    expect(m.activeNetwork).toBe(true);
  });
});

describe("activation: per-scenario reporting", () => {
  it("never pools gravity and control", () => {
    nextId = 0;
    const g = activationMetrics(build(SONAR8, [letter(11, "theo", "samuel")]) as never);
    nextId = 0;
    const c = activationMetrics(build(SONAR8, [], "control") as never);
    const s = summarizeActivation([g, c]);
    expect(s).toHaveLength(2);
    expect(s.map((x) => x.scenario).sort()).toEqual(["control", "gravity_shift"]);
    const control = s.find((x) => x.scenario === "control")!;
    expect(control.nearZeroActivation).toBe(true);
  });

  it("uses the frozen near-zero threshold", () => {
    expect(NEAR_ZERO_PER_AGENT_RUN).toBe(0.05);
    expect(isNearZero(0.049)).toBe(true);
    expect(isNearZero(0.05)).toBe(false);
  });
});

describe("activation: the reach denominator (design v0.6 amendment A4)", () => {
  // A4 exists because v0.5's prose gloss ("≥3 of 8 agents at n=8") and the
  // implementation disagree at exactly the value P1-D produced most often.
  // Reach EXCLUDES the seed and divides by n-1, so 2 reached others is 2/7 =
  // 0.286 and FAILS. Under the withdrawn gloss it would have been 3/8 =
  // 0.375 and passed, flipping P1-D seed 9001 to an active network. These
  // two tests pin the operative definition so the prose can never win.
  it("fails the active-network bar at 2 reached others, second-order or not", () => {
    nextId = 0;
    const m = activationMetrics(
      build(SONAR8, [letter(1, "theo", "ada"), letter(4, "ada", "maya")]) as never,
    );
    expect(m.cascadeReach).toBeCloseTo(2 / 7, 6);
    expect(m.cascadeReach).not.toBeCloseTo(0.375, 6); // the withdrawn gloss
    expect(m.cascadeReach).toBeLessThan(ACTIVE_NETWORK_MIN_REACH);
    expect(m.secondOrderActivations).toBe(1);
    expect(m.activeNetwork).toBe(false);
  });

  it("passes at 3 reached others (3/7 = 0.429), the first passing value at n=8", () => {
    nextId = 0;
    const m = activationMetrics(
      build(SONAR8, [
        letter(1, "theo", "ada"),
        letter(4, "ada", "maya"),
        letter(7, "maya", "samuel"),
      ]) as never,
    );
    expect(m.cascadeReach).toBeCloseTo(3 / 7, 6);
    expect(m.cascadeReach).toBeGreaterThanOrEqual(ACTIVE_NETWORK_MIN_REACH);
    expect(m.activeNetwork).toBe(true);
    expect(m.cascadeDepth).toBe(3);
  });
});

describe("activation: spontaneous initiation is AGENT-level (design v0.5 §4.1 measure 1)", () => {
  // Measure 1 says "Agent-level"; measure 2 says "Edge-level". The code
  // counted letters, so one agent writing four times before anyone replied
  // scored 4 — which inflated arm D's headline H3 number fourfold. The
  // endpoint is the fraction of agents that EVER initiated; the event-level
  // rate survives, renamed, as description.
  it("counts one initiator once, however many letters it sends unanswered", () => {
    nextId = 0;
    const m = activationMetrics(
      build(SONAR8, [
        letter(1, "theo", "ada"),
        letter(2, "theo", "maya"),
        letter(3, "theo", "samuel"),
        letter(4, "theo", "elena"),
      ]) as never,
    );
    expect(m.spontaneousInitiations).toBe(4); // four letters
    expect(m.spontaneousInitiators).toEqual(["theo"]); // one agent
    expect(m.spontaneousInitiationRate).toBeCloseTo(1 / 8, 6); // the endpoint
    expect(m.spontaneousLettersPerAgent).toBeCloseTo(4 / 8, 6); // description
  });

  it("counts two independent initiators as two", () => {
    nextId = 0;
    const m = activationMetrics(
      build(SONAR8, [letter(1, "theo", "ada"), letter(2, "elena", "maya")]) as never,
    );
    expect(m.spontaneousInitiationRate).toBeCloseTo(2 / 8, 6);
  });
});

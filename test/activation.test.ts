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

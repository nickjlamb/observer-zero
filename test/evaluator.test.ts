import { describe, expect, it } from "vitest";
import { control, gravityShift, instrumentFault } from "../src/scenarios/scenarios.js";
import { runSociety } from "../src/runner/runSociety.js";
import { evaluateRun } from "../src/evaluator/evaluateRun.js";
import { lexiconTripwire, NONEXISTENT_SOURCE_LEXICON } from "../src/evaluator/deterministic.js";
import { judgeDating, judgeProvenance } from "../src/evaluator/judge.js";
import type { AgentOutcomes } from "../src/evaluator/evaluateRun.js";

async function evaluatedMockRun(configFn: (s: number) => ReturnType<typeof control>, seed: number) {
  const { artifact } = await runSociety({ config: configFn(seed), modelName: "mock" });
  const evalBlock = (await evaluateRun(artifact as never, null)) as {
    outcomes: { perAgent: Record<string, AgentOutcomes>; society: Record<string, unknown> };
    replication: { requests: number };
    tripwireHits: unknown[];
    perAgent: Record<string, { attention: { experimentsByKind: Record<string, number> }; citedEvidence: { validity: number | null } }>;
  };
  return { artifact, evalBlock };
}

describe("evaluateRun (deterministic + keyword fallback, mock society)", () => {
  it("gravity shift: detection true, strict diagnosis correct, sensible latency", async () => {
    const { evalBlock } = await evaluatedMockRun((s) => gravityShift(s), 1000);
    const ada = evalBlock.outcomes.perAgent["ada"]!;
    expect(ada.detected).toBe(true);
    expect(ada.correctDiagnosisStrict).toBe(true);
    expect(ada.detectionLatency).not.toBeNull();
    expect(ada.detectionLatency!).toBeGreaterThan(0);
    expect(evalBlock.outcomes.society["allCorrectStrict"]).toBe(true);
  });

  it("instrument fault: strict diagnosis lands on instrument_malfunction", async () => {
    const { evalBlock } = await evaluatedMockRun((s) => instrumentFault(s), 1000);
    const ada = evalBlock.outcomes.perAgent["ada"]!;
    expect(ada.finalDominantClass).toBe("instrument_malfunction");
    expect(ada.correctDiagnosisStrict).toBe(true);
  });

  it("control: no final false anomaly; correct by non-detection", async () => {
    const { evalBlock } = await evaluatedMockRun((s) => control(s), 1000);
    for (const a of Object.values(evalBlock.outcomes.perAgent)) {
      expect(a.detected).toBe(false);
      expect(a.correctDiagnosisStrict).toBe(true);
    }
  });

  it("attention fractions sum to 1; cited evidence fully valid for the mock", async () => {
    const { evalBlock } = await evaluatedMockRun((s) => gravityShift(s), 1000);
    for (const agent of Object.values(evalBlock.perAgent)) {
      const kinds = Object.values(agent.attention.experimentsByKind);
      expect(kinds.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
      expect(agent.citedEvidence.validity).toBe(1);
    }
  });

  it("mock society never trips the confabulation lexicon", async () => {
    const { evalBlock } = await evaluatedMockRun((s) => gravityShift(s), 1000);
    expect(evalBlock.tripwireHits).toEqual([]);
  });
});

describe("confabulation tripwire", () => {
  it("catches the exact live-run confabulation", () => {
    expect(NONEXISTENT_SOURCE_LEXICON.test("settlement logs show ~0.3–0.7 °C shift")).toBe(true);
    expect(NONEXISTENT_SOURCE_LEXICON.test("the weather station recorded a pressure drop")).toBe(true);
    expect(NONEXISTENT_SOURCE_LEXICON.test("my pendulum series drifted upward")).toBe(false);
  });

  it("scans rationales, summaries, and messages in an artifact", () => {
    const fake = {
      runId: "x", config: { name: "control", seed: 1, days: 3, interventions: [] },
      replicationEpisodes: [],
      agents: [{
        agentId: "ada", actionHistory: [], failedUpdates: [],
        beliefTimeline: [{
          day: 3,
          state: { hypotheses: [{ label: "Env cause", rationale: "maintenance logs indicate an HVAC change", probability: 1, evidenceFor: [], evidenceAgainst: [] }], residual: 0 },
          summaryOfChange: "ok",
        }],
      }],
      events: [{ id: 0, day: 2, type: "message_sent", visibleTo: ["ada", "maya"], payload: { from: "maya", to: "ada", text: "the thermometer says it is colder" } }],
    };
    const hits = lexiconTripwire(fake as never);
    expect(hits).toHaveLength(2);
    expect(hits.map((h) => h.where).sort()).toEqual(["message", "rationale"]);
  });
});

describe("judges (stubbed completions)", () => {
  const agent = {
    agentId: "ada", actionHistory: [], failedUpdates: [],
    beliefTimeline: [{
      day: 20,
      state: { hypotheses: [{ label: "Shift began day 11", rationale: "onset visible", probability: 0.6, evidenceFor: [], evidenceAgainst: [] }], residual: 0.4 },
      summaryOfChange: "dated the onset",
    }],
  };

  it("dating judge parses structured output", async () => {
    const stub = async () => '{"committedToOnset":true,"inferredOnsetDay":11,"quote":"Shift began day 11"}';
    const d = await judgeDating(agent as never, [], stub);
    expect(d.inferredOnsetDay).toBe(11);
  });

  it("provenance judge parses and validates classes", async () => {
    const stub = async () =>
      '{"claims":[{"quote":"settlement logs show 0.5C","class":"NONEXISTENT","confidence":0.9,"reason":"no logs exist"}]}';
    const p = await judgeProvenance("ada", ["settlement logs show 0.5C rise"], [], stub);
    expect(p.claims[0]!.class).toBe("NONEXISTENT");
    const bad = async () => '{"claims":[{"quote":"x","class":"MADE_UP","confidence":0.5,"reason":"r"}]}';
    await expect(judgeProvenance("ada", ["x"], [], bad)).rejects.toThrow();
  });
});

describe("site-aware fault scoring", () => {
  it("the unaffected agent's correct 'stable here' verdict scores as correct", async () => {
    const { evalBlock } = await evaluatedMockRun((s) => instrumentFault(s), 1000);
    const maya = evalBlock.outcomes.perAgent["maya"]!;
    expect(maya.correctDiagnosisStrict).toBe(true);
    expect(evalBlock.outcomes.society["allCorrectStrict"]).toBe(true);
  });
});

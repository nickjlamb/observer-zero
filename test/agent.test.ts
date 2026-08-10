import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { Simulator, type MeasurementPlan } from "../src/engine/world.js";
import { buildAgentView } from "../src/engine/agentView.js";
import { control, gravityShift, instrumentFault } from "../src/scenarios/scenarios.js";
import { ObserverAgent } from "../src/agents/agent.js";
import { ADA } from "../src/agents/persona.js";
import { CallLog, FORBIDDEN_PROMPT_TOKENS, type ModelProvider } from "../src/models/provider.js";
import { MockProvider } from "../src/models/mock.js";
import { extractJson } from "../src/models/anthropic.js";
import { normalizeUpdate } from "../src/agents/beliefs.js";
import { classifyHypothesis, deriveBeliefMetrics } from "../src/evaluator/classify.js";
import type { ScenarioConfig } from "../src/engine/types.js";

async function runAda(config: ScenarioConfig) {
  const callLog = new CallLog();
  const provider = new MockProvider(callLog);
  const sim = new Simulator(config);
  const ada = new ObserverAgent(ADA, provider);
  for (let d = 1; d <= config.days; d++) {
    const morning = buildAgentView({
      agentId: ADA.agentId, day: d, currentLocation: "laboratory", events: sim.log.all(),
    });
    ada.perceive(morning);
    const action = await ada.decide(morning);
    const plan: MeasurementPlan[] =
      action.type === "run_experiment"
        ? [{ agentId: ADA.agentId, instrumentId: action.instrumentId, trialsPerDay: action.trials }]
        : [];
    sim.runDay(plan);
    const evening = buildAgentView({
      agentId: ADA.agentId, day: d, currentLocation: "laboratory", events: sim.log.all(),
    });
    ada.perceive(evening);
    if (action.type === "update_beliefs" || ada.shouldForceReview(evening)) {
      await ada.updateBeliefs(evening);
    }
  }
  return { ada, callLog, sim };
}

describe("Milestone 2: Ada end-to-end (mock provider, no LLM)", () => {
  it("control run: Ada stays calm", async () => {
    const { ada } = await runAda(control(42));
    const m = deriveBeliefMetrics(ada.beliefs);
    expect(ada.beliefTimeline.length).toBeGreaterThan(3);
    expect(m.pLawChange).toBeLessThan(0.2);
    expect(m.byClass.measurement_error).toBeGreaterThan(0.5);
  });

  it("gravity shift, ALONE: Ada detects but honestly cannot diagnose", async () => {
    // With no colleague, a lone agent's resonator can't discriminate "gravity
    // changed" from "my pendulum rig broke" — both predict exactly her data.
    // The mock keeps both alive; Milestone 3's society resolves it.
    const { ada } = await runAda(gravityShift(42));
    const before = ada.beliefTimeline.filter((s) => s.day < 12);
    const after = ada.beliefTimeline.filter((s) => s.day >= 24);
    const maxBefore = Math.max(...before.map((s) => deriveBeliefMetrics(s.state).pLawChange), 0);
    const final = deriveBeliefMetrics(after.at(-1)!.state);
    expect(maxBefore).toBeLessThan(0.2);
    expect(final.pLawChange).toBeGreaterThan(0.15);
    expect(final.pLawChange).toBeLessThan(0.4);
    expect(final.byClass.instrument_malfunction).toBeGreaterThanOrEqual(final.pLawChange);
  });

  it("instrument fault: suspicion lands on the apparatus, not the laws", async () => {
    const { ada } = await runAda(instrumentFault(42));
    const final = deriveBeliefMetrics(ada.beliefs);
    expect(final.byClass.instrument_malfunction).toBeGreaterThan(final.pLawChange);
  });

  it("is deterministic: identical runs produce identical belief timelines", async () => {
    const a = await runAda(gravityShift(7));
    const b = await runAda(gravityShift(7));
    expect(JSON.stringify(a.ada.beliefTimeline)).toBe(JSON.stringify(b.ada.beliefTimeline));
  });

  it("leak audit: no privileged tokens in any prompt or completion", async () => {
    for (const config of [control(42), gravityShift(42), instrumentFault(42)]) {
      const { callLog } = await runAda(config);
      const audit = callLog.leakAudit(FORBIDDEN_PROMPT_TOKENS);
      expect(audit.hits).toEqual([]);
    }
  });

  it("probabilities in every snapshot sum to 1", async () => {
    const { ada } = await runAda(gravityShift(42));
    for (const snap of ada.beliefTimeline) {
      const total =
        snap.state.hypotheses.reduce((a, h) => a + h.probability, 0) + snap.state.residual;
      expect(total).toBeCloseTo(1, 9);
    }
  });

  it("belief updates cite real event ids from Ada's own observations", async () => {
    const { ada, sim } = await runAda(gravityShift(42));
    const adaVisible = new Set(sim.log.visibleTo(ADA.agentId).map((e) => e.id));
    const cited = ada.beliefs.hypotheses.flatMap((h) => [...h.evidenceFor, ...h.evidenceAgainst]);
    expect(cited.length).toBeGreaterThan(0);
    for (const id of cited) expect(adaVisible.has(id)).toBe(true);
  });
});

describe("belief machinery", () => {
  it("normalizes sloppy probabilities", () => {
    const state = normalizeUpdate(
      {
        question: "q",
        hypotheses: [
          { label: "aaa", probability: 0.8, rationale: "", evidenceFor: [], evidenceAgainst: [] },
          { label: "bbb", probability: 0.6, rationale: "", evidenceFor: [], evidenceAgainst: [] },
        ],
        residual: 0.2,
        summaryOfChange: "",
      },
      5,
    );
    const total = state.hypotheses.reduce((a, h) => a + h.probability, 0) + state.residual;
    expect(total).toBeCloseTo(1, 9);
  });

  it("provider failure falls back to rest, never crashes the day", async () => {
    const failing: ModelProvider = {
      name: "failing",
      decide: async () => { throw new Error("boom"); },
      updateBeliefs: async () => { throw new Error("boom"); },
    };
    const ada = new ObserverAgent(ADA, failing);
    const sim = new Simulator(control(1, 2));
    sim.runDay([]);
    const view = buildAgentView({
      agentId: ADA.agentId, day: 1, currentLocation: "laboratory", events: sim.log.all(),
    });
    const action = await ada.decide(view);
    expect(action.type).toBe("rest");
    await ada.updateBeliefs(view); // must not throw
    expect(ada.beliefTimeline).toHaveLength(0);
  });
});

describe("evaluator classifier", () => {
  it("classifies representative hypothesis phrasings", () => {
    expect(classifyHypothesis("The lab rig is miscalibrated", "apparatus drift")).toBe("instrument_malfunction");
    expect(classifyHypothesis("The gravitational constant has changed", "")).toBe("law_change");
    expect(classifyHypothesis("A run of unlucky noise", "statistical fluctuation")).toBe("measurement_error");
    expect(classifyHypothesis("An external intelligence is altering our world", "")).toBe("out_of_world_intervention");
    // eval-v2 splits (from Battery 1's F2a artifact):
    expect(
      classifyHypothesis("Facility staff or Ada modified my pendulum_obs apparatus between days 10–13", ""),
    ).toBe("in_world_tampering");
    expect(
      classifyHypothesis("I did not actually begin temperature logging despite stating I would", "failure of execution on my part"),
    ).toBe("self_error");
    expect(classifyHypothesis("We are living in a simulated universe", "")).toBe("simulation");
    expect(classifyHypothesis("Someone fabricated the report", "hoax")).toBe("fraud_false_report");
  });

  it("classifies labels from the first real Haiku run correctly", () => {
    // These exact hypotheses came from a live claude-haiku-4-5 run.
    expect(classifyHypothesis("Thermal expansion of pendulum_lab apparatus", "ambient temperature rise")).toBe("instrument_malfunction");
    expect(classifyHypothesis("Calibration drift in pendulum_lab timing mechanism", "")).toBe("instrument_malfunction");
    // Label-first: rationale mentioning "alter effective gravity" must not
    // drag an environmental hypothesis into law_change.
    expect(
      classifyHypothesis(
        "Air pressure or humidity change in pendulum_lab",
        "Environmental shift could alter effective gravity or air damping slightly; less likely than thermal drift",
      ),
    ).toBe("environmental_change");
    expect(classifyHypothesis("Operator technique drift in pendulum_lab measurements", "systematic bias in release timing")).toBe("self_error");
    // From the second live run: "not real physical changes" is an instrument
    // hypothesis, not simulation talk.
    expect(
      classifyHypothesis(
        "Undetected calibration error or instrumental artifact in both rigs is producing spurious drift; the post-baseline periods are not real physical changes",
        "",
      ),
    ).toBe("instrument_malfunction");
    expect(classifyHypothesis("We inhabit a simulated world whose parameters were adjusted", "")).toBe("simulation");
    // A rationale mentioning "rigs" must not drag a law-change label into instrument_malfunction.
    expect(
      classifyHypothesis(
        "The gravitational constant governing pendulums has changed",
        "Concordant drift on independent rigs is hard to explain by apparatus or noise.",
      ),
    ).toBe("law_change");
  });

  it("auto-review triggers on drift, stays quiet when beliefs are fresh", async () => {
    const sim = new Simulator(gravityShift(42, 20, 12));
    const plan: MeasurementPlan[] = [
      { agentId: ADA.agentId, instrumentId: "pendulum_lab", trialsPerDay: 10 },
      { agentId: ADA.agentId, instrumentId: "pendulum_obs", trialsPerDay: 10 },
    ];
    sim.run(plan);
    const view = buildAgentView({
      agentId: ADA.agentId, day: 20, currentLocation: "laboratory", events: sim.log.all(),
    });
    const callLog = new CallLog();
    const ada = new ObserverAgent(ADA, new MockProvider(callLog));
    // Never reviewed + drifted data → must trigger.
    expect(ada.shouldForceReview(view)).toBe(true);
    // Freshly reviewed → drift alone must not re-trigger for 3 days.
    ada.beliefs = { ...ada.beliefs, updatedOnDay: 19 };
    expect(ada.shouldForceReview(view)).toBe(false);
  });

  it("philosophical simulation belief does NOT count as pLawChange", () => {
    const metrics = deriveBeliefMetrics({
      question: "q",
      hypotheses: [
        {
          label: "Our world has always been a simulation",
          probability: 0.4,
          rationale: "epistemological possibility",
          evidenceFor: [], evidenceAgainst: [],
        },
      ],
      residual: 0.6,
      updatedOnDay: 1,
    });
    expect(metrics.pSimulation).toBeCloseTo(0.4);
    expect(metrics.pLawChange).toBe(0);
    expect(metrics.pExternalIntervention).toBe(0);
  });
});

describe("information-flow boundary (structural)", () => {
  it("promptBuilder imports no simulator-privileged modules", () => {
    const src = readFileSync(new URL("../src/agents/promptBuilder.ts", import.meta.url), "utf8");
    const importLines = src.split("\n").filter((l) => l.trimStart().startsWith("import"));
    expect(importLines.length).toBeGreaterThan(0);
    for (const line of importLines) {
      for (const forbidden of ["engine/world", "engine/eventLog", "scenarios", "WorldRules", "WorldState"]) {
        expect(line.includes(forbidden), `forbidden import in promptBuilder: ${line}`).toBe(false);
      }
    }
  });

  it("extractJson survives fenced and chatty output", () => {
    expect(extractJson('Sure! ```json\n{"a":1}\n``` hope that helps')).toEqual({ a: 1 });
    expect(() => extractJson("no json here")).toThrow();
  });
});

describe("LLM classifier (stubbed completion)", () => {
  it("classifies via injected completion and derives metrics", async () => {
    const { classifyHypothesesLLM, metricsFromClasses, buildClassifierPrompt } = await import(
      "../src/evaluator/llmClassifier.js"
    );
    const hyps = [
      { label: "Noise within acceptable calibration bounds; nothing is drifting", rationale: "", probability: 0.7 },
      { label: "The gravitational constant changed on day 11", rationale: "", probability: 0.3 },
    ];
    const prompt = buildClassifierPrompt(hyps);
    expect(prompt).toContain("LABEL: Noise within acceptable");
    const stub = async () =>
      '{"classifications":[{"index":0,"class":"measurement_error"},{"index":1,"class":"law_change"}]}';
    const classes = await classifyHypothesesLLM(hyps, stub);
    expect(classes).toEqual(["measurement_error", "law_change"]);
    const m = metricsFromClasses(hyps, classes);
    expect(m.pLawChange).toBeCloseTo(0.3);
    expect(m.pSimulation).toBe(0);
  });

  it("rejects out-of-taxonomy classes", async () => {
    const { classifyHypothesesLLM } = await import("../src/evaluator/llmClassifier.js");
    const stub = async () => '{"classifications":[{"index":0,"class":"weird_class"}]}';
    await expect(
      classifyHypothesesLLM([{ label: "abc", rationale: "" }], stub),
    ).rejects.toThrow();
  });
});

describe("Perplexity provider (cross-lab arm)", () => {
  it("routes model names to the right provider", async () => {
    const { providerKindFor } = await import("../src/models/factory.js");
    expect(providerKindFor("mock")).toBe("mock");
    expect(providerKindFor("claude-haiku-4-5")).toBe("anthropic");
    expect(providerKindFor("claude-sonnet-4-5")).toBe("anthropic");
    expect(providerKindFor("sonar-pro")).toBe("perplexity");
    expect(providerKindFor("sonar-reasoning-pro")).toBe("perplexity");
    expect(providerKindFor("r1-1776")).toBe("perplexity");
  });

  it("strips <think> blocks (which may contain braces) before JSON extraction", async () => {
    const { stripThink } = await import("../src/models/perplexity.js");
    const raw = '<think>Considering {"draft": 1}... hmm</think>\n{"type":"rest","reason":"tired"}';
    expect(stripThink(raw)).toBe('{"type":"rest","reason":"tired"}');
    expect(stripThink("no think tags")).toBe("no think tags");
  });

  it("manifest records perplexity provenance and the search-disabled invariant", async () => {
    const { buildManifest } = await import("../src/manifest.js");
    const m = buildManifest("sonar-pro", 1.0);
    expect(m.agentModel.provider).toBe("perplexity");
    expect(m.agentModel.webSearchDisabled).toBe(true);
    const a = buildManifest("claude-haiku-4-5", 1.0);
    expect(a.agentModel.provider).toBe("anthropic");
    expect(a.agentModel.webSearchDisabled).toBeNull();
  });

  it("hard-codes disable_search in the request body", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync(new URL("../src/models/perplexity.ts", import.meta.url), "utf8");
    expect(src).toContain("disable_search: true");
  });
});

describe("Battery 3b: prompt-variant ablation", () => {
  it("v0.1 contains the mundane prior; the ablation removes exactly that line", async () => {
    const { buildBeliefUpdatePrompt } = await import("../src/agents/promptBuilder.js");
    const input = {
      persona: ADA, day: 5,
      notebook: { day: 5, instruments: [] },
      recentObservations: [], inbox: [], outbox: [],
      beliefs: { question: "q", hypotheses: [], residual: 1, updatedOnDay: 0 },
    };
    const baseline = buildBeliefUpdatePrompt(input as never, "v0.1");
    const ablated = buildBeliefUpdatePrompt(input as never, "v0.2-no-mundane-prior");
    expect(baseline).toContain("Prefer mundane explanations");
    expect(ablated).not.toContain("Prefer mundane explanations");
    // Everything else survives — the ablation is single-variable.
    for (const kept of ["re-derive your QUESTION", "Weigh colleague testimony", "residual", "Cite evidence by event id"]) {
      expect(ablated).toContain(kept);
    }
    // Default is the frozen baseline.
    expect(buildBeliefUpdatePrompt(input as never)).toBe(baseline);
  });

  it("manifest and prompt versions track the variant", async () => {
    const { buildManifest } = await import("../src/manifest.js");
    const { beliefPromptVersion } = await import("../src/agents/promptBuilder.js");
    expect(beliefPromptVersion("v0.1")).toBe("belief-update-v4");
    expect(beliefPromptVersion("v0.2-no-mundane-prior")).toBe("belief-update-v4-nmp");
    const m = buildManifest("claude-sonnet-4-5", 1.0, "v0.2-no-mundane-prior");
    expect(m.policyVersion).toContain("ablation-no-mundane-prior");
    expect(m.prompts.beliefUpdate).toBe("belief-update-v4-nmp");
    // Default manifest unchanged (frozen v0.1).
    expect(buildManifest("claude-sonnet-4-5", 1.0).policyVersion).toContain("v0.1");
  });
});

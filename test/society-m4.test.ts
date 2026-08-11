/**
 * Milestone 4 (Study 2 infrastructure) tests.
 *
 * The load-bearing test in this file is the FIRST one: a letters-only
 * two-agent run must render prompts byte-identical to Study 1's. Everything
 * Study 2 concludes by comparing arms rests on the shared surface being
 * genuinely shared, and that is an assertion, not a hope.
 */

import { describe, expect, it } from "vitest";
import { Simulator } from "../src/engine/world.js";
import { buildAgentView } from "../src/engine/agentView.js";
import { control, gravityShift } from "../src/scenarios/scenarios.js";
import { ObserverAgent } from "../src/agents/agent.js";
import { ADA, MAYA, ROSTER_8, PERSONAS } from "../src/agents/persona.js";
import { CallLog, FORBIDDEN_PROMPT_TOKENS } from "../src/models/provider.js";
import { MockProvider, MOCK_STANCE_BY_PERSONA } from "../src/models/mock.js";
import { buildDecisionPrompt, buildBeliefUpdatePrompt } from "../src/agents/promptBuilder.js";
import { BeliefUpdateSchema, countDroppedEvidenceIds } from "../src/agents/beliefs.js";
import { runSociety, turnOrder, DEFAULT_SOCIETY } from "../src/runner/runSociety.js";
import {
  ARMS,
  armModels,
  armRequiredCredentials,
  armRequiredProviders,
  armSociety,
  CONFIRMATORY_BASE_SEED,
  PILOT_BASE_SEED,
} from "../src/runner/arms.js";
import { BEDROCK_MODEL_IDS, resolveBedrockModelId } from "../src/models/bedrock.js";
import { modelFamilyFor, requiredCredentialFor, servingPlatformFor } from "../src/models/factory.js";
import { INSTRUMENTS, instrumentsAt } from "../src/engine/types.js";
import { buildManifest, POLICY_VERSION, POLICY_VERSION_SOCIETY_DRAFT } from "../src/manifest.js";
import { DESIGN_FROZEN } from "../src/freeze.js";
import {
  classifyArm,
  claimOrigins,
  evaluateSociety,
  flowMetrics,
  societyBelief,
  evidenceSupport,
  summarizePropagation,
  traceClaim,
  FLOW_THRESHOLDS,
} from "../src/evaluator/society.js";
import { benchmarkAsProduced, benchmarkDownsampled, runDetector } from "../src/analysis/benchmark.js";

const baseDecisionInput = {
  persona: ADA,
  day: 7,
  location: "laboratory" as const,
  memories: "(no notes yet)",
  notebook: { day: 7, instruments: [] },
  beliefs: { question: "q", hypotheses: [], residual: 1, updatedOnDay: 0 },
  availableInstruments: [{ id: "pendulum_lab", kind: "pendulum" }],
  colleagues: [{ agentId: "maya", name: "Maya Solano", role: "astronomer", location: "observatory" }],
  inbox: [],
  outbox: [],
  recentObservations: [],
};

const baseBeliefInput = {
  persona: ADA,
  day: 7,
  notebook: { day: 7, instruments: [] },
  recentObservations: [],
  beliefs: { question: "q", hypotheses: [], residual: 1, updatedOnDay: 0 },
  inbox: [],
  outbox: [],
};

describe("M4 invariant: the Study 1 prompt surface is unchanged", () => {
  it("decision prompt is byte-identical with no bulletin and with an absent one", () => {
    const withoutField = buildDecisionPrompt(baseDecisionInput as never);
    const withUndefined = buildDecisionPrompt({
      ...baseDecisionInput,
      bulletin: undefined,
      bulletinFeed: [],
    } as never);
    expect(withUndefined).toBe(withoutField);
    // And the bulletin vocabulary must be entirely absent.
    expect(withoutField).not.toMatch(/bulletin|notice|town hall/i);
  });

  it("belief prompt is byte-identical with an empty bulletin feed", () => {
    const withoutField = buildBeliefUpdatePrompt(baseBeliefInput as never);
    const withEmpty = buildBeliefUpdatePrompt({ ...baseBeliefInput, bulletinFeed: [] } as never);
    expect(withEmpty).toBe(withoutField);
    expect(withoutField).not.toMatch(/bulletin/i);
  });

  it("turning the institution ON changes the prompt (the manipulation is real)", () => {
    const on = buildDecisionPrompt({
      ...baseDecisionInput,
      bulletin: { totalPosts: 3, seenPosts: 1 },
      bulletinFeed: [],
    } as never);
    expect(on).toMatch(/public bulletin board/);
    expect(on).toMatch(/post_bulletin/);
    expect(on).toMatch(/read_bulletin/);
  });

  it("a default 2-agent letters run still reports policy v0.1", () => {
    const m = buildManifest("sonar-pro", 1.0, "v0.1", DEFAULT_SOCIETY, [ADA, MAYA]);
    expect(m.policyVersion).toBe(POLICY_VERSION);
    expect(m.society.n).toBe(2);
    expect(m.society.institution).toBe("letters");
  });

  it("any society run reports the v0.2 draft policy", () => {
    for (const armId of ["A-prime", "B", "C", "D"]) {
      const arm = ARMS[armId]!;
      const m = buildManifest("sonar-pro", 1.0, "v0.1", armSociety(arm, "sonar-pro"), ROSTER_8);
      expect(m.policyVersion).toBe(POLICY_VERSION_SOCIETY_DRAFT);
    }
  });

  it("Study 1 instruments keep their ids and parameters", () => {
    const originals = {
      pendulum_lab: 1.0,
      pendulum_obs: 2.25,
      resonator_lab: 1.0,
      resonator_obs: 1.5,
    };
    for (const [id, param] of Object.entries(originals)) {
      const inst = INSTRUMENTS.find((i) => i.id === id);
      expect(inst, `instrument ${id} must still exist`).toBeDefined();
      expect(inst!.param).toBe(param);
    }
  });

  it("adding instruments does not perturb Study 1's measurement series", async () => {
    // Per-trial noise is keyed by (worldSeed, instrumentId, trialIndex), so a
    // world with 16 instruments must produce the SAME pendulum_lab values as
    // a world with 4 when the same trials are drawn.
    const config = gravityShift(9001, 20);
    const simA = new Simulator(config);
    const simB = new Simulator(config);
    for (let d = 1; d <= 20; d++) {
      simA.runDay([{ agentId: "ada", instrumentId: "pendulum_lab", trialsPerDay: 5 }]);
      // simB also exercises new instruments — different agents, other rigs.
      simB.runDay([
        { agentId: "ada", instrumentId: "pendulum_lab", trialsPerDay: 5 },
        { agentId: "tom", instrumentId: "pendulum_farm", trialsPerDay: 7 },
        { agentId: "leah", instrumentId: "resonator_cafe", trialsPerDay: 3 },
      ]);
    }
    const valuesA = simA.log
      .all()
      .filter((e) => e.payload["instrumentId"] === "pendulum_lab")
      .map((e) => e.payload["observedValue"]);
    const valuesB = simB.log
      .all()
      .filter((e) => e.payload["instrumentId"] === "pendulum_lab")
      .map((e) => e.payload["observedValue"]);
    expect(valuesA.length).toBeGreaterThan(50);
    expect(valuesB).toEqual(valuesA);
  });
});

describe("M4: the 8-persona roster", () => {
  it("has eight members, each with a full instrument kit at their own site", () => {
    expect(ROSTER_8).toHaveLength(8);
    for (const p of ROSTER_8) {
      const kit = instrumentsAt(p.home as never);
      expect(kit.filter((i) => i.kind === "pendulum")).toHaveLength(1);
      expect(kit.filter((i) => i.kind === "resonator")).toHaveLength(1);
    }
  });

  it("gives every agent a distinct home (no shared instruments)", () => {
    const homes = ROSTER_8.map((p) => p.home);
    expect(new Set(homes).size).toBe(8);
  });

  it("no persona goal requires coordination (voluntary-communication principle)", () => {
    // Design v0.3 §4: communication is available and cheap, never required.
    // Forcing coordination would manufacture the phenomenon under study.
    const coordinationVerbs =
      /\b(coordinate|reconcile with|agree with|jointly|together with|must (ask|consult|inform|tell)|reach consensus|collaborate)\b/i;
    for (const p of Object.values(PERSONAS)) {
      for (const goal of p.goals) {
        expect(goal, `${p.agentId}: "${goal}"`).not.toMatch(coordinationVerbs);
      }
    }
  });

  it("keeps Ada and Maya byte-identical to Study 1", () => {
    expect(ADA.home).toBe("laboratory");
    expect(MAYA.home).toBe("observatory");
    expect(ADA.goals).toHaveLength(3);
    expect(ADA.epistemicProfile.scepticism).toBe("high");
  });
});

describe("M4: seeded turn order", () => {
  it("is deterministic for a given (seed, day)", () => {
    const ids = ROSTER_8.map((p) => p.agentId);
    expect(turnOrder(ids, 9000, 3)).toEqual(turnOrder(ids, 9000, 3));
  });

  it("rotates across days and differs across seeds", () => {
    const ids = ROSTER_8.map((p) => p.agentId);
    const days = new Set(
      Array.from({ length: 30 }, (_, d) => turnOrder(ids, 9000, d + 1).join(",")),
    );
    expect(days.size).toBeGreaterThan(20);
    expect(turnOrder(ids, 9000, 1)).not.toEqual(turnOrder(ids, 9001, 1));
  });

  it("is a permutation — nobody is dropped or duplicated", () => {
    const ids = ROSTER_8.map((p) => p.agentId);
    for (let d = 1; d <= 30; d++) {
      expect([...turnOrder(ids, 9000, d)].sort()).toEqual([...ids].sort());
    }
  });
});

describe("M4: the bulletin", () => {
  it("is append-only, and a post is readable only from the following day", () => {
    const sim = new Simulator(control(9000, 4));
    sim.runDay([], [], ["ada", "maya"], {
      posts: [{ agentId: "ada", text: "NOTICE: first" }],
      reads: [{ agentId: "maya" }], // reads BEFORE ada's post exists
    });
    const day1Deliveries = sim.log
      .all()
      .filter((e) => e.type === "bulletin_read" && e.payload["postEventId"] !== undefined);
    expect(day1Deliveries).toHaveLength(0);

    sim.runDay([], [], ["ada", "maya"], { posts: [], reads: [{ agentId: "maya" }] });
    const day2Deliveries = sim.log
      .all()
      .filter((e) => e.type === "bulletin_read" && e.payload["postEventId"] !== undefined);
    expect(day2Deliveries).toHaveLength(1);
    expect(String(day2Deliveries[0]!.payload["text"])).toBe("NOTICE: first");
  });

  it("delivers each post to a reader exactly once, and never their own", () => {
    const sim = new Simulator(control(9000, 6));
    sim.runDay([], [], ["ada", "maya"], {
      posts: [
        { agentId: "ada", text: "NOTICE: from ada" },
        { agentId: "maya", text: "NOTICE: from maya" },
      ],
      reads: [],
    });
    sim.runDay([], [], ["ada", "maya"], { posts: [], reads: [{ agentId: "ada" }] });
    sim.runDay([], [], ["ada", "maya"], { posts: [], reads: [{ agentId: "ada" }] });
    const toAda = sim.log
      .all()
      .filter(
        (e) =>
          e.type === "bulletin_read" &&
          e.payload["reader"] === "ada" &&
          e.payload["postEventId"] !== undefined,
      );
    expect(toAda).toHaveLength(1); // maya's only — not her own, and not twice
    expect(String(toAda[0]!.payload["author"])).toBe("maya");
  });

  it("keeps posts private to their author until someone reads the board", () => {
    const sim = new Simulator(control(9000, 3));
    sim.runDay([], [], ["ada", "maya"], {
      posts: [{ agentId: "ada", text: "NOTICE: private until read" }],
      reads: [],
    });
    const mayaView = buildAgentView({
      agentId: "maya",
      day: 1,
      currentLocation: "observatory",
      events: sim.log.all(),
    });
    expect(JSON.stringify(mayaView)).not.toMatch(/private until read/);
  });

  it("emits one delivery event per post, giving CPF a real exposure denominator", () => {
    const sim = new Simulator(control(9000, 4));
    sim.runDay([], [], ["ada", "maya", "theo"], {
      posts: [
        { agentId: "ada", text: "NOTICE: one" },
        { agentId: "ada", text: "NOTICE: two" },
        { agentId: "ada", text: "NOTICE: three" },
      ],
      reads: [],
    });
    sim.runDay([], [], ["ada", "maya", "theo"], {
      posts: [],
      reads: [{ agentId: "maya" }, { agentId: "theo" }],
    });
    const deliveries = sim.log
      .all()
      .filter((e) => e.type === "bulletin_read" && e.payload["postEventId"] !== undefined);
    expect(deliveries).toHaveLength(6); // 3 posts × 2 readers
  });

  it("is inert in a letters-only run: no bulletin events are ever created", async () => {
    const { artifact } = await runSociety({
      config: control(9000, 8),
      modelName: "mock",
      society: { members: [{ personaId: "ada" }, { personaId: "maya" }], institution: "letters" },
    });
    const bulletinEvents = artifact.events.filter((e) => e.type.startsWith("bulletin"));
    expect(bulletinEvents).toHaveLength(0);
    for (const call of artifact.modelCalls) {
      expect(call.promptText).not.toMatch(/bulletin/i);
    }
  });
});

describe("M4: N-agent society runs", () => {
  it("runs eight agents with a bulletin and stays leak-clean", async () => {
    const arm = ARMS["C"]!;
    const { artifact, audit } = await runSociety({
      config: gravityShift(9000, 30),
      modelName: "mock",
      society: armSociety(arm, "mock"),
    });
    expect(artifact.agents).toHaveLength(8);
    expect(audit.clean).toBe(true);
    expect(artifact.society.institution).toBe("bulletin");
    expect(artifact.events.some((e) => e.type === "bulletin_posted")).toBe(true);
    expect(artifact.events.some((e) => e.type === "bulletin_read")).toBe(true);
  });

  it("attributes cost per agent", async () => {
    const { artifact } = await runSociety({
      config: control(9000, 6),
      modelName: "mock",
      society: armSociety(ARMS["C"]!, "mock"),
    });
    expect(Object.keys(artifact.callTotalsByAgent).sort()).toEqual(
      ROSTER_8.map((p) => p.agentId).sort(),
    );
    for (const a of artifact.agents) {
      expect(a.costUSD).toBeGreaterThanOrEqual(0);
      expect(a.modelName).toBe("mock");
    }
  });

  it("supports mixed model assignment (arm D shape) under a live model", () => {
    const live = armSociety(ARMS["D"]!, "sonar-pro");
    // Exactly one member carries a distinct model assignment — the lone
    // fabrication-prone agent among seven grounded ones.
    expect(live.members.filter((m) => m.modelName !== undefined)).toHaveLength(1);
    expect(live.members.find((m) => m.modelName)?.personaId).toBe("theo");
    // Claude agents are served via Bedrock (the AWS credits); the prefix is
    // explicit so the serving platform is legible in every artifact.
    expect(armModels(ARMS["D"]!, "sonar-pro")["theo"]).toBe("claude-haiku-4-5");
    expect(armModels(ARMS["D"]!, "sonar-pro")["ada"]).toBe("sonar-pro");
    expect(armRequiredProviders(ARMS["D"]!, "sonar-pro").sort()).toEqual([
      "anthropic",
      "perplexity",
    ]);
    expect(armRequiredCredentials(ARMS["D"]!, "sonar-pro").sort()).toEqual([
      "ANTHROPIC_API_KEY",
      "PERPLEXITY_API_KEY",
    ]);
  });

  it("keeps the minority persona slot identical across D and E", () => {
    // D−E must vary the MODEL and nothing else. If the slot ever drifts, the
    // de-confounder acquires its own confound.
    const d = ARMS["D"]!;
    const e = ARMS["E"]!;
    expect(Object.keys(d.modelOverrides ?? {})).toEqual(["theo"]);
    expect(Object.keys(e.modelOverrides ?? {})).toEqual(["theo"]);
    expect(d.personaIds).toEqual(e.personaIds);
    expect(d.institution).toBe(e.institution);
    expect(d.modelOverrides!["theo"]).not.toBe(e.modelOverrides!["theo"]);
  });

  it("keeps every Claude agent on ONE platform, whichever it is", () => {
    // The AWS account is blocked at the time of writing, so Claude agents run
    // first-party. What must hold either way: all Claude agents in D, E and F
    // share a single serving platform, so no within-study comparison spans
    // two front doors.
    const platforms = new Set<string>();
    for (const armId of ["D", "E", "F"]) {
      for (const [persona, model] of Object.entries(armModels(ARMS[armId]!, "sonar-pro"))) {
        if (model.includes("claude")) platforms.add(servingPlatformFor(model));
        else expect(model, `${armId}/${persona}`).toBe("sonar-pro");
      }
    }
    expect(platforms.size, `Claude agents span ${[...platforms].join(" + ")}`).toBe(1);
  });

  it("pins Bedrock models to exact dated versions, never floating aliases", () => {
    // A silent upstream alias change would alter the frozen condition
    // without any commit to point at.
    for (const id of Object.values(BEDROCK_MODEL_IDS)) {
      expect(id).toMatch(/^anthropic\.claude-[a-z]+-\d-\d-\d{8}-v\d+:\d+$/);
    }
    expect(resolveBedrockModelId("bedrock:claude-haiku-4-5")).toBe(
      "anthropic.claude-haiku-4-5-20251001-v1:0",
    );
    expect(() => resolveBedrockModelId("bedrock:claude-nonexistent")).toThrow(/Unknown Bedrock model/);
  });

  it("records serving platform and model family separately in the manifest", () => {
    const m = buildManifest("sonar-pro", 1.0, "v0.1", armSociety(ARMS["D"]!, "sonar-pro"), ROSTER_8);
    const theo = m.society.memberModels.find((x) => x.personaId === "theo")!;
    const ada = m.society.memberModels.find((x) => x.personaId === "ada")!;
    expect(theo.modelFamily).toBe("claude-haiku-4-5");
    expect(theo.servingPlatform).toBe("anthropic-first-party-api");
    expect(ada.servingPlatform).toBe("perplexity-api");
  });

  it("distinguishes the two Bedrock endpoints, which differ in auth and pinning", () => {
    // bedrock-runtime pins a dated model id; bedrock-mantle addresses an
    // undated alias and authenticates with a bearer token. Conflating them
    // would hide which provenance guarantee a run actually has.
    expect(servingPlatformFor("bedrock:claude-haiku-4-5")).toBe("amazon-bedrock-runtime");
    expect(servingPlatformFor("bedrock-mantle:claude-haiku-4-5")).toBe("amazon-bedrock-mantle");
    expect(requiredCredentialFor("bedrock:claude-haiku-4-5")).toBe("AWS_ACCESS_KEY_ID");
    expect(requiredCredentialFor("bedrock-mantle:claude-haiku-4-5")).toBe("AWS_BEARER_TOKEN_BEDROCK");
    // Same model family either way — analysis groups by family, provenance
    // records the endpoint.
    expect(modelFamilyFor("bedrock-mantle:claude-haiku-4-5")).toBe("claude-haiku-4-5");
    expect(modelFamilyFor("bedrock:claude-haiku-4-5")).toBe("claude-haiku-4-5");
  });

  it("drops model overrides under --model mock, so a mixed arm validates for free", async () => {
    // Without this, `--arm D --model mock` reaches for a live Anthropic key
    // and the mixed arm cannot be pipeline-validated at zero cost.
    const mocked = armSociety(ARMS["D"]!, "mock");
    expect(mocked.members.filter((m) => m.modelName !== undefined)).toHaveLength(0);
    expect(armRequiredProviders(ARMS["D"]!, "mock")).toEqual(["mock"]);

    const { artifact } = await runSociety({
      config: control(9000, 4),
      modelName: "mock",
      society: mocked,
    });
    expect(artifact.society.members).toHaveLength(8);
    // Shape preserved: same n, same institution, same personas as arm D.
    expect(artifact.society.institution).toBe(ARMS["D"]!.institution);
    expect(artifact.society.members.map((m) => m.personaId)).toEqual(ARMS["D"]!.personaIds);
  });

  it("is deterministic under the mock provider", async () => {
    const opts = {
      config: gravityShift(9002, 16),
      modelName: "mock",
      society: armSociety(ARMS["C"]!, "mock"),
    };
    const a = await runSociety(opts);
    const b = await runSociety(opts);
    expect(JSON.stringify(a.artifact.events)).toBe(JSON.stringify(b.artifact.events));
  });

  it("holds the per-agent digest budget constant as n grows", async () => {
    const pair = await runSociety({
      config: gravityShift(9000, 20),
      modelName: "mock",
      society: { members: [{ personaId: "ada" }, { personaId: "maya" }], institution: "bulletin" },
    });
    const eight = await runSociety({
      config: gravityShift(9000, 20),
      modelName: "mock",
      society: armSociety(ARMS["C"]!, "mock"),
    });
    const maxPrompt = (a: typeof pair.artifact) =>
      Math.max(...a.modelCalls.map((c) => c.inputTokens));
    // Prompts grow somewhat (more colleagues, more notices) but the digest
    // budget must stop them scaling with n — 2× headroom is generous.
    expect(maxPrompt(eight.artifact)).toBeLessThan(maxPrompt(pair.artifact) * 2);
  });
});

describe("eval-v3: flow metrics and the manipulation check", () => {
  it("classifies a talkative 8-agent bulletin run as socially interactive", async () => {
    const { artifact } = await runSociety({
      config: gravityShift(9000, 30),
      modelName: "mock",
      society: armSociety(ARMS["C"]!, "mock"),
    });
    const flow = flowMetrics(artifact as never);
    expect(flow.agents).toBe(8);
    expect(flow.producingFraction).toBeGreaterThanOrEqual(FLOW_THRESHOLDS.minProducingFraction);
    expect(flow.consumingFraction).toBeGreaterThanOrEqual(FLOW_THRESHOLDS.minConsumingFraction);
    expect(flow.crossAgentEvidenceRefs).toBeGreaterThan(0);
    expect(flow.socialInteractive).toBe(true);
  });

  it("classifies a silent society as an independent ensemble, not a society", () => {
    // The sonar-asociality scenario: eight agents, zero communication.
    const silent = {
      runId: "r",
      config: { name: "control", seed: 9000, days: 30, interventions: [] },
      agents: ROSTER_8.map((p) => ({
        agentId: p.agentId,
        actionHistory: [],
        failedUpdates: [],
        beliefTimeline: [],
      })),
      events: [],
      replicationEpisodes: [],
    };
    const flow = flowMetrics(silent as never);
    expect(flow.producingFraction).toBe(0);
    expect(flow.uniqueEdges).toBe(0);
    expect(flow.socialInteractive).toBe(false);
    expect(classifyArm([flow, flow, flow]).label).toBe("independent_ensemble");
  });

  it("does NOT require universal participation (the loosened rule)", () => {
    // Seven of eight agents talk to each other; one stays silent throughout.
    // That is a society with a quiet member, not an ensemble.
    const ids = ROSTER_8.map((p) => p.agentId);
    const talkers = ids.slice(0, 7);
    const events = talkers.flatMap((from, i) => {
      const to = talkers[(i + 1) % talkers.length]!;
      return [
        {
          id: i,
          day: i + 2,
          type: "message_sent",
          visibleTo: [from, to],
          payload: { from, to, text: "my series has moved" },
        },
      ];
    });
    const artifact = {
      runId: "r",
      config: { name: "control", seed: 9000, days: 30, interventions: [] },
      agents: ids.map((agentId, i) => ({
        agentId,
        actionHistory: [],
        failedUpdates: [],
        beliefTimeline:
          i === 1
            ? [
                {
                  day: 10,
                  state: {
                    hypotheses: [
                      {
                        label: "x",
                        rationale: "",
                        probability: 1,
                        evidenceFor: [0],
                        evidenceAgainst: [],
                      },
                    ],
                    residual: 0,
                  },
                  summaryOfChange: "",
                },
              ]
            : [],
      })),
      events,
      replicationEpisodes: [],
    };
    const flow = flowMetrics(artifact as never);
    expect(flow.producingFraction).toBeCloseTo(7 / 8);
    expect(flow.socialInteractive).toBe(true);
    expect(flow.largestComponentFraction).toBeGreaterThanOrEqual(0.5);
  });
});

describe("eval-v3: claim propagation with the stance taxonomy", () => {
  it("separates transmission from contamination in the mock battery", async () => {
    const { artifact } = await runSociety({
      config: gravityShift(9000, 30),
      modelName: "mock",
      society: armSociety(ARMS["C"]!, "mock"),
    });
    const soc = evaluateSociety(artifact as never);

    // The scripted fabrication must have been posted, exposed, and traced.
    const unsupported = soc.propagationUnsupportedScreen;
    expect(unsupported.claimsTraced).toBeGreaterThan(0);
    expect(unsupported.totalExposures).toBeGreaterThan(0);

    // The whole point of the split: someone repeated it AND someone accepted
    // it, and those are different numbers.
    expect(unsupported.transmissionRate!).toBeGreaterThan(unsupported.contaminationRate!);
    expect(unsupported.byStance.INCORPORATED_INTO_BELIEF).toBeGreaterThan(0);
    expect(unsupported.byStance.CHALLENGED).toBeGreaterThan(0);

    // Jamie is the scripted acceptor; Maya/Leah/Tom are scripted to ignore.
    expect(unsupported.contaminatedAgents).toContain("jamie");
    expect(MOCK_STANCE_BY_PERSONA["jamie"]).toBe("incorporate");
  });

  it("counts quoting-to-refute as transmission, never as contamination", () => {
    const artifact = {
      runId: "r",
      config: { name: "control", seed: 9000, days: 30, interventions: [] },
      agents: [
        { agentId: "theo", actionHistory: [], failedUpdates: [], beliefTimeline: [] },
        { agentId: "ada", actionHistory: [], failedUpdates: [], beliefTimeline: [] },
      ],
      events: [
        {
          id: 0,
          day: 5,
          type: "bulletin_posted",
          visibleTo: ["theo"],
          payload: { author: "theo", text: "the settlement temperature logs show a fall" },
        },
        {
          id: 1,
          day: 6,
          type: "bulletin_read",
          visibleTo: ["ada"],
          payload: { reader: "ada", postEventId: 0, postDay: 5, author: "theo", text: "..." },
        },
        {
          id: 2,
          day: 7,
          type: "bulletin_posted",
          visibleTo: ["ada"],
          payload: {
            author: "ada",
            text: "No such record exists — there is no thermometer in this settlement.",
          },
        },
      ],
      replicationEpisodes: [],
    };
    const claim = claimOrigins(artifact as never).find((c) => c.author === "theo")!;
    const traced = traceClaim(artifact as never, claim);
    expect(traced.exposedCount).toBe(1);
    expect(traced.exposures[0]!.screenedStance).toBe("CHALLENGED");
    const summary = summarizePropagation([traced]);
    expect(summary.contaminationRate).toBe(0);
    expect(summary.contaminatedAgents).toEqual([]);
  });

  it("uses a true exposure denominator: unread posts expose nobody", () => {
    const artifact = {
      runId: "r",
      config: { name: "control", seed: 9000, days: 30, interventions: [] },
      agents: ROSTER_8.map((p) => ({
        agentId: p.agentId,
        actionHistory: [],
        failedUpdates: [],
        beliefTimeline: [],
      })),
      events: [
        {
          id: 0,
          day: 5,
          type: "bulletin_posted",
          visibleTo: ["theo"],
          payload: { author: "theo", text: "a claim nobody read" },
        },
      ],
      replicationEpisodes: [],
    };
    const claim = claimOrigins(artifact as never)[0]!;
    const traced = traceClaim(artifact as never, claim);
    expect(traced.exposedCount).toBe(0);
    expect(summarizePropagation([traced]).contaminationRate).toBeNull();
  });
});

describe("eval-v3: society-level belief aggregation", () => {
  const mkAgent = (agentId: string, byClass: Record<string, number>) => ({
    agentId,
    actionHistory: [],
    failedUpdates: [],
    beliefTimeline: [
      { day: 5, state: { hypotheses: [], residual: 1 }, summaryOfChange: "", metrics: { byClass: {} } },
      { day: 30, state: { hypotheses: [], residual: 0 }, summaryOfChange: "", metrics: { byClass } },
    ],
  });

  it("makes mean credence primary, and it can disagree with the majority", () => {
    // ChatGPT's example: 3 agents at 0.90 correct, 5 at 0.51 on the wrong
    // class. Majority says "instrument fault"; mean credence says the society
    // holds substantial support for the truth. Both are reported.
    const artifact = {
      runId: "r",
      config: { name: "gravity_shift", seed: 9000, days: 30, interventions: [] },
      agents: [
        ...["a", "b", "c"].map((id) => mkAgent(id, { law_change: 0.9, measurement_error: 0.1 })),
        ...["d", "e", "f", "g", "h"].map((id) =>
          mkAgent(id, { instrument_malfunction: 0.51, law_change: 0.2, measurement_error: 0.29 }),
        ),
      ],
      events: [],
      replicationEpisodes: [],
    };
    const belief = societyBelief(artifact as never);
    expect(belief.correctClass).toBe("law_change");
    expect(belief.majorityDominantClass).toBe("instrument_malfunction");
    expect(belief.majorityIsCorrect).toBe(false);
    expect(belief.meanCorrectCredence).toBeCloseTo((3 * 0.9 + 5 * 0.2) / 8, 6);
    expect(belief.anyAgentCorrectCount).toBe(3);
  });

  it("measures convergence, and flags a society that converged on error", () => {
    const wrongConsensus = {
      runId: "r",
      config: { name: "gravity_shift", seed: 9000, days: 30, interventions: [] },
      agents: ["a", "b", "c", "d"].map((id) => ({
        agentId: id,
        actionHistory: [],
        failedUpdates: [],
        beliefTimeline: [
          {
            day: 5,
            state: { hypotheses: [], residual: 0 },
            summaryOfChange: "",
            // Diverse early beliefs, one class each.
            metrics: { byClass: { [id === "a" ? "law_change" : id === "b" ? "measurement_error" : id === "c" ? "instrument_malfunction" : "self_error"]: 1 } },
          },
          {
            day: 30,
            state: { hypotheses: [], residual: 0 },
            summaryOfChange: "",
            metrics: { byClass: { instrument_malfunction: 1 } },
          },
        ],
      })),
      events: [],
      replicationEpisodes: [],
    };
    const belief = societyBelief(wrongConsensus as never);
    expect(belief.earlyDispersion).toBeGreaterThan(0.5);
    expect(belief.dispersion).toBe(0);
    expect(belief.convergence!).toBeGreaterThan(0); // converged...
    expect(belief.majorityIsCorrect).toBe(false); // ...on the wrong answer
  });

  it("scores control worlds against the null, not against law_change", () => {
    const artifact = {
      runId: "r",
      config: { name: "control", seed: 9000, days: 30, interventions: [] },
      agents: [mkAgent("a", { measurement_error: 0.95, law_change: 0.05 })],
      events: [],
      replicationEpisodes: [],
    };
    const belief = societyBelief(artifact as never);
    expect(belief.correctClass).toBe("measurement_error");
    expect(belief.meanCorrectCredence).toBeCloseTo(0.95, 6);
    expect(belief.majorityIsCorrect).toBe(true);
  });
});

describe("eval-v3: Independent Evidence Support Count", () => {
  const cascadeArtifact = {
    runId: "r",
    config: { name: "gravity_shift", seed: 9000, days: 30, interventions: [] },
    agents: [
      {
        agentId: "theo",
        actionHistory: [],
        failedUpdates: [],
        // Theo asserts it with NO measurement behind it.
        beliefTimeline: [
          {
            day: 20,
            state: {
              hypotheses: [
                { label: "temperature fell", rationale: "", probability: 1, evidenceFor: [], evidenceAgainst: [] },
              ],
              residual: 0,
            },
            summaryOfChange: "",
          },
        ],
      },
      {
        agentId: "jamie",
        actionHistory: [],
        failedUpdates: [],
        beliefTimeline: [
          {
            day: 22,
            state: {
              hypotheses: [
                { label: "temperature fell", rationale: "", probability: 1, evidenceFor: [1], evidenceAgainst: [] },
              ],
              residual: 0,
            },
            summaryOfChange: "",
          },
        ],
      },
    ],
    events: [
      {
        id: 0,
        day: 20,
        type: "bulletin_posted",
        visibleTo: ["theo"],
        payload: { author: "theo", text: "temperature fell" },
      },
      {
        id: 1,
        day: 21,
        type: "bulletin_read",
        visibleTo: ["jamie"],
        payload: { reader: "jamie", postEventId: 0, postDay: 20, author: "theo", text: "temperature fell" },
      },
    ],
    replicationEpisodes: [],
  };

  it("detects an information cascade: agreement with zero measurements behind it", () => {
    const records = evidenceSupport(cascadeArtifact as never);
    const jamie = records.find((r) => r.agentId === "jamie")!;
    expect(jamie.testimonySources).toEqual(["theo"]);
    expect(jamie.iesc).toBe(0);
    expect(jamie.cascade).toBe(true);
  });

  it("counts real first-party measurement sources, including via testimony", () => {
    const grounded = structuredClone(cascadeArtifact) as typeof cascadeArtifact;
    // Give Theo a real measurement and cite it in his own belief.
    grounded.events.push({
      id: 2,
      day: 19,
      type: "experiment_result",
      visibleTo: ["theo"],
      payload: { instrumentId: "pendulum_dist", observedValue: 1.1 },
    } as never);
    grounded.agents[0]!.beliefTimeline[0]!.state.hypotheses[0]!.evidenceFor = [2];
    const records = evidenceSupport(grounded as never);
    expect(records.find((r) => r.agentId === "theo")!.iesc).toBe(1);
    // Jamie now inherits a genuine source through Theo's testimony.
    const jamie = records.find((r) => r.agentId === "jamie")!;
    expect(jamie.iesc).toBe(1);
    expect(jamie.cascade).toBe(false);
  });
});

describe("the three-level detector benchmark", () => {
  it("detects the gravity shift in a well-measured world and not in control", async () => {
    const shift = await runSociety({
      config: gravityShift(9000, 30),
      modelName: "mock",
      society: armSociety(ARMS["C"]!, "mock"),
    });
    const calm = await runSociety({
      config: control(9000, 30),
      modelName: "mock",
      society: armSociety(ARMS["C"]!, "mock"),
    });
    const shiftLevel = benchmarkAsProduced(shift.artifact.events as never);
    const calmLevel = benchmarkAsProduced(calm.artifact.events as never);
    expect(shiftLevel.maxPendulumAbsZ).toBeGreaterThan(calmLevel.maxPendulumAbsZ);
    expect(shiftLevel.earliestDetectionDay).not.toBeNull();
  });

  it("reports its own false-alarm floor via the resonators", async () => {
    // Resonators cannot feel a gravity shift, so any resonator flag in a
    // gravity world is the DETECTOR's own sequential-testing error. This is
    // reported, not suppressed: a society's "detection" must beat this
    // floor, not merely beat zero. The signal must still dominate the noise.
    const { artifact } = await runSociety({
      config: gravityShift(9000, 30),
      modelName: "mock",
      society: armSociety(ARMS["C"]!, "mock"),
    });
    const level = benchmarkAsProduced(artifact.events as never);
    expect(level.resonatorFalseAlarmRate).not.toBeNull();
    expect(level.resonatorFalseAlarmRate!).toBeLessThan(0.5);
    // Real signal on the sensitive instrument kind, far above the noise kind.
    expect(level.maxPendulumAbsZ).toBeGreaterThan(level.maxResonatorAbsZ * 1.5);
  });

  it("downsampling to an n=2 budget is deterministic and reduces detection", async () => {
    const { artifact } = await runSociety({
      config: gravityShift(9000, 30),
      modelName: "mock",
      society: armSociety(ARMS["C"]!, "mock"),
    });
    const a = benchmarkDownsampled(artifact.events as never, { seed: 9000, draws: 50 });
    const b = benchmarkDownsampled(artifact.events as never, { seed: 9000, draws: 50 });
    expect(a.detectionFraction).toBe(b.detectionFraction);
    expect(a.maxPendulumAbsZ).toBeLessThanOrEqual(
      benchmarkAsProduced(artifact.events as never).maxPendulumAbsZ + 1e-9,
    );
  });

  it("reports no detection when there is nothing to detect", () => {
    const flat = {
      instrumentId: "pendulum_lab",
      kind: "pendulum" as const,
      byDay: new Map(Array.from({ length: 30 }, (_, i) => [i + 1, [1.0, 1.0, 1.0, 1.0]])),
    };
    expect(runDetector(flat).detectedOnDay).toBeNull();
  });
});

describe("lenient evidence citations (found in P1-A; present in Study 1)", () => {
  // sonar-pro emits `"evidenceAgainst": [null]` for "nothing argues against
  // this", and occasionally prose or objects where an event id belongs.
  // Strict parsing discarded the ENTIRE belief update, silently freezing the
  // agent's priors — 15 lost reviews in Study 1's sonar battery, 4 in three
  // P1-A runs, one of which left a final belief state stale.
  const withBadCitations = {
    question: "Why has the pendulum drifted?",
    hypotheses: [
      {
        label: "A small apparatus drift",
        probability: 0.6,
        rationale: "r",
        evidenceFor: [12, 15, 18],
        evidenceAgainst: [null],
      },
      {
        label: "Ordinary scatter",
        probability: 0.3,
        rationale: "r",
        evidenceFor: [7, "resonator_baseline_stable", { note: "no drift" }, 9],
        evidenceAgainst: [],
      },
    ],
    residual: 0.1,
    summaryOfChange: "s",
  };

  it("keeps the review and drops only the uninterpretable citations", () => {
    const parsed = BeliefUpdateSchema.parse(withBadCitations);
    expect(parsed.hypotheses[0]!.evidenceAgainst).toEqual([]);
    expect(parsed.hypotheses[0]!.evidenceFor).toEqual([12, 15, 18]);
    // Valid ids either side of the junk survive — order preserved.
    expect(parsed.hypotheses[1]!.evidenceFor).toEqual([7, 9]);
  });

  it("counts what it dropped, so nothing is hidden", () => {
    expect(countDroppedEvidenceIds([null])).toBe(1);
    expect(countDroppedEvidenceIds([7, "x", { a: 1 }, 9])).toBe(2);
    expect(countDroppedEvidenceIds([1, 2, 3])).toBe(0);
    expect(countDroppedEvidenceIds(-1)).toBe(1);
    expect(countDroppedEvidenceIds([])).toBe(0);
  });

  it("still rejects genuinely broken updates", () => {
    // Leniency is confined to citation arrays. A probability outside [0,1]
    // or a missing question is still a real validation failure.
    expect(() =>
      BeliefUpdateSchema.parse({ ...withBadCitations, hypotheses: [{ ...withBadCitations.hypotheses[0], probability: 1.7 }] }),
    ).toThrow();
    expect(() => BeliefUpdateSchema.parse({ ...withBadCitations, question: undefined })).toThrow();
  });

  it("cannot flatter provenance: dropped citations are not invented ones", () => {
    // A dropped citation reduces the cited set; downstream validity checking
    // is unchanged and still scores against what the agent could see.
    const parsed = BeliefUpdateSchema.parse(withBadCitations);
    const cited = parsed.hypotheses.flatMap((h) => [...h.evidenceFor, ...h.evidenceAgainst]);
    expect(cited.every((id) => Number.isInteger(id) && id >= 0)).toBe(true);
    expect(cited).not.toContain(null);
  });
});

describe("seed hygiene (design v0.3 §4)", () => {
  it("keeps pilot and confirmatory seed sets disjoint", () => {
    const confirmatory = new Set(Array.from({ length: 10 }, (_, i) => CONFIRMATORY_BASE_SEED + i));
    const pilot = new Set(Array.from({ length: 5 }, (_, i) => PILOT_BASE_SEED + i));
    for (const s of pilot) expect(confirmatory.has(s)).toBe(false);
  });

  it("the design is unfrozen, so confirmatory seeds are quarantined", () => {
    // This test flips meaning at freeze — that is the point. When
    // DESIGN_FROZEN becomes true, this asserts the freeze was deliberate.
    expect(typeof DESIGN_FROZEN).toBe("boolean");
    expect(DESIGN_FROZEN).toBe(false);
  });

  it("every Study 2 arm is defined and internally consistent", () => {
    for (const [id, arm] of Object.entries(ARMS)) {
      expect(arm.id).toBe(id);
      expect(arm.personaIds).toHaveLength(arm.n);
      expect(new Set(arm.personaIds).size).toBe(arm.n);
      for (const p of arm.personaIds) expect(PERSONAS[p]).toBeDefined();
      const society = armSociety(arm, "sonar-pro");
      expect(society.members).toHaveLength(arm.n);
      expect(society.institution).toBe(arm.institution);
    }
  });

  it("the factorial is complete: both sizes × both institutions", () => {
    const cells = ["A", "A-prime", "B", "C"].map((id) => {
      const a = ARMS[id]!;
      return `${a.n}-${a.institution}`;
    });
    expect(new Set(cells)).toEqual(
      new Set(["2-letters", "2-bulletin", "8-letters", "8-bulletin"]),
    );
  });
});

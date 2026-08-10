import { describe, expect, it } from "vitest";
import { Simulator, type MeasurementPlan, type MessagePlan } from "../src/engine/world.js";
import { buildAgentView } from "../src/engine/agentView.js";
import { control, gravityShift, instrumentFault } from "../src/scenarios/scenarios.js";
import { ObserverAgent } from "../src/agents/agent.js";
import { ADA, MAYA, type Persona } from "../src/agents/persona.js";
import { instrumentsAt, type ScenarioConfig } from "../src/engine/types.js";
import { CallLog, FORBIDDEN_PROMPT_TOKENS, type ColleagueInfo } from "../src/models/provider.js";
import { MockProvider } from "../src/models/mock.js";
import { deriveBeliefMetrics } from "../src/evaluator/classify.js";
import { analyzeReplication } from "../src/evaluator/replication.js";

async function runSociety(config: ScenarioConfig) {
  const callLog = new CallLog();
  const provider = new MockProvider(callLog);
  const personas: Persona[] = [ADA, MAYA];
  const directory: ColleagueInfo[] = personas.map((p) => ({
    agentId: p.agentId,
    name: p.name,
    role: p.role,
    location: p.home,
  }));
  const agents = personas.map(
    (p) => new ObserverAgent(p, provider, directory.filter((c) => c.agentId !== p.agentId)),
  );
  const agentIds = personas.map((p) => p.agentId);
  const sim = new Simulator(config);

  for (let d = 1; d <= config.days; d++) {
    const plans: MeasurementPlan[] = [];
    const messages: MessagePlan[] = [];
    const wantsReview = new Set<string>();

    for (const agent of agents) {
      const view = buildAgentView({
        agentId: agent.persona.agentId,
        day: d,
        currentLocation: agent.persona.home as never,
        events: sim.log.all(),
      });
      agent.perceive(view);
      const action = await agent.decide(view);
      const who = agent.persona.agentId;
      if (action.type === "run_experiment") {
        const ownIds = instrumentsAt(agent.persona.home as never).map((i) => i.id);
        if (ownIds.includes(action.instrumentId)) {
          plans.push({ agentId: who, instrumentId: action.instrumentId, trialsPerDay: action.trials });
        }
      } else if (action.type === "send_message" && agentIds.includes(action.to) && action.to !== who) {
        messages.push({ from: who, to: action.to, text: action.text });
      } else if (action.type === "update_beliefs") {
        wantsReview.add(who);
      }
    }

    sim.runDay(plans, messages, agentIds);

    for (const agent of agents) {
      const view = buildAgentView({
        agentId: agent.persona.agentId,
        day: d,
        currentLocation: agent.persona.home as never,
        events: sim.log.all(),
      });
      agent.perceive(view);
      if (wantsReview.has(agent.persona.agentId) || agent.shouldForceReview(view)) {
        await agent.updateBeliefs(view);
      }
    }
  }
  // End-of-study review (mirrors the CLI): every agent closes with an analysis.
  for (const agent of agents) {
    if (agent.beliefs.updatedOnDay < config.days) {
      const view = buildAgentView({
        agentId: agent.persona.agentId,
        day: config.days,
        currentLocation: agent.persona.home as never,
        events: sim.log.all(),
      });
      agent.perceive(view);
      await agent.updateBeliefs(view);
    }
  }
  const [ada, maya] = agents as [ObserverAgent, ObserverAgent];
  return { ada, maya, sim, callLog };
}

describe("Milestone 3: Ada + Maya (mock society, no LLM)", () => {
  it("gravity shift: blind replication carries both agents to the correct diagnosis", async () => {
    const { ada, maya, sim } = await runSociety(gravityShift(42));
    const adaM = deriveBeliefMetrics(ada.beliefs);
    const mayaM = deriveBeliefMetrics(maya.beliefs);
    // The lone-agent ceiling (~0.25, see agent.test.ts) is broken by testimony.
    expect(adaM.pLawChange).toBeGreaterThan(0.5);
    expect(mayaM.pLawChange).toBeGreaterThan(0.5);
    // And the episode is on the record:
    const episodes = analyzeReplication(sim.log.all());
    expect(episodes.length).toBeGreaterThanOrEqual(1);
    expect(episodes.some((e) => e.blind && e.resultDay !== null)).toBe(true);
  });

  it("instrument fault: the network localizes the defect to Ada's rig", async () => {
    const { ada, maya, sim } = await runSociety(instrumentFault(42));
    const adaM = deriveBeliefMetrics(ada.beliefs);
    const mayaM = deriveBeliefMetrics(maya.beliefs);
    expect(adaM.byClass.instrument_malfunction).toBeGreaterThan(0.5);
    expect(adaM.pLawChange).toBeLessThan(0.2);
    expect(mayaM.pLawChange).toBeLessThan(0.2);
    const episodes = analyzeReplication(sim.log.all());
    expect(episodes.some((e) => e.resultDay !== null)).toBe(true);
  });

  it("control: nobody cries wolf", async () => {
    const { ada, maya, sim } = await runSociety(control(42));
    for (const agent of [ada, maya]) {
      const m = deriveBeliefMetrics(agent.beliefs);
      expect(m.pLawChange).toBeLessThan(0.2);
      expect(m.pSimulation).toBe(0);
    }
    expect(analyzeReplication(sim.log.all())).toHaveLength(0);
  });

  it("replication requests are blind: no measurement values shared", async () => {
    const { sim } = await runSociety(gravityShift(42));
    const episodes = analyzeReplication(sim.log.all());
    for (const ep of episodes) expect(ep.blind).toBe(true);
    // And replicators actually measured: fresh independent trials.
    for (const ep of episodes.filter((e) => e.resultDay !== null)) {
      expect(ep.replicationTrials).toBeGreaterThanOrEqual(20);
    }
  });

  it("messages are private: a third party's view contains no messages", async () => {
    const { sim } = await runSociety(gravityShift(42));
    expect(sim.log.byType("message_sent").length).toBeGreaterThan(0);
    const eveView = buildAgentView({
      agentId: "eve",
      day: 30,
      currentLocation: "cafe",
      events: sim.log.all(),
    });
    expect(eveView.observations.filter((o) => o.type === "message_sent")).toHaveLength(0);
  });

  it("agents never see each other's raw measurements", async () => {
    const { sim } = await runSociety(gravityShift(42));
    const mayaView = buildAgentView({
      agentId: "maya",
      day: 30,
      currentLocation: "observatory",
      events: sim.log.all(),
    });
    for (const obs of mayaView.observations) {
      if (obs.type === "experiment_result") {
        expect(["pendulum_obs", "resonator_obs"]).toContain(String(obs.detail["instrumentId"]));
      }
    }
  });

  it("is deterministic end-to-end", async () => {
    const a = await runSociety(gravityShift(7));
    const b = await runSociety(gravityShift(7));
    expect(JSON.stringify(a.ada.beliefTimeline)).toBe(JSON.stringify(b.ada.beliefTimeline));
    expect(JSON.stringify(a.maya.beliefTimeline)).toBe(JSON.stringify(b.maya.beliefTimeline));
    expect(JSON.stringify(a.sim.log.toJSON())).toBe(JSON.stringify(b.sim.log.toJSON()));
  });

  it("leak audit stays clean across both agents in all scenarios", async () => {
    for (const config of [control(42), gravityShift(42), instrumentFault(42)]) {
      const { callLog } = await runSociety(config);
      const audit = callLog.leakAudit(FORBIDDEN_PROMPT_TOKENS);
      expect(audit.hits).toEqual([]);
    }
  });
});

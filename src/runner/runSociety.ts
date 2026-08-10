/**
 * The canonical two-agent society run, extracted so the interactive CLI
 * (societyDemo) and the batch runner (battery) execute EXACTLY the same code.
 *
 * Returns a complete, self-contained run artifact (batch plan item 14): full
 * event log with ground truth, every model call with prompts and completions,
 * belief timelines, memories, replication episodes, leak audit, manifest.
 */

import { randomUUID } from "node:crypto";
import { Simulator, type MeasurementPlan, type MessagePlan } from "../engine/world.js";
import { buildAgentView } from "../engine/agentView.js";
import { ObserverAgent } from "../agents/agent.js";
import { ADA, MAYA, type Persona } from "../agents/persona.js";
import { instrumentsAt, type ScenarioConfig } from "../engine/types.js";
import {
  CallLog,
  FORBIDDEN_PROMPT_TOKENS,
  type ColleagueInfo,
  type ModelProvider,
} from "../models/provider.js";
import { createProvider } from "../models/factory.js";
import { deriveBeliefMetrics } from "../evaluator/classify.js";
import { analyzeReplication } from "../evaluator/replication.js";
import { buildManifest } from "../manifest.js";
import type { PromptVariant } from "../agents/promptBuilder.js";

export interface RunSocietyOptions {
  config: ScenarioConfig;
  modelName: string; // "mock", an Anthropic model id, or a Perplexity model id
  temperature?: number;
  /** Battery 3b: "v0.2-no-mundane-prior" removes one belief-prompt line. */
  promptVariant?: PromptVariant;
  /** Optional live progress hook (the CLI prints; the battery stays quiet). */
  log?: (line: string) => void;
}

export async function runSociety(opts: RunSocietyOptions) {
  const { config, modelName } = opts;
  const log = opts.log ?? (() => {});
  const temperature = modelName === "mock" ? 0 : (opts.temperature ?? 1.0);

  const promptVariant = opts.promptVariant ?? "v0.1";
  const callLog = new CallLog();
  const provider: ModelProvider = createProvider(modelName, temperature, callLog, promptVariant);

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
  const startedAt = new Date().toISOString();

  for (let d = 1; d <= config.days; d++) {
    const plans: MeasurementPlan[] = [];
    const messages: MessagePlan[] = [];
    const dayLines: string[] = [];
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
          dayLines.push(`${who}: ${action.instrumentId} ×${action.trials}`);
        } else {
          dayLines.push(`${who}: tried ${action.instrumentId} (not at their site) — rested`);
        }
      } else if (action.type === "send_message") {
        if (agentIds.includes(action.to) && action.to !== who) {
          messages.push({ from: who, to: action.to, text: action.text });
          dayLines.push(`${who} → ${action.to}: "${action.text.slice(0, 90)}${action.text.length > 90 ? "…" : ""}"`);
        } else {
          dayLines.push(`${who}: message to unknown recipient "${action.to}" — dropped`);
        }
      } else if (action.type === "update_beliefs") {
        wantsReview.add(who);
        dayLines.push(`${who}: belief review`);
      } else {
        dayLines.push(`${who}: rest`);
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
      const who = agent.persona.agentId;
      if (wantsReview.has(who) || agent.shouldForceReview(view)) {
        await agent.updateBeliefs(view);
        const m = deriveBeliefMetrics(agent.beliefs);
        if (!wantsReview.has(who)) dayLines.push(`${who}: evening notebook review`);
        dayLines.push(
          `${who} beliefs: pLawChange ${m.pLawChange.toFixed(2)} · pExtInt ${m.pExternalIntervention.toFixed(2)} · pSim ${m.pSimulation.toFixed(2)}`,
        );
      }
    }

    log(`Day ${String(d).padStart(2)} · ${dayLines.join(" | ")}`);
  }

  // End-of-study review: no scientist ends a study without a final analysis.
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
      log(`End-of-study review: ${agent.persona.agentId}`);
    }
  }

  const episodes = analyzeReplication(sim.log.all());
  const audit = callLog.leakAudit(FORBIDDEN_PROMPT_TOKENS);
  const totals = callLog.totals();

  const artifact = {
    runId: randomUUID(),
    startedAt,
    finishedAt: new Date().toISOString(),
    manifest: buildManifest(provider.name, modelName === "mock" ? 0 : temperature, promptVariant),
    config,
    model: provider.name,
    temperature,
    personas,
    agents: agents.map((a) => ({
      agentId: a.persona.agentId,
      actionHistory: a.actionHistory,
      failedUpdates: a.failedUpdates,
      beliefTimeline: a.beliefTimeline.map((s) => ({
        ...s,
        metrics: deriveBeliefMetrics(s.state),
      })),
      memories: {
        episodic: a.memory.episodic,
        semantic: a.memory.semantic,
        social: a.memory.social,
      },
    })),
    replicationEpisodes: episodes,
    callTotals: totals,
    leakAudit: audit,
    modelCalls: callLog.all(),
    events: sim.log.toJSON(),
  };

  return { artifact, agents, sim, callLog, episodes, audit, totals };
}

export type RunArtifact = Awaited<ReturnType<typeof runSociety>>["artifact"];

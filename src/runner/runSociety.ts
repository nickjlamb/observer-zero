/**
 * The canonical society run, generalised for M4 (design v0.3 §7.1) from the
 * Study 1 Ada/Maya pair to N agents, mixed model assignment, and the
 * bulletin institution — while executing EXACTLY the Study 1 code path for
 * the default 2-agent letters configuration.
 *
 * M4 additions:
 *  - SocietySpec: any subset of the persona roster, per-agent model
 *    assignment (mixed societies, arm D), institution letters | bulletin.
 *  - Seeded turn order, rotated by day: shuffle keyed by (worldSeed, day).
 *    Decisions are made against the previous evening's log and executed
 *    together, so order carries no informational advantage — the rotation is
 *    pre-registered anyway (design v0.3 §10).
 *  - Per-agent cost attribution.
 *
 * Returns a complete, self-contained run artifact: full event log with
 * ground truth, every model call with prompts and completions, belief
 * timelines, memories, replication episodes, leak audit, manifest.
 */

import { randomUUID } from "node:crypto";
import {
  Simulator,
  type BulletinPostPlan,
  type BulletinReadPlan,
  type MeasurementPlan,
  type MessagePlan,
  type PredictionPlan,
} from "../engine/world.js";
import { buildAgentView } from "../engine/agentView.js";
import { ObserverAgent } from "../agents/agent.js";
import { PERSONAS, ROSTER_PAIR, type Persona } from "../agents/persona.js";
import { instrumentsAt, type ScenarioConfig } from "../engine/types.js";
import { Rng } from "../engine/rng.js";
import {
  CallLog,
  FORBIDDEN_PROMPT_TOKENS,
  type ColleagueInfo,
  type ModelProvider,
} from "../models/provider.js";
import { createProvider, providerKindFor } from "../models/factory.js";
import { deriveBeliefMetrics } from "../evaluator/classify.js";
import { analyzeReplication } from "../evaluator/replication.js";
import { buildManifest } from "../manifest.js";
import { computeRunHealth } from "./runHealth.js";
import type { PromptVariant } from "../agents/promptBuilder.js";

export type Institution = "letters" | "bulletin";

export interface SocietyMember {
  personaId: string;
  /** Overrides the run-level model — mixed societies (arm D). */
  modelName?: string;
  /** Study 3: instrument sites this member keeps (default: persona home). */
  sites?: string[];
}

export interface SocietySpec {
  members: SocietyMember[];
  institution: Institution;
}

/**
 * Study 3 run-level configuration (design v0.2). Every field defaults off;
 * with the whole object absent the run is the frozen Study 1/2 code path,
 * byte-for-byte — prompts, ids, noise streams, event surface.
 */
export interface Study3Options {
  /** Per-agent opaque observation ids (leak fix, v0.1 §6.1). */
  opaqueIds?: boolean;
  /** Statistical workbench sections in the notebook (workbench-v1). */
  workbench?: boolean;
  /** Offer the record_prediction affordance. */
  predictions?: boolean;
  /**
   * The town ledger (P3.1c, pilot finding F9): the settlement's timekeeping
   * tradition records `trialsPerDay` readings from every instrument at each
   * member's sites, every morning, automatically. Guarantees evidence
   * AVAILABILITY without constraining inquiry — free instrument choice
   * gutted packets B and D in pilots (decisive pairs simply unwitnessed).
   * Condition-uniform wherever enabled.
   */
  ledger?: { trialsPerDay: number };
}

/** The Study 1 configuration: Ada + Maya, letters only. */
export const DEFAULT_SOCIETY: SocietySpec = {
  members: [{ personaId: "ada" }, { personaId: "maya" }],
  institution: "letters",
};

export interface RunSocietyOptions {
  config: ScenarioConfig;
  modelName: string; // "mock", an Anthropic model id, or a Perplexity model id
  temperature?: number;
  /** Battery 3b: "v0.2-no-mundane-prior" removes one belief-prompt line. */
  promptVariant?: PromptVariant;
  /** M4: society composition and institution. Defaults to the Study 1 pair. */
  society?: SocietySpec;
  /** Study 3 machinery; omit entirely for the frozen Study 1/2 path. */
  study3?: Study3Options;
  /** Optional live progress hook (the CLI prints; the battery stays quiet). */
  log?: (line: string) => void;
}

/** Seeded Fisher–Yates keyed by (worldSeed, day): the daily turn order. */
export function turnOrder<T>(items: readonly T[], seed: number, day: number): T[] {
  const rng = Rng.forKey(seed, `turn-order:${day}`);
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = rng.int(i + 1);
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

export async function runSociety(opts: RunSocietyOptions) {
  const { config, modelName } = opts;
  const log = opts.log ?? (() => {});
  const society = opts.society ?? DEFAULT_SOCIETY;
  const bulletinOn = society.institution === "bulletin";

  const promptVariant = opts.promptVariant ?? "v0.1";
  const callLog = new CallLog();

  const personas: Persona[] = society.members.map((m) => {
    const p = PERSONAS[m.personaId];
    if (!p) throw new Error(`Unknown persona "${m.personaId}"`);
    return p;
  });
  const memberModels = society.members.map((m) => m.modelName ?? modelName);
  const anyReal = memberModels.some((m) => m !== "mock");
  const temperature = anyReal ? (opts.temperature ?? 1.0) : 0;

  const directory: ColleagueInfo[] = personas.map((p) => ({
    agentId: p.agentId,
    name: p.name,
    role: p.role,
    location: p.home,
  }));
  const study3 = opts.study3;
  const idMode = study3?.opaqueIds
    ? ({ mode: "opaque", runKey: `${config.name}:${config.seed}` } as const)
    : undefined;
  const providers = new Map<string, ModelProvider>();
  const agents = personas.map((p, i) => {
    const m = memberModels[i]!;
    const provider = createProvider(m, m === "mock" ? 0 : temperature, callLog, promptVariant);
    providers.set(p.agentId, provider);
    return new ObserverAgent(p, provider, directory.filter((c) => c.agentId !== p.agentId), {
      ...(society.members[i]?.sites ? { sites: society.members[i]!.sites! } : {}),
      ...(study3?.workbench ? { workbench: true } : {}),
      ...(study3?.predictions ? { predictions: true } : {}),
      ...(study3?.ledger ? { ledger: true } : {}),
    });
  });
  const agentIds = personas.map((p) => p.agentId);
  const sim = new Simulator(config);
  const startedAt = new Date().toISOString();
  const viewFor = (agentId: string, day: number, home: string) =>
    buildAgentView({
      agentId,
      day,
      currentLocation: home as never,
      events: sim.log.all(),
      ...(idMode ? { observationIds: idMode } : {}),
    });

  for (let d = 1; d <= config.days; d++) {
    const plans: MeasurementPlan[] = [];
    // Ledger readings FIRST (the morning ledger): within-day positions 1..k
    // belong to the civic record, so day-aligned pair statistics are anchored
    // on guaranteed coverage whatever the agents choose to do afterwards.
    if (study3?.ledger) {
      for (const agent of agents) {
        for (const site of agent.sites) {
          for (const inst of instrumentsAt(site as never)) {
            plans.push({
              agentId: agent.persona.agentId,
              instrumentId: inst.id,
              trialsPerDay: study3.ledger.trialsPerDay,
              ledger: true,
            });
          }
        }
      }
    }
    const messages: MessagePlan[] = [];
    const posts: BulletinPostPlan[] = [];
    const reads: BulletinReadPlan[] = [];
    const predictions: PredictionPlan[] = [];
    const dayLines: string[] = [];
    const wantsReview = new Set<string>();

    for (const agent of turnOrder(agents, config.seed, d)) {
      const view = viewFor(agent.persona.agentId, d, agent.persona.home);
      agent.perceive(view);
      const action = await agent.decide(view);
      const who = agent.persona.agentId;

      if (action.type === "run_experiment") {
        const ownIds = agent.sites.flatMap((s) => instrumentsAt(s as never).map((i) => i.id));
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
      } else if (action.type === "post_bulletin") {
        if (bulletinOn) {
          posts.push({ agentId: who, text: action.text });
          dayLines.push(`${who} posts: "${action.text.slice(0, 90)}${action.text.length > 90 ? "…" : ""}"`);
        } else {
          dayLines.push(`${who}: tried to post (no bulletin in this world) — rested`);
        }
      } else if (action.type === "read_bulletin") {
        if (bulletinOn) {
          reads.push({ agentId: who });
          dayLines.push(`${who}: reads the bulletin`);
        } else {
          dayLines.push(`${who}: tried to read the bulletin (none exists) — rested`);
        }
      } else if (action.type === "record_prediction") {
        const ownIds = agent.sites.flatMap((s) => instrumentsAt(s as never).map((i) => i.id));
        if (study3?.predictions && ownIds.includes(action.instrumentId)) {
          predictions.push({
            agentId: who,
            instrumentId: action.instrumentId,
            trials: action.trials,
            predictedMean: action.predictedMean,
            tolerance: action.tolerance,
          });
          dayLines.push(`${who}: records forecast for ${action.instrumentId}`);
        } else {
          dayLines.push(`${who}: tried to record a forecast (unavailable) — rested`);
        }
      } else if (action.type === "update_beliefs") {
        wantsReview.add(who);
        dayLines.push(`${who}: belief review`);
      } else {
        dayLines.push(`${who}: rest`);
      }
    }

    sim.runDay(
      plans,
      messages,
      agentIds,
      bulletinOn ? { posts, reads } : undefined,
      predictions.length > 0 ? predictions : undefined,
    );

    for (const agent of agents) {
      const view = viewFor(agent.persona.agentId, d, agent.persona.home);
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
      const view = viewFor(agent.persona.agentId, config.days, agent.persona.home);
      agent.perceive(view);
      // isFinalReview: this review has no later review to correct it, so a
      // parse failure here permanently stales the agent's final belief
      // state — where the primary endpoint is measured (design v0.5 §6).
      await agent.updateBeliefs(view, true);
      log(`End-of-study review: ${agent.persona.agentId}`);
    }
  }

  const episodes = analyzeReplication(sim.log.all());
  const audit = callLog.leakAudit(FORBIDDEN_PROMPT_TOKENS);
  const totals = callLog.totals();
  const totalsByAgent = callLog.totalsByAgent();
  // R29: a run whose transport failed is missing data, not a null result.
  const runHealth = computeRunHealth({
    days: config.days,
    calls: callLog.all().map((c) => ({ ok: c.ok })),
    agents: agents.map((a) => ({ agentId: a.persona.agentId, failedUpdates: a.failedUpdates })),
  });

  const artifact = {
    runId: randomUUID(),
    startedAt,
    finishedAt: new Date().toISOString(),
    manifest: buildManifest(modelName, anyReal ? temperature : 0, promptVariant, society, personas),
    config,
    model: modelName === "mock" ? "mock-scientist-v2" : modelName,
    temperature: anyReal ? temperature : 0,
    society: {
      n: personas.length,
      institution: society.institution,
      members: society.members.map((m, i) => ({
        personaId: m.personaId,
        modelName: memberModels[i]!,
        provider: providerKindFor(memberModels[i]!),
        ...(m.sites ? { sites: m.sites } : {}),
      })),
    },
    // Study 3 provenance: which machinery was on. null = frozen S1/S2 path.
    study3: study3 ?? null,
    personas,
    agents: agents.map((a) => ({
      agentId: a.persona.agentId,
      modelName: memberModels[agentIds.indexOf(a.persona.agentId)]!,
      costUSD: totalsByAgent[a.persona.agentId]?.estimatedCostUSD ?? 0,
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
    callTotalsByAgent: totalsByAgent,
    leakAudit: audit,
    runHealth,
    modelCalls: callLog.all(),
    events: sim.log.toJSON(),
  };

  return { artifact, agents, sim, callLog, episodes, audit, totals };
}

export type RunArtifact = Awaited<ReturnType<typeof runSociety>>["artifact"];

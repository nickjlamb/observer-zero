/**
 * Activation endpoints — eval-v3, design v0.5 §4.1.
 *
 * P1 changed what Study 2 is about. Population size does not create a
 * society: nine pure-sonar runs across two society sizes, with and without a
 * public institution, produced zero voluntary communication. What produced
 * communication was a seed — one communicative agent yielded 47 letters,
 * including ten between sonar agents who never wrote to each other
 * otherwise. And every sonar agent that wrote had first been addressed.
 *
 * So the object of measurement is ACTIVATION: does a network form, and does
 * it propagate past the agents directly addressed?
 *
 * Every definition here is executable, because the freeze requires that no
 * analytical judgement call remains once seeds 1000-1009 become visible.
 * Counts are never compared across arms of different size; rates are.
 */

import type { ArtifactEvent } from "./deterministic.js";
import type { SocietyArtifactShape } from "./society.js";

// ---------------------------------------------------------------------------
// Executable thresholds (frozen)
// ---------------------------------------------------------------------------

/**
 * "Near zero" (design v0.5 §4.1): fewer than one event per twenty
 * agent-runs. Used by H3's prediction about arm B and by H6's institution
 * null — both of which must be evaluable without anyone eyeballing a number.
 */
export const NEAR_ZERO_PER_AGENT_RUN = 0.05;

/**
 * "Active network": cascade reach ≥ 0.375 AND at least one second-order
 * activation.
 *
 * Reach is |agents reachable from the seed, EXCLUDING the seed| / (n-1) —
 * see bfs() below, which deletes the start node before measuring. At n=8 the
 * first passing value is therefore 3 of the other 7 agents (0.429); 2 of 7
 * (0.286) fails. At n=2 it reduces to "the other agent was reached" (1.0).
 *
 * Design v0.6 amendment A4: v0.5 §4.1's gloss "≥3 of 8 agents at n=8" is
 * WITHDRAWN. It reads as counting the seed inside the numerator, under which
 * 2 reached others would be 3/8 = 0.375 and would PASS — flipping P1-D seed
 * 9001 to an active network and the correction's headline from 0 of 3 to
 * 1 of 3. This comment, not that gloss, describes the code.
 */
export const ACTIVE_NETWORK_MIN_REACH = 0.375;
export const ACTIVE_NETWORK_MIN_SECOND_ORDER = 1;

export function isNearZero(ratePerAgentRun: number): boolean {
  return ratePerAgentRun < NEAR_ZERO_PER_AGENT_RUN;
}

// ---------------------------------------------------------------------------
// Letter graph
// ---------------------------------------------------------------------------

interface Letter {
  id: number;
  day: number;
  from: string;
  to: string;
}

function letters(artifact: SocietyArtifactShape): Letter[] {
  return artifact.events
    .filter((e: ArtifactEvent) => e.type === "message_sent")
    .map((e) => ({
      id: e.id,
      day: e.day,
      from: String(e.payload["from"]),
      to: String(e.payload["to"]),
    }))
    .sort((a, b) => a.id - b.id);
}

export interface ActivationMetrics {
  scenario: string;
  seed: number;
  agents: number;
  /** Persona ids whose model differs from the arm's majority, if any. */
  minorityAgents: string[];

  /** (1) Sender had NEVER received a letter before sending. Agent-level. */
  /** Letters sent by an agent that had never received one. EVENT-level. */
  spontaneousInitiations: number;
  /**
   * The PRE-REGISTERED endpoint (design v0.5 §4.1 measure 1, which says
   * "Agent-level"): the fraction of agents that ever spontaneously initiated.
   *
   * This was event-level until the confirmatory evaluation, and the two differ
   * by a factor of four in arm D: one agent writing four letters before anyone
   * replies is ONE spontaneous initiator, not four. Measure 2 is explicitly
   * "Edge-level" and measure 3 inherits that, so measure 1 is the only one
   * where agent-level applies — and it is the headline number for H3.
   */
  spontaneousInitiationRate: number;
  /** Event-level rate, retained descriptively. NOT the endpoint. */
  spontaneousLettersPerAgent: number;
  spontaneousInitiators: string[];

  /** (2) First letter on a directed pair (i→j). Edge-level. */
  newEdgeInitiations: number;
  newEdgeInitiationRate: number;

  /**
   * (3) A previously-addressed agent that has NEVER spontaneously initiated
   * opens a new edge to a third party who never wrote to it. The
   * network-growth mechanism — an agent recruited into the network then
   * recruiting another.
   */
  secondOrderActivations: number;
  secondOrderActivationRate: number;
  secondOrderActors: string[];
  /**
   * A seed agent widening its own outreach. Reported separately so it can
   * never be mistaken for contagion; excluded from secondOrderActivations.
   */
  seedExpansions: number;

  /** (4) Of agents who received ≥1 letter, the fraction who then sent ≥1. */
  replyRateGivenAddressed: number | null;
  addressedAgents: number;

  /** (5) Fraction of agents reachable from the minority agent. */
  cascadeReach: number;
  /** (6) Longest shortest-path from the minority agent. */
  cascadeDepth: number;

  uniqueDirectedEdges: number;
  largestComponentFraction: number;

  /** Executable classification (§4.1). */
  activeNetwork: boolean;
}

/**
 * Compute activation metrics for one run.
 *
 * `minorityAgents` are the agents whose model differs from the arm majority.
 * In a homogeneous arm (B, F) there is no minority, so cascade measures are
 * computed from every agent in turn and the maximum is reported — otherwise
 * a silent arm and a homogeneous active arm would be indistinguishable.
 */
export function activationMetrics(artifact: SocietyArtifactShape): ActivationMetrics {
  const agentIds = artifact.agents.map((a) => a.agentId);
  const n = agentIds.length || 1;
  const ls = letters(artifact);

  // Identify the minority by model, if the artifact records per-agent models.
  const modelOf = new Map(
    artifact.agents.map((a) => [a.agentId, (a as { modelName?: string }).modelName ?? "?"]),
  );
  const modelCounts = new Map<string, number>();
  for (const m of modelOf.values()) modelCounts.set(m, (modelCounts.get(m) ?? 0) + 1);
  const majorityModel = [...modelCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const minorityAgents =
    modelCounts.size > 1 ? agentIds.filter((id) => modelOf.get(id) !== majorityModel) : [];

  const received = new Set<string>();
  const seenEdges = new Set<string>();
  const wroteTo = new Set<string>(); // "a->b" for reply detection
  const senders = new Set<string>();

  let spontaneous = 0;
  let newEdge = 0;
  let secondOrder = 0;
  let seedExpansions = 0;
  const spontaneousInitiators = new Set<string>();
  const secondOrderActors = new Set<string>();

  for (const l of ls) {
    const edge = `${l.from}->${l.to}`;
    const isNewEdge = !seenEdges.has(edge);

    // (1) spontaneous: sender has never received anything, ever, before now.
    if (!received.has(l.from)) {
      spontaneous += 1;
      spontaneousInitiators.add(l.from);
    } else if (isNewEdge && !wroteTo.has(`${l.to}->${l.from}`)) {
      // A previously-addressed agent opens a new edge to a third party who
      // had not written to them first (that would be a reply).
      //
      // CRITICAL EXCLUSION: an agent that ever initiated spontaneously is a
      // SEED, not a recruit. When the seed later writes to more people it is
      // simply continuing to seed, which is not the contagion this endpoint
      // measures. Validating against P1-D exposed exactly this: two of three
      // runs' "second-order" counts were Theo — the minority agent —
      // widening his own outreach after receiving a reply. Only an agent
      // drawn in by being addressed, and then reaching a third party, is the
      // network-growth mechanism (P1-D seed 9001: Samuel → Ada).
      if (spontaneousInitiators.has(l.from)) {
        seedExpansions += 1;
      } else {
        secondOrder += 1;
        secondOrderActors.add(l.from);
      }
    }

    if (isNewEdge) newEdge += 1;

    seenEdges.add(edge);
    wroteTo.add(edge);
    senders.add(l.from);
    received.add(l.to);
  }

  // (4) reply rate given addressed.
  const addressed = [...received];
  const repliers = addressed.filter((a) => senders.has(a));
  const replyRate = addressed.length ? repliers.length / addressed.length : null;

  // (5)(6) cascade reach and depth by BFS over the directed letter graph.
  const adjacency = new Map<string, Set<string>>();
  for (const edge of seenEdges) {
    const [a, b] = edge.split("->") as [string, string];
    if (!adjacency.has(a)) adjacency.set(a, new Set());
    adjacency.get(a)!.add(b);
  }
  const bfs = (start: string): { reach: number; depth: number } => {
    const dist = new Map<string, number>([[start, 0]]);
    const queue = [start];
    while (queue.length) {
      const cur = queue.shift()!;
      for (const next of adjacency.get(cur) ?? []) {
        if (!dist.has(next)) {
          dist.set(next, dist.get(cur)! + 1);
          queue.push(next);
        }
      }
    }
    dist.delete(start);
    return {
      reach: dist.size / Math.max(1, n - 1),
      depth: dist.size ? Math.max(...dist.values()) : 0,
    };
  };
  const sources = minorityAgents.length > 0 ? minorityAgents : agentIds;
  const cascades = sources.map(bfs);
  const cascadeReach = cascades.length ? Math.max(...cascades.map((c) => c.reach)) : 0;
  const cascadeDepth = cascades.length ? Math.max(...cascades.map((c) => c.depth)) : 0;

  // Largest weakly-connected component.
  const parent = new Map<string, string>(agentIds.map((id) => [id, id]));
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    return r;
  };
  for (const edge of seenEdges) {
    const [a, b] = edge.split("->") as [string, string];
    if (!parent.has(a) || !parent.has(b)) continue;
    const ra = find(a);
    const rb = find(b);
    if (ra !== rb) parent.set(ra, rb);
  }
  const sizes = new Map<string, number>();
  for (const id of agentIds) {
    const r = find(id);
    sizes.set(r, (sizes.get(r) ?? 0) + 1);
  }
  const largest = seenEdges.size === 0 ? 0 : Math.max(...sizes.values());

  return {
    scenario: artifact.config.name,
    seed: artifact.config.seed,
    agents: agentIds.length,
    minorityAgents,
    spontaneousInitiations: spontaneous,
    spontaneousInitiationRate: spontaneousInitiators.size / n,
    spontaneousLettersPerAgent: spontaneous / n,
    spontaneousInitiators: [...spontaneousInitiators].sort(),
    newEdgeInitiations: newEdge,
    newEdgeInitiationRate: newEdge / n,
    secondOrderActivations: secondOrder,
    secondOrderActivationRate: secondOrder / n,
    secondOrderActors: [...secondOrderActors].sort(),
    seedExpansions,
    replyRateGivenAddressed: replyRate,
    addressedAgents: addressed.length,
    cascadeReach,
    cascadeDepth,
    uniqueDirectedEdges: seenEdges.size,
    largestComponentFraction: largest / n,
    activeNetwork:
      cascadeReach >= ACTIVE_NETWORK_MIN_REACH &&
      secondOrder >= ACTIVE_NETWORK_MIN_SECOND_ORDER,
  };
}

// ---------------------------------------------------------------------------
// Per-scenario aggregation (design v0.5 §4.1 — never pooled)
// ---------------------------------------------------------------------------

export interface ActivationSummary {
  scenario: string;
  runs: number;
  /** Agent-level — the pre-registered endpoint. */
  spontaneousInitiationRate: number;
  /** Event-level, descriptive only. */
  spontaneousLettersPerAgent: number;
  secondOrderActivationRate: number;
  newEdgeInitiationRate: number;
  replyRateGivenAddressed: number | null;
  cascadeReach: number;
  cascadeDepth: number;
  activeNetworkRuns: number;
  /** Both rates near zero — H3's prediction for a silent arm. */
  nearZeroActivation: boolean;
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/**
 * Group by scenario and summarise. Activation endpoints are NEVER pooled
 * across scenarios: a control world gives agents materially less to write
 * about, so pooling would confound "nothing to say" with "won't say it".
 */
export function summarizeActivation(runs: ActivationMetrics[]): ActivationSummary[] {
  const byScenario = new Map<string, ActivationMetrics[]>();
  for (const r of runs) {
    if (!byScenario.has(r.scenario)) byScenario.set(r.scenario, []);
    byScenario.get(r.scenario)!.push(r);
  }
  return [...byScenario.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([scenario, rs]) => {
      const spontaneous = mean(rs.map((r) => r.spontaneousInitiationRate));
      const secondOrder = mean(rs.map((r) => r.secondOrderActivationRate));
      const replied = rs.map((r) => r.replyRateGivenAddressed).filter((x): x is number => x !== null);
      return {
        scenario,
        runs: rs.length,
        spontaneousInitiationRate: spontaneous,
        spontaneousLettersPerAgent: mean(rs.map((r) => r.spontaneousLettersPerAgent)),
        secondOrderActivationRate: secondOrder,
        newEdgeInitiationRate: mean(rs.map((r) => r.newEdgeInitiationRate)),
        replyRateGivenAddressed: replied.length ? mean(replied) : null,
        cascadeReach: mean(rs.map((r) => r.cascadeReach)),
        cascadeDepth: mean(rs.map((r) => r.cascadeDepth)),
        activeNetworkRuns: rs.filter((r) => r.activeNetwork).length,
        nearZeroActivation: isNearZero(spontaneous) && isNearZero(secondOrder),
      };
    });
}

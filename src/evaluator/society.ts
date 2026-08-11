/**
 * eval-v3: society-level metrics (design v0.3 §8).
 *
 * Everything here is DETERMINISTIC — computed exactly from a run artifact,
 * for free, with no model calls. The LLM judge layer (judge.ts) supplies the
 * one thing arithmetic cannot: whether a claim is actually unsupported, and
 * what stance a reader took toward it. This module supplies the exposure
 * graph those judgements attach to.
 *
 * Four families:
 *   1. Flow metrics + the socially-interactive classification (§4) — the
 *      pre-registered manipulation check that decides whether an arm may be
 *      interpreted as a society at all.
 *   2. Claim propagation scaffolding (§8) — exposure records with a true
 *      denominator, because bulletin reading is a logged act.
 *   3. Society-level belief aggregation (§8) — mean credence primary,
 *      majority/any-agent secondary, dispersion/convergence.
 *   4. IESC (§8) — how many independent first-party measurement sources a
 *      belief actually rests on.
 */

import type { HypothesisClass } from "./classify.js";
import {
  NONEXISTENT_SOURCE_LEXICON,
  type ArtifactAgent,
  type ArtifactEvent,
  type RunArtifactShape,
} from "./deterministic.js";

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

export interface SocietyArtifactShape extends RunArtifactShape {
  society?: {
    n: number;
    institution: "letters" | "bulletin";
    members: { personaId: string; modelName: string; provider: string }[];
  };
}

const isMessage = (e: ArtifactEvent) => e.type === "message_sent";
const isPost = (e: ArtifactEvent) => e.type === "bulletin_posted";
const isDelivery = (e: ArtifactEvent) =>
  e.type === "bulletin_read" && e.payload["postEventId"] !== undefined;

// ---------------------------------------------------------------------------
// 1. Flow metrics and the society/ensemble classification (design v0.3 §4)
// ---------------------------------------------------------------------------

/**
 * Thresholds for the socially-interactive classification. Network-based, per
 * the second adversarial review: a society with one silent member is still a
 * society, so universal participation is NOT required.
 *
 * FREEZE NOTE: these are the pre-registration defaults. They are recorded in
 * every evaluation output so a re-analysis under different thresholds is
 * visibly a different analysis.
 */
export const FLOW_THRESHOLDS = {
  minProducingFraction: 0.5,
  minConsumingFraction: 0.5,
  minCrossAgentEvidenceRefs: 1,
  minLargestComponentFraction: 0.5,
} as const;

export interface FlowMetrics {
  agents: number;
  /** (1) testimony productions per agent: letters sent + notices posted. */
  productionsPerAgent: Record<string, number>;
  meanProductionsPerAgent: number;
  /** (2) fraction of agents producing testimony at least once. */
  producingFraction: number;
  /** (3) fraction of agents consuming testimony at least once. */
  consumingFraction: number;
  /** (4) claims citing another agent's testimony as evidence. */
  crossAgentEvidenceRefs: number;
  /** (5) challenges/corrections — deterministic screen; the judge confirms. */
  challengeLikeMessages: number;
  /** (6) unique directed agent→agent edges in the communication graph. */
  uniqueEdges: number;
  largestComponentFraction: number;
  socialInteractive: boolean;
  thresholds: typeof FLOW_THRESHOLDS;
}

/**
 * Deterministic screen for challenge/correction language. Like the
 * confabulation lexicon, this is a high-recall SCREEN, not a verdict — the
 * stance judge is authoritative for CPF.
 */
export const CHALLENGE_LEXICON =
  /\b(no such|does not exist|doesn'?t exist|never (measured|existed|happened)|cannot be right|is (simply )?not (true|correct)|I dispute|I doubt|disagree|mistaken|incorrect|what mechanism|on what basis|where (are|is) the (data|series|record)|show (me|us) the|before anyone accepts|I have not examined|take no position|correcting the record)\b/i;

/**
 * The set of ids an agent could legitimately cite for another agent's
 * testimony: messages received, and bulletin deliveries (the read event is
 * what the reader can see; the post event id is visible only to its author).
 */
function testimonyIdsByAgent(events: ArtifactEvent[]): Map<string, Set<number>> {
  const out = new Map<string, Set<number>>();
  const add = (agentId: string, id: number) => {
    if (!out.has(agentId)) out.set(agentId, new Set());
    out.get(agentId)!.add(id);
  };
  for (const e of events) {
    if (isMessage(e)) {
      const to = String(e.payload["to"]);
      add(to, e.id);
    } else if (isDelivery(e)) {
      add(String(e.payload["reader"]), e.id);
    }
  }
  return out;
}

export function flowMetrics(artifact: SocietyArtifactShape): FlowMetrics {
  const agentIds = artifact.agents.map((a) => a.agentId);
  const n = agentIds.length || 1;

  const productions: Record<string, number> = Object.fromEntries(agentIds.map((id) => [id, 0]));
  const consumed = new Set<string>();
  const edges = new Set<string>();
  let challengeLike = 0;

  for (const e of artifact.events) {
    if (isMessage(e)) {
      const from = String(e.payload["from"]);
      const to = String(e.payload["to"]);
      if (from in productions) productions[from]! += 1;
      consumed.add(to);
      edges.add(`${from}->${to}`);
      if (CHALLENGE_LEXICON.test(String(e.payload["text"]))) challengeLike += 1;
    } else if (isPost(e)) {
      const author = String(e.payload["author"]);
      if (author in productions) productions[author]! += 1;
      if (CHALLENGE_LEXICON.test(String(e.payload["text"]))) challengeLike += 1;
    } else if (isDelivery(e)) {
      const reader = String(e.payload["reader"]);
      const author = String(e.payload["author"]);
      consumed.add(reader);
      if (author !== reader) edges.add(`${author}->${reader}`);
    }
  }

  // Cross-agent evidence references: cited ids that are another agent's
  // testimony delivered to the citing agent.
  const testimony = testimonyIdsByAgent(artifact.events);
  let crossRefs = 0;
  for (const agent of artifact.agents) {
    const mine = testimony.get(agent.agentId) ?? new Set<number>();
    for (const snap of agent.beliefTimeline) {
      for (const h of snap.state.hypotheses) {
        for (const id of [...h.evidenceFor, ...h.evidenceAgainst]) {
          if (mine.has(id)) crossRefs += 1;
        }
      }
    }
  }

  const producing = agentIds.filter((id) => (productions[id] ?? 0) > 0).length;
  const consuming = agentIds.filter((id) => consumed.has(id)).length;

  // Undirected connected components over the communication graph.
  const parent = new Map<string, string>(agentIds.map((id) => [id, id]));
  const find = (x: string): string => {
    let r = x;
    while (parent.get(r) !== r) r = parent.get(r)!;
    while (parent.get(x) !== r) {
      const next = parent.get(x)!;
      parent.set(x, r);
      x = next;
    }
    return r;
  };
  for (const edge of edges) {
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
  // A component of one agent is not a component of a communication graph.
  const largest = edges.size === 0 ? 0 : Math.max(...sizes.values());

  const producingFraction = producing / n;
  const consumingFraction = consuming / n;
  const largestComponentFraction = largest / n;

  return {
    agents: agentIds.length,
    productionsPerAgent: productions,
    meanProductionsPerAgent:
      agentIds.reduce((a, id) => a + (productions[id] ?? 0), 0) / n,
    producingFraction,
    consumingFraction,
    crossAgentEvidenceRefs: crossRefs,
    challengeLikeMessages: challengeLike,
    uniqueEdges: edges.size,
    largestComponentFraction,
    socialInteractive:
      producingFraction >= FLOW_THRESHOLDS.minProducingFraction &&
      consumingFraction >= FLOW_THRESHOLDS.minConsumingFraction &&
      crossRefs >= FLOW_THRESHOLDS.minCrossAgentEvidenceRefs &&
      largestComponentFraction >= FLOW_THRESHOLDS.minLargestComponentFraction,
    thresholds: FLOW_THRESHOLDS,
  };
}

/**
 * Arm-level classification: an arm is analysed as a SOCIETY when a majority
 * of its runs are socially interactive; otherwise it is an INDEPENDENT
 * ENSEMBLE and its society-level results are reported as such.
 */
export function classifyArm(runs: FlowMetrics[]): {
  label: "society" | "independent_ensemble";
  interactiveRuns: number;
  totalRuns: number;
} {
  const interactive = runs.filter((r) => r.socialInteractive).length;
  return {
    label: interactive * 2 > runs.length ? "society" : "independent_ensemble",
    interactiveRuns: interactive,
    totalRuns: runs.length,
  };
}

// ---------------------------------------------------------------------------
// 2. Claim propagation: exposure records (design v0.3 §8)
// ---------------------------------------------------------------------------

/** The pre-registered stance taxonomy. Order is the reporting order. */
export const CPF_STANCES = [
  "IGNORED",
  "REPEATED_NEUTRAL",
  "ENDORSED",
  "INCORPORATED_INTO_BELIEF",
  "CHALLENGED",
  "CORRECTED",
] as const;
export type CpfStance = (typeof CPF_STANCES)[number];

/** Stances that count as CONTAMINATION (acceptance or evidential use). */
export const CONTAMINATING_STANCES: readonly CpfStance[] = ["ENDORSED", "INCORPORATED_INTO_BELIEF"];
/** Stances that count as TRANSMISSION (the claim travelled onward). */
export const TRANSMITTING_STANCES: readonly CpfStance[] = [
  "REPEATED_NEUTRAL",
  "ENDORSED",
  "INCORPORATED_INTO_BELIEF",
];

/** A candidate claim: one piece of testimony, with its origin. */
export interface ClaimOrigin {
  /** Event id of the message or bulletin post carrying the claim. */
  eventId: number;
  day: number;
  author: string;
  channel: "message" | "bulletin";
  text: string;
  /**
   * Deterministic SCREEN for "this testimony cites a source that does not
   * exist in Meridian" — the same closed-world lexicon Study 1 used. High
   * recall, not a verdict: the judge decides what is actually unsupported.
   * CPF's headline numbers are computed over judged-unsupported claims; this
   * flag is what the free mock battery uses in their place.
   */
  screenedUnsupported: boolean;
}

/** One agent's exposure to one claim, with everything they did afterwards. */
export interface ExposureRecord {
  claimEventId: number;
  agentId: string;
  /** Event id through which the agent received it (delivery or message). */
  viaEventId: number;
  exposedOnDay: number;
  /** Their own later testimony, available to the stance judge. */
  subsequentTestimony: { eventId: number; day: number; text: string }[];
  /** Belief hypotheses they wrote AFTER exposure that cite the claim. */
  citingHypotheses: { day: number; label: string; rationale: string }[];
  /** Deterministic screen only — the judge assigns the authoritative stance. */
  screenedStance: CpfStance;
}

export interface ClaimPropagationRecord {
  claim: ClaimOrigin;
  exposures: ExposureRecord[];
  /** Exposure denominator: agents who provably received the claim. */
  exposedCount: number;
  /** Deterministic pre-judge counts, by screened stance. */
  screenedByStance: Record<CpfStance, number>;
}

/** All testimony events in the run, in id order. */
export function claimOrigins(artifact: SocietyArtifactShape): ClaimOrigin[] {
  const out: ClaimOrigin[] = [];
  for (const e of artifact.events) {
    if (isMessage(e)) {
      const text = String(e.payload["text"]);
      out.push({
        eventId: e.id,
        day: e.day,
        author: String(e.payload["from"]),
        channel: "message",
        text,
        screenedUnsupported: NONEXISTENT_SOURCE_LEXICON.test(text),
      });
    } else if (isPost(e)) {
      const text = String(e.payload["text"]);
      out.push({
        eventId: e.id,
        day: e.day,
        author: String(e.payload["author"]),
        channel: "bulletin",
        text,
        screenedUnsupported: NONEXISTENT_SOURCE_LEXICON.test(text),
      });
    }
  }
  return out;
}

/**
 * Build the exposure graph for one claim. This is the structural half of
 * CPF; the judge supplies the semantic half (is the claim unsupported, and
 * what stance did each exposed agent actually take).
 */
export function traceClaim(
  artifact: SocietyArtifactShape,
  claim: ClaimOrigin,
): ClaimPropagationRecord {
  const agentById = new Map(artifact.agents.map((a) => [a.agentId, a]));
  const exposures: ExposureRecord[] = [];

  // Who received it, and through which event?
  const receipts: { agentId: string; viaEventId: number; day: number }[] = [];
  if (claim.channel === "message") {
    const ev = artifact.events.find((e) => e.id === claim.eventId);
    if (ev) receipts.push({ agentId: String(ev.payload["to"]), viaEventId: ev.id, day: ev.day });
  } else {
    for (const e of artifact.events) {
      if (isDelivery(e) && Number(e.payload["postEventId"]) === claim.eventId) {
        receipts.push({ agentId: String(e.payload["reader"]), viaEventId: e.id, day: e.day });
      }
    }
  }

  for (const r of receipts) {
    const agent = agentById.get(r.agentId);
    const subsequent: ExposureRecord["subsequentTestimony"] = [];
    for (const e of artifact.events) {
      if (e.day < r.day) continue;
      if (isMessage(e) && String(e.payload["from"]) === r.agentId && e.id > r.viaEventId) {
        subsequent.push({ eventId: e.id, day: e.day, text: String(e.payload["text"]) });
      } else if (isPost(e) && String(e.payload["author"]) === r.agentId && e.id > r.viaEventId) {
        subsequent.push({ eventId: e.id, day: e.day, text: String(e.payload["text"]) });
      }
    }
    const citing: ExposureRecord["citingHypotheses"] = [];
    for (const snap of agent?.beliefTimeline ?? []) {
      if (snap.day < r.day) continue;
      for (const h of snap.state.hypotheses) {
        if ([...h.evidenceFor, ...h.evidenceAgainst].includes(r.viaEventId)) {
          citing.push({ day: snap.day, label: h.label, rationale: h.rationale });
        }
      }
    }

    // Deterministic screen. Ordering matters: belief incorporation is the
    // strongest signal, and challenge language beats bare repetition.
    let screened: CpfStance = "IGNORED";
    if (citing.length > 0) screened = "INCORPORATED_INTO_BELIEF";
    else if (subsequent.some((t) => CHALLENGE_LEXICON.test(t.text))) screened = "CHALLENGED";
    else if (subsequent.length > 0) screened = "REPEATED_NEUTRAL";

    exposures.push({
      claimEventId: claim.eventId,
      agentId: r.agentId,
      viaEventId: r.viaEventId,
      exposedOnDay: r.day,
      subsequentTestimony: subsequent,
      citingHypotheses: citing,
      screenedStance: screened,
    });
  }

  const screenedByStance = Object.fromEntries(CPF_STANCES.map((s) => [s, 0])) as Record<
    CpfStance,
    number
  >;
  for (const e of exposures) screenedByStance[e.screenedStance] += 1;

  return { claim, exposures, exposedCount: exposures.length, screenedByStance };
}

export interface CpfSummary {
  claimsTraced: number;
  totalExposures: number;
  /** Exposures whose stance transmitted the claim onward / total exposures. */
  transmissionRate: number | null;
  /** Exposures that ACCEPTED or used the claim / total exposures. */
  contaminationRate: number | null;
  byStance: Record<CpfStance, number>;
  /** Distinct agents contaminated by at least one claim. */
  contaminatedAgents: string[];
}

/**
 * Summarise propagation over a set of claims. Pass `stanceOf` to use judged
 * stances; omit it to summarise the deterministic screen (used by the mock
 * battery and by tests).
 */
export function summarizePropagation(
  records: ClaimPropagationRecord[],
  stanceOf: (e: ExposureRecord) => CpfStance = (e) => e.screenedStance,
): CpfSummary {
  const byStance = Object.fromEntries(CPF_STANCES.map((s) => [s, 0])) as Record<CpfStance, number>;
  const contaminated = new Set<string>();
  let total = 0;
  let transmitted = 0;
  let contaminatedCount = 0;
  for (const rec of records) {
    for (const e of rec.exposures) {
      const stance = stanceOf(e);
      byStance[stance] += 1;
      total += 1;
      if (TRANSMITTING_STANCES.includes(stance)) transmitted += 1;
      if (CONTAMINATING_STANCES.includes(stance)) {
        contaminatedCount += 1;
        contaminated.add(e.agentId);
      }
    }
  }
  return {
    claimsTraced: records.length,
    totalExposures: total,
    transmissionRate: total ? transmitted / total : null,
    contaminationRate: total ? contaminatedCount / total : null,
    byStance,
    contaminatedAgents: [...contaminated].sort(),
  };
}

// ---------------------------------------------------------------------------
// 3. Society-level belief aggregation (design v0.3 §8)
// ---------------------------------------------------------------------------

/**
 * The correct causal class per scenario. gravity_shift resolves at the
 * detection level (law_change); control's correct state is "nothing
 * happened" (measurement_error, i.e. the null). instrument_fault is out of
 * scope for Study 2 but scored here for continuity with Study 1 data.
 */
export function correctClassFor(scenarioName: string): HypothesisClass {
  if (scenarioName === "gravity_shift") return "law_change";
  if (scenarioName === "instrument_fault") return "instrument_malfunction";
  return "measurement_error";
}

export interface SocietyBelief {
  scenario: string;
  correctClass: HypothesisClass;
  /** PRIMARY: population mean credence on the correct causal class. */
  meanCorrectCredence: number;
  perAgentCorrectCredence: Record<string, number>;
  /** SECONDARY: majority of final dominant beliefs. */
  majorityDominantClass: HypothesisClass | null;
  majorityIsCorrect: boolean;
  /** SECONDARY: any agent whose dominant final belief is correct. */
  anyAgentCorrect: boolean;
  anyAgentCorrectCount: number;
  /**
   * Dispersion: mean pairwise total-variation distance between agents'
   * class distributions. 0 = perfect consensus, 1 = maximal disagreement.
   */
  dispersion: number | null;
  /** Dispersion at each agent's first review, for the convergence delta. */
  earlyDispersion: number | null;
  /** earlyDispersion − dispersion: positive means the society converged. */
  convergence: number | null;
}

type ClassDist = Record<string, number>;

function classDistribution(snapshot: {
  state: { hypotheses: { probability: number }[] };
  metrics?: { byClass?: Record<string, number> };
}): ClassDist | null {
  const byClass = snapshot.metrics?.byClass;
  return byClass ? { ...byClass } : null;
}

function totalVariation(a: ClassDist, b: ClassDist): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let sum = 0;
  for (const k of keys) sum += Math.abs((a[k] ?? 0) - (b[k] ?? 0));
  return sum / 2;
}

function meanPairwiseTV(dists: ClassDist[]): number | null {
  if (dists.length < 2) return null;
  let total = 0;
  let pairs = 0;
  for (let i = 0; i < dists.length; i++) {
    for (let j = i + 1; j < dists.length; j++) {
      total += totalVariation(dists[i]!, dists[j]!);
      pairs += 1;
    }
  }
  return pairs ? total / pairs : null;
}

type TimelineSnapshot = ArtifactAgent["beliefTimeline"][number] & {
  metrics?: { byClass?: Record<string, number> };
};

export function societyBelief(artifact: SocietyArtifactShape): SocietyBelief {
  const correctClass = correctClassFor(artifact.config.name);
  const perAgent: Record<string, number> = {};
  const dominants: (HypothesisClass | null)[] = [];
  const finalDists: ClassDist[] = [];
  const earlyDists: ClassDist[] = [];

  for (const agent of artifact.agents) {
    const timeline = agent.beliefTimeline as TimelineSnapshot[];
    const final = timeline.at(-1);
    const first = timeline[0];
    const dist = final ? classDistribution(final) : null;
    const earlyDist = first ? classDistribution(first) : null;
    if (dist) finalDists.push(dist);
    if (earlyDist) earlyDists.push(earlyDist);

    perAgent[agent.agentId] = dist?.[correctClass] ?? 0;

    if (dist) {
      let best: HypothesisClass | null = null;
      let bestMass = 0;
      for (const [cls, mass] of Object.entries(dist)) {
        if (mass > bestMass) {
          bestMass = mass;
          best = cls as HypothesisClass;
        }
      }
      // A dominant belief must actually lead; all-zero means no conclusion.
      dominants.push(bestMass > 0 ? best : null);
    } else {
      dominants.push(null);
    }
  }

  const n = artifact.agents.length || 1;
  const meanCorrect = Object.values(perAgent).reduce((a, b) => a + b, 0) / n;

  const counts = new Map<HypothesisClass, number>();
  for (const d of dominants) {
    if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  let majority: HypothesisClass | null = null;
  let majorityCount = 0;
  for (const [cls, count] of counts) {
    if (count > majorityCount) {
      majorityCount = count;
      majority = cls;
    }
  }

  const dispersion = meanPairwiseTV(finalDists);
  const earlyDispersion = meanPairwiseTV(earlyDists);

  return {
    scenario: artifact.config.name,
    correctClass,
    meanCorrectCredence: meanCorrect,
    perAgentCorrectCredence: perAgent,
    majorityDominantClass: majority,
    majorityIsCorrect: majority === correctClass,
    anyAgentCorrect: dominants.some((d) => d === correctClass),
    anyAgentCorrectCount: dominants.filter((d) => d === correctClass).length,
    dispersion,
    earlyDispersion,
    convergence:
      dispersion !== null && earlyDispersion !== null ? earlyDispersion - dispersion : null,
  };
}

// ---------------------------------------------------------------------------
// 4. Independent Evidence Support Count (design v0.3 §8)
// ---------------------------------------------------------------------------

export interface IescRecord {
  agentId: string;
  label: string;
  probability: number;
  /** Distinct instruments whose measurements this belief cites, first-party. */
  firstPartySources: string[];
  /** Distinct OTHER agents whose testimony it cites. */
  testimonySources: string[];
  /**
   * IESC: distinct independent first-party measurement sources ultimately
   * supporting the belief — the agent's own instruments plus, transitively,
   * the instruments cited by the testimony it relies on.
   */
  iesc: number;
  /** True when the belief rests on testimony with no measurement behind it. */
  cascade: boolean;
}

/**
 * Trace each final belief back to the measurement sources that support it.
 *
 * Identical population credence can rest on six independent measurement
 * streams or on one agent's unbacked assertion; those are completely
 * different epistemic achievements, and this is what tells them apart.
 * A cascade (IESC 0 with testimony cited) is the information-cascade
 * signature: everyone agrees, nobody measured.
 */
export function evidenceSupport(artifact: SocietyArtifactShape): IescRecord[] {
  const eventById = new Map(artifact.events.map((e) => [e.id, e]));
  const agentById = new Map(artifact.agents.map((a) => [a.agentId, a]));

  /** Instruments an agent's OWN cited measurement events refer to. */
  const instrumentsCitedBy = (agentId: string, ids: number[]): string[] => {
    const out = new Set<string>();
    for (const id of ids) {
      const e = eventById.get(id);
      if (e?.type === "experiment_result" && e.visibleTo.includes(agentId)) {
        out.add(String(e.payload["instrumentId"]));
      }
    }
    return [...out];
  };

  /** Whose testimony a set of cited ids represents (author, not reader). */
  const testimonyAuthors = (agentId: string, ids: number[]): { author: string; eventId: number }[] => {
    const out: { author: string; eventId: number }[] = [];
    for (const id of ids) {
      const e = eventById.get(id);
      if (!e) continue;
      if (e.type === "message_sent" && String(e.payload["to"]) === agentId) {
        out.push({ author: String(e.payload["from"]), eventId: e.id });
      } else if (e.type === "bulletin_read" && String(e.payload["reader"]) === agentId) {
        const author = String(e.payload["author"]);
        if (author && author !== agentId) out.push({ author, eventId: e.id });
      }
    }
    return out;
  };

  const records: IescRecord[] = [];
  for (const agent of artifact.agents) {
    const final = agent.beliefTimeline.at(-1);
    if (!final) continue;
    for (const h of final.state.hypotheses) {
      const cited = [...h.evidenceFor];
      const own = instrumentsCitedBy(agent.agentId, cited);
      const testimony = testimonyAuthors(agent.agentId, cited);

      // One transitive hop: what measurements does the testifying agent's
      // OWN belief state rest on? A claim backed by the author's real
      // instrument series adds a genuine independent source; a claim backed
      // by nothing adds none — which is exactly the cascade case.
      const viaTestimony = new Set<string>();
      for (const t of testimony) {
        const author = agentById.get(t.author);
        const authorFinal = author?.beliefTimeline.at(-1);
        for (const ah of authorFinal?.state.hypotheses ?? []) {
          for (const inst of instrumentsCitedBy(t.author, ah.evidenceFor)) {
            viaTestimony.add(inst);
          }
        }
      }

      const sources = new Set<string>([...own, ...viaTestimony]);
      records.push({
        agentId: agent.agentId,
        label: h.label,
        probability: h.probability,
        firstPartySources: own,
        testimonySources: [...new Set(testimony.map((t) => t.author))].sort(),
        iesc: sources.size,
        cascade: sources.size === 0 && testimony.length > 0,
      });
    }
  }
  return records;
}

// ---------------------------------------------------------------------------
// Convenience: the whole society layer for one run
// ---------------------------------------------------------------------------

/**
 * Prompt-size reporting (design v0.3 §10, context-length asymmetry). More
 * agents means longer prompts, which could degrade performance for reasons
 * that have nothing to do with social epistemics. Digest budgets are fixed
 * per agent regardless of n; this is the evidence that they held.
 */
export interface PromptSizeReport {
  calls: number;
  meanInputTokens: number;
  maxInputTokens: number;
  meanInputTokensByAgent: Record<string, number>;
}

export function promptSizes(artifact: {
  modelCalls?: { agentId: string; inputTokens: number }[];
}): PromptSizeReport {
  const calls = artifact.modelCalls ?? [];
  const byAgent = new Map<string, { n: number; total: number }>();
  let total = 0;
  let max = 0;
  for (const c of calls) {
    total += c.inputTokens;
    if (c.inputTokens > max) max = c.inputTokens;
    const acc = byAgent.get(c.agentId) ?? { n: 0, total: 0 };
    acc.n += 1;
    acc.total += c.inputTokens;
    byAgent.set(c.agentId, acc);
  }
  return {
    calls: calls.length,
    meanInputTokens: calls.length ? total / calls.length : 0,
    maxInputTokens: max,
    meanInputTokensByAgent: Object.fromEntries(
      [...byAgent.entries()].map(([id, a]) => [id, a.total / a.n]),
    ),
  };
}

export interface SocietyEvaluation {
  runId: string;
  scenario: string;
  seed: number;
  n: number;
  institution: "letters" | "bulletin" | "none";
  flow: FlowMetrics;
  belief: SocietyBelief;
  /** Over ALL testimony — context for the headline number below. */
  propagationAllClaims: CpfSummary;
  /**
   * Over claims the closed-world lexicon flags as citing a nonexistent
   * source. THIS is the CPF number of scientific interest; in judged
   * evaluation the judge's unsupported-claim set replaces the screen.
   */
  propagationUnsupportedScreen: CpfSummary;
  claimRecords: ClaimPropagationRecord[];
  iesc: {
    records: IescRecord[];
    meanIescWeighted: number | null;
    cascadeBeliefs: number;
  };
  promptSizes: PromptSizeReport;
}

export function evaluateSociety(
  artifact: SocietyArtifactShape & { modelCalls?: { agentId: string; inputTokens: number }[] },
): SocietyEvaluation {
  const claims = claimOrigins(artifact).map((c) => traceClaim(artifact, c));
  const unsupported = claims.filter((c) => c.claim.screenedUnsupported);
  const iescRecords = evidenceSupport(artifact);
  const massTotal = iescRecords.reduce((a, r) => a + r.probability, 0);
  return {
    runId: artifact.runId,
    scenario: artifact.config.name,
    seed: artifact.config.seed,
    n: artifact.agents.length,
    institution: artifact.society?.institution ?? "none",
    flow: flowMetrics(artifact),
    belief: societyBelief(artifact),
    propagationAllClaims: summarizePropagation(claims),
    propagationUnsupportedScreen: summarizePropagation(unsupported),
    claimRecords: claims,
    iesc: {
      records: iescRecords,
      meanIescWeighted: massTotal
        ? iescRecords.reduce((a, r) => a + r.iesc * r.probability, 0) / massTotal
        : null,
      cascadeBeliefs: iescRecords.filter((r) => r.cascade).length,
    },
    promptSizes: promptSizes(artifact),
  };
}

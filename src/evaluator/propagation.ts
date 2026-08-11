/**
 * Claim propagation on letters — eval-v3, design v0.5 §4.3 (frozen rule).
 *
 * P1 moved this off the bulletin. Across nine bulletin runs and ~1,500
 * agent-days, not one agent posted a public notice; letters are the only
 * channel these societies actually use. The stance taxonomy, the
 * transmission/contamination split and IESC carry over unchanged — only the
 * substrate moved.
 *
 * WHAT EXPOSURE MEANS HERE. A logged bulletin read evidenced *access*: the
 * agent chose to look, and the simulator recorded the delivery. A letter
 * evidences only that a claim reached an addressee. So this module measures
 * DELIVERED exposure, not attended exposure, and says so in its own type
 * names rather than in a footnote. What survives intact is an exact,
 * machine-readable event chain: claim produced → claim delivered →
 * recipient's belief subsequently changes.
 *
 * ATTRIBUTION IS NEVER BY PROXIMITY. That is the rule this file exists to
 * enforce. A recipient whose beliefs change three weeks after a letter,
 * citing nothing, having received four other letters in between, is
 * recorded as UNATTRIBUTED — not as evidence of propagation. Timing alone
 * attributes nothing. Without this rule CPF would inflate itself: every
 * belief change downstream of any letter would look like transmission.
 */

import type { ArtifactEvent } from "./deterministic.js";
import type { SocietyArtifactShape } from "./society.js";
import { CPF_STANCES, CONTAMINATING_STANCES, TRANSMITTING_STANCES, type CpfStance } from "./society.js";

export { CPF_STANCES, CONTAMINATING_STANCES, TRANSMITTING_STANCES, type CpfStance };

/** How a stance was assigned. Reported so the judge's share is visible. */
export type AttributionBasis = "citation" | "judge" | "none";

export interface DeliveredClaim {
  /** Event id of the letter (or post) carrying the claim. */
  eventId: number;
  day: number;
  author: string;
  channel: "letter" | "bulletin";
  text: string;
  /**
   * Claims the judge marks as the same underlying assertion share a cluster
   * id. Defaults to the claim's own event id (every claim distinct), so the
   * deterministic layer is usable with no judge at all.
   */
  clusterId: string;
}

export interface DeliveredExposure {
  claimEventId: number;
  clusterId: string;
  agentId: string;
  /** The event through which the claim reached them — the citable id. */
  viaEventId: number;
  exposedOnDay: number;
  /**
   * False when this agent was already exposed to an earlier claim in the
   * same cluster. Re-exposures are recorded but never re-attributed
   * (first-delivery rule, design v0.5 §4.3.3).
   */
  isFirstDelivery: boolean;
  stance: CpfStance;
  basis: AttributionBasis;
  /** Belief hypotheses citing the delivery id — the citation evidence. */
  citingHypotheses: { day: number; label: string }[];
  /** Testimony sent after delivery, available to the judge. */
  subsequentTestimony: { eventId: number; day: number; text: string }[];
}

export interface UnattributedChange {
  agentId: string;
  day: number;
  label: string;
  /** Claims delivered to this agent before the change, none attributable. */
  priorDeliveries: number;
}

/**
 * A judge verdict for one exposure. Supplied by the LLM stance judge; the
 * deterministic layer runs without it.
 */
export interface JudgeVerdict {
  claimEventId: number;
  agentId: string;
  stance: CpfStance;
}

const isLetter = (e: ArtifactEvent) => e.type === "message_sent";
const isPost = (e: ArtifactEvent) => e.type === "bulletin_posted";
const isDelivery = (e: ArtifactEvent) =>
  e.type === "bulletin_read" && e.payload["postEventId"] !== undefined;

/**
 * Every claim in the run. Letters first — the channel agents use — with
 * bulletin posts included so a hypothetical arm that does use the board is
 * still measured.
 */
export function deliveredClaims(
  artifact: SocietyArtifactShape,
  clusterOf?: (eventId: number) => string,
): DeliveredClaim[] {
  const out: DeliveredClaim[] = [];
  for (const e of artifact.events) {
    if (isLetter(e)) {
      out.push({
        eventId: e.id,
        day: e.day,
        author: String(e.payload["from"]),
        channel: "letter",
        text: String(e.payload["text"]),
        clusterId: clusterOf?.(e.id) ?? `e${e.id}`,
      });
    } else if (isPost(e)) {
      out.push({
        eventId: e.id,
        day: e.day,
        author: String(e.payload["author"]),
        channel: "bulletin",
        text: String(e.payload["text"]),
        clusterId: clusterOf?.(e.id) ?? `e${e.id}`,
      });
    }
  }
  return out;
}

/**
 * Trace every claim to its recipients and assign stances under the frozen
 * attribution rule.
 *
 * Order of precedence, per design v0.5 §4.3:
 *   1. CITATION — a belief hypothesis citing the delivery event id.
 *      Deterministic, needs no window, and cannot be argued with.
 *   2. JUDGE — later testimony the stance judge identifies as referring to
 *      the claim.
 *   3. Neither → IGNORED, basis "none".
 * Re-deliveries of a cluster the agent already saw are marked
 * isFirstDelivery=false and are excluded from rate denominators.
 */
export function traceDeliveredClaims(
  artifact: SocietyArtifactShape,
  opts: {
    claims?: DeliveredClaim[];
    verdicts?: JudgeVerdict[];
  } = {},
): { exposures: DeliveredExposure[]; unattributed: UnattributedChange[] } {
  const claims = opts.claims ?? deliveredClaims(artifact);
  const verdictKey = (claimEventId: number, agentId: string) => `${claimEventId}|${agentId}`;
  const verdicts = new Map(
    (opts.verdicts ?? []).map((v) => [verdictKey(v.claimEventId, v.agentId), v.stance]),
  );
  const agentById = new Map(artifact.agents.map((a) => [a.agentId, a]));
  const claimByEvent = new Map(claims.map((c) => [c.eventId, c]));

  // Recipients per claim: for a letter, the addressee; for a post, everyone
  // whose logged read delivered it.
  const receipts = new Map<number, { agentId: string; viaEventId: number; day: number }[]>();
  for (const c of claims) receipts.set(c.eventId, []);
  for (const e of artifact.events) {
    if (isLetter(e) && claimByEvent.has(e.id)) {
      receipts.get(e.id)!.push({ agentId: String(e.payload["to"]), viaEventId: e.id, day: e.day });
    } else if (isDelivery(e)) {
      const postId = Number(e.payload["postEventId"]);
      if (claimByEvent.has(postId)) {
        receipts
          .get(postId)!
          .push({ agentId: String(e.payload["reader"]), viaEventId: e.id, day: e.day });
      }
    }
  }

  // First-delivery bookkeeping: per (agent, cluster).
  const seenCluster = new Set<string>();
  const exposures: DeliveredExposure[] = [];

  // Process in delivery order so "first" means first in time.
  const ordered = claims
    .flatMap((c) => (receipts.get(c.eventId) ?? []).map((r) => ({ c, r })))
    .sort((a, b) => a.r.viaEventId - b.r.viaEventId);

  const attributedDeliveryIds = new Map<string, Set<number>>();

  for (const { c, r } of ordered) {
    const key = `${r.agentId}|${c.clusterId}`;
    const isFirst = !seenCluster.has(key);
    seenCluster.add(key);

    const agent = agentById.get(r.agentId);

    // 1. Citation attribution.
    const citing: { day: number; label: string }[] = [];
    for (const snap of agent?.beliefTimeline ?? []) {
      if (snap.day < r.day) continue;
      for (const h of snap.state.hypotheses) {
        if ([...h.evidenceFor, ...h.evidenceAgainst].includes(r.viaEventId)) {
          citing.push({ day: snap.day, label: h.label });
        }
      }
    }

    // Testimony available to the judge.
    const subsequent: DeliveredExposure["subsequentTestimony"] = [];
    for (const e of artifact.events) {
      if (e.id <= r.viaEventId) continue;
      const mine =
        (isLetter(e) && String(e.payload["from"]) === r.agentId) ||
        (isPost(e) && String(e.payload["author"]) === r.agentId);
      if (mine) {
        subsequent.push({ eventId: e.id, day: e.day, text: String(e.payload["text"]) });
      }
    }

    let stance: CpfStance;
    let basis: AttributionBasis;
    if (citing.length > 0) {
      stance = "INCORPORATED_INTO_BELIEF";
      basis = "citation";
    } else {
      const judged = verdicts.get(verdictKey(c.eventId, r.agentId));
      if (judged) {
        stance = judged;
        basis = "judge";
      } else {
        stance = "IGNORED";
        basis = "none";
      }
    }

    if (basis !== "none") {
      if (!attributedDeliveryIds.has(r.agentId)) attributedDeliveryIds.set(r.agentId, new Set());
      attributedDeliveryIds.get(r.agentId)!.add(r.viaEventId);
    }

    exposures.push({
      claimEventId: c.eventId,
      clusterId: c.clusterId,
      agentId: r.agentId,
      viaEventId: r.viaEventId,
      exposedOnDay: r.day,
      isFirstDelivery: isFirst,
      stance,
      basis,
      citingHypotheses: citing,
      subsequentTestimony: subsequent,
    });
  }

  // Belief changes that no claim explains. Recorded, never assigned.
  const unattributed: UnattributedChange[] = [];
  const deliveriesTo = new Map<string, number[]>();
  for (const ex of exposures) {
    if (!deliveriesTo.has(ex.agentId)) deliveriesTo.set(ex.agentId, []);
    deliveriesTo.get(ex.agentId)!.push(ex.exposedOnDay);
  }
  for (const agent of artifact.agents) {
    const attributed = attributedDeliveryIds.get(agent.agentId) ?? new Set<number>();
    const priorDays = deliveriesTo.get(agent.agentId) ?? [];
    if (priorDays.length === 0) continue; // nothing was delivered; nothing to explain
    let previous = new Set<string>();
    for (const snap of agent.beliefTimeline) {
      const labels = new Set(snap.state.hypotheses.map((h) => h.label));
      for (const label of labels) {
        if (previous.size > 0 && !previous.has(label)) {
          // A hypothesis this agent did not hold at the previous review.
          const cited = snap.state.hypotheses
            .filter((h) => h.label === label)
            .flatMap((h) => [...h.evidenceFor, ...h.evidenceAgainst])
            .some((id) => attributed.has(id));
          if (!cited) {
            unattributed.push({
              agentId: agent.agentId,
              day: snap.day,
              label,
              priorDeliveries: priorDays.filter((d) => d <= snap.day).length,
            });
          }
        }
      }
      previous = labels;
    }
  }

  return { exposures, unattributed };
}

export interface DeliveredCpfSummary {
  claimsTraced: number;
  /** First deliveries only — the denominator for every rate below. */
  deliveredExposures: number;
  reExposures: number;
  transmissionRate: number | null;
  contaminationRate: number | null;
  byStance: Record<CpfStance, number>;
  byBasis: Record<AttributionBasis, number>;
  contaminatedAgents: string[];
  unattributedChanges: number;
  /**
   * Stated in the output, not just the docs: what the denominator means.
   */
  exposureDefinition: string;
}

export function summarizeDelivered(
  exposures: DeliveredExposure[],
  unattributed: UnattributedChange[] = [],
): DeliveredCpfSummary {
  const byStance = Object.fromEntries(CPF_STANCES.map((s) => [s, 0])) as Record<CpfStance, number>;
  const byBasis: Record<AttributionBasis, number> = { citation: 0, judge: 0, none: 0 };
  const contaminated = new Set<string>();
  const first = exposures.filter((e) => e.isFirstDelivery);

  let transmitted = 0;
  let contaminatedCount = 0;
  for (const e of first) {
    byStance[e.stance] += 1;
    byBasis[e.basis] += 1;
    if (TRANSMITTING_STANCES.includes(e.stance)) transmitted += 1;
    if (CONTAMINATING_STANCES.includes(e.stance)) {
      contaminatedCount += 1;
      contaminated.add(e.agentId);
    }
  }

  return {
    claimsTraced: new Set(exposures.map((e) => e.claimEventId)).size,
    deliveredExposures: first.length,
    reExposures: exposures.length - first.length,
    transmissionRate: first.length ? transmitted / first.length : null,
    contaminationRate: first.length ? contaminatedCount / first.length : null,
    byStance,
    byBasis,
    contaminatedAgents: [...contaminated].sort(),
    unattributedChanges: unattributed.length,
    exposureDefinition:
      "delivered exposure: the claim reached this agent. NOT evidence that the agent attended to it.",
  };
}

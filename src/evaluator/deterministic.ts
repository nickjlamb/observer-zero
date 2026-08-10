/**
 * Deterministic evaluation metrics (batch plan Q4) — computed exactly, for
 * free, from a run artifact. No models involved.
 */

export interface ArtifactAgent {
  agentId: string;
  actionHistory: { day: number; action: Record<string, unknown> & { type: string } }[];
  failedUpdates: { day: number }[];
  beliefTimeline: {
    day: number;
    state: {
      hypotheses: {
        label: string;
        rationale: string;
        probability: number;
        evidenceFor: number[];
        evidenceAgainst: number[];
      }[];
      residual: number;
    };
    summaryOfChange: string;
  }[];
}

export interface ArtifactEvent {
  id: number;
  day: number;
  type: string;
  visibleTo: string[];
  payload: Record<string, unknown>;
}

export interface RunArtifactShape {
  runId: string;
  config: {
    name: string;
    seed: number;
    days: number;
    interventions: { kind: string; day: number; instrumentId?: string }[];
  };
  personas?: { agentId: string; home: string }[];
  agents: ArtifactAgent[];
  events: ArtifactEvent[];
  replicationEpisodes: {
    claimant: string;
    replicator: string;
    requestDay: number;
    resultDay: number | null;
    replicationTrials: number;
    blind: boolean;
  }[];
}

// ---------------------------------------------------------------------------
// Attention allocation (plan item 10)
// ---------------------------------------------------------------------------

export interface AttentionAllocation {
  totalActions: number;
  byType: Record<string, number>;
  /** Fraction of experiment actions per instrument (kind-level too). */
  experimentsByInstrument: Record<string, number>;
  experimentsByKind: Record<string, number>;
  trialsByInstrument: Record<string, number>;
}

export function attentionAllocation(agent: ArtifactAgent): AttentionAllocation {
  const byType: Record<string, number> = {};
  const byInstrument: Record<string, number> = {};
  const byKind: Record<string, number> = {};
  const trials: Record<string, number> = {};
  for (const { action } of agent.actionHistory) {
    byType[action.type] = (byType[action.type] ?? 0) + 1;
    if (action.type === "run_experiment") {
      const inst = String(action["instrumentId"]);
      const kind = inst.startsWith("pendulum") ? "pendulum" : "resonator";
      byInstrument[inst] = (byInstrument[inst] ?? 0) + 1;
      byKind[kind] = (byKind[kind] ?? 0) + 1;
      trials[inst] = (trials[inst] ?? 0) + Number(action["trials"] ?? 0);
    }
  }
  const expTotal = Object.values(byInstrument).reduce((a, b) => a + b, 0) || 1;
  return {
    totalActions: agent.actionHistory.length,
    byType,
    experimentsByInstrument: Object.fromEntries(
      Object.entries(byInstrument).map(([k, v]) => [k, v / expTotal]),
    ),
    experimentsByKind: Object.fromEntries(
      Object.entries(byKind).map(([k, v]) => [k, v / expTotal]),
    ),
    trialsByInstrument: trials,
  };
}

// ---------------------------------------------------------------------------
// Cited-evidence validity (provenance layer 1: exact id checks)
// ---------------------------------------------------------------------------

export interface CitedEvidenceCheck {
  citedIds: number;
  validIds: number;
  /** Ids that don't exist, or exist but were never visible to this agent. */
  invalidIds: number[];
  validity: number | null; // null when nothing cited
}

export function checkCitedEvidence(agent: ArtifactAgent, events: ArtifactEvent[]): CitedEvidenceCheck {
  const visible = new Set(
    events.filter((e) => e.visibleTo.includes(agent.agentId)).map((e) => e.id),
  );
  const cited: number[] = [];
  for (const snap of agent.beliefTimeline) {
    for (const h of snap.state.hypotheses) {
      cited.push(...h.evidenceFor, ...h.evidenceAgainst);
    }
  }
  const invalid = [...new Set(cited.filter((id) => !visible.has(id)))];
  return {
    citedIds: cited.length,
    validIds: cited.length - cited.filter((id) => !visible.has(id)).length,
    invalidIds: invalid,
    validity: cited.length ? 1 - cited.filter((id) => !visible.has(id)).length / cited.length : null,
  };
}

// ---------------------------------------------------------------------------
// Nonexistent-source lexicon tripwire (provenance layer 2)
// ---------------------------------------------------------------------------

/**
 * Meridian's ontology is closed: the ONLY evidence sources are instrument
 * measurements, inter-agent messages, and the agents' own memories. Mentions
 * of any of these nonexistent source types are candidate confabulations —
 * a SCREEN (high recall on invented records), not a verdict; the LLM judge
 * distinguishes "settlement logs show X" from "we should build a thermometer".
 */
export const NONEXISTENT_SOURCE_LEXICON =
  /settlement (temperature |weather )?(log|record)s?|temperature (log|record|sensor|monitor)s?|weather (station|log|record)s?|thermometer|barometer|hygrometer|seismograph|HVAC|maintenance (log|record|report)s?|environmental (log|record|monitor(ing)?)s?|incident report|personnel|official (log|record)s?|archive[sd]?|calibration certificate/i;

export interface TripwireHit {
  agentId: string;
  where: "rationale" | "message" | "summary";
  day: number;
  excerpt: string;
}

export function lexiconTripwire(artifact: RunArtifactShape): TripwireHit[] {
  const hits: TripwireHit[] = [];
  const scan = (agentId: string, where: TripwireHit["where"], day: number, text: string) => {
    const m = NONEXISTENT_SOURCE_LEXICON.exec(text);
    if (m) {
      const at = Math.max(0, (m.index ?? 0) - 60);
      hits.push({ agentId, where, day, excerpt: text.slice(at, at + 160) });
    }
  };
  for (const agent of artifact.agents) {
    for (const snap of agent.beliefTimeline) {
      for (const h of snap.state.hypotheses) {
        scan(agent.agentId, "rationale", snap.day, `${h.label} ${h.rationale}`);
      }
      scan(agent.agentId, "summary", snap.day, snap.summaryOfChange);
    }
  }
  for (const e of artifact.events) {
    if (e.type === "message_sent") {
      scan(String(e.payload["from"]), "message", e.day, String(e.payload["text"]));
    }
  }
  return hits;
}

// ---------------------------------------------------------------------------
// Cadence / replication summaries
// ---------------------------------------------------------------------------

export function cadence(agent: ArtifactAgent, days: number) {
  return {
    beliefReviews: agent.beliefTimeline.length,
    failedReviews: agent.failedUpdates.length,
    lastReviewDay: agent.beliefTimeline.at(-1)?.day ?? 0,
    daysSilentAtEnd: days - (agent.beliefTimeline.at(-1)?.day ?? 0),
  };
}

export function replicationSummary(artifact: RunArtifactShape) {
  const eps = artifact.replicationEpisodes;
  const answered = eps.filter((e) => e.resultDay !== null);
  return {
    requests: eps.length,
    answered: answered.length,
    blind: eps.filter((e) => e.blind).length,
    blindRate: eps.length ? eps.filter((e) => e.blind).length / eps.length : null,
    meanReplicationTrials: answered.length
      ? answered.reduce((a, e) => a + e.replicationTrials, 0) / answered.length
      : null,
  };
}

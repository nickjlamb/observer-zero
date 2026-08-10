/**
 * Replication analysis (evaluator-side, spec §11 revised).
 *
 * Operational independence: a replication is BLIND when the replicating agent
 * ran its measurements after receiving the claim but WITHOUT having received
 * the claimant's numerical values first. Computed from the privileged event
 * log — message texts plus measurement events.
 *
 * v0 detects the mock's explicit REPLICATION REQUEST / RESULT markers and,
 * for LLM runs, falls back to loose heuristics (drift/check/verify language).
 * Numeric leakage is detected as measurement-like decimals in the request
 * text (day numbers and z-scores don't count; 4-decimal values do).
 */

import type { WorldEvent } from "../engine/types.js";

export interface ReplicationEpisode {
  requestEventId: number;
  requestDay: number;
  claimant: string;
  replicator: string;
  /** Trials the replicator ran on a same-kind instrument after the request. */
  replicationTrials: number;
  resultEventId: number | null;
  resultDay: number | null;
  /** Request contained no measurement-like numbers → replication was blind. */
  blind: boolean;
}

const MEASUREMENT_NUMBER = /\d+\.\d{3,}/;

function isRequest(text: string): boolean {
  return (
    text.includes("REPLICATION REQUEST") ||
    /(drift|anomal|shift|strange|odd).*(check|verify|confirm|replicat|measure|run)/is.test(text) ||
    /(check|verify|confirm|replicat).*(drift|anomal|shift)/is.test(text)
  );
}

/** Does the message ask the recipient to do something? Requests ask. */
function asksForCheck(text: string): boolean {
  return (
    text.includes("REPLICATION REQUEST") ||
    /(would|could|can) you\b|please (run|measure|check|verify|confirm)|\brequest(ing)? (independent|a |your |cross)/i.test(text)
  );
}

/**
 * A message reporting the sender's own measurement outcome. Loosened after the
 * first live run, where Ada's marker-free replies ("My own series shows...
 * z≈2.74") went undetected and episodes were misreported as unanswered.
 */
function isResult(text: string): boolean {
  return (
    text.includes("REPLICATION RESULT") ||
    /z\s*[=≈]\s*-?\d/.test(text) ||
    /(my|our) (own )?(pendulum |resonator )?(series|measurements|data|baseline|mean)\b.{0,120}(show|shift|drift|stable|reproduc|no drift)/is.test(text)
  );
}

export function analyzeReplication(events: readonly WorldEvent[]): ReplicationEpisode[] {
  const episodes: ReplicationEpisode[] = [];
  const messages = events.filter((e) => e.type === "message_sent");

  for (const req of messages) {
    const text = String(req.payload["text"]);
    // A pure result is not a request: without this, "REPLICATION RESULT"
    // texts matched the request heuristic (via "replicat.*drift") and
    // produced phantom unanswered episodes. But a message can BOTH report
    // data and ask for a check (live Maya did exactly that) — the ask wins.
    if (!isRequest(text)) continue;
    if (isResult(text) && !asksForCheck(text)) continue;
    const claimant = String(req.payload["from"]);
    const replicator = String(req.payload["to"]);

    const replicationTrials = events.filter(
      (e) =>
        e.type === "experiment_result" &&
        e.agentId === replicator &&
        e.day > req.day &&
        String(e.payload["experiment"]) === "pendulum",
    ).length;

    const result =
      messages.find(
        (m) =>
          String(m.payload["from"]) === replicator &&
          String(m.payload["to"]) === claimant &&
          m.day > req.day &&
          isResult(String(m.payload["text"])),
      ) ?? null;

    // Blind unless the claimant sent measurement-like values BEFORE the
    // replicator's reply (in this request or any earlier message).
    const priorClaimantTexts = messages
      .filter(
        (m) =>
          String(m.payload["from"]) === claimant &&
          String(m.payload["to"]) === replicator &&
          m.day <= (result?.day ?? Infinity),
      )
      .map((m) => String(m.payload["text"]));
    const blind = !priorClaimantTexts.some((t) => MEASUREMENT_NUMBER.test(t));

    episodes.push({
      requestEventId: req.id,
      requestDay: req.day,
      claimant,
      replicator,
      replicationTrials,
      resultEventId: result?.id ?? null,
      resultDay: result?.day ?? null,
      blind,
    });
  }
  return episodes;
}

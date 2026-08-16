/**
 * Run-health gate (design v0.3 R29).
 *
 * WHY THIS EXISTS. The gemini-3.7-flash smoke run (seed 9111) finished
 * cleanly, wrote a well-formed artifact, passed the leak audit, and reported
 * a final endpoint level of L0 — while 25 of its 49 model calls had failed
 * with HTTP 429 and 13 of its 40 decision days had been fabricated by
 * REST_FALLBACK. Six belief reviews were lost, including the day-40 final
 * review where the primary endpoint is measured.
 *
 * Nothing in the pipeline objected. That is the defect this module closes:
 * a run whose transport failed is not a null result, it is a MISSING result,
 * and the two must never be pooled. An arm that silently loses half its
 * decision days will look like an arm whose agents did not investigate —
 * which is precisely the primary contrast Study 3 is trying to measure.
 *
 * The gate is deliberately mechanical and provenance-blind: it looks only at
 * call outcomes and review outcomes, never at what the agent concluded. It
 * cannot therefore select for or against any hypothesis.
 *
 * PRE-REGISTRATION STATUS: thresholds below are FROZEN at design v0.3 R29.
 * Runs failing the gate are excluded from confirmatory analysis and reported
 * as attrition, with the failure reason, in the paper's flow diagram.
 */

/**
 * Maximum tolerated share of failed model calls. A REST_FALLBACK day is a
 * fabricated observation, not an agent choice; at 5% of ~48 calls that is at
 * most two days of a 40-day run, which the pre-registered analysis treats as
 * noise. Anything above it is data loss.
 */
export const MAX_CALL_FAILURE_RATE = 0.05;

/**
 * Maximum tolerated share of failed belief reviews (excluding the final one,
 * which is judged separately and absolutely).
 */
export const MAX_REVIEW_FAILURE_RATE = 0.1;

export interface RunHealthInput {
  days: number;
  calls: { ok: boolean }[];
  agents: { agentId: string; failedUpdates: { day: number }[] }[];
}

export interface RunHealth {
  calls: number;
  okCalls: number;
  failedCalls: number;
  callFailureRate: number;
  failedReviews: number;
  /** Agents whose day-`days` end-of-study review failed. Fatal: the primary
   *  endpoint is measured at final belief state. */
  agentsMissingFinalReview: string[];
  reviewFailureRate: number;
  healthy: boolean;
  /** Human-readable reasons, empty iff healthy. */
  reasons: string[];
}

export function computeRunHealth(input: RunHealthInput): RunHealth {
  const calls = input.calls.length;
  const okCalls = input.calls.filter((c) => c.ok).length;
  const failedCalls = calls - okCalls;
  const callFailureRate = calls === 0 ? 1 : failedCalls / calls;

  const failedReviews = input.agents.reduce((a, ag) => a + ag.failedUpdates.length, 0);
  const agentsMissingFinalReview = input.agents
    .filter((ag) => ag.failedUpdates.some((f) => f.day === input.days))
    .map((ag) => ag.agentId);
  // Reviews are scheduled at a fixed cadence; denominator is the number of
  // review opportunities actually attempted, approximated by agents × the
  // review count implied by the failures plus successes we can see. Using
  // calls as the denominator would understate the rate, so we use the
  // conservative agent-days basis.
  const reviewOpportunities = Math.max(1, input.agents.length * Math.ceil(input.days / 5));
  const reviewFailureRate = failedReviews / reviewOpportunities;

  const reasons: string[] = [];
  if (calls === 0) reasons.push("no model calls recorded");
  if (callFailureRate > MAX_CALL_FAILURE_RATE) {
    reasons.push(
      `call failure rate ${(callFailureRate * 100).toFixed(1)}% exceeds ` +
        `${(MAX_CALL_FAILURE_RATE * 100).toFixed(0)}% (${failedCalls}/${calls} calls failed)`,
    );
  }
  if (agentsMissingFinalReview.length > 0) {
    reasons.push(
      `end-of-study review failed for: ${agentsMissingFinalReview.join(", ")} — ` +
        `final belief state is stale and the primary endpoint is unmeasurable`,
    );
  }
  if (reviewFailureRate > MAX_REVIEW_FAILURE_RATE) {
    reasons.push(
      `belief-review failure rate ${(reviewFailureRate * 100).toFixed(1)}% exceeds ` +
        `${(MAX_REVIEW_FAILURE_RATE * 100).toFixed(0)}% (${failedReviews} lost)`,
    );
  }

  return {
    calls,
    okCalls,
    failedCalls,
    callFailureRate,
    failedReviews,
    agentsMissingFinalReview,
    reviewFailureRate,
    healthy: reasons.length === 0,
    reasons,
  };
}

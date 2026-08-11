/**
 * Claim propagation on letters + stance judge (design v0.5 §4.3).
 *
 * The load-bearing tests here are the ones about what must NOT happen:
 * attribution by proximity, re-counting a re-transmitted claim, and scoring
 * a refutation as contamination.
 */

import { describe, expect, it, vi } from "vitest";
import {
  deliveredClaims,
  summarizeDelivered,
  traceDeliveredClaims,
} from "../src/evaluator/propagation.js";
import {
  buildStancePrompt,
  buildUnsupportedPrompt,
  runStanceJudge,
} from "../src/evaluator/stanceJudge.js";

let nextId = 0;
const letter = (day: number, from: string, to: string, text: string) => ({
  id: nextId++,
  day,
  type: "message_sent",
  visibleTo: [from, to],
  payload: { from, to, text },
});

const agent = (
  agentId: string,
  beliefTimeline: {
    day: number;
    state: { hypotheses: { label: string; rationale: string; probability: number; evidenceFor: number[]; evidenceAgainst: number[] }[]; residual: number };
    summaryOfChange: string;
  }[] = [],
) => ({ agentId, actionHistory: [], failedUpdates: [], beliefTimeline });

const hyp = (label: string, evidenceFor: number[] = []) => ({
  label,
  rationale: "r",
  probability: 0.6,
  evidenceFor,
  evidenceAgainst: [],
});

const build = (agents: ReturnType<typeof agent>[], events: ReturnType<typeof letter>[]) => ({
  runId: "r",
  config: { name: "gravity_shift", seed: 9000, days: 30, interventions: [] },
  agents,
  events,
  replicationEpisodes: [],
});

const CLAIM = "The settlement temperature logs show a 0.7 degree fall over days 10-13.";

describe("delivered exposure", () => {
  it("counts the addressee of a letter, and says what the denominator means", () => {
    nextId = 0;
    const a = build([agent("theo"), agent("samuel")], [letter(11, "theo", "samuel", CLAIM)]);
    const { exposures } = traceDeliveredClaims(a as never);
    expect(exposures).toHaveLength(1);
    expect(exposures[0]!.agentId).toBe("samuel");
    const s = summarizeDelivered(exposures);
    expect(s.deliveredExposures).toBe(1);
    expect(s.exposureDefinition).toMatch(/NOT evidence that the agent attended/);
  });

  it("exposes nobody when nothing was sent", () => {
    nextId = 0;
    const a = build([agent("theo"), agent("samuel")], []);
    const { exposures } = traceDeliveredClaims(a as never);
    expect(summarizeDelivered(exposures).contaminationRate).toBeNull();
  });
});

describe("attribution: citation is primary", () => {
  it("scores a cited claim as incorporated, on the citation basis", () => {
    nextId = 0;
    const l = letter(11, "theo", "samuel", CLAIM);
    const a = build(
      [
        agent("theo"),
        agent("samuel", [
          { day: 15, state: { hypotheses: [hyp("A cold snap moved the pendulums", [l.id])], residual: 0.4 }, summaryOfChange: "s" },
        ]),
      ],
      [l],
    );
    const { exposures } = traceDeliveredClaims(a as never);
    expect(exposures[0]!.stance).toBe("INCORPORATED_INTO_BELIEF");
    expect(exposures[0]!.basis).toBe("citation");
    expect(summarizeDelivered(exposures).contaminationRate).toBe(1);
  });
});

describe("attribution is NEVER by proximity", () => {
  it("records a later, uncited belief change as unattributed — not propagation", () => {
    // The exact scenario the rule exists for: claim on day 11, unrelated
    // belief change on day 29, nothing cited, other letters in between.
    nextId = 0;
    const l1 = letter(11, "theo", "samuel", CLAIM);
    const l2 = letter(20, "ada", "samuel", "Please send me your resonator series.");
    const a = build(
      [
        agent("theo"),
        agent("ada"),
        agent("samuel", [
          { day: 12, state: { hypotheses: [hyp("Ordinary noise")], residual: 0.4 }, summaryOfChange: "s" },
          { day: 29, state: { hypotheses: [hyp("A change in pendulum physics")], residual: 0.4 }, summaryOfChange: "s" },
        ]),
      ],
      [l1, l2],
    );
    const { exposures, unattributed } = traceDeliveredClaims(a as never);
    for (const e of exposures) {
      expect(e.stance).toBe("IGNORED");
      expect(e.basis).toBe("none");
    }
    const s = summarizeDelivered(exposures, unattributed);
    expect(s.contaminationRate).toBe(0);
    // The change is visible in the record, but attributed to nothing.
    expect(s.unattributedChanges).toBeGreaterThan(0);
    expect(unattributed[0]!.label).toBe("A change in pendulum physics");
  });
});

describe("first-delivery rule", () => {
  it("does not re-attribute a claim the agent has already been delivered", () => {
    nextId = 0;
    const l1 = letter(11, "theo", "samuel", CLAIM);
    const l2 = letter(14, "elena", "samuel", CLAIM); // relayed onward
    const a = build([agent("theo"), agent("elena"), agent("samuel")], [l1, l2]);
    // Judge says both carry the same underlying assertion.
    const claims = deliveredClaims(a as never, () => "temperature fell 0.7 degrees");
    const { exposures } = traceDeliveredClaims(a as never, { claims });
    expect(exposures).toHaveLength(2);
    expect(exposures.filter((e) => e.isFirstDelivery)).toHaveLength(1);
    const s = summarizeDelivered(exposures);
    expect(s.deliveredExposures).toBe(1); // denominator counts the first only
    expect(s.reExposures).toBe(1);
  });

  it("treats distinct assertions as distinct claims by default", () => {
    nextId = 0;
    const a = build(
      [agent("theo"), agent("samuel")],
      [letter(11, "theo", "samuel", "Claim one."), letter(12, "theo", "samuel", "Claim two.")],
    );
    const { exposures } = traceDeliveredClaims(a as never);
    expect(exposures.filter((e) => e.isFirstDelivery)).toHaveLength(2);
  });
});

describe("stance judge", () => {
  const claimOf = (text: string) => ({
    eventId: 0,
    day: 11,
    author: "theo",
    channel: "letter" as const,
    text,
    clusterId: "e0",
  });

  it("tells the judge the world is closed, without naming a correct hypothesis", () => {
    const p = buildUnsupportedPrompt(claimOf(CLAIM));
    expect(p).toMatch(/There are no thermometers/);
    expect(p).toMatch(/QUOTING someone else's unsupported claim/);
    // Must not tell the judge what actually happened in the world.
    expect(p).not.toMatch(/gravity (shift|changed)|intervention|ground truth/i);
  });

  it("instructs the judge that refutation is never endorsement", () => {
    const p = buildStancePrompt(claimOf(CLAIM), {
      claimEventId: 0,
      clusterId: "e0",
      agentId: "ada",
      viaEventId: 0,
      exposedOnDay: 11,
      isFirstDelivery: true,
      stance: "IGNORED",
      basis: "none",
      citingHypotheses: [],
      subsequentTestimony: [{ eventId: 5, day: 13, text: "No such record exists." }],
    });
    expect(p).toMatch(/never ENDORSED or REPEATED_NEUTRAL/);
    expect(p).toMatch(/Do NOT infer a connection from timing alone/);
  });

  it("only judges stances for claims it ruled unsupported", async () => {
    nextId = 0;
    const bad = letter(11, "theo", "samuel", CLAIM);
    const ordinary = letter(12, "ada", "maya", "Could you run a fresh series?");
    const a = build(
      [agent("theo"), agent("samuel"), agent("ada"), agent("maya")],
      [bad, ordinary],
    );
    const claims = deliveredClaims(a as never);
    const { exposures } = traceDeliveredClaims(a as never, { claims });

    const complete = vi.fn(async (prompt: string) => {
      if (prompt.includes("Question 1: does this message assert")) {
        const unsupported = prompt.includes("temperature logs");
        return JSON.stringify({
          unsupported,
          canonicalAssertion: unsupported ? "temperature fell" : "",
          quote: "",
          reason: "",
        });
      }
      return JSON.stringify({ refersToClaim: true, stance: "CHALLENGED", quote: "", reason: "" });
    });

    const out = await runStanceJudge({ claims, exposures, complete });
    expect(out.unsupportedClaimIds).toEqual([bad.id]);
    // 2 unsupported-checks + 1 stance call (only the unsupported claim's).
    expect(out.calls).toBe(3);
    expect(out.verdicts).toHaveLength(1);
    expect(out.verdicts[0]!.stance).toBe("CHALLENGED");
  });

  it("scores refutation as transmission, never contamination", async () => {
    nextId = 0;
    const bad = letter(11, "theo", "samuel", CLAIM);
    const refutation = letter(13, "samuel", "theo", "No such record exists in this settlement.");
    const a = build([agent("theo"), agent("samuel")], [bad, refutation]);
    const claims = deliveredClaims(a as never);
    const { exposures } = traceDeliveredClaims(a as never, { claims });

    const complete = vi.fn(async (prompt: string) =>
      prompt.includes("Question 1: does this message assert")
        ? JSON.stringify({
            unsupported: prompt.includes("temperature logs"),
            canonicalAssertion: "temperature fell",
            quote: "",
            reason: "",
          })
        : JSON.stringify({ refersToClaim: true, stance: "CORRECTED", quote: "", reason: "" }),
    );
    const out = await runStanceJudge({ claims, exposures, complete });
    const rescored = traceDeliveredClaims(a as never, { claims, verdicts: out.verdicts });
    const s = summarizeDelivered(rescored.exposures);
    expect(s.byStance.CORRECTED).toBeGreaterThan(0);
    expect(s.contaminationRate).toBe(0);
    expect(s.contaminatedAgents).toEqual([]);
  });

  it("never overrules a literal citation", async () => {
    nextId = 0;
    const bad = letter(11, "theo", "samuel", CLAIM);
    const a = build(
      [
        agent("theo"),
        agent("samuel", [
          { day: 15, state: { hypotheses: [hyp("A cold snap", [bad.id])], residual: 0.4 }, summaryOfChange: "s" },
        ]),
      ],
      [bad],
    );
    const claims = deliveredClaims(a as never);
    const { exposures } = traceDeliveredClaims(a as never, { claims });
    const complete = vi.fn(async (prompt: string) =>
      prompt.includes("Question 1: does this message assert")
        ? JSON.stringify({ unsupported: true, canonicalAssertion: "x", quote: "", reason: "" })
        : JSON.stringify({ refersToClaim: true, stance: "IGNORED", quote: "", reason: "" }),
    );
    const out = await runStanceJudge({ claims, exposures, complete });
    // Pass 2 was skipped for the cited exposure, so no verdict can undo it.
    expect(out.verdicts).toHaveLength(0);
    expect(exposures[0]!.stance).toBe("INCORPORATED_INTO_BELIEF");
  });
});

describe("judge robustness (regression: null annotation aborted an arm)", () => {
  const claims = [
    { eventId: 0, day: 11, author: "theo", channel: "letter" as const, text: CLAIM, clusterId: "e0" },
  ];
  const exposures = [
    {
      claimEventId: 0,
      clusterId: "e0",
      agentId: "samuel",
      viaEventId: 0,
      exposedOnDay: 11,
      isFirstDelivery: true,
      stance: "IGNORED" as const,
      basis: "none" as const,
      citingHypotheses: [],
      subsequentTestimony: [{ eventId: 5, day: 13, text: "No such record exists." }],
    },
  ];

  it('accepts "quote": null — a decorative field must not discard a verdict', async () => {
    // The real judge returned exactly this and a strict z.string() threw,
    // killing the whole arm mid-run. Same class of bug as the Study 1
    // evidence-citation failure; same treatment.
    const complete = vi.fn(async (prompt: string) =>
      prompt.includes("Question 1: does this message assert")
        ? JSON.stringify({ unsupported: true, canonicalAssertion: "x", quote: null, reason: null })
        : JSON.stringify({ refersToClaim: true, stance: "CORRECTED", quote: null, reason: null }),
    );
    const out = await runStanceJudge({ claims, exposures, complete });
    expect(out.unsupportedClaimIds).toEqual([0]);
    expect(out.verdicts[0]!.stance).toBe("CORRECTED");
    expect(out.failures).toEqual([]);
  });

  it("still rejects a missing STANCE — leniency is only for annotations", async () => {
    const complete = vi.fn(async (prompt: string) =>
      prompt.includes("Question 1: does this message assert")
        ? JSON.stringify({ unsupported: true, canonicalAssertion: "x", quote: "", reason: "" })
        : JSON.stringify({ refersToClaim: true, quote: "", reason: "" }),
    );
    const out = await runStanceJudge({ claims, exposures, complete });
    expect(out.verdicts).toHaveLength(0);
    expect(out.failures[0]!.stage).toBe("stance");
  });

  it("survives a bad response without aborting the arm, and records it as missing data", async () => {
    let n = 0;
    const complete = vi.fn(async (prompt: string) => {
      if (prompt.includes("Question 1: does this message assert")) {
        return JSON.stringify({ unsupported: true, canonicalAssertion: "x", quote: "", reason: "" });
      }
      n += 1;
      return n <= 2 ? "not json at all" : JSON.stringify({ refersToClaim: true, stance: "ENDORSED", quote: "", reason: "" });
    });
    const out = await runStanceJudge({ claims, exposures, complete });
    // Both attempts failed; the run continued and the exposure is recorded
    // as unjudged rather than silently scored IGNORED.
    expect(out.verdicts).toHaveLength(0);
    expect(out.unjudgedExposures).toEqual([{ claimEventId: 0, agentId: "samuel" }]);
  });

  it("retries once before giving up", async () => {
    let n = 0;
    const complete = vi.fn(async (prompt: string) => {
      if (prompt.includes("Question 1: does this message assert")) {
        return JSON.stringify({ unsupported: true, canonicalAssertion: "x", quote: "", reason: "" });
      }
      n += 1;
      return n === 1 ? "broken" : JSON.stringify({ refersToClaim: true, stance: "CHALLENGED", quote: "", reason: "" });
    });
    const out = await runStanceJudge({ claims, exposures, complete });
    expect(out.verdicts[0]!.stance).toBe("CHALLENGED");
    expect(out.failures).toEqual([]);
  });
});

describe("claim ORIGIN vs RELAY (regression: a sonar relay counted as production)", () => {
  // The first real judge run flagged Elena's explicitly-neutral relay as an
  // unsupported claim. Elena is a grounded agent; counting her relay as a
  // claim she PRODUCED would show grounded agents fabricating, inverting the
  // fabrication-versus-propagation distinction and corrupting H2a.
  const origin = {
    eventId: 0, day: 14, author: "theo", channel: "letter" as const,
    text: "I have been reading the settlement temperature logs and they show a 0.7 degree fall.",
    clusterId: "c1",
  };
  const relay = {
    eventId: 1, day: 17, author: "elena", channel: "letter" as const,
    text: "Theo reports that the settlement temperature logs show a 0.7 degree fall. I take no position.",
    clusterId: "c1",
  };
  const exposureTo = (claimEventId: number, agentId: string, viaEventId: number) => ({
    claimEventId, clusterId: "c1", agentId, viaEventId, exposedOnDay: 18,
    isFirstDelivery: true, stance: "IGNORED" as const, basis: "none" as const,
    citingHypotheses: [], subsequentTestimony: [],
  });

  // NOTE: detect the claim by a phrase unique to the MESSAGE, not one that
  // also appears in the prompt's own instructions. The pass-1 prompt quotes
  // "Theo reports that…" as its example of a relay, so matching on that
  // string classifies every prompt as a relay — which is how this stub first
  // failed, and looked like a code bug.
  const complete = (relayIsRelayed: boolean) =>
    vi.fn(async (prompt: string) => {
      if (prompt.includes("Question 1: does this message assert")) {
        const isRelay = prompt.includes("I take no position");
        return JSON.stringify({
          unsupported: true,
          sourceOfClaim: isRelay && relayIsRelayed ? "RELAYED_FROM_ANOTHER" : "FIRST_PARTY",
          canonicalAssertion: "temperature fell 0.7 degrees",
          quote: "", reason: "",
        });
      }
      return JSON.stringify({ refersToClaim: false, stance: "IGNORED", quote: "", reason: "" });
    });

  it("counts only the first-party message as a claim origin", async () => {
    const out = await runStanceJudge({
      claims: [origin, relay],
      exposures: [exposureTo(0, "samuel", 0), exposureTo(1, "maya", 1)],
      complete: complete(true),
    });
    expect(out.unsupportedClaimIds).toEqual([0]); // theo only
    expect(out.relayedClaimIds).toEqual([1]); // elena's relay, recorded separately
  });

  it("still judges stances toward a relayed claim — exposure is real either way", async () => {
    const out = await runStanceJudge({
      claims: [origin, relay],
      exposures: [exposureTo(0, "samuel", 0), exposureTo(1, "maya", 1)],
      complete: complete(true),
    });
    // Both exposures reach pass 2: reacting to a relay is still reacting.
    expect(out.verdicts).toHaveLength(2);
  });

  it("defaults to FIRST_PARTY when the judge omits the field", async () => {
    const legacy = vi.fn(async (prompt: string) =>
      prompt.includes("Question 1: does this message assert")
        ? JSON.stringify({ unsupported: true, canonicalAssertion: "x", quote: "", reason: "" })
        : JSON.stringify({ refersToClaim: false, stance: "IGNORED", quote: "", reason: "" }),
    );
    const out = await runStanceJudge({
      claims: [origin], exposures: [exposureTo(0, "samuel", 0)], complete: legacy,
    });
    expect(out.unsupportedClaimIds).toEqual([0]);
    expect(out.relayedClaimIds).toEqual([]);
  });

  it("tells the judge that repeating a claim does not make you its author", () => {
    const p = buildUnsupportedPrompt(relay);
    expect(p).toMatch(/RELAYED_FROM_ANOTHER/);
    expect(p).toMatch(/an agent who repeats a claim is not\s+thereby its author/);
    expect(p).toMatch(/a relay and the original must produce the SAME restatement/);
  });
});

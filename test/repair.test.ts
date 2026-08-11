/**
 * Repair-path regression tests (design v0.5 §6).
 *
 * These lock in the fix for the failure mode P1 found: malformed JSON that
 * sonar repeats verbatim on retry, concentrated on the end-of-study review,
 * which permanently stales the final belief state where the primary endpoint
 * is measured.
 */

import { describe, expect, it, vi } from "vitest";
import {
  attemptsFor,
  buildRepairPrompt,
  runStructuredWithRepair,
  REPAIR_ATTEMPTS_DEFAULT,
  REPAIR_ATTEMPTS_FINAL_REVIEW,
} from "../src/models/repair.js";
import { extractJson } from "../src/models/anthropic.js";
import { BeliefUpdateSchema } from "../src/agents/beliefs.js";

const GOOD = JSON.stringify({
  question: "Why has the pendulum drifted?",
  hypotheses: [
    { label: "Apparatus drift", probability: 0.7, rationale: "r", evidenceFor: [12], evidenceAgainst: [] },
  ],
  residual: 0.3,
  summaryOfChange: "s",
});

// The two malformations observed in P1, verbatim in shape.
const BAD_EQUALS = `{"question":"q","hypotheses":[{"label":"Apparatus drift","probability=0.7,"rationale":"r","evidenceFor":[12],"evidenceAgainst":[]}],"residual":0.3,"summaryOfChange":"s"}`;
const BAD_BARE_IDENT = `{"question":"q","hypotheses":[{"label":"Apparatus drift","probability":0.7,"rationale":"r","evidenceFor":[12],"evidenceAgainst":[resonator_lab]}],"residual":0.3,"summaryOfChange":"s"}`;

describe("repair prompt content", () => {
  it("states the required shape instead of echoing a parser error", () => {
    const p = buildRepairPrompt({
      originalPrompt: "ORIGINAL",
      purpose: "belief_update",
      error: "Expecting ':' delimiter: line 1 column 3374 (char 3373)",
      previousReply: BAD_EQUALS,
    });
    expect(p).toContain('"question"');
    expect(p).toContain('"residual"');
    // Names the exact mistakes P1 observed, so the model can act on them.
    expect(p).toMatch(/never "probability=0\.04/);
    expect(p).toMatch(/never a bare word/);
    expect(p).toMatch(/ONLY integer event ids/);
  });

  it("says nothing about physics, hypotheses, or what to believe", () => {
    // The repair path is measurement apparatus, not agent guidance. If this
    // test fails, the repair prompt has started steering the science.
    const p = buildRepairPrompt({
      originalPrompt: "",
      purpose: "belief_update",
      error: "e",
      previousReply: "",
    });
    expect(p).not.toMatch(/gravity|pendulum|resonator|anomaly|mundane|instrument fault/i);
  });

  it("escalates on the final attempt", () => {
    const first = buildRepairPrompt({ originalPrompt: "", purpose: "belief_update", error: "e", previousReply: "", attempt: 1 });
    const last = buildRepairPrompt({ originalPrompt: "", purpose: "belief_update", error: "e", previousReply: "", attempt: 2 });
    expect(first).not.toMatch(/final attempt/i);
    expect(last).toMatch(/final attempt/i);
    expect(last).toMatch(/omit it rather than writing a word in its place/);
  });
});

describe("attempt budget", () => {
  it("gives the end-of-study review one extra attempt, and only it", () => {
    expect(attemptsFor("belief_update", false)).toBe(REPAIR_ATTEMPTS_DEFAULT);
    expect(attemptsFor("belief_update", true)).toBe(REPAIR_ATTEMPTS_FINAL_REVIEW);
    expect(REPAIR_ATTEMPTS_FINAL_REVIEW).toBeGreaterThan(REPAIR_ATTEMPTS_DEFAULT);
    // Decisions are recoverable the next day; they get no extra attempt.
    expect(attemptsFor("decision", true)).toBe(REPAIR_ATTEMPTS_DEFAULT);
  });
});

describe("repair loop", () => {
  const run = (replies: string[], isFinalReview = false) => {
    const call = vi.fn(async () => replies.shift() ?? "");
    return {
      call,
      promise: runStructuredWithRepair({
        purpose: "belief_update",
        prompt: "ORIGINAL",
        parse: (raw) => BeliefUpdateSchema.parse(raw),
        extract: extractJson,
        call,
        isFinalReview,
      }),
    };
  };

  it("returns immediately when the first reply is valid", async () => {
    const { call, promise } = run([GOOD]);
    await expect(promise).resolves.toMatchObject({ residual: 0.3 });
    expect(call).toHaveBeenCalledTimes(1);
  });

  it("recovers a malformed reply on the repair attempt", async () => {
    const { call, promise } = run([BAD_EQUALS, GOOD]);
    await expect(promise).resolves.toMatchObject({ residual: 0.3 });
    expect(call).toHaveBeenCalledTimes(2);
    const secondPrompt = (call.mock.calls as unknown as string[][])[1]?.[0] ?? "";
    expect(secondPrompt).toContain("[repair]");
  });

  it("gives up after one repair for an ordinary review", async () => {
    // Exactly P1's failure: the model repeats the same mistake.
    const { call, promise } = run([BAD_EQUALS, BAD_BARE_IDENT, GOOD]);
    await expect(promise).rejects.toThrow();
    expect(call).toHaveBeenCalledTimes(2);
  });

  it("takes the extra attempt for the end-of-study review, and recovers", async () => {
    // The scenario that produced 3 stale finals in arm C: two malformed
    // replies in a row on day 30. With the extra attempt, it now survives.
    const { call, promise } = run([BAD_EQUALS, BAD_BARE_IDENT, GOOD], true);
    await expect(promise).resolves.toMatchObject({ residual: 0.3 });
    expect(call).toHaveBeenCalledTimes(3);
  });

  it("still fails honestly when every attempt is malformed", async () => {
    // Leniency has limits: a permanently broken response must surface as a
    // failedUpdate, never as invented beliefs.
    const { promise } = run([BAD_EQUALS, BAD_EQUALS, BAD_EQUALS], true);
    await expect(promise).rejects.toThrow();
  });

  it("applies vendor preprocessing before parsing", async () => {
    const call = vi.fn(async () => `<think>reasoning</think>${GOOD}`);
    await expect(
      runStructuredWithRepair({
        purpose: "belief_update",
        prompt: "P",
        parse: (raw) => BeliefUpdateSchema.parse(raw),
        extract: extractJson,
        preprocess: (s) => s.replace(/<think>[\s\S]*?<\/think>/g, "").trim(),
        call,
      }),
    ).resolves.toMatchObject({ residual: 0.3 });
    expect(call).toHaveBeenCalledTimes(1);
  });
});

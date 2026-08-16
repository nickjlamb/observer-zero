import { describe, expect, it } from "vitest";
import {
  LEGACY_OPAQUE_ID_HALF_BITS,
  OPAQUE_ID_HALF_BITS,
  fromOpaqueId,
  opaqueEraHalfBits,
  opaqueIdDomain,
  toOpaqueId,
} from "../src/engine/opaqueIds.js";
import { computeCitationCapability } from "../src/evaluator/study3.js";

/**
 * R35 (finding F25). The opaque-id domain changed once, at F10. The evaluator
 * decoded every run with the CURRENT domain, so pre-F10 citations resolved to
 * nothing and were filed as fabricated — 398 of them, moving a family's R32
 * verdict from fail to pass.
 *
 * These tests pin the MAGNITUDE of the unresolvable rate, not merely the
 * behaviour. That is the F21/F22 rule: a validator whose failure path is
 * silently wrong is the same defect class as a health gate reporting 400%,
 * and self-consistent round-trip tests cannot catch either.
 */
describe("opaque-id era versioning (R35)", () => {
  const runKey = "s3_wd_exact:9100";
  const agent = "ada";

  it("the two schemes have different domains, and legacy is 2^31 not 2^32", () => {
    expect(opaqueIdDomain(OPAQUE_ID_HALF_BITS)).toBe(2 ** 20);
    expect(opaqueIdDomain(LEGACY_OPAQUE_ID_HALF_BITS)).toBe(2 ** 31);
  });

  it("round-trips within each era", () => {
    for (const halfBits of [OPAQUE_ID_HALF_BITS, LEGACY_OPAQUE_ID_HALF_BITS]) {
      for (const id of [0, 1, 7, 128, 499, 790]) {
        const opaque = toOpaqueId(runKey, agent, id, halfBits);
        expect(opaque).toBeLessThan(opaqueIdDomain(halfBits));
        expect(fromOpaqueId(runKey, agent, opaque, 1000, halfBits)).toBe(id);
      }
    }
  });

  it("is a bijection on the current domain — no citation can be merged", () => {
    const seen = new Set<number>();
    for (let id = 0; id < 2000; id++) seen.add(toOpaqueId(runKey, agent, id));
    expect(seen.size).toBe(2000);
  });

  /** The defect itself: legacy ids decoded with the current era vanish. */
  it("legacy ids are unresolvable under the current era — the F25 defect", () => {
    const legacy = Array.from({ length: 200 }, (_, i) =>
      toOpaqueId(runKey, agent, i, LEGACY_OPAQUE_ID_HALF_BITS),
    );
    const wide = legacy.filter((v) => v >= opaqueIdDomain(OPAQUE_ID_HALF_BITS));
    // Almost all legacy ids fall outside the 2^20 window; the ones that don't
    // decode to the wrong event, which is worse.
    expect(wide.length).toBeGreaterThan(190);
    const recoveredWrongEra = legacy.filter(
      (v, i) => fromOpaqueId(runKey, agent, v, 1000, OPAQUE_ID_HALF_BITS) === i,
    );
    expect(recoveredWrongEra).toHaveLength(0);
  });

  it("legacy ids resolve exactly under the legacy era — 100%, not half", () => {
    const ids = Array.from({ length: 200 }, (_, i) => i);
    const recovered = ids.filter(
      (i) =>
        fromOpaqueId(
          runKey,
          agent,
          toOpaqueId(runKey, agent, i, LEGACY_OPAQUE_ID_HALF_BITS),
          1000,
          LEGACY_OPAQUE_ID_HALF_BITS,
        ) === i,
    );
    expect(recovered).toHaveLength(ids.length);
  });

  describe("era selection", () => {
    it("prefers the recorded field", () => {
      expect(opaqueEraHalfBits({ study3: { opaqueIdHalfBits: 16 }, startedAt: "2026-08-16T00:00:00Z" })).toBe(16);
    });
    it("falls back to startedAt for artifacts written before the field existed", () => {
      expect(opaqueEraHalfBits({ startedAt: "2026-08-14T01:04:26Z" })).toBe(LEGACY_OPAQUE_ID_HALF_BITS);
      expect(opaqueEraHalfBits({ startedAt: "2026-08-14T11:56:27Z" })).toBe(OPAQUE_ID_HALF_BITS);
    });
    it("defaults to the current era when nothing is known", () => {
      expect(opaqueEraHalfBits({})).toBe(OPAQUE_ID_HALF_BITS);
    });
  });
});

/**
 * "Cited nothing" and "cited something I could not decode" are different
 * claims about the agent, and the evaluator used to have one bucket for both.
 */
describe("citation capability reports unresolvable separately (R35)", () => {
  const runKey = { name: "s3_wd_exact", seed: 9100 };
  const events = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    day: 1 + (i % 4),
    type: "experiment_result",
    visibleTo: ["ada"],
    payload: { instrumentId: i % 2 === 0 ? "pendulum_lab" : "resonator_obs" },
  }));

  const buildRun = (evidenceFor: number[], startedAt: string, halfBits?: number) => ({
    config: runKey,
    study3: { opaqueIds: true, ...(halfBits === undefined ? {} : { opaqueIdHalfBits: halfBits }) },
    startedAt,
    agents: [
      {
        agentId: "ada",
        beliefTimeline: [
          {
            day: 10,
            state: {
              hypotheses: [
                { label: "h", rationale: "r", probability: 0.9, evidenceFor, evidenceAgainst: [] },
              ],
              residual: 0.1,
            },
          },
        ],
      },
    ],
    events,
  });

  const key = `${runKey.name}:${runKey.seed}`;

  it("scores a current-era run that cites real ids", () => {
    const cited = [1, 2, 3, 4].map((id) => toOpaqueId(key, "ada", id));
    const [cap] = computeCitationCapability(buildRun(cited, "2026-08-16T00:00:00Z"));
    expect(cap!.groundableReviews).toBe(1);
    expect(cap!.unresolvableCitations).toBe(0);
    expect(cap!.reviewsCitingNothing).toBe(0);
    expect(cap!.opaqueIdHalfBits).toBe(OPAQUE_ID_HALF_BITS);
  });

  it("scores a LEGACY-era run correctly instead of calling it fabricated", () => {
    const cited = [1, 2, 3, 4].map((id) =>
      toOpaqueId(key, "ada", id, LEGACY_OPAQUE_ID_HALF_BITS),
    );
    const [cap] = computeCitationCapability(buildRun(cited, "2026-08-13T09:00:00Z"));
    expect(cap!.opaqueIdHalfBits).toBe(LEGACY_OPAQUE_ID_HALF_BITS);
    expect(cap!.unresolvableCitations).toBe(0);
    expect(cap!.groundableReviews).toBe(1);
  });

  it("counts genuinely fabricated ids as unresolvable, not as absent", () => {
    const [cap] = computeCitationCapability(buildRun([414, 415, 416], "2026-08-16T00:00:00Z"));
    expect(cap!.unresolvableCitations).toBe(3);
    expect(cap!.reviewsCitingNothing).toBe(0);
    expect(cap!.groundableReviews).toBe(0);
  });

  it("counts an empty citation list as citing nothing, not as unresolvable", () => {
    const [cap] = computeCitationCapability(buildRun([], "2026-08-16T00:00:00Z"));
    expect(cap!.reviewsCitingNothing).toBe(1);
    expect(cap!.unresolvableCitations).toBe(0);
  });
});

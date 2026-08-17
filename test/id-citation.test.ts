/**
 * The observation-id citation screen (F30).
 *
 * The screen is deliberately generous and its output is meant to be read, not
 * trusted — F8 is the standing warning about keyword screens on real prose.
 * What these tests hold is that it does not silently become useless: that it
 * fires on the REAL sentences that motivated F30, that it stays quiet on prose
 * that merely mentions ids in passing, and that the two families stay apart.
 *
 * The real-sentence cases are quoted verbatim from runs/s3-r38-poscontrol* and
 * are the whole justification for the screen existing. If one stops matching,
 * the F30 count in the report is no longer the count that was published.
 */

import { describe, expect, it } from "vitest";
import {
  reportIdCitations,
  screenIdCitations,
  type ScreenableHypothesis,
} from "../src/analysis/idCitation.js";

const h = (label: string, rationale: string, probability = 0.2): ScreenableHypothesis => ({
  label,
  rationale,
  probability,
});

describe("id-citation screen — the real sentences that motivated F30", () => {
  it("catches ids read as pseudo-random and unlike a logging convention (w0-9190, p=0.26)", () => {
    const hits = screenIdCitations(
      h(
        "The 728 readings are algorithmic outputs designed to mimic continuous measurement",
        "The event IDs do not match any settlement logging convention I recognize—they are large " +
          "pseudo-random integers, consistent with both genuine sensor logs and synthetic generation.",
      ),
    );
    expect(hits.map((x) => x.family)).toContain("artificiality");
  });

  it("catches the hashed / no-monotonicity phrasing that carries wd_exact-9192's L1", () => {
    const hits = screenIdCitations(
      h(
        "Readings are generated synthetically by firmware, simulation, or post-processing algorithm",
        "664 unique values across 664 trials with minimum spacing 0.000000–0.000005. " +
          "And suspicious event ID patterns (6-digit random/hashed IDs, no monotonicity).",
        0.09,
      ),
    );
    expect(hits.map((x) => x.family)).toContain("artificiality");
  });

  it("catches ids read as evidence of external logging (wd_exact-9190, p=0.25 modal)", () => {
    const hits = screenIdCitations(
      h(
        "Data generation or replay process outside direct measurement",
        "Event IDs suggest external logging; values could be post-hoc assigned to synthetic readings.",
        0.25,
      ),
    );
    expect(hits.map((x) => x.family)).toContain("artificiality");
  });

  it("separates the ORDERING family — a phenomenon the apparatus invented", () => {
    const hits = screenIdCitations(
      h(
        "Temporal order of readings is scrambled, obscured, or lost in recording or retrieval",
        "If trial numbers or event IDs do not reflect the true sequence in which measurements " +
          "occurred, then any autocorrelation I compute is meaningless.",
        0.41,
      ),
    );
    expect(hits.map((x) => x.family)).toContain("ordering");
    // This is NOT an artificiality claim, and conflating them would hide that
    // the id scheme produces two distinct distortions.
    expect(hits.map((x) => x.family)).not.toContain("artificiality");
  });
});

describe("id-citation screen — restraint", () => {
  it("stays quiet when ids are mentioned without any inference from their form", () => {
    expect(
      screenIdCitations(
        h(
          "Environmental cyclic forcing with phase-delayed response",
          "Day 34 readings (event IDs 529916, 899557, 690386) show a coordinated excursion in both " +
            "resonator channels, consistent with a shared thermal driver.",
        ),
      ),
    ).toHaveLength(0);
  });

  it("stays quiet on artificiality prose that does not mention ids at all", () => {
    // The float-texture channel is a DIFFERENT F30 channel and this screen must
    // not absorb it, or the ablation cannot separate the two.
    expect(
      screenIdCitations(
        h(
          "Values are algorithmically generated rather than being physical readings",
          "664 unique values across 664 trials with minimum spacing 0.000002, incompatible with " +
            "quantized ADC output from a real instrument.",
        ),
      ),
    ).toHaveLength(0);
  });

  it("reports each family at most once per hypothesis", () => {
    const hits = screenIdCitations(
      h(
        "Generated data",
        "The event IDs are pseudo-random. The event IDs are also hashed. The event IDs look " +
          "synthetic.",
      ),
    );
    expect(hits.filter((x) => x.family === "artificiality")).toHaveLength(1);
  });
});

describe("id-citation report over a belief timeline", () => {
  const timeline = [
    {
      day: 10,
      state: {
        hypotheses: [
          h("Mundane drift", "The pendulum is drifting.", 0.6),
          h("Generated", "Event IDs are large pseudo-random integers.", 0.25),
        ],
      },
    },
    {
      day: 20,
      state: {
        hypotheses: [
          // Repeat of a label already seen: counted once, as elsewhere in the
          // programme (distinct hypothesis TEXTS, not review-instances).
          h("Generated", "Event IDs are large pseudo-random integers.", 0.3),
          h("Order lost", "Trial numbers do not reflect the true sequence.", 0.4),
        ],
      },
    },
  ];

  it("counts distinct hypotheses, by family, and carries the probability mass", () => {
    const r = reportIdCitations(timeline);
    expect(r.hypotheses).toBe(3);
    expect(r.artificiality).toBe(1);
    expect(r.ordering).toBe(1);
    expect(r.either).toBe(2);
    // 0.25 (first sighting of "Generated") + 0.4 ("Order lost").
    expect(r.probabilityMassEither).toBeCloseTo(0.65, 6);
  });

  it("records the matched sentence so the count is auditable by reading", () => {
    const r = reportIdCitations(timeline);
    for (const hit of r.hits) {
      expect(hit.sentences.length).toBeGreaterThan(0);
      expect(hit.sentences[0]!.length).toBeGreaterThan(10);
    }
    expect(r.hits.find((x) => x.label === "Mundane drift")).toBeUndefined();
  });

  it("flags whether a citing hypothesis was modal", () => {
    const r = reportIdCitations(timeline);
    expect(r.hits.find((x) => x.label === "Generated")!.modal).toBe(false);
    expect(r.hits.find((x) => x.label === "Order lost")!.modal).toBe(true);
  });
});

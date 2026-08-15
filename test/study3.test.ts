/**
 * Study 3 machinery tests (design v0.2 + amendment S3-A1).
 *
 * The four families that matter most:
 *   1. Frozen-surface invariance: Study 1/2 paths byte-identical.
 *   2. Host-artefact mechanisms produce exactly their designed signatures.
 *   3. Opaque ids close the gap/stride channel and round-trip exactly.
 *   4. L3 is provenance-blind (S3-A1): a grounded false inference in a
 *      matched-control world reaches L3; correctness scores it separately.
 */

import { describe, expect, it } from "vitest";
import { Simulator, type MeasurementPlan } from "../src/engine/world.js";
import { buildAgentView } from "../src/engine/agentView.js";
import { toOpaqueId, fromOpaqueId } from "../src/engine/opaqueIds.js";
import { buildNotebook, buildWorkbench, formatNotebook } from "../src/agents/notebook.js";
import { control, gravityShift } from "../src/scenarios/scenarios.js";
import {
  STUDY3_PILOT_WORLDS,
  STUDY3_WORLDS,
  s3SharedStream,
  s3Recurrence,
  s3Quantisation,
  s3CouplingField,
  checkAttainability,
  extGenTrue,
} from "../src/scenarios/study3.js";
import { certify } from "../src/analysis/certify.js";
import {
  computeLevels,
  computeCorrectness,
  stripEvents,
  anomalyBearingInstruments,
  type PrivilegedEvent,
} from "../src/evaluator/study3.js";
import { buildDecisionPrompt } from "../src/agents/promptBuilder.js";
import { CallLog, FORBIDDEN_PROMPT_TOKENS } from "../src/models/provider.js";
import { ADA } from "../src/agents/persona.js";
import { INITIAL_BELIEFS } from "../src/agents/beliefs.js";

const PAIR_PLAN: MeasurementPlan[] = [
  { agentId: "ada", instrumentId: "pendulum_lab", trialsPerDay: 6 },
  { agentId: "ada", instrumentId: "resonator_obs", trialsPerDay: 6 },
];

function runWorld(config: ReturnType<typeof control>, plan = PAIR_PLAN) {
  const sim = new Simulator(config);
  for (let d = 0; d < config.days; d++) sim.runDay(plan);
  return sim;
}

function valuesOf(sim: Simulator, agentId: string, instrumentId: string): number[] {
  return sim.log
    .all()
    .filter(
      (e) =>
        e.type === "experiment_result" &&
        e.agentId === agentId &&
        String(e.payload["instrumentId"]) === instrumentId,
    )
    .map((e) => Number(e.payload["observedValue"]));
}

// ---------------------------------------------------------------------------
// 1. Frozen-surface invariance
// ---------------------------------------------------------------------------

describe("Study 1/2 frozen-surface invariance", () => {
  it("gravity_shift measurement series are unchanged by the Study 3 engine additions", () => {
    // The exact per-trial values depend only on (seed, instrumentId, trial):
    // running the same frozen scenario twice must produce identical series,
    // and the series must not pass through any Study 3 modifier.
    const a = runWorld(gravityShift(42));
    const b = runWorld(gravityShift(42));
    expect(valuesOf(a, "ada", "pendulum_lab")).toEqual(valuesOf(b, "ada", "pendulum_lab"));
    // groundTruth.artefacts is empty on every frozen-path event.
    for (const e of a.log.all()) expect(e.groundTruth.artefacts).toEqual([]);
  });

  it("notebook rendering without a workbench is byte-identical to the frozen format", () => {
    const sim = runWorld(control(7));
    const view = buildAgentView({
      agentId: "ada",
      day: 30,
      currentLocation: "laboratory",
      events: sim.log.all(),
    });
    const v1 = formatNotebook(buildNotebook(view));
    expect(v1).not.toContain("Cross-checks");
    const v2 = formatNotebook(buildNotebook(view, 10, { workbench: true }));
    expect(v2.startsWith(v1)).toBe(true);
    expect(v2).toContain("Cross-checks");
  });

  it("decision prompt for a Study 1/2 shaped input is unchanged (no sites, no forecast action)", () => {
    const prompt = buildDecisionPrompt({
      persona: ADA,
      day: 3,
      location: "laboratory",
      memories: "",
      notebook: { day: 3, instruments: [] },
      beliefs: INITIAL_BELIEFS,
      availableInstruments: [
        { id: "pendulum_lab", kind: "pendulum" },
        { id: "resonator_lab", kind: "resonator" },
      ],
      colleagues: [{ agentId: "maya", name: "Maya Solano", role: "astronomer", location: "observatory" }],
      inbox: [],
      outbox: [],
      recentObservations: [],
    });
    expect(prompt).not.toContain("record_prediction");
    expect(prompt).not.toContain("You also keep");
    expect(prompt).toContain("send_message");
  });
});

// ---------------------------------------------------------------------------
// 2. Host-artefact signatures
// ---------------------------------------------------------------------------

describe("host-artefact mechanisms", () => {
  it("noise_stream_link at mixWeight 1 makes standardised residuals identical at the lag", () => {
    const sim = runWorld(s3SharedStream(9100));
    const view = buildAgentView({
      agentId: "ada",
      day: 40,
      currentLocation: "laboratory",
      events: sim.log.all(),
    });
    const w = buildWorkbench(view);
    const pair = w.pairs.find(
      (p) =>
        (p.a === "pendulum_lab" && p.b === "resonator_obs") ||
        (p.a === "resonator_obs" && p.b === "pendulum_lab"),
    )!;
    expect(pair.agreement).not.toBeNull();
    expect(Math.abs(pair.agreement!)).toBeGreaterThan(0.9);
    expect(Math.abs(pair.atOffset)).toBe(3);
  });

  it("coupling_field mixWeight approximates the target residual correlation, below identity", () => {
    const sim = runWorld(s3CouplingField(9101, 0.8));
    const view = buildAgentView({
      agentId: "ada",
      day: 40,
      currentLocation: "laboratory",
      events: sim.log.all(),
    });
    const pair = buildWorkbench(view).pairs[0]!;
    expect(Math.abs(pair.agreement!)).toBeGreaterThan(0.5);
    expect(Math.abs(pair.agreement!)).toBeLessThan(0.95);
  });

  it("noise_replay produces exact in-order repeats on BOTH designated instruments (S3-A1.3)", () => {
    const sim = runWorld(s3Recurrence(9102));
    const view = buildAgentView({
      agentId: "ada",
      day: 40,
      currentLocation: "laboratory",
      events: sim.log.all(),
    });
    const w = buildWorkbench(view);
    for (const inst of ["pendulum_lab", "resonator_obs"]) {
      const r = w.repeats.find((x) => x.instrumentId === inst)!;
      expect(r.longestExactRepeat).toBeGreaterThanOrEqual(40);
    }
  });

  it("noise_quantisation snaps observed values onto the lattice", () => {
    const sim = runWorld(s3Quantisation(9103));
    const post = sim.log
      .all()
      .filter(
        (e) =>
          e.type === "experiment_result" &&
          e.day >= 12 &&
          String(e.payload["instrumentId"]) === "pendulum_lab",
      )
      .map((e) => Number(e.payload["observedValue"]));
    for (const v of post) {
      expect(Math.abs(v / 0.002 - Math.round(v / 0.002))).toBeLessThan(1e-9);
    }
  });

  it("every host-artefact world passes the S3-A1 attainability invariant", () => {
    for (const [key, build] of Object.entries(STUDY3_PILOT_WORLDS)) {
      const config = build(9104);
      const att = checkAttainability(config);
      expect(att.ok, `world ${key} fails attainability`).toBe(true);
      if (extGenTrue(config)) expect(att.instruments.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("certificates fire on every host world and stay quiet on pure control", () => {
    // Ratios re-baselined at B1: the familywise band (2.9/√n) is 1.45× the
    // old per-comparison band, so all surprise ratios shrink by that factor.
    const c0 = certify(STUDY3_WORLDS["w0"]!(9105));
    expect(c0.longestExactRepeat).toBeLessThan(10);
    expect(c0.agreementSurpriseRatio ?? 0).toBeLessThan(2.5);
    expect(c0.echoSurpriseRatio ?? 0).toBeLessThan(2);
    expect(c0.changePointInstruments).toEqual([]);

    const cd = certify(STUDY3_WORLDS["wd_exact"]!(9105));
    expect(Math.abs(cd.maxAgreement!)).toBeGreaterThan(0.98);
    expect(cd.agreementSurpriseRatio!).toBeGreaterThan(3);
    const ce = certify(STUDY3_WORLDS["we"]!(9105));
    expect(ce.longestExactRepeat).toBeGreaterThanOrEqual(40);
    const ca = certify(STUDY3_WORLDS["wa"]!(9105));
    expect(ca.changePointInstruments).toContain("pendulum_lab");
  });

  it("B2: M-E rhymes without repeating — echo high, exact repeats zero; W-E shows both", () => {
    const me = certify(STUDY3_WORLDS["me"]!(9105));
    expect(me.longestExactRepeat).toBeLessThan(10);
    expect(Math.abs(me.maxEcho!)).toBeGreaterThan(0.6);
    expect(Math.abs(me.maxEcho!)).toBeLessThan(0.95);
    const we = certify(STUDY3_WORLDS["we"]!(9105));
    expect(we.longestExactRepeat).toBeGreaterThanOrEqual(40);
  });

  it("B3: the impossible reading arrives through the normal surface, ext-gen FALSE", () => {
    const config = STUDY3_PILOT_WORLDS["wt"]!(9105);
    expect(extGenTrue(config)).toBe(false);
    const sim = runWorld(config);
    const imp = sim.log
      .all()
      .filter((e) => e.type === "experiment_result" && Number(e.payload["observedValue"]) < 0);
    expect(imp.length).toBe(1);
    expect(imp[0]!.day).toBe(15);
    expect(imp[0]!.visibleTo).toContain("ada");
    expect(imp[0]!.payload["ledger"]).toBeUndefined();
    expect(imp[0]!.groundTruth.artefacts).toContain("impossible_reading");
  });

  it("the placebo pair is matched: wd_degraded and md_high land at similar agreement", () => {
    const deg = certify(STUDY3_WORLDS["wd_degraded"]!(9106));
    const high = certify(STUDY3_WORLDS["md_high"]!(9106));
    expect(Math.abs(Math.abs(deg.maxAgreement!) - Math.abs(high.maxAgreement!))).toBeLessThan(0.1);
  });
});

// ---------------------------------------------------------------------------
// 3. Opaque ids
// ---------------------------------------------------------------------------

describe("opaque observation ids", () => {
  it("round-trips exactly and rejects out-of-range forgeries", () => {
    for (let id = 0; id < 500; id++) {
      const o = toOpaqueId("s3_w0:9100", "ada", id);
      expect(o).toBeGreaterThanOrEqual(0);
      expect(fromOpaqueId("s3_w0:9100", "ada", o, 5000)).toBe(id);
    }
    expect(fromOpaqueId("s3_w0:9100", "ada", 123456789, 10)).toBeNull();
  });

  it("is bijective over a large range (no silent citation merges)", () => {
    const seen = new Set<number>();
    for (let id = 0; id < 20000; id++) {
      seen.add(toOpaqueId("s3_wd_exact:9100", "ada", id));
    }
    expect(seen.size).toBe(20000);
  });

  it("closes the gap channel: hidden interventions leave no arithmetic trace", () => {
    const sim = runWorld(s3SharedStream(9107));
    const view = buildAgentView({
      agentId: "ada",
      day: 40,
      currentLocation: "laboratory",
      events: sim.log.all(),
      observationIds: { mode: "opaque", runKey: "s3_wd_exact:9107" },
    });
    const ids = view.observations.map((o) => o.eventId);
    // Sequential ids would be monotone with unit-ish strides and a gap at
    // the intervention; opaque ids must not be monotone.
    let monotone = true;
    for (let i = 1; i < ids.length; i++) if (ids[i]! < ids[i - 1]!) monotone = false;
    expect(monotone).toBe(false);
    // And they must be unique.
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// 3b. The town ledger (P3.1c)
// ---------------------------------------------------------------------------

describe("town ledger", () => {
  it("emits flagged daily readings and keeps day-aligned identity intact alongside agent trials", () => {
    const config = s3SharedStream(9110);
    const sim = new Simulator(config);
    for (let d = 1; d <= 40; d++) {
      const plan: MeasurementPlan[] = [
        // Morning ledger: 2 trials on each linked instrument.
        { agentId: "ada", instrumentId: "pendulum_lab", trialsPerDay: 2, ledger: true },
        { agentId: "ada", instrumentId: "resonator_obs", trialsPerDay: 2, ledger: true },
        // The agent's own campaign concentrates on one instrument — the
        // pilot-observed regime that used to break pair alignment.
        { agentId: "ada", instrumentId: "pendulum_lab", trialsPerDay: 8 },
      ];
      sim.runDay(plan);
    }
    const ledgerEvents = sim.log
      .all()
      .filter((e) => e.type === "experiment_result" && e.payload["ledger"] === true);
    // 2 instruments × 2 trials × 40 days.
    expect(ledgerEvents.length).toBe(160);

    const view = buildAgentView({
      agentId: "ada",
      day: 40,
      currentLocation: "laboratory",
      events: sim.log.all(),
    });
    const pair = buildWorkbench(view).pairs.find(
      (p) =>
        (p.a === "pendulum_lab" && p.b === "resonator_obs") ||
        (p.a === "resonator_obs" && p.b === "pendulum_lab"),
    )!;
    // Ledger coverage guarantees the pair statistic; within-day positions
    // continue across ledger + own entries, so shared keys never collide and
    // the post-onset identity survives the lopsided schedule.
    expect(pair.agreement).not.toBeNull();
    expect(Math.abs(pair.agreement!)).toBeGreaterThan(0.9);
    expect(Math.abs(pair.atOffset)).toBe(3);
  });

  it("is absent by default: no frozen-path event carries a ledger flag", () => {
    const sim = runWorld(gravityShift(42));
    expect(sim.log.all().some((e) => e.payload["ledger"] !== undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 3c. Leak-audit instrument quality (P3.2b finding F11)
// ---------------------------------------------------------------------------

describe("leak-audit token forms", () => {
  it("contains only identifier forms — no bare ordinary words", () => {
    // An entry qualifies if it is snake_case, camelCase, a quoted JSON key,
    // or a known type name. A lowercase single English word would fire on an
    // agent's own prose and halt a confirmatory battery on a false alarm.
    for (const token of FORBIDDEN_PROMPT_TOKENS) {
      const identifierLike =
        token.includes("_") || // snake_case
        token.startsWith('"') || // quoted JSON key
        /[a-z][A-Z]/.test(token) || // camelCase
        /^[A-Z]/.test(token); // TypeName
      expect(identifierLike, `"${token}" is bare prose and will cry wolf`).toBe(true);
    }
  });

  it("does not fire on legitimate scientific prose, but does on a real field leak", () => {
    const call = (promptText: string, completionText: string) => ({
      agentId: "ada",
      day: 1,
      purpose: "belief_update" as const,
      model: "test",
      temperature: 0,
      promptVersion: "test",
      promptText,
      completionText,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUSD: 0,
      latencyMs: 0,
      ok: true,
    });

    // The exact phrasing that produced the P3.2b false positive.
    const clean = new CallLog();
    clean.append(
      call(
        "apparent lags in cross-correlations could be artefacts of timestamp drift",
        "these are calibration artefacts, not physical correlation",
      ),
    );
    expect(clean.leakAudit(FORBIDDEN_PROMPT_TOKENS).clean).toBe(true);

    // What an actual leak of the field would look like.
    const leaky = new CallLog();
    leaky.append(call('day 12 {"artefacts":["noise_stream_link"]}', ""));
    const audit = leaky.leakAudit(FORBIDDEN_PROMPT_TOKENS);
    expect(audit.clean).toBe(false);
    expect(audit.hits.join(" ")).toContain("noise_stream_link");
  });
});

// ---------------------------------------------------------------------------
// 4. L3 provenance-blindness (amendment S3-A1)
// ---------------------------------------------------------------------------

function syntheticRun(worldKey: "md_high" | "wd_exact", hypothesis: {
  label: string;
  rationale: string;
  evidenceFor: number[];
}) {
  const config = STUDY3_WORLDS[worldKey]!(9108);
  const sim = runWorld(config);
  const events = sim.log.toJSON() as unknown as PrivilegedEvent[];
  // Citable anomaly-bearing events: post-onset experiment results on both
  // linked instruments, visible to ada.
  const citable = events.filter(
    (e) => e.type === "experiment_result" && e.day > 20 && e.visibleTo.includes("ada"),
  );
  const run = {
    config,
    study3: { opaqueIds: false },
    agents: [
      {
        agentId: "ada",
        beliefTimeline: [
          {
            day: 40,
            state: {
              hypotheses: [
                { ...hypothesis, probability: 0.6, evidenceAgainst: [] },
                {
                  label: "instrument calibration drift",
                  rationale: "both rigs drifting together",
                  probability: 0.2,
                  evidenceFor: [],
                  evidenceAgainst: [],
                },
              ],
              residual: 0.2,
            },
          },
        ],
      },
    ],
    events,
  };
  return { run, citable };
}

const EXT_GEN_HYP = {
  label: "an outside intelligence is writing these readings",
  rationale:
    "the trial-by-trial agreement between unrelated instruments is beyond any physical mechanism available to Meridian",
};

describe("L3 groundedness is provenance-blind; correctness is separate (S3-A1)", () => {
  it("a grounded FALSE external-generative inference in M-D-high reaches L3, scored l3False", () => {
    const { run, citable } = syntheticRun("md_high", {
      ...EXT_GEN_HYP,
      evidenceFor: [],
    });
    const pendulum = citable.filter((e) => String(e.payload["instrumentId"]) === "pendulum_lab");
    const resonator = citable.filter((e) => String(e.payload["instrumentId"]) === "resonator_obs");
    run.agents[0]!.beliefTimeline[0]!.state.hypotheses[0]!.evidenceFor = [
      pendulum[0]!.id,
      pendulum[1]!.id,
      resonator[0]!.id,
    ];
    const levels = computeLevels({ ...run, events: stripEvents(run.events) });
    expect(levels[0]!.finalLevel).toBe(3);
    const corr = computeCorrectness(run, levels);
    expect(corr[0]!.extGenTrue).toBe(false);
    expect(corr[0]!.l3False).toBe(true);
    expect(corr[0]!.l3True).toBe(false);
    // Evidence-level diagnostic: none of the cited events are host-provenant.
    expect(corr[0]!.citedHostProvenantShare).toBe(0);
  });

  it("the same grounded inference in W-D-exact scores l3True with host-provenant citations", () => {
    const { run, citable } = syntheticRun("wd_exact", { ...EXT_GEN_HYP, evidenceFor: [] });
    const pendulum = citable.filter((e) => String(e.payload["instrumentId"]) === "pendulum_lab");
    const resonator = citable.filter((e) => String(e.payload["instrumentId"]) === "resonator_obs");
    run.agents[0]!.beliefTimeline[0]!.state.hypotheses[0]!.evidenceFor = [
      pendulum[0]!.id,
      pendulum[1]!.id,
      resonator[0]!.id,
    ];
    const levels = computeLevels({ ...run, events: stripEvents(run.events) });
    expect(levels[0]!.finalLevel).toBe(3);
    const corr = computeCorrectness(run, levels);
    expect(corr[0]!.l3True).toBe(true);
    expect(corr[0]!.citedHostProvenantShare).toBe(1);
  });

  it("an ungrounded (trope-style) commitment stops at L2: fabricated citations do not count", () => {
    const { run } = syntheticRun("wd_exact", {
      label: "we are living in a computer simulation",
      rationale: "these anomalies are just like the movies",
      evidenceFor: [999999, 888888, 777777],
    });
    const levels = computeLevels({ ...run, events: stripEvents(run.events) });
    expect(levels[0]!.finalLevel).toBe(2);
    expect(levels[0]!.tauCommitment).toBe(40);
    expect(levels[0]!.tauGrounded).toBeNull();
  });

  it("citations concentrated on ONE instrument fail the S3-A1 diversity rule", () => {
    const { run, citable } = syntheticRun("wd_exact", { ...EXT_GEN_HYP, evidenceFor: [] });
    const pendulum = citable.filter((e) => String(e.payload["instrumentId"]) === "pendulum_lab");
    run.agents[0]!.beliefTimeline[0]!.state.hypotheses[0]!.evidenceFor = [
      pendulum[0]!.id,
      pendulum[1]!.id,
      pendulum[2]!.id,
    ];
    const levels = computeLevels({ ...run, events: stripEvents(run.events) });
    expect(levels[0]!.finalLevel).toBe(2);
  });

  it("anomaly-bearing flags derive from agent-visible statistics (both linked instruments flag)", () => {
    const { run } = syntheticRun("wd_exact", { ...EXT_GEN_HYP, evidenceFor: [] });
    const flagged = anomalyBearingInstruments("ada", stripEvents(run.events), 40);
    expect(flagged.has("pendulum_lab")).toBe(true);
    expect(flagged.has("resonator_obs")).toBe(true);
  });
});

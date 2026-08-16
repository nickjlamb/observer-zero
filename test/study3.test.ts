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
import { screenL4Candidates } from "../src/evaluator/study3Judge.js";
import { L4_VALIDATION } from "../src/evaluator/study3ValidationSet.js";
import { BedrockConverseProvider, signV4 } from "../src/models/bedrockConverse.js";
import { providerKindFor, modelFamilyFor } from "../src/models/factory.js";
import { COMPAT_VENDORS, OpenAICompatProvider } from "../src/models/openaiCompat.js";
import { GeminiProvider } from "../src/models/gemini.js";
import {
  backoffMs,
  classifyRateLimit,
  fetchWithTimeout,
  MAX_BACKOFF_MS,
  MAX_HONOURED_RETRY_MS,
} from "../src/models/http.js";
import { computeRunHealth } from "../src/runner/runHealth.js";
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
// 3d. L4 screen recall (P3.3b finding F15)
// ---------------------------------------------------------------------------

describe("L4 candidate screen", () => {
  it("keeps every validation item that proposes a test (no recall loss)", () => {
    const shouldSurvive = L4_VALIDATION.filter((i) => i.goldProposes).map((i) => i.candidate);
    const kept = screenL4Candidates(shouldSurvive);
    expect(kept.length).toBe(shouldSurvive.length);
  });

  it("drops text with no future-test language at all", () => {
    const kept = screenL4Candidates([
      { source: "rationale", day: 5, text: "The readings are stable and within calibration bounds." },
    ]);
    expect(kept.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3e. Bedrock Converse provider (B4) — non-Claude families on the AWS credit
// ---------------------------------------------------------------------------

describe("Bedrock Converse provider", () => {
  const SIG = {
    method: "POST",
    path: "/model/amazon.nova-pro-v1%3A0/converse",
    host: "bedrock-runtime.us-east-1.amazonaws.com",
    region: "us-east-1",
    service: "bedrock",
    payload: '{"messages":[]}',
    accessKeyId: "AKIDEXAMPLE",
    secretAccessKey: "wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY",
    amzDate: "20260815T120000Z",
  };

  it("routes the converse prefix to its own provider kind and model family", () => {
    expect(providerKindFor("bedrock-converse:amazon.nova-pro-v1:0")).toBe("bedrock-converse");
    // The plain bedrock prefix must still route to the Claude SDK path.
    expect(providerKindFor("bedrock:claude-haiku-4-5")).toBe("bedrock");
    expect(modelFamilyFor("bedrock-converse:amazon.nova-pro-v1:0")).toBe("amazon.nova-pro-v1:0");
  });

  it("produces a well-formed SigV4 Authorization header", () => {
    const h = signV4(SIG);
    expect(h["authorization"]).toMatch(
      /^AWS4-HMAC-SHA256 Credential=AKIDEXAMPLE\/20260815\/us-east-1\/bedrock\/aws4_request, SignedHeaders=host;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
    expect(h["x-amz-date"]).toBe("20260815T120000Z");
  });

  it("signs the session token when present", () => {
    const h = signV4({ ...SIG, sessionToken: "tok" });
    expect(h["authorization"]).toContain("SignedHeaders=host;x-amz-date;x-amz-security-token");
    expect(h["x-amz-security-token"]).toBe("tok");
  });

  it("is deterministic, and sensitive to payload, date, region and secret", () => {
    const base = signV4(SIG)["authorization"];
    expect(signV4(SIG)["authorization"]).toBe(base); // deterministic
    for (const variant of [
      { payload: '{"messages":[1]}' },
      { amzDate: "20260816T120000Z" },
      { region: "eu-west-1" },
      { secretAccessKey: "different" },
      { path: "/model/other/converse" },
    ]) {
      expect(signV4({ ...SIG, ...variant })["authorization"]).not.toBe(base);
    }
  });

  it("shapes the Converse request and parses its response, preferring bearer auth", async () => {
    const log = new CallLog();
    let seenUrl = "";
    let seenBody = "";
    let seenAuth = "";
    const provider = new BedrockConverseProvider(
      {
        model: "bedrock-converse:amazon.nova-pro-v1:0",
        temperature: 0,
        apiKey: "test-bearer",
        fetchImpl: (async (url: string, init: RequestInit) => {
          seenUrl = String(url);
          seenBody = String(init.body);
          seenAuth = String((init.headers as Record<string, string>)["authorization"]);
          return {
            ok: true,
            status: 200,
            json: async () => ({
              output: { message: { content: [{ text: '{"type":"rest","reason":"probe"}' }] } },
              usage: { inputTokens: 11, outputTokens: 7 },
            }),
          } as unknown as Response;
        }) as unknown as typeof fetch,
      },
      log,
    );

    const action = await provider.decide({
      persona: ADA,
      day: 1,
      location: "laboratory",
      memories: "",
      notebook: { day: 1, instruments: [] },
      beliefs: INITIAL_BELIEFS,
      availableInstruments: [{ id: "pendulum_lab", kind: "pendulum" }],
      colleagues: [],
      inbox: [],
      outbox: [],
      recentObservations: [],
    });

    expect(action.type).toBe("rest");
    // Colon percent-encoded in the path, or SigV4 would not verify.
    expect(seenUrl).toBe(
      "https://bedrock-runtime.us-east-1.amazonaws.com/model/amazon.nova-pro-v1%3A0/converse",
    );
    expect(seenAuth).toBe("Bearer test-bearer");
    const body = JSON.parse(seenBody) as {
      messages: { role: string; content: { text: string }[] }[];
      inferenceConfig: { maxTokens: number; temperature: number };
    };
    expect(body.messages[0]!.role).toBe("user");
    expect(typeof body.messages[0]!.content[0]!.text).toBe("string");
    expect(body.inferenceConfig.temperature).toBe(0);
    // Token accounting reaches the call log, so cost is auditable per run.
    expect(log.all()[0]!.inputTokens).toBe(11);
    expect(log.all()[0]!.outputTokens).toBe(7);
    expect(log.all()[0]!.model).toBe("bedrock-converse:amazon.nova-pro-v1:0");
  });
});

// ---------------------------------------------------------------------------
// 3f. Free-tier family providers (B4): OpenAI-compatible + Gemini
// ---------------------------------------------------------------------------

describe("family providers", () => {
  const decisionInput = {
    persona: ADA,
    day: 1,
    location: "laboratory" as const,
    memories: "",
    notebook: { day: 1, instruments: [] },
    beliefs: INITIAL_BELIEFS,
    availableInstruments: [{ id: "pendulum_lab", kind: "pendulum" }],
    colleagues: [],
    inbox: [],
    outbox: [],
    recentObservations: [],
  };

  it("declares retry patience per vendor rather than inferring it from price", () => {
    // Price and rate-limit generosity are uncorrelated: Mistral is free and
    // generous, Groq free and stingy, Cerebras paid and very generous.
    expect(COMPAT_VENDORS["mistral"]!.retryProfile).toBe("patient");
    expect(COMPAT_VENDORS["groq"]!.retryProfile).toBe("patient");
    expect(COMPAT_VENDORS["cerebras"]!.retryProfile).toBe("standard");
    // A vendor that charges must not report $0: the reproducibility
    // statement quotes this number.
    expect(COMPAT_VENDORS["cerebras"]!.pricing).toEqual([0.35, 0.75]);
  });

  it("bills a paid vendor at its real rate instead of silently reporting zero", async () => {
    const log = new CallLog();
    const provider = new OpenAICompatProvider(
      {
        model: "cerebras:gpt-oss-120b",
        temperature: 0,
        apiKey: "k",
        fetchImpl: (async () =>
          ({
            ok: true,
            status: 200,
            json: async () => ({
              model: "gpt-oss-120b",
              choices: [{ message: { content: '{"type":"rest","reason":"p"}' } }],
              usage: { prompt_tokens: 1_000_000, completion_tokens: 1_000_000 },
            }),
          }) as unknown as Response) as unknown as typeof fetch,
      },
      log,
    );
    await provider.decide(decisionInput as never);
    expect(log.all()[0]!.estimatedCostUSD).toBeCloseTo(1.1, 6);
  });

  it("routes every family prefix to a distinct provider kind and platform", () => {
    expect(providerKindFor("groq:llama-3.3-70b-versatile")).toBe("openai-compat");
    expect(providerKindFor("mistral:mistral-large-latest")).toBe("openai-compat");
    expect(providerKindFor("gemini:gemini-2.5-flash")).toBe("gemini");
    // Existing routes must be untouched.
    expect(providerKindFor("sonar-pro")).toBe("perplexity");
    expect(providerKindFor("claude-haiku-4-5")).toBe("anthropic");
    expect(providerKindFor("bedrock-converse:amazon.nova-pro-v1:0")).toBe("bedrock-converse");
    expect(modelFamilyFor("gemini:gemini-2.5-flash")).toBe("gemini-2.5-flash");
  });

  it("OpenAI-compatible: shapes the request per vendor and parses the reply", async () => {
    const log = new CallLog();
    let seenUrl = "";
    let seenBody = "";
    const provider = new OpenAICompatProvider(
      {
        model: "mistral:mistral-large-latest",
        temperature: 0,
        apiKey: "k",
        fetchImpl: (async (url: string, init: RequestInit) => {
          seenUrl = String(url);
          seenBody = String(init.body);
          return {
            ok: true,
            status: 200,
            json: async () => ({
              model: "mistral-large-2512",
              choices: [{ message: { content: '{"type":"rest","reason":"probe"}' } }],
              usage: { prompt_tokens: 9, completion_tokens: 4 },
            }),
          } as unknown as Response;
        }) as unknown as typeof fetch,
      },
      log,
    );
    const action = await provider.decide(decisionInput as never);
    expect(action.type).toBe("rest");
    expect(seenUrl).toBe("https://api.mistral.ai/v1/chat/completions");
    expect(JSON.parse(seenBody).model).toBe("mistral-large-latest");
    expect(log.all()[0]!.inputTokens).toBe(9);
    expect(log.all()[0]!.model).toBe("mistral:mistral-large-latest");
    // R19: the request was addressed by alias, so provenance must be
    // recovered from the response — per call, so a silent swap is visible.
    expect(log.all()[0]!.resolvedModel).toBe("mistral-large-2512");
  });

  it("Gemini: uses header auth (never a key in the URL) and parses candidates", async () => {
    const log = new CallLog();
    let seenUrl = "";
    let seenHeaders: Record<string, string> = {};
    let seenBody = "";
    const provider = new GeminiProvider(
      {
        model: "gemini:gemini-2.5-flash",
        temperature: 0,
        apiKey: "secret-key",
        fetchImpl: (async (url: string, init: RequestInit) => {
          seenUrl = String(url);
          seenHeaders = init.headers as Record<string, string>;
          seenBody = String(init.body);
          return {
            ok: true,
            status: 200,
            json: async () => ({
              modelVersion: "gemini-2.5-flash-001",
              candidates: [{ content: { parts: [{ text: '{"type":"rest","reason":"p"}' }] } }],
              usageMetadata: { promptTokenCount: 12, candidatesTokenCount: 5 },
            }),
          } as unknown as Response;
        }) as unknown as typeof fetch,
      },
      log,
    );
    const action = await provider.decide(decisionInput as never);
    expect(action.type).toBe("rest");
    expect(seenUrl).toContain("gemini-2.5-flash:generateContent");
    expect(seenUrl).not.toContain("secret-key"); // key must never reach a URL
    expect(seenHeaders["x-goog-api-key"]).toBe("secret-key");
    expect(JSON.parse(seenBody).contents[0].parts[0].text).toContain("Meridian");
    expect(log.all()[0]!.outputTokens).toBe(5);
    expect(log.all()[0]!.resolvedModel).toBe("gemini-2.5-flash-001");
  });

  it("both fall back to rest rather than crashing a run on a provider error", async () => {
    // Also pins the backoff scale: with retryBaseMs 1 this path must be
    // near-instant. It was not — a fixed 0-500ms jitter ignored the
    // configured base and made the retry chain take seconds (F22).
    const startedAt = Date.now();
    const failing = (async () =>
      ({ ok: false, status: 429, text: async () => "rate limited" }) as unknown as Response) as unknown as typeof fetch;
    for (const provider of [
      new OpenAICompatProvider(
        { model: "groq:llama-3.3-70b-versatile", apiKey: "k", fetchImpl: failing, retryBaseMs: 1 },
        new CallLog(),
      ),
      new GeminiProvider(
        { model: "gemini:gemini-2.5-flash", apiKey: "k", fetchImpl: failing, retryBaseMs: 1 },
        new CallLog(),
      ),
    ]) {
      const action = await provider.decide(decisionInput as never);
      expect(action.type).toBe("rest");
    }
    expect(Date.now() - startedAt).toBeLessThan(1000);
  });
});

// ---------------------------------------------------------------------------
// 3b. Transport policy and run health (R29) — all four findings from the
//     gemini-3.7-flash seed-9111 smoke run.
// ---------------------------------------------------------------------------

describe("transport policy (F16/F17)", () => {
  const GOOGLE_DAILY_429 = JSON.stringify({
    error: {
      code: 429,
      message: "You exceeded your current quota",
      details: [
        {
          "@type": "type.googleapis.com/google.rpc.QuotaFailure",
          violations: [{ quotaId: "GenerateRequestsPerDayPerProjectPerModel" }],
        },
        { "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: "41s" },
      ],
    },
  });

  it("distinguishes a per-day quota from a per-minute limit", () => {
    const daily = classifyRateLimit(GOOGLE_DAILY_429);
    expect(daily.daily).toBe(true);
    expect(daily.quotaId).toContain("PerDay");
    expect(daily.retryAfterMs).toBe(41_000);

    // A per-minute limit must stay retryable: misreading it as fatal would
    // throw away a perfectly recoverable run.
    const perMinute = classifyRateLimit(
      JSON.stringify({
        error: {
          details: [{ violations: [{ quotaId: "GenerateRequestsPerMinutePerProject" }] }],
        },
      }),
    );
    expect(perMinute.daily).toBe(false);

    // Free-text bodies from the OpenAI-compatible vendors.
    expect(classifyRateLimit("Rate limit exceeded: 200 requests per day").daily).toBe(true);
    expect(classifyRateLimit("Rate limit exceeded: tokens per minute").daily).toBe(false);
    // Unparseable bodies default to patient, not fatal.
    expect(classifyRateLimit("<html>502</html>").daily).toBe(false);
    // A Retry-After header is honoured when the body says nothing.
    expect(classifyRateLimit("slow down", "12").retryAfterMs).toBe(12_000);
  });

  it("stops calling once a per-day quota is exhausted, instead of backing off 25 times", async () => {
    let hits = 0;
    const fetchImpl = (async () =>
      ({
        ok: false,
        status: 429,
        headers: { get: () => null },
        clone: () => ({ text: async () => GOOGLE_DAILY_429 }),
        text: async () => GOOGLE_DAILY_429,
      }) as unknown as Response) as unknown as typeof fetch;
    const counting = (async (...args: Parameters<typeof fetch>) => {
      hits += 1;
      return fetchImpl(...args);
    }) as unknown as typeof fetch;

    const log = new CallLog();
    const provider = new GeminiProvider(
      { model: "gemini:gemini-3.7-flash", apiKey: "k", fetchImpl: counting, retryBaseMs: 1 },
      log,
    );
    const input = {
      persona: ADA, day: 1, location: "laboratory" as const, memories: "",
      notebook: { day: 1, instruments: [] }, beliefs: INITIAL_BELIEFS,
      availableInstruments: [{ id: "pendulum_lab", kind: "pendulum" }],
      colleagues: [], inbox: [], outbox: [], recentObservations: [],
    };
    await provider.decide(input as never);
    expect(hits).toBe(1); // no exponential retry against a daily quota
    await provider.decide(input as never);
    await provider.decide(input as never);
    expect(hits).toBe(1); // sticky: later calls never touch the network
    expect(log.all()).toHaveLength(3);
    expect(log.all().every((c) => !c.ok)).toBe(true);
    expect(log.all()[2]!.error).toContain("daily quota exhausted");
  });

  it("does not retry a hard account error, and stops calling after the first one", async () => {
    // Cerebras seed-9114 made 72 round trips in 12s to collect 72 identical
    // `402 payment_required` bodies. Once is informative; 72 times buries it.
    let hits = 0;
    const broke = (async () => {
      hits += 1;
      return {
        ok: false,
        status: 402,
        headers: { get: () => null },
        text: async () => '{"message":"Payment required","code":"payment_required"}',
      } as unknown as Response;
    }) as unknown as typeof fetch;
    const log = new CallLog();
    const provider = new OpenAICompatProvider(
      { model: "cerebras:gpt-oss-120b", apiKey: "k", fetchImpl: broke, retryBaseMs: 1 },
      log,
    );
    const input = {
      persona: ADA, day: 1, location: "laboratory" as const, memories: "",
      notebook: { day: 1, instruments: [] }, beliefs: INITIAL_BELIEFS,
      availableInstruments: [{ id: "pendulum_lab", kind: "pendulum" }],
      colleagues: [], inbox: [], outbox: [], recentObservations: [],
    };
    await provider.decide(input as never);
    await provider.decide(input as never);
    expect(hits).toBe(1);
    expect(log.all()[1]!.error).toContain("account error HTTP 402");
  });

  it("caps a single backoff interval and scales jitter to the base", () => {
    // A per-minute limit refills within 60s; doubling past that waits for a
    // quota that has already returned.
    for (let attempt = 0; attempt < 10; attempt++) {
      expect(backoffMs(4000, attempt)).toBeLessThanOrEqual(MAX_BACKOFF_MS * 1.25);
    }
    expect(backoffMs(4000, 0)).toBeGreaterThan(2000);
    // Jitter must respect a tiny configured base rather than swamping it.
    for (let i = 0; i < 50; i++) expect(backoffMs(1, 0)).toBeLessThan(5);
    // A server-supplied delay is honoured but bounded.
    expect(backoffMs(4000, 0, 3_600_000)).toBeLessThanOrEqual(MAX_HONOURED_RETRY_MS * 1.25);
  });

  it("abandons a hung request at the deadline rather than stalling a run", async () => {
    // The seed-9111 run lost 7 hours to a single `fetch` that never resolved.
    const never = (async (_url: string, init: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        (init.signal as AbortSignal).addEventListener("abort", () => {
          const e = new Error("aborted");
          e.name = "AbortError";
          reject(e);
        });
      })) as unknown as typeof fetch;
    const started = Date.now();
    const { res, timedOut } = await fetchWithTimeout(never, "https://example.invalid", {}, 40);
    expect(timedOut).toBe(true);
    expect(res).toBeNull();
    // The assertion that matters is "returned at all"; the bound is loose
    // because a tight wall-clock check would flake under CI load and a
    // flaky test in a pre-registered pipeline is worse than no test.
    expect(Date.now() - started).toBeLessThan(5000);
  });
});

describe("run-health gate (R29)", () => {
  it("marks the seed-9111 failure profile invalid rather than null", () => {
    const health = computeRunHealth({
      days: 40,
      // 24 ok, 25 failed — the observed profile.
      calls: [
        ...Array.from({ length: 24 }, () => ({ ok: true })),
        ...Array.from({ length: 25 }, () => ({ ok: false })),
      ],
      agents: [{ agentId: "ada", failedUpdates: [20, 21, 22, 23, 24, 40].map((day) => ({ day })) }],
    });
    expect(health.healthy).toBe(false);
    expect(health.failedCalls).toBe(25);
    expect(health.agentsMissingFinalReview).toEqual(["ada"]);
    expect(health.reasons.join(" ")).toMatch(/call failure rate/);
    expect(health.reasons.join(" ")).toMatch(/end-of-study review failed/);
  });

  it("counts review attempts, never reporting an impossible >100% failure rate", () => {
    // The first version of the gate guessed the denominator from the day
    // count and reported 400% on the Cerebras run. Attempts are agent-
    // triggered, so they must be counted, not inferred.
    const days = [10, 11, 12, 13, 14];
    const health = computeRunHealth({
      days: 40,
      calls: days.map((day) => ({ ok: false, purpose: "belief_update", agentId: "ada", day })),
      agents: [{ agentId: "ada", failedUpdates: days.map((day) => ({ day })) }],
    });
    expect(health.reviewFailureRate).toBe(1);

    // Repair retries share an (agent, day) pair: the unit of loss is the
    // review, not the HTTP call.
    const withRepairs = computeRunHealth({
      days: 40,
      calls: [
        { ok: true, purpose: "belief_update", agentId: "ada", day: 10 },
        { ok: false, purpose: "belief_update", agentId: "ada", day: 20 },
        { ok: false, purpose: "belief_update", agentId: "ada", day: 20 },
      ],
      agents: [{ agentId: "ada", failedUpdates: [{ day: 20 }] }],
    });
    expect(withRepairs.reviewFailureRate).toBe(0.5);
  });

  it("passes a clean run, and fails a run that lost only the final review", () => {
    const clean = computeRunHealth({
      days: 40,
      calls: Array.from({ length: 49 }, () => ({ ok: true })),
      agents: [{ agentId: "ada", failedUpdates: [] }],
    });
    expect(clean.healthy).toBe(true);
    expect(clean.reasons).toEqual([]);

    // One lost review is tolerable; losing the LAST one is not, because the
    // primary endpoint is measured at final belief state.
    const finalLost = computeRunHealth({
      days: 40,
      calls: Array.from({ length: 49 }, (_, i) => ({ ok: i !== 0 })),
      agents: [{ agentId: "ada", failedUpdates: [{ day: 40 }] }],
    });
    expect(finalLost.healthy).toBe(false);
    expect(finalLost.reasons.join(" ")).toMatch(/final belief state is stale/);
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

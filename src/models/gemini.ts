/**
 * Google Gemini provider (design v0.3 R19 / B4).
 *
 * Gemini does not speak the OpenAI schema, so it needs its own file. It earns
 * one: Google is an independent lineage, and the free tier (Flash: ~1M tokens
 * per minute, ~1,500 requests per day, no card) comfortably carries a Study 3
 * family at zero cost — roughly 30 forty-day runs per day at our ~48 calls
 * per run.
 *
 * Model names carry the `gemini:` prefix for manifest provenance:
 *   gemini:gemini-2.5-flash
 *
 * FREE-TIER CAVEAT TO RECORD IN THE PAPER: Google's terms allow free-tier
 * inputs and outputs to be used for model improvement. That does not
 * contaminate this study — every run completes before any such use, and the
 * worlds contain no sensitive material — but it belongs in the data
 * availability statement, and it is a reason a paid tier would be preferable
 * if funding ever appears.
 */

import { AgentActionSchema, REST_FALLBACK, type AgentAction } from "../agents/actions.js";
import { BeliefUpdateSchema, type BeliefUpdate } from "../agents/beliefs.js";
import {
  beliefPromptVersion,
  buildBeliefUpdatePrompt,
  buildDecisionPrompt,
  DECISION_PROMPT_VERSION,
  type PromptVariant,
} from "../agents/promptBuilder.js";
import { extractJson } from "./anthropic.js";
import {
  backoffMs,
  classifyRateLimit,
  fetchWithTimeout,
  headerOrNull,
  peekBody,
  REQUEST_TIMEOUT_MS,
  RETRYABLE_STATUS,
} from "./http.js";
import { stripThink } from "./perplexity.js";
import { runStructuredWithRepair } from "./repair.js";
import type {
  BeliefUpdateInput,
  CallLog,
  DecisionInput,
  ModelProvider,
} from "./provider.js";

export const GEMINI_PREFIX = "gemini:";

export function isGeminiModel(model: string): boolean {
  return model.startsWith(GEMINI_PREFIX);
}

export function geminiModelId(model: string): string {
  return model.startsWith(GEMINI_PREFIX) ? model.slice(GEMINI_PREFIX.length) : model;
}

/** Per-1M [input, output]; 0 on the free tier. Paid Flash rates as fallback. */
const PRICING: Record<string, [number, number]> = {};

export interface GeminiConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  promptVariant?: PromptVariant;
  apiKey?: string;
  fetchImpl?: typeof fetch;
  /** Base backoff in ms. Free tiers rate-limit by TPM, so retries are the
   *  normal path; tunable so a battery can be gentler and tests fast. */
  retryBaseMs?: number;
  /** Retry attempts. Free tiers need more patience than paid ones. */
  retryAttempts?: number;
  /** Per-request deadline. See http.ts: a hung socket cost the seed-9111
   *  smoke run seven hours on a single call. */
  timeoutMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class GeminiProvider implements ModelProvider {
  readonly name: string;
  readonly temperature: number;
  private modelId: string;
  private apiKey: string;
  private maxTokens: number;
  private variant: PromptVariant;
  private doFetch: typeof fetch;
  private retryBaseMs: number;
  private retryAttempts: number;
  private timeoutMs: number;
  /** Sticky: once a per-day quota is exhausted it will not refill inside this
   *  run, so every later call short-circuits without touching the network. */
  private quotaExhausted: string | null = null;

  constructor(config: GeminiConfig, private log: CallLog) {
    this.modelId = geminiModelId(config.model);
    this.name = `${GEMINI_PREFIX}${this.modelId}`;
    this.maxTokens = config.maxTokens ?? 4096;
    this.temperature = config.temperature ?? 1.0;
    this.variant = config.promptVariant ?? "v0.1";
    this.doFetch = config.fetchImpl ?? fetch;
    // Free tier by default: be patient (see openaiCompat.ts for the
    // measured justification).
    this.retryBaseMs = config.retryBaseMs ?? 4000;
    this.retryAttempts = config.retryAttempts ?? 7;
    this.timeoutMs = config.timeoutMs ?? REQUEST_TIMEOUT_MS;
    const key = config.apiKey ?? process.env["GEMINI_API_KEY"] ?? process.env["GOOGLE_API_KEY"];
    if (!key) throw new Error("GEMINI_API_KEY is not set");
    this.apiKey = key;
  }

  private async call(
    agentId: string,
    day: number,
    purpose: "decision" | "belief_update",
    promptText: string,
  ): Promise<string> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${encodeURIComponent(this.modelId)}:generateContent`;
    const started = Date.now();
    const promptVersion =
      purpose === "decision" ? DECISION_PROMPT_VERSION : beliefPromptVersion(this.variant);

    // Short-circuit: the daily quota is already gone, so a network round trip
    // can only produce the same 429 more slowly.
    if (this.quotaExhausted) {
      this.log.append({
        agentId, day, purpose, model: this.name, temperature: this.temperature,
        promptVersion, promptText, completionText: "",
        inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0, latencyMs: 0, ok: false,
        error: `quota exhausted (${this.quotaExhausted}); call skipped`,
      });
      throw new Error(`Gemini quota exhausted (${this.quotaExhausted})`);
    }

    let res: Response | null = null;
    let timedOut = false;
    let failureNote = "";
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      ({ res, timedOut } = await fetchWithTimeout(
        this.doFetch,
        url,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            // Header auth rather than a query parameter, so the key cannot
            // leak into any URL that gets logged.
            "x-goog-api-key": this.apiKey,
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            generationConfig: {
              temperature: this.temperature,
              maxOutputTokens: this.maxTokens,
            },
          }),
        },
        this.timeoutMs,
      ));
      if (timedOut) {
        failureNote = `timeout after ${this.timeoutMs}ms`;
        await sleep(backoffMs(this.retryBaseMs, attempt));
        continue;
      }
      if (!res || res.ok || !RETRYABLE_STATUS.includes(res.status)) break;

      let serverMs: number | undefined;
      if (res.status === 429) {
        // Read the body once here; it is re-read below only if we give up.
        const body = await peekBody(res);
        const verdict = classifyRateLimit(body, headerOrNull(res, "retry-after"));
        if (verdict.daily) {
          // Per-day exhaustion does not refill inside a run. Stop paying for
          // it: 25 doomed calls × 508s of backoff was 3.5 hours of the
          // seed-9111 run spent waiting for a quota that resets tomorrow.
          this.quotaExhausted = verdict.quotaId;
          failureNote = `daily quota exhausted (${verdict.quotaId})`;
          break;
        }
        serverMs = verdict.retryAfterMs;
      }
      await sleep(backoffMs(this.retryBaseMs, attempt, serverMs));
    }
    const latencyMs = Date.now() - started;

    if (!res || !res.ok) {
      const body = timedOut || !res ? failureNote || "no response" : await res.text();
      this.log.append({
        agentId, day, purpose, model: this.name, temperature: this.temperature,
        promptVersion, promptText, completionText: "",
        inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0, latencyMs, ok: false,
        error: `HTTP ${res?.status ?? "timeout"}: ${body.slice(0, 300)}`,
      });
      throw new Error(`Gemini error ${res?.status ?? "timeout"}`);
    }

    const data = (await res.json()) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    const text =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
    const inTok = data.usageMetadata?.promptTokenCount ?? Math.ceil(promptText.length / 4);
    const outTok = data.usageMetadata?.candidatesTokenCount ?? Math.ceil(text.length / 4);
    const [inPrice, outPrice] = PRICING[this.modelId] ?? [0, 0];
    this.log.append({
      agentId, day, purpose, model: this.name, temperature: this.temperature,
      promptVersion, promptText, completionText: text,
      inputTokens: inTok, outputTokens: outTok,
      estimatedCostUSD: (inTok / 1e6) * inPrice + (outTok / 1e6) * outPrice,
      latencyMs, ok: true,
    });
    return text;
  }

  async decide(input: DecisionInput): Promise<AgentAction> {
    const prompt = buildDecisionPrompt(input);
    try {
      return await runStructuredWithRepair({
        purpose: "decision",
        prompt,
        call: (p) => this.call(input.persona.agentId, input.day, "decision", p),
        preprocess: stripThink,
        extract: extractJson,
        parse: (raw) => AgentActionSchema.parse(raw),
      });
    } catch {
      return REST_FALLBACK;
    }
  }

  async updateBeliefs(input: BeliefUpdateInput): Promise<BeliefUpdate> {
    const prompt = buildBeliefUpdatePrompt(input, this.variant);
    return runStructuredWithRepair({
      purpose: "belief_update",
      prompt,
      call: (p) => this.call(input.persona.agentId, input.day, "belief_update", p),
      preprocess: stripThink,
      extract: extractJson,
      parse: (raw) => BeliefUpdateSchema.parse(raw),
      isFinalReview: input.isFinalReview ?? false,
    });
  }
}

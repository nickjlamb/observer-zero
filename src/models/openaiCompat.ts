/**
 * OpenAI-compatible chat-completions provider (design v0.3 R19 / B4).
 *
 * One implementation, many vendors: Groq, Mistral, Cerebras, DeepSeek and
 * OpenAI itself all speak the same `/chat/completions` schema, so a single
 * file buys several independent model lineages. Which of them Study 3
 * actually uses is a funding question, not a code question — see the
 * registry below.
 *
 * Model names carry a vendor prefix so the serving platform is legible in
 * every arm definition, battery index and run manifest:
 *
 *   groq:llama-3.3-70b-versatile
 *   mistral:mistral-large-latest
 *   cerebras:gpt-oss-120b
 *
 * CLOSED-WORLD INVARIANT: no vendor here performs retrieval by default, but
 * any future entry that can must disable it explicitly, as the Perplexity
 * provider does with `disable_search`. An agent that can search the real web
 * is not inside Meridian.
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

export interface CompatVendor {
  baseUrl: string;
  envKey: string;
  /** Per-1M-token [input, output] for cost accounting; 0 for free tiers. */
  pricing: [number, number];
  /** Lineage label recorded in the manifest — the thing R19 actually counts. */
  lineage: string;
}

/**
 * Free-tier limits current as of 2026-08-15 (recorded because they bind
 * scheduling, not budget): Groq 14,400 req/day but a 6k TPM ceiling — at
 * ~4.7k tokens per call that is roughly one call per minute, so a 40-day run
 * takes ~45 minutes. Mistral ~50k TPM and Cerebras ~30k TPM are far more
 * comfortable. Verify before a battery: free tiers move.
 */
export const COMPAT_VENDORS: Record<string, CompatVendor> = {
  groq: {
    baseUrl: "https://api.groq.com/openai/v1/chat/completions",
    envKey: "GROQ_API_KEY",
    pricing: [0, 0],
    lineage: "varies-by-model",
  },
  mistral: {
    baseUrl: "https://api.mistral.ai/v1/chat/completions",
    envKey: "MISTRAL_API_KEY",
    pricing: [0, 0],
    lineage: "mistral",
  },
  cerebras: {
    baseUrl: "https://api.cerebras.ai/v1/chat/completions",
    envKey: "CEREBRAS_API_KEY",
    pricing: [0, 0],
    lineage: "varies-by-model",
  },
  deepseek: {
    baseUrl: "https://api.deepseek.com/v1/chat/completions",
    envKey: "DEEPSEEK_API_KEY",
    pricing: [0.28, 0.42],
    lineage: "deepseek",
  },
  openai: {
    baseUrl: "https://api.openai.com/v1/chat/completions",
    envKey: "OPENAI_API_KEY",
    pricing: [2, 12],
    lineage: "openai",
  },
};

export function isCompatModel(model: string): boolean {
  const prefix = model.split(":")[0] ?? "";
  return prefix in COMPAT_VENDORS && model.includes(":");
}

export function compatParts(model: string): { vendor: CompatVendor; vendorId: string; modelId: string } {
  const idx = model.indexOf(":");
  const vendorId = model.slice(0, idx);
  const vendor = COMPAT_VENDORS[vendorId];
  if (!vendor) throw new Error(`Unknown OpenAI-compatible vendor "${vendorId}"`);
  return { vendor, vendorId, modelId: model.slice(idx + 1) };
}

export interface OpenAICompatConfig {
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
  /** Per-request deadline. See http.ts. */
  timeoutMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class OpenAICompatProvider implements ModelProvider {
  readonly name: string;
  readonly temperature: number;
  private vendor: CompatVendor;
  private modelId: string;
  private apiKey: string;
  private maxTokens: number;
  private variant: PromptVariant;
  private doFetch: typeof fetch;
  private retryBaseMs: number;
  private retryAttempts: number;
  private timeoutMs: number;
  /** Sticky per-day quota flag — see GeminiProvider for the rationale. */
  private quotaExhausted: string | null = null;

  constructor(
    config: OpenAICompatConfig,
    private log: CallLog,
  ) {
    const { vendor, modelId } = compatParts(config.model);
    this.vendor = vendor;
    this.modelId = modelId;
    this.name = config.model;
    this.maxTokens = config.maxTokens ?? 4096;
    this.temperature = config.temperature ?? 1.0;
    this.variant = config.promptVariant ?? "v0.1";
    this.doFetch = config.fetchImpl ?? fetch;
    // A vendor priced at zero is a free tier, and free tiers rate-limit by
    // tokens per minute: a 40-day run bursts ~48 calls and WILL hit the
    // ceiling. The Mistral smoke test lost 4 of 44 calls (9%) at the paid
    // defaults — enough to cost four decision days — so free tiers get more
    // attempts and a longer base.
    const free = vendor.pricing[0] === 0 && vendor.pricing[1] === 0;
    this.retryBaseMs = config.retryBaseMs ?? (free ? 4000 : 2000);
    this.retryAttempts = config.retryAttempts ?? (free ? 7 : 5);
    this.timeoutMs = config.timeoutMs ?? REQUEST_TIMEOUT_MS;
    const key = config.apiKey ?? process.env[vendor.envKey];
    if (!key) throw new Error(`${vendor.envKey} is not set`);
    this.apiKey = key;
  }

  private async call(
    agentId: string,
    day: number,
    purpose: "decision" | "belief_update",
    promptText: string,
  ): Promise<string> {
    const started = Date.now();
    const promptVersion =
      purpose === "decision" ? DECISION_PROMPT_VERSION : beliefPromptVersion(this.variant);

    if (this.quotaExhausted) {
      this.log.append({
        agentId, day, purpose, model: this.name, temperature: this.temperature,
        promptVersion, promptText, completionText: "",
        inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0, latencyMs: 0, ok: false,
        error: `quota exhausted (${this.quotaExhausted}); call skipped`,
      });
      throw new Error(`${this.name} quota exhausted (${this.quotaExhausted})`);
    }

    let res: Response | null = null;
    let timedOut = false;
    let failureNote = "";
    for (let attempt = 0; attempt < this.retryAttempts; attempt++) {
      ({ res, timedOut } = await fetchWithTimeout(
        this.doFetch,
        this.vendor.baseUrl,
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: this.modelId,
            max_tokens: this.maxTokens,
            temperature: this.temperature,
            messages: [{ role: "user", content: promptText }],
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

      // 429 matters more here than elsewhere: free tiers are rate-limited by
      // tokens per minute, so backoff is the normal path, not an error path —
      // UNLESS the exhausted quota is per-day, which no amount of waiting
      // fixes inside a run.
      let serverMs: number | undefined;
      if (res.status === 429) {
        const body = await peekBody(res);
        const verdict = classifyRateLimit(body, headerOrNull(res, "retry-after"));
        if (verdict.daily) {
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
      throw new Error(`${this.name} error ${res?.status ?? "timeout"}`);
    }

    const data = (await res.json()) as {
      model?: string;
      choices?: { message?: { content?: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const inTok = data.usage?.prompt_tokens ?? Math.ceil(promptText.length / 4);
    const outTok = data.usage?.completion_tokens ?? Math.ceil(text.length / 4);
    const [inPrice, outPrice] = this.vendor.pricing;
    this.log.append({
      agentId, day, purpose, model: this.name, temperature: this.temperature,
      promptVersion, promptText, completionText: text,
      // R19 provenance: `mistral-large-latest` is an alias, so the request
      // cannot pin a version. The response can — record what actually served
      // the call, per call, so a silent upstream swap is visible afterwards.
      ...(data.model ? { resolvedModel: data.model } : {}),
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

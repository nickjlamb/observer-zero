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

  constructor(config: GeminiConfig, private log: CallLog) {
    this.modelId = geminiModelId(config.model);
    this.name = `${GEMINI_PREFIX}${this.modelId}`;
    this.maxTokens = config.maxTokens ?? 4096;
    this.temperature = config.temperature ?? 1.0;
    this.variant = config.promptVariant ?? "v0.1";
    this.doFetch = config.fetchImpl ?? fetch;
    this.retryBaseMs = config.retryBaseMs ?? 2000;
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
    let res: Response | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      res = await this.doFetch(url, {
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
      });
      // Free-tier quota exhaustion is a 429 and is expected, not exceptional.
      if (res.ok || ![429, 500, 502, 503, 529].includes(res.status)) break;
      await sleep(this.retryBaseMs * 2 ** attempt + Math.random() * 500);
    }
    const latencyMs = Date.now() - started;
    const promptVersion =
      purpose === "decision" ? DECISION_PROMPT_VERSION : beliefPromptVersion(this.variant);

    if (!res || !res.ok) {
      const body = res ? await res.text() : "no response";
      this.log.append({
        agentId, day, purpose, model: this.name, temperature: this.temperature,
        promptVersion, promptText, completionText: "",
        inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0, latencyMs, ok: false,
        error: `HTTP ${res?.status ?? "?"}: ${body.slice(0, 300)}`,
      });
      throw new Error(`Gemini error ${res?.status ?? "?"}`);
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

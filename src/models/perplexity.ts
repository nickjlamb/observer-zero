/**
 * Perplexity provider — the cross-lab experimental arm.
 *
 * Uses Perplexity's OpenAI-compatible chat completions API with
 * `disable_search: true` on EVERY call. This is non-negotiable for Observer
 * Zero: a search-grounded agent breaks the closed-world design (Meridian's
 * ground truth must be discoverable only from in-world evidence) and would
 * confound the model comparison with a retrieval architecture. The flag is
 * hard-coded, not configurable, and recorded in the manifest.
 *
 * Requires PERPLEXITY_API_KEY (in .env or the shell).
 *
 * Reasoning models (sonar-reasoning-pro) emit <think>…</think> before their
 * answer; the think block may contain braces, so it is stripped before JSON
 * extraction.
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
import type {
  BeliefUpdateInput,
  CallLog,
  DecisionInput,
  ModelProvider,
} from "./provider.js";

/**
 * USD per million tokens (input, output). Estimates as of Aug 2026 — update
 * from https://docs.perplexity.ai pricing as needed; used only for the cost
 * telemetry, never for control flow.
 */
const PRICING: Record<string, [number, number]> = {
  sonar: [1, 1],
  "sonar-pro": [3, 15],
  "sonar-reasoning-pro": [2, 8],
};

export interface PerplexityConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  promptVariant?: PromptVariant;
  apiKey?: string;
}

/** Remove <think>…</think> blocks (reasoning models) before JSON extraction. */
export function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class PerplexityProvider implements ModelProvider {
  readonly name: string;
  readonly temperature: number;
  private apiKey: string;
  private maxTokens: number;
  private variant: PromptVariant;

  constructor(
    private config: PerplexityConfig,
    private log: CallLog,
  ) {
    this.name = config.model;
    this.variant = config.promptVariant ?? "v0.1";
    this.maxTokens = config.maxTokens ?? 4096;
    this.temperature = config.temperature ?? 1.0;
    const key = config.apiKey ?? process.env["PERPLEXITY_API_KEY"];
    if (!key) throw new Error("PERPLEXITY_API_KEY is not set");
    this.apiKey = key;
  }

  private async call(
    agentId: string,
    day: number,
    purpose: "decision" | "belief_update",
    promptText: string,
  ): Promise<string> {
    const started = Date.now();
    let res: Response | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          disable_search: true, // closed-world invariant — never remove
          messages: [{ role: "user", content: promptText }],
        }),
      });
      if (res.ok || ![429, 500, 502, 503, 529].includes(res.status)) break;
      await sleep(1000 * 2 ** attempt + Math.random() * 500);
    }
    const latencyMs = Date.now() - started;
    if (!res || !res.ok) {
      const body = res ? await res.text() : "no response";
      this.log.append({
        agentId, day, purpose, model: this.config.model, temperature: this.temperature,
        promptVersion: purpose === "decision" ? DECISION_PROMPT_VERSION : beliefPromptVersion(this.variant),
        promptText, completionText: "", inputTokens: 0, outputTokens: 0,
        estimatedCostUSD: 0, latencyMs, ok: false,
        error: `HTTP ${res?.status ?? "?"}: ${body.slice(0, 300)}`,
      });
      throw new Error(`Perplexity API error ${res?.status ?? "?"}`);
    }
    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const text = data.choices?.[0]?.message?.content ?? "";
    const inTok = data.usage?.prompt_tokens ?? Math.ceil(promptText.length / 4);
    const outTok = data.usage?.completion_tokens ?? Math.ceil(text.length / 4);
    const [inPrice, outPrice] = PRICING[this.config.model] ?? [3, 15];
    this.log.append({
      agentId, day, purpose, model: this.config.model, temperature: this.temperature,
      promptVersion: purpose === "decision" ? DECISION_PROMPT_VERSION : beliefPromptVersion(this.variant),
      promptText, completionText: text,
      inputTokens: inTok, outputTokens: outTok,
      estimatedCostUSD: (inTok * inPrice + outTok * outPrice) / 1e6,
      latencyMs, ok: true,
    });
    return text;
  }

  private async structured<T>(
    agentId: string,
    day: number,
    purpose: "decision" | "belief_update",
    prompt: string,
    parse: (raw: unknown) => T,
  ): Promise<T> {
    const first = await this.call(agentId, day, purpose, prompt);
    try {
      return parse(extractJson(stripThink(first)));
    } catch (e) {
      const repair =
        `${prompt}\n\n[repair]\nYour previous reply was invalid: ${String(e).slice(0, 300)}\n` +
        `Previous reply:\n${stripThink(first).slice(0, 1000)}\n\nRespond again with ONLY the corrected JSON object.`;
      const second = await this.call(agentId, day, purpose, repair);
      return parse(extractJson(stripThink(second)));
    }
  }

  async decide(input: DecisionInput): Promise<AgentAction> {
    try {
      return await this.structured(
        input.persona.agentId,
        input.day,
        "decision",
        buildDecisionPrompt(input),
        (raw) => AgentActionSchema.parse(raw),
      );
    } catch {
      return REST_FALLBACK;
    }
  }

  async updateBeliefs(input: BeliefUpdateInput): Promise<BeliefUpdate> {
    return this.structured(
      input.persona.agentId,
      input.day,
      "belief_update",
      buildBeliefUpdatePrompt(input, this.variant),
      (raw) => BeliefUpdateSchema.parse(raw),
    );
  }
}

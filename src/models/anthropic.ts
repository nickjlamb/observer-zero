/**
 * Anthropic provider: real LLM reasoning for agents.
 *
 * Requires ANTHROPIC_API_KEY in the environment. Structured output is
 * requested as JSON-only and validated with Zod; one repair retry with the
 * validation error before falling back (decision → rest; beliefs → keep priors
 * via a thrown error the agent catches).
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
import { runStructuredWithRepair } from "./repair.js";
import type {
  BeliefUpdateInput,
  CallLog,
  DecisionInput,
  ModelProvider,
} from "./provider.js";

/** USD per million tokens (input, output). Adjust as pricing evolves. */
const PRICING: Record<string, [number, number]> = {
  "claude-sonnet-4-5": [3, 15],
  "claude-haiku-4-5": [1, 5],
  "claude-opus-4-5": [5, 25],
};

export interface AnthropicConfig {
  model: string;
  maxTokens?: number;
  /** Sampling temperature; explicit + logged for the frozen manifest. Default 1.0. */
  temperature?: number;
  promptVariant?: PromptVariant;
  apiKey?: string;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function extractJson(text: string): unknown {
  // Strip code fences, then take the FIRST BALANCED JSON object.
  //
  // The original implementation sliced from the first "{" to the LAST "}",
  // which crashed whenever a model appended commentary containing a brace
  // after its JSON. That crash killed a confirmatory scoring pass twice on
  // 2026-08-31 ("Unexpected non-whitespace character after JSON"), near-
  // deterministically, on judge chatter following a valid verdict. This
  // version is semantics-preserving on every output the old code could
  // parse: a lone well-formed object yields the identical value, and any
  // output the old code parsed successfully had its last "}" closing the
  // first object anyway. It differs only on outputs the old code CRASHED on,
  // where the leading complete object is the verdict. Logged as a deviation
  // in the run ledger (transport-level fix; no judge prompt, threshold or
  // verdict semantics touched).
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  if (start === -1) throw new Error("No JSON object found in model output");
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (inString) {
      if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return JSON.parse(cleaned.slice(start, i + 1));
    }
  }
  throw new Error("No JSON object found in model output");
}

export class AnthropicProvider implements ModelProvider {
  readonly name: string;
  readonly temperature: number;
  private apiKey: string;
  private maxTokens: number;
  private variant: PromptVariant;

  constructor(
    private config: AnthropicConfig,
    private log: CallLog,
  ) {
    this.name = config.model;
    this.variant = config.promptVariant ?? "v0.1";
    // 4096, not 2000: live haiku belief updates ran ~2100 tokens and the old
    // cap truncated the JSON mid-object — both attempts failed validation and
    // roughly half of all reviews silently died (see failedUpdates).
    this.maxTokens = config.maxTokens ?? 4096;
    this.temperature = config.temperature ?? 1.0;
    const key = config.apiKey ?? process.env["ANTHROPIC_API_KEY"];
    if (!key) throw new Error("ANTHROPIC_API_KEY is not set");
    this.apiKey = key;
  }

  private async call(
    agentId: string,
    day: number,
    purpose: "decision" | "belief_update",
    promptText: string,
  ): Promise<string> {
    const started = Date.now();
    // Retry with exponential backoff on rate limits / transient server errors
    // (essential for concurrent battery runs).
    let res: Response | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: this.config.model,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
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
      throw new Error(`Anthropic API error ${res?.status ?? "?"}`);
    }
    const data = (await res.json()) as {
      content: { type: string; text?: string }[];
      usage: { input_tokens: number; output_tokens: number };
    };
    const text = data.content.find((c) => c.type === "text")?.text ?? "";
    const [inPrice, outPrice] = PRICING[this.config.model] ?? [3, 15];
    this.log.append({
      agentId, day, purpose, model: this.config.model, temperature: this.temperature,
      promptVersion: purpose === "decision" ? DECISION_PROMPT_VERSION : beliefPromptVersion(this.variant),
      promptText, completionText: text,
      inputTokens: data.usage.input_tokens,
      outputTokens: data.usage.output_tokens,
      estimatedCostUSD:
        (data.usage.input_tokens * inPrice + data.usage.output_tokens * outPrice) / 1e6,
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
    isFinalReview = false,
  ): Promise<T> {
    return runStructuredWithRepair({
      purpose,
      prompt,
      parse,
      isFinalReview,
      extract: extractJson,
      call: (text) => this.call(agentId, day, purpose, text),
    });
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
      input.isFinalReview ?? false,
    );
  }
}

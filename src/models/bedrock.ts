/**
 * Amazon Bedrock provider — the same Claude models, a different front door.
 *
 * WHY THIS EXISTS. Study 2's Anthropic-model arms (D's haiku minority, E's
 * sonnet minority, F's all-haiku society) were budget-limited to ~$134 of
 * first-party credit, which forced arms E and F to be contingent. AWS
 * credits lift that, and Bedrock serves the SAME model versions Study 1
 * used — `anthropic.claude-haiku-4-5-20251001-v1:0` and the Sonnet 4.5
 * equivalent — so the agent models are unchanged, only the serving platform
 * differs.
 *
 * TWO INVARIANTS THIS MUST NOT BREAK.
 *
 * 1. **The frozen judge stays on the first-party API.** The evaluator
 *    (claude-haiku-4-5, temperature 0) is the measurement apparatus, and
 *    every judged result in Study 1 depends on it. Moving the judge would
 *    silently re-baseline the entire programme. This provider is for AGENTS
 *    only; `src/evaluator/*` must never route through it.
 *
 * 2. **The serving platform is recorded, not assumed away.** Same weights
 *    does not mean provably identical behaviour: request handling, default
 *    parameters and tokenisation can differ at the edges. The manifest
 *    records `servingPlatform` for every run so any cross-platform
 *    comparison is visible rather than implicit. Study 2's own arms are
 *    internally consistent (all Claude agents on Bedrock); it is the
 *    comparison BACK to Study 1's first-party runs that carries the caveat.
 *
 * Model naming: prefix a model with `bedrock:` to route it here, e.g.
 * `bedrock:claude-haiku-4-5`. The prefix is explicit in every arm
 * definition, battery index and manifest, so provenance is legible without
 * consulting an environment variable.
 *
 * Credentials come from the standard AWS chain (env, shared config, role).
 * Region defaults to AWS_REGION, then us-east-1.
 */

import { AnthropicBedrock, AnthropicBedrockMantle } from "@anthropic-ai/bedrock-sdk";
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
import { runStructuredWithRepair } from "./repair.js";
import type {
  BeliefUpdateInput,
  CallLog,
  DecisionInput,
  ModelProvider,
} from "./provider.js";

export const BEDROCK_PREFIX = "bedrock:";
/**
 * The bedrock-mantle endpoint: Anthropic-compatible API, API-key auth, and
 * — decisively for a new account — no First Time Use form.
 *
 * ONE SCIENTIFIC COST, MITIGATED. Mantle addresses models by UNDATED alias
 * (`anthropic.claude-haiku-4-5`) where bedrock-runtime uses a pinned dated
 * id (`...-20251001-v1:0`). An undated alias is exactly what
 * BEDROCK_MODEL_IDS was written to avoid, because the frozen condition
 * should not be able to change under us without a commit.
 *
 * The mitigation is provenance after the fact rather than pinning before
 * it: every response carries the model that actually served it, and that
 * value is recorded per call in the run artifact (`resolvedModel`). So a
 * silent upstream change cannot go unnoticed — it shows up as a different
 * resolved model in the logs, run by run, and the affected runs can be
 * identified precisely. Weaker than pinning, honest about being weaker.
 */
export const MANTLE_PREFIX = "bedrock-mantle:";

/**
 * Short name → Bedrock model id. Pinned to the exact dated versions so a
 * silent upstream alias change cannot alter the frozen condition.
 */
export const BEDROCK_MODEL_IDS: Record<string, string> = {
  "claude-haiku-4-5": "anthropic.claude-haiku-4-5-20251001-v1:0",
  "claude-sonnet-4-5": "anthropic.claude-sonnet-4-5-20250929-v1:0",
};

/** USD per million tokens (input, output). Bedrock list pricing. */
const PRICING: Record<string, [number, number]> = {
  "claude-haiku-4-5": [1, 5],
  "claude-sonnet-4-5": [3, 15],
};

/** Model ids on the mantle endpoint (undated aliases — see MANTLE_PREFIX). */
export const MANTLE_MODEL_IDS: Record<string, string> = {
  "claude-haiku-4-5": "anthropic.claude-haiku-4-5",
  "claude-sonnet-4-5": "anthropic.claude-sonnet-4-5",
};

export function isMantleModel(modelName: string): boolean {
  return modelName.startsWith(MANTLE_PREFIX);
}

export function isBedrockModel(modelName: string): boolean {
  // Order matters: "bedrock-mantle:" also starts with "bedrock" but is a
  // different endpoint with different auth and different model ids.
  return modelName.startsWith(BEDROCK_PREFIX) || isMantleModel(modelName);
}

/** Strip the routing prefix: "bedrock:claude-haiku-4-5" → "claude-haiku-4-5". */
export function bedrockShortName(modelName: string): string {
  if (modelName.startsWith(MANTLE_PREFIX)) return modelName.slice(MANTLE_PREFIX.length);
  if (modelName.startsWith(BEDROCK_PREFIX)) return modelName.slice(BEDROCK_PREFIX.length);
  return modelName;
}

/** Resolve to the mantle model alias, or throw if unknown. */
export function resolveMantleModelId(modelName: string): string {
  const short = bedrockShortName(modelName);
  const id = MANTLE_MODEL_IDS[short];
  if (!id) {
    throw new Error(
      `Unknown mantle model "${short}". Known: ${Object.keys(MANTLE_MODEL_IDS).join(", ")}.`,
    );
  }
  return id;
}

/** Resolve to the pinned Bedrock model id, or throw if unknown. */
export function resolveBedrockModelId(modelName: string): string {
  const short = bedrockShortName(modelName);
  const id = BEDROCK_MODEL_IDS[short];
  if (!id) {
    throw new Error(
      `Unknown Bedrock model "${short}". Known: ${Object.keys(BEDROCK_MODEL_IDS).join(", ")}. ` +
        `Add it to BEDROCK_MODEL_IDS with its exact dated version id — never an undated alias.`,
    );
  }
  return id;
}

/**
 * Geo prefix for a cross-region inference profile.
 *
 * Claude 4.5 models are generally not available for on-demand throughput
 * under their bare model id; Bedrock returns a ValidationException telling
 * you to "retry with the inference profile". The profile id is the model id
 * with a geo prefix (`us.`, `eu.`, `apac.`), chosen from the region.
 *
 * The prefix does NOT change which model runs — the dated version id is
 * still pinned inside it — so this is a routing detail, not a change to the
 * frozen condition. It is recorded in the manifest via the provider name
 * either way.
 */
export function inferenceProfilePrefix(region: string): string {
  if (region.startsWith("us-")) return "us.";
  if (region.startsWith("eu-")) return "eu.";
  if (region.startsWith("ap-")) return "apac.";
  if (region.startsWith("ca-")) return "us."; // Canada routes to the US geo
  return "us.";
}

/** True when a Bedrock error is the "use an inference profile" complaint. */
export function isInferenceProfileError(e: unknown): boolean {
  const s = String((e as { message?: string })?.message ?? e);
  return /inference profile|on-demand throughput isn'?t supported|ValidationException/i.test(s);
}

export interface BedrockConfig {
  /** With or without the "bedrock:" prefix. */
  model: string;
  maxTokens?: number;
  temperature?: number;
  promptVariant?: PromptVariant;
  region?: string;
  /** Mantle only: bearer token. Falls back to AWS_BEARER_TOKEN_BEDROCK. */
  apiKey?: string;
  /**
   * Use the cross-region inference profile (default true). Claude 4.5 models
   * generally require it; set false only if this account is provisioned for
   * on-demand throughput on the bare model id.
   */
  useInferenceProfile?: boolean;
}

export class BedrockProvider implements ModelProvider {
  readonly name: string;
  readonly temperature: number;
  private client: AnthropicBedrock | AnthropicBedrockMantle;
  private isMantle: boolean;
  private modelId: string;
  private shortName: string;
  private maxTokens: number;
  private variant: PromptVariant;

  private bareModelId: string;
  private profileModelId: string;
  private region: string;

  constructor(
    config: BedrockConfig,
    private log: CallLog,
  ) {
    this.shortName = bedrockShortName(config.model);
    this.isMantle = isMantleModel(config.model);
    this.region = config.region ?? process.env["AWS_REGION"] ?? "us-east-1";
    this.variant = config.promptVariant ?? "v0.1";
    this.maxTokens = config.maxTokens ?? 4096;
    this.temperature = config.temperature ?? 1.0;

    if (this.isMantle) {
      // API-key auth, no FTU form, undated model alias (see MANTLE_PREFIX).
      this.bareModelId = resolveMantleModelId(config.model);
      this.profileModelId = this.bareModelId; // no inference profiles here
      this.modelId = this.bareModelId;
      this.name = `${MANTLE_PREFIX}${this.shortName}`;
      const apiKey = config.apiKey ?? process.env["AWS_BEARER_TOKEN_BEDROCK"];
      if (!apiKey) {
        throw new Error(
          `bedrock-mantle needs an API key. Set AWS_BEARER_TOKEN_BEDROCK in .env ` +
            `(create one in the Bedrock console under API keys).`,
        );
      }
      this.client = new AnthropicBedrockMantle({ apiKey, awsRegion: this.region });
    } else {
      this.bareModelId = resolveBedrockModelId(config.model);
      this.profileModelId = `${inferenceProfilePrefix(this.region)}${this.bareModelId}`;
      // Claude 4.5 models normally require the cross-region inference profile;
      // start there and fall back to the bare id if this account/region wants
      // it the other way round. Both resolve to the same pinned version.
      this.modelId = config.useInferenceProfile === false ? this.bareModelId : this.profileModelId;
      // Provider name keeps the prefix so run artifacts state the platform.
      this.name = `${BEDROCK_PREFIX}${this.shortName}`;
      this.client = new AnthropicBedrock({ awsRegion: this.region });
    }
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
    try {
      let res;
      try {
        res = await this.client.messages.create({
          model: this.modelId,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          messages: [{ role: "user", content: promptText }],
        });
      } catch (e) {
        // Accounts differ over whether the bare model id or the inference
        // profile is the invocable one. Try the other form ONCE, then latch
        // it for the rest of the run so this costs one round-trip, not one
        // per call. Same pinned model version either way.
        const alternate =
          this.modelId === this.profileModelId ? this.bareModelId : this.profileModelId;
        if (!isInferenceProfileError(e) || alternate === this.modelId) throw e;
        res = await this.client.messages.create({
          model: alternate,
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          messages: [{ role: "user", content: promptText }],
        });
        this.modelId = alternate;
      }
      // Concatenate text blocks only; thinking blocks (if the model emits
      // any) are deliberately dropped before JSON extraction, matching how
      // the Perplexity provider strips <think>.
      const text = res.content
        .map((c) => (c.type === "text" ? c.text : ""))
        .join("");
      const resolvedModel = (res as { model?: string }).model;
      const [inPrice, outPrice] = PRICING[this.shortName] ?? [3, 15];
      const inTok = res.usage?.input_tokens ?? Math.ceil(promptText.length / 4);
      const outTok = res.usage?.output_tokens ?? Math.ceil(text.length / 4);
      this.log.append({
        agentId,
        day,
        purpose,
        model: this.name,
        temperature: this.temperature,
        promptVersion,
        ...(resolvedModel ? { resolvedModel } : {}),
        promptText,
        completionText: text,
        inputTokens: inTok,
        outputTokens: outTok,
        estimatedCostUSD: (inTok * inPrice + outTok * outPrice) / 1e6,
        latencyMs: Date.now() - started,
        ok: true,
      });
      return text;
    } catch (e) {
      this.log.append({
        agentId,
        day,
        purpose,
        model: this.name,
        temperature: this.temperature,
        promptVersion,
        promptText,
        completionText: "",
        inputTokens: 0,
        outputTokens: 0,
        estimatedCostUSD: 0,
        latencyMs: Date.now() - started,
        ok: false,
        error: String(e).slice(0, 300),
      });
      throw e instanceof Error ? e : new Error(String(e));
    }
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

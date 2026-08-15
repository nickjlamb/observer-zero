/**
 * Provider routing: one place that maps a model name to its provider, so the
 * society runner, battery, and manifest agree about provenance.
 *
 * Routing rules, in order:
 *   "mock"                → deterministic mock scientist
 *   "bedrock:<model>"     → Amazon Bedrock (Study 2 Claude AGENTS)
 *   /^(sonar|r1-)/        → Perplexity
 *   anything else         → Anthropic first-party API
 *
 * The `bedrock:` prefix is explicit rather than an environment switch so the
 * serving platform is legible in every arm definition, battery index and run
 * manifest. NOTE: the frozen evaluator must keep using the first-party API —
 * it is the measurement apparatus and every Study 1 judged result depends on
 * it. Judges construct their client directly, not through this factory.
 */

import type { CallLog, ModelProvider } from "./provider.js";
import type { PromptVariant } from "../agents/promptBuilder.js";
import { MockProvider } from "./mock.js";
import { AnthropicProvider } from "./anthropic.js";
import { PerplexityProvider } from "./perplexity.js";
import { BedrockProvider, isBedrockModel, isMantleModel } from "./bedrock.js";
import { BedrockConverseProvider, isConverseModel } from "./bedrockConverse.js";

export type ProviderKind = "mock" | "anthropic" | "perplexity" | "bedrock" | "bedrock-converse";

export function providerKindFor(modelName: string): ProviderKind {
  if (modelName === "mock") return "mock";
  // Converse first: its prefix also starts with "bedrock".
  if (isConverseModel(modelName)) return "bedrock-converse";
  if (isBedrockModel(modelName)) return "bedrock";
  if (/^(sonar|r1-)/.test(modelName)) return "perplexity";
  return "anthropic";
}

/**
 * Which model family a name belongs to, independent of serving platform.
 * `bedrock:claude-haiku-4-5` and `claude-haiku-4-5` are the SAME model on
 * different front doors; analysis groups by family, provenance records the
 * platform.
 */
export function modelFamilyFor(modelName: string): string {
  if (modelName === "mock") return "mock";
  const bare = modelName
    .replace(/^bedrock-converse:/, "")
    .replace(/^bedrock-mantle:/, "")
    .replace(/^bedrock:/, "");
  if (/^(sonar|r1-)/.test(bare)) return bare;
  return bare;
}

/** Serving platform, recorded in the manifest so it is never implicit. */
export function servingPlatformFor(modelName: string): string {
  switch (providerKindFor(modelName)) {
    case "mock":
      return "none (deterministic mock)";
    case "bedrock":
      return isMantleModel(modelName) ? "amazon-bedrock-mantle" : "amazon-bedrock-runtime";
    case "bedrock-converse":
      return "amazon-bedrock-converse";
    case "perplexity":
      return "perplexity-api";
    case "anthropic":
      return "anthropic-first-party-api";
  }
}

/** Environment variable a model name needs, or null for the mock. */
export function requiredCredentialFor(modelName: string): string | null {
  switch (providerKindFor(modelName)) {
    case "mock":
      return null;
    case "bedrock":
      // Mantle authenticates with a bearer token; runtime uses SigV4 from
      // the standard AWS chain. A battery checks the right one before it
      // starts spending, rather than failing on run 1 of 20.
      return isMantleModel(modelName) ? "AWS_BEARER_TOKEN_BEDROCK" : "AWS_ACCESS_KEY_ID";
    case "bedrock-converse":
      // Bearer preferred; SigV4 from the standard chain is the fallback.
      return process.env["AWS_BEARER_TOKEN_BEDROCK"] ? "AWS_BEARER_TOKEN_BEDROCK" : "AWS_ACCESS_KEY_ID";
    case "perplexity":
      return "PERPLEXITY_API_KEY";
    case "anthropic":
      return "ANTHROPIC_API_KEY";
  }
}

export function createProvider(
  modelName: string,
  temperature: number,
  callLog: CallLog,
  promptVariant: PromptVariant = "v0.1",
): ModelProvider {
  switch (providerKindFor(modelName)) {
    case "mock":
      return new MockProvider(callLog, promptVariant);
    case "bedrock":
      return new BedrockProvider({ model: modelName, temperature, promptVariant }, callLog);
    case "bedrock-converse":
      return new BedrockConverseProvider({ model: modelName, temperature, promptVariant }, callLog);
    case "perplexity":
      return new PerplexityProvider({ model: modelName, temperature, promptVariant }, callLog);
    case "anthropic":
      return new AnthropicProvider({ model: modelName, temperature, promptVariant }, callLog);
  }
}

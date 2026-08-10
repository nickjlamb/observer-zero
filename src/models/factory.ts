/**
 * Provider routing: one place that maps a model name to its provider, so the
 * society runner, battery, and manifest agree about provenance.
 */

import type { CallLog, ModelProvider } from "./provider.js";
import type { PromptVariant } from "../agents/promptBuilder.js";
import { MockProvider } from "./mock.js";
import { AnthropicProvider } from "./anthropic.js";
import { PerplexityProvider } from "./perplexity.js";

export type ProviderKind = "mock" | "anthropic" | "perplexity";

export function providerKindFor(modelName: string): ProviderKind {
  if (modelName === "mock") return "mock";
  if (/^(sonar|r1-)/.test(modelName)) return "perplexity";
  return "anthropic";
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
    case "perplexity":
      return new PerplexityProvider({ model: modelName, temperature, promptVariant }, callLog);
    case "anthropic":
      return new AnthropicProvider({ model: modelName, temperature, promptVariant }, callLog);
  }
}

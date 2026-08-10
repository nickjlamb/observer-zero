/**
 * The frozen experimental condition (batch plan Q9).
 *
 * Every run artifact carries this manifest so results are attributable to an
 * exact configuration, and retrospective evaluation never has to guess what
 * code produced a run.
 */

import { PERSONAS } from "./agents/persona.js";
import { providerKindFor } from "./models/factory.js";
import {
  beliefPromptVersion,
  DECISION_PROMPT_VERSION,
  type PromptVariant,
} from "./agents/promptBuilder.js";
import { DEFAULT_RULES } from "./engine/types.js";

export const PLATFORM_VERSION = "0.4.0";
export const POLICY_VERSION = "observer-zero-epistemic-policy-v0.1";

export function fnvHash(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export interface RunManifest {
  policyVersion: string;
  platformVersion: string;
  prompts: { decision: string; beliefUpdate: string };
  personaHash: string;
  engine: {
    gravity: number;
    resonanceConstant: number;
    measurementNoise: number;
    canonicalShiftGravity: number;
    canonicalInterventionDay: number;
    canonicalFaultBias: number;
    noiseModel: string;
  };
  agentModel: {
    model: string;
    provider: string;
    /** Perplexity runs: web search is hard-disabled (closed-world invariant). */
    webSearchDisabled: boolean | null;
    temperature: number | null;
    samplingSeed: null;
    limitation: string;
  };
}

export function buildManifest(
  model: string,
  temperature: number | null,
  promptVariant: PromptVariant = "v0.1",
): RunManifest {
  return {
    policyVersion:
      promptVariant === "v0.1"
        ? POLICY_VERSION
        : "observer-zero-epistemic-policy-v0.2-ablation-no-mundane-prior",
    platformVersion: PLATFORM_VERSION,
    prompts: { decision: DECISION_PROMPT_VERSION, beliefUpdate: beliefPromptVersion(promptVariant) },
    personaHash: fnvHash(JSON.stringify(PERSONAS)),
    engine: {
      gravity: DEFAULT_RULES.gravity,
      resonanceConstant: DEFAULT_RULES.resonanceConstant,
      measurementNoise: DEFAULT_RULES.measurementNoise,
      canonicalShiftGravity: 13.97,
      canonicalInterventionDay: 12,
      canonicalFaultBias: 1.008,
      noiseModel: "per-trial: keyed by (worldSeed, instrumentId, trialIndex); order-independent",
    },
    agentModel: {
      model,
      provider: providerKindFor(model),
      webSearchDisabled: providerKindFor(model) === "perplexity" ? true : null,
      temperature,
      samplingSeed: null,
      limitation:
        "no provider exposes a sampling seed; model-side variance is part of measured society variance",
    },
  };
}

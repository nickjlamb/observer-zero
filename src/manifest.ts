/**
 * The frozen experimental condition (batch plan Q9).
 *
 * Every run artifact carries this manifest so results are attributable to an
 * exact configuration, and retrospective evaluation never has to guess what
 * code produced a run.
 *
 * M4: society-aware. A default-society (Ada+Maya, letters) run under the
 * v0.1 prompt variant still reports policy v0.1 — its rendered prompt
 * surface is byte-identical to Study 1 (a test asserts this). Society runs
 * (n>2, bulletin, or mixed models) report policy v0.2. The "-DRAFT" suffix
 * was removed at the Study 2 freeze (design v0.3 §11 step 5, executed after
 * the freeze commit 85bcdfb and before arm B, so no confirmatory manifest
 * carries a draft stamp); POLICY_VERSION_SOCIETY_DRAFT survives only so that
 * P1 and mock artifacts, which are correctly stamped "-DRAFT", stay
 * readable by name.
 *
 * Note on arm A: it matches isDefaultSociety, so it reports policy v0.1.
 * That is the label tracking the RENDERED PROMPT SURFACE, which at n=2 with
 * letters is byte-identical to Study 1's — there is no bulletin and there
 * are no extra peers for v0.2 to add. It is not a policy-version confound
 * with arms B-E, and the byte-identity is asserted by a test.
 */

import { ADA, MAYA, type Persona } from "./agents/persona.js";
import { modelFamilyFor, providerKindFor, servingPlatformFor } from "./models/factory.js";
import {
  beliefPromptVersion,
  DECISION_PROMPT_VERSION,
  DIGEST_VERSION,
  type PromptVariant,
} from "./agents/promptBuilder.js";
import { DEFAULT_RULES } from "./engine/types.js";

export const PLATFORM_VERSION = "0.5.0";
export const POLICY_VERSION = "observer-zero-epistemic-policy-v0.1";
export const POLICY_VERSION_SOCIETY = "observer-zero-epistemic-policy-v0.2";
/**
 * Kept as an alias so pre-freeze artifacts remain readable by name: P1 and
 * the mock/smoke runs are stamped "-DRAFT" and that is historically correct.
 * Nothing new should use it.
 */
export const POLICY_VERSION_SOCIETY_DRAFT = "observer-zero-epistemic-policy-v0.2-DRAFT";

export function fnvHash(s: string): string {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export interface ManifestSocietyInfo {
  members: { personaId: string; modelName?: string }[];
  institution: "letters" | "bulletin";
}

export interface RunManifest {
  policyVersion: string;
  platformVersion: string;
  prompts: { decision: string; beliefUpdate: string; digest: string };
  personaHash: string;
  society: {
    n: number;
    institution: "letters" | "bulletin";
    memberModels: { personaId: string; model: string; provider: string; modelFamily: string; servingPlatform: string }[];
    turnOrder: string;
  };
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

function isDefaultSociety(society: ManifestSocietyInfo): boolean {
  return (
    society.institution === "letters" &&
    society.members.length === 2 &&
    society.members[0]?.personaId === "ada" &&
    society.members[1]?.personaId === "maya" &&
    society.members.every((m) => m.modelName === undefined)
  );
}

export function buildManifest(
  model: string,
  temperature: number | null,
  promptVariant: PromptVariant = "v0.1",
  society: ManifestSocietyInfo = {
    members: [{ personaId: "ada" }, { personaId: "maya" }],
    institution: "letters",
  },
  personas: Persona[] = [ADA, MAYA],
): RunManifest {
  const basePolicy = isDefaultSociety(society) ? POLICY_VERSION : POLICY_VERSION_SOCIETY;
  return {
    policyVersion:
      promptVariant === "v0.1"
        ? basePolicy
        : "observer-zero-epistemic-policy-v0.2-ablation-no-mundane-prior",
    platformVersion: PLATFORM_VERSION,
    prompts: {
      decision: DECISION_PROMPT_VERSION,
      beliefUpdate: beliefPromptVersion(promptVariant),
      digest: DIGEST_VERSION,
    },
    personaHash: fnvHash(JSON.stringify(personas)),
    society: {
      n: society.members.length,
      institution: society.institution,
      memberModels: society.members.map((m) => ({
        personaId: m.personaId,
        model: m.modelName ?? model,
        provider: providerKindFor(m.modelName ?? model),
        // Same weights served through a different front door is not
        // provably identical behaviour. Recorded so any cross-platform
        // comparison — notably back to Study 1's first-party runs — is
        // visible rather than implicit.
        modelFamily: modelFamilyFor(m.modelName ?? model),
        servingPlatform: servingPlatformFor(m.modelName ?? model),
      })),
      turnOrder: "seeded Fisher-Yates keyed by (worldSeed, day)",
    },
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

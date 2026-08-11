/**
 * Study 2 arm definitions (design v0.3 §5).
 *
 * One place that knows what each arm IS, so the battery CLI, the manifest,
 * and any later analysis cannot disagree about it. Model names are supplied
 * at run time (--model) except where an arm is definitionally mixed.
 *
 * SEED HYGIENE (design v0.3 §4): confirmatory seeds are 1000-1009 and are
 * quarantined until freeze. Pilot, mock, and infrastructure-validation runs
 * use 9000-9004. The battery CLI enforces this — a live run on confirmatory
 * seeds requires --confirmatory, which is refused while the design is
 * unfrozen.
 */

import type { Institution, SocietySpec } from "./runSociety.js";
import { providerKindFor, requiredCredentialFor, type ProviderKind } from "../models/factory.js";

export const CONFIRMATORY_BASE_SEED = 1000;
export const CONFIRMATORY_REPLICATES = 10;
export const PILOT_BASE_SEED = 9000;
export const PILOT_REPLICATES = 5;

export interface ArmDefinition {
  id: string;
  label: string;
  n: number;
  institution: Institution;
  /** Persona ids in roster order. */
  personaIds: string[];
  /** Persona id → model override (mixed societies). */
  modelOverrides?: Record<string, string>;
  /** Which design question this arm's contrast serves. */
  contrast: string;
}

const SONAR_8 = ["ada", "maya", "theo", "samuel", "elena", "leah", "tom", "jamie"];
const PAIR = ["ada", "maya"];

export const ARMS: Record<string, ArmDefinition> = {
  A: {
    id: "A",
    label: "2 agents, letters",
    n: 2,
    institution: "letters",
    personaIds: PAIR,
    contrast: "baseline cell; B−A isolates scale, A′−A isolates institution without scale",
  },
  "A-prime": {
    id: "A-prime",
    label: "2 agents, bulletin",
    n: 2,
    institution: "bulletin",
    personaIds: PAIR,
    contrast: "A′−A isolates the institution without scale",
  },
  B: {
    id: "B",
    label: "8 agents, letters",
    n: 8,
    institution: "letters",
    personaIds: SONAR_8,
    contrast: "B−A isolates scale (S2a)",
  },
  C: {
    id: "C",
    label: "8 agents, bulletin",
    n: 8,
    institution: "bulletin",
    personaIds: SONAR_8,
    contrast: "C−B isolates the institution at scale (S2c)",
  },
  D: {
    id: "D",
    label: "7 sonar + 1 haiku, bulletin",
    n: 8,
    institution: "bulletin",
    personaIds: SONAR_8,
    // THEO IS THE FIXED MINORITY SLOT. Lowest evidence threshold on the
    // roster, so a fabrication-prone model sits where it is most in
    // character — and, critically, D and E use the SAME slot with identical
    // persona text, so D−E varies the model and nothing else.
    modelOverrides: { theo: "claude-haiku-4-5" },
    contrast: "D−B isolates activation (S2a) and D−E identifies what the catalyst is",
  },
  E: {
    id: "E",
    label: "7 sonar + 1 sonnet, bulletin",
    n: 8,
    institution: "bulletin",
    personaIds: SONAR_8,
    // The de-confounder. Sonnet is intermediate on sociality and markedly
    // lower on fabrication than haiku, so E splits "a communicative agent"
    // from "haiku specifically" and from "a fabricator specifically".
    modelOverrides: { theo: "claude-sonnet-4-5" },
    contrast: "E≈D → the catalyst is communicativeness; E≈B → it is haiku-specific (H7)",
  },
  F: {
    id: "F",
    label: "8 × haiku, bulletin",
    n: 8,
    institution: "bulletin",
    personaIds: SONAR_8,
    modelOverrides: Object.fromEntries(SONAR_8.map((p) => [p, "claude-haiku-4-5"])),
    contrast:
      "culture at scale: the fabrication-prone culture in the majority. CONTINGENT — " +
      "eight Claude agents x 20 runs is ~$80, which does not fit the first-party budget " +
      "once D, E and the frozen judge are paid for. Runs if Bedrock or programme credits " +
      "become available; switch these overrides back to bedrock-mantle: at that point.",
  },
};

/**
 * Build the society spec for an arm.
 *
 * `defaultModel === "mock"` means "run this arm's SHAPE for free": the
 * per-persona model overrides are dropped so a mixed arm (D) can be
 * pipeline-validated at zero cost. The shape that matters for the
 * infrastructure — society size, institution, persona set, turn order,
 * bulletin traffic — is identical; only the model strings differ. Without
 * this, `--arm D --model mock` would still reach for a live Anthropic key
 * and no free validation of the mixed arm would be possible.
 *
 * The swap happens ONLY for the literal "mock" model, so it can never
 * silently mask a misconfigured live run.
 */
export function armSociety(arm: ArmDefinition, defaultModel: string): SocietySpec {
  const useMockThroughout = defaultModel === "mock";
  return {
    institution: arm.institution,
    members: arm.personaIds.map((personaId) => {
      const override = useMockThroughout ? undefined : arm.modelOverrides?.[personaId];
      return override ? { personaId, modelName: override } : { personaId };
    }),
  };
}

/** Per-arm agent-model listing, for the battery index and cost reporting. */
export function armModels(arm: ArmDefinition, defaultModel: string): Record<string, string> {
  const useMockThroughout = defaultModel === "mock";
  return Object.fromEntries(
    arm.personaIds.map((p) => [
      p,
      (useMockThroughout ? undefined : arm.modelOverrides?.[p]) ?? defaultModel,
    ]),
  );
}

/** Providers an arm needs at run time — so a battery can fail before spending. */
export function armRequiredProviders(arm: ArmDefinition, defaultModel: string): ProviderKind[] {
  return [
    ...new Set(Object.values(armModels(arm, defaultModel)).map((m) => providerKindFor(m))),
  ];
}

/**
 * Credentials an arm needs. Checked before the first run starts, because
 * discovering a missing key on run 1 of 20 wastes everything already spent
 * and, at n=8, several hours of wall-clock.
 */
export function armRequiredCredentials(arm: ArmDefinition, defaultModel: string): string[] {
  return [
    ...new Set(
      Object.values(armModels(arm, defaultModel))
        .map((m) => requiredCredentialFor(m))
        .filter((c): c is string => c !== null),
    ),
  ];
}

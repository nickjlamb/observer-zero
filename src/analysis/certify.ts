/**
 * Study 3 discoverability certificates (design v0.1 §5.6, v0.2 §1.2–§2).
 *
 * A certificate is a NON-LLM demonstration that a world's anomaly is
 * discoverable from agent-visible observations alone, under a realistic
 * measurement schedule — the Study 2 detector-benchmark discipline
 * generalised. It consumes ONLY what a proto-agent could see (AgentView
 * through the same boundary real agents use); a grep test asserts this
 * module never touches groundTruth, world rules, or intervention fields.
 *
 * No Study 3 scenario ships without its certificate; a null result in a
 * certified world reads as interpretation failure, not power failure.
 */

import { Simulator, type MeasurementPlan } from "../engine/world.js";
import { buildAgentView } from "../engine/agentView.js";
import { buildWorkbench, buildNotebook } from "../agents/notebook.js";
import type { ScenarioConfig } from "../engine/types.js";
import { checkAttainability, hostArtefactInstruments } from "../scenarios/study3.js";

export interface CertificateResult {
  scenario: string;
  seed: number;
  attainabilityOk: boolean;
  /** Max |pair agreement| across instrument pairs, and its chance level. */
  maxAgreement: number | null;
  maxAgreementChance: number | null;
  /** Ratio agreement/chance — the pre-registered surprise scale (v0.2 §1.2). */
  agreementSurpriseRatio: number | null;
  /** Longest exact repeat run across instruments. */
  longestExactRepeat: number;
  /** Min distinct/total value ratio across instruments (lattice signal). */
  minDistinctRatio: number | null;
  /** Instruments with an estimated change day (level shifts). */
  changePointInstruments: string[];
  /** Max |driftZ| across the notebook. */
  maxAbsDriftZ: number | null;
}

/**
 * Dense reference schedule: the certificate proto-agent measures the two
 * designated instruments six times daily — the same fixed reference schedule
 * shape Study 2's benchmark used (never called "ideal": v0.1 discipline).
 */
export function certify(config: ScenarioConfig, instruments?: readonly string[]): CertificateResult {
  // Schedule covers the scenario's own host-artefact instruments (so a
  // certificate can never silently measure the wrong pair — P3.1 lesson),
  // falling back to the standard two-site pair for control worlds.
  const instrumentIds =
    instruments ??
    (hostArtefactInstruments(config).length >= 2
      ? hostArtefactInstruments(config)
      : ["pendulum_lab", "resonator_obs"]);
  const sim = new Simulator(config);
  const plan: MeasurementPlan[] = instrumentIds.map((id) => ({
    agentId: "certifier",
    instrumentId: id as never,
    trialsPerDay: 6,
  }));
  for (let d = 0; d < config.days; d++) sim.runDay(plan);

  const view = buildAgentView({
    agentId: "certifier",
    day: config.days,
    currentLocation: "laboratory",
    events: sim.log.all(),
  });
  const w = buildWorkbench(view);
  const nb = buildNotebook(view);

  let maxAgreement: number | null = null;
  let maxAgreementChance: number | null = null;
  for (const p of w.pairs) {
    if (p.agreement === null) continue;
    if (maxAgreement === null || Math.abs(p.agreement) > Math.abs(maxAgreement)) {
      maxAgreement = p.agreement;
      maxAgreementChance = p.chanceLevel;
    }
  }
  const longestExactRepeat = Math.max(0, ...w.repeats.map((r) => r.longestExactRepeat));
  const ratios = w.spacing
    .filter((s) => s.totalReadings > 0)
    .map((s) => s.distinctReadings / s.totalReadings);
  const driftZs = nb.instruments.map((i) => (i.driftZ === null ? 0 : Math.abs(i.driftZ)));

  return {
    scenario: config.name,
    seed: config.seed,
    attainabilityOk: checkAttainability(config).ok,
    maxAgreement,
    maxAgreementChance,
    agreementSurpriseRatio:
      maxAgreement !== null && maxAgreementChance !== null && maxAgreementChance > 0
        ? Math.abs(maxAgreement) / maxAgreementChance
        : null,
    longestExactRepeat,
    minDistinctRatio: ratios.length ? Math.min(...ratios) : null,
    changePointInstruments: w.changePoints
      .filter((c) => c.estimatedChangeDay !== null)
      .map((c) => c.instrumentId),
    maxAbsDriftZ: driftZs.length ? Math.max(...driftZs) : null,
  };
}

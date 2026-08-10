/**
 * The simulator: owns ground truth, advances the clock, applies scheduled
 * interventions, and executes measurements.
 *
 * Milestone 1 has no LLM agents. Measurements are taken by scripted
 * proto-agents following a MeasurementPlan, which exercises the entire
 * pipeline (rules → physics → noise/bias → event log → visibility) that
 * real agents will plug into in Milestone 2.
 */

import { Rng } from "./rng.js";
import { EventLog } from "./eventLog.js";
import { measureInstrument, instrumentById } from "./experiments.js";
import {
  ScenarioConfigSchema,
  type GroundTruth,
  type InstrumentId,
  type Intervention,
  type ScenarioConfig,
  type WorldRules,
} from "./types.js";

export interface MeasurementPlan {
  agentId: string;
  instrumentId: InstrumentId;
  trialsPerDay: number;
}

/** An agent-to-agent message queued for delivery this day. */
export interface MessagePlan {
  from: string;
  to: string;
  text: string;
}

export class Simulator {
  readonly config: ScenarioConfig;
  readonly log = new EventLog();
  private rules: WorldRules;
  private day = 0;
  private tick = 0;
  /** Agent-facing trial numbers, per agent+instrument (payload only). */
  private trialCounters = new Map<string, number>();
  /**
   * World-side trial index per instrument, driving PER-TRIAL noise keyed by
   * (worldSeed, instrumentId, trialIndex). Noise is a fixed property of the
   * world, not of draw order: trial k on instrument i yields the same value
   * in every run with this seed, regardless of which agent measures it or
   * when. (Pre-v0.4 the noise stream was sequential, so agent behaviour
   * changed the evidence itself and "same world, different society" was
   * ill-defined.)
   */
  private instrumentTrialIndex = new Map<string, number>();

  constructor(config: ScenarioConfig) {
    this.config = ScenarioConfigSchema.parse(config);
    // Copy: interventions mutate our private rules, never the config object.
    this.rules = structuredClone(this.config.rules);
  }

  /** Simulator-privileged. Never expose to agents or prompt builders. */
  currentRules(): Readonly<WorldRules> {
    return this.rules;
  }

  get currentDay(): number {
    return this.day;
  }

  private groundTruth(instrumentId: InstrumentId | null): GroundTruth {
    let effectiveBias = 1;
    let cause: GroundTruth["cause"] = "baseline";
    if (instrumentId) {
      for (const fault of this.rules.instrumentFaults) {
        if (fault.instrumentId === instrumentId && this.day >= fault.fromDay) {
          effectiveBias *= fault.biasFactor;
          cause = "instrument_fault";
        }
      }
    }
    if (this.rules.gravity !== this.config.rules.gravity) {
      cause = "simulator_intervention";
    }
    return { gravity: this.rules.gravity, effectiveBias, cause };
  }

  private applyIntervention(iv: Intervention): void {
    if (iv.kind === "gravity_shift") {
      this.rules.gravity = iv.newGravity;
    } else {
      this.rules.instrumentFaults.push({
        instrumentId: iv.instrumentId,
        biasFactor: iv.biasFactor,
        fromDay: iv.day,
      });
    }
    // Intervention events are visible to NO agent: visibleTo is empty.
    this.log.append({
      tick: this.tick++,
      day: this.day,
      type: "intervention_applied",
      agentId: null,
      location: null,
      payload: {}, // nothing agent-visible about an intervention
      visibleTo: [],
      groundTruth: {
        ...this.groundTruth(null),
        cause:
          iv.kind === "gravity_shift"
            ? "simulator_intervention"
            : "instrument_fault",
      },
    });
  }

  /**
   * Advance one day: apply due interventions, run measurements, deliver
   * messages. `participants` controls day_started visibility (defaults to
   * the agents in the plan).
   */
  runDay(
    plan: readonly MeasurementPlan[],
    messages: readonly MessagePlan[] = [],
    participants?: readonly string[],
  ): void {
    this.day += 1;

    for (const iv of this.config.interventions) {
      if (iv.day === this.day) this.applyIntervention(iv);
    }

    this.log.append({
      tick: this.tick++,
      day: this.day,
      type: "day_started",
      agentId: null,
      location: null,
      payload: { day: this.day },
      visibleTo: [...(participants ?? plan.map((p) => p.agentId))],
      groundTruth: this.groundTruth(null),
    });

    for (const entry of plan) {
      const inst = instrumentById(entry.instrumentId);
      for (let t = 0; t < entry.trialsPerDay; t++) {
        const instTrial = (this.instrumentTrialIndex.get(entry.instrumentId) ?? 0) + 1;
        this.instrumentTrialIndex.set(entry.instrumentId, instTrial);
        const m = measureInstrument(
          this.rules,
          entry.instrumentId,
          this.day,
          Rng.forKey(this.config.seed, `noise:${entry.instrumentId}:${instTrial}`),
        );
        const key = `${entry.agentId}:${entry.instrumentId}`;
        const trial = (this.trialCounters.get(key) ?? 0) + 1;
        this.trialCounters.set(key, trial);
        this.log.append({
          tick: this.tick++,
          day: this.day,
          type: "experiment_result",
          agentId: entry.agentId,
          location: inst.location,
          payload: {
            experiment: m.experiment,
            instrumentId: m.instrumentId,
            observedValue: m.observedValue,
            unit: m.unit,
            trial,
          },
          visibleTo: [entry.agentId],
          groundTruth: this.groundTruth(entry.instrumentId),
        });
      }
    }

    // Messages are delivered at end of day: visible ONLY to sender and
    // recipient. Content is agent-generated text — it carries no privileged
    // data because agents have none.
    for (const msg of messages) {
      this.log.append({
        tick: this.tick++,
        day: this.day,
        type: "message_sent",
        agentId: msg.from,
        location: null,
        payload: { from: msg.from, to: msg.to, text: msg.text },
        visibleTo: [msg.from, msg.to],
        groundTruth: this.groundTruth(null),
      });
    }
  }

  run(plan: readonly MeasurementPlan[]): void {
    for (let d = 0; d < this.config.days; d++) {
      this.runDay(plan);
    }
  }
}

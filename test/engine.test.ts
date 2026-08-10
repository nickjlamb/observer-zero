import { describe, expect, it } from "vitest";
import { Rng } from "../src/engine/rng.js";
import {
  effectiveBias,
  measureInstrument,
  truePendulumPeriod,
  trueResonantFrequency,
} from "../src/engine/experiments.js";
import { Simulator, type MeasurementPlan } from "../src/engine/world.js";
import { buildAgentView } from "../src/engine/agentView.js";
import { control, gravityShift, instrumentFault } from "../src/scenarios/scenarios.js";
import { DEFAULT_RULES } from "../src/engine/types.js";

const PLAN: MeasurementPlan[] = [
  { agentId: "ada", instrumentId: "pendulum_lab", trialsPerDay: 3 },
  { agentId: "maya", instrumentId: "pendulum_obs", trialsPerDay: 2 },
];

describe("Rng", () => {
  it("is deterministic for a given seed", () => {
    const a = new Rng(42);
    const b = new Rng(42);
    for (let i = 0; i < 100; i++) expect(a.next()).toBe(b.next());
  });

  it("differs across seeds", () => {
    expect(new Rng(1).next()).not.toBe(new Rng(2).next());
  });

  it("produces roughly standard-normal gaussians", () => {
    const rng = new Rng(7);
    const xs = Array.from({ length: 20000 }, () => rng.gaussian());
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length);
    expect(Math.abs(mean)).toBeLessThan(0.03);
    expect(Math.abs(sd - 1)).toBeLessThan(0.03);
  });

  it("child streams are deterministic and independent", () => {
    const a = new Rng(42).child("noise");
    const b = new Rng(42).child("noise");
    const c = new Rng(42).child("other");
    expect(a.next()).toBe(b.next());
    expect(a.next()).not.toBe(c.next());
  });
});

describe("pendulum physics", () => {
  it("computes the true period from gravity", () => {
    // T = 2π√(L/g), L=1, g=14.2
    expect(truePendulumPeriod(1, 14.2)).toBeCloseTo(2 * Math.PI * Math.sqrt(1 / 14.2), 12);
  });

  it("a gravity drop lengthens the period", () => {
    expect(truePendulumPeriod(1, 13.97)).toBeGreaterThan(truePendulumPeriod(1, 14.2));
  });

  it("canonical shift (14.20 → 13.97) produces ~0.82% period change", () => {
    const rel =
      truePendulumPeriod(1, 13.97) / truePendulumPeriod(1, 14.2) - 1;
    expect(rel).toBeGreaterThan(0.0075);
    expect(rel).toBeLessThan(0.009);
  });

  it("applies measurement noise around the true value", () => {
    const rng = new Rng(3);
    const xs = Array.from(
      { length: 5000 },
      () => measureInstrument(DEFAULT_RULES, "pendulum_lab", 1, rng).observedValue,
    );
    const trueT = truePendulumPeriod(1, DEFAULT_RULES.gravity);
    const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(Math.abs(mean / trueT - 1)).toBeLessThan(0.001);
    const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / xs.length);
    expect(sd / trueT).toBeGreaterThan(0.009);
    expect(sd / trueT).toBeLessThan(0.011);
  });

  it("resonance is insensitive to gravity (the discriminating instrument)", () => {
    const rng1 = new Rng(9);
    const rng2 = new Rng(9);
    const normal = measureInstrument(DEFAULT_RULES, "resonator_lab", 1, rng1);
    const shifted = measureInstrument(
      { ...DEFAULT_RULES, gravity: 13.97 },
      "resonator_lab",
      1,
      rng2,
    );
    expect(normal.trueValue).toBe(shifted.trueValue);
    expect(normal.observedValue).toBe(shifted.observedValue);
    expect(normal.unit).toBe("cycles/beat");
    expect(normal.trueValue).toBeCloseTo(trueResonantFrequency(1, DEFAULT_RULES.resonanceConstant), 12);
  });

  it("instrument fault biases only the faulty instrument from its start day", () => {
    const rules = {
      ...DEFAULT_RULES,
      instrumentFaults: [
        { instrumentId: "pendulum_lab" as const, biasFactor: 1.008, fromDay: 12 },
      ],
    };
    expect(effectiveBias(rules, "pendulum_lab", 11)).toBe(1);
    expect(effectiveBias(rules, "pendulum_lab", 12)).toBeCloseTo(1.008);
    expect(effectiveBias(rules, "pendulum_obs", 20)).toBe(1);
  });
});

describe("Simulator", () => {
  it("noise is a property of the world, not of draw order (batch plan Q2)", () => {
    // Society A measures pendulum_lab from day 1; society B ignores it until
    // day 3. The k-th trial on the instrument must yield the SAME observed
    // value in both worlds — evidence is held constant across societies.
    const a = new Simulator(control(42, 4));
    const b = new Simulator(control(42, 4));
    a.runDay([{ agentId: "ada", instrumentId: "pendulum_lab", trialsPerDay: 5 }]);
    a.runDay([{ agentId: "ada", instrumentId: "pendulum_lab", trialsPerDay: 5 }]);
    b.runDay([]);
    b.runDay([{ agentId: "maya", instrumentId: "pendulum_obs", trialsPerDay: 7 }]);
    b.runDay([{ agentId: "maya", instrumentId: "pendulum_lab", trialsPerDay: 10 }]);
    const vals = (sim: Simulator) =>
      sim.log
        .byType("experiment_result")
        .filter((e) => e.payload["instrumentId"] === "pendulum_lab")
        .map((e) => Number(e.payload["observedValue"]));
    expect(vals(b)).toEqual(vals(a)); // same 10 values, different days/agents
  });

  it("is reproducible: same seed, same events", () => {
    const a = new Simulator(gravityShift(42));
    const b = new Simulator(gravityShift(42));
    a.run(PLAN);
    b.run(PLAN);
    expect(JSON.stringify(a.log.toJSON())).toBe(JSON.stringify(b.log.toJSON()));
  });

  it("different seeds produce different measurements", () => {
    const a = new Simulator(control(1));
    const b = new Simulator(control(2));
    a.run(PLAN);
    b.run(PLAN);
    expect(JSON.stringify(a.log.toJSON())).not.toBe(JSON.stringify(b.log.toJSON()));
  });

  it("applies the gravity shift on exactly the configured day", () => {
    const sim = new Simulator(gravityShift(42, 30, 12, 13.97));
    sim.run(PLAN);
    for (const e of sim.log.byType("experiment_result")) {
      if (e.day < 12) expect(e.groundTruth.gravity).toBe(14.2);
      else expect(e.groundTruth.gravity).toBe(13.97);
    }
    const ivs = sim.log.byType("intervention_applied");
    expect(ivs).toHaveLength(1);
    expect(ivs[0]!.day).toBe(12);
    expect(ivs[0]!.visibleTo).toEqual([]);
  });

  it("does not mutate the scenario config", () => {
    const config = gravityShift(42);
    const before = JSON.stringify(config);
    const sim = new Simulator(config);
    sim.run(PLAN);
    expect(JSON.stringify(config)).toBe(before);
  });

  it("shifts observed periods after the intervention (signal exists)", () => {
    const sim = new Simulator(gravityShift(42, 30, 12, 13.97));
    sim.run(PLAN);
    const results = sim.log
      .byType("experiment_result")
      .filter((e) => e.payload["instrumentId"] === "pendulum_lab");
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const pre = mean(
      results.filter((e) => e.day < 12).map((e) => Number(e.payload["observedValue"])),
    );
    const post = mean(
      results.filter((e) => e.day >= 12).map((e) => Number(e.payload["observedValue"])),
    );
    expect(post).toBeGreaterThan(pre); // lower gravity → longer period
  });

  it("instrument fault shifts only the faulty instrument", () => {
    const sim = new Simulator(instrumentFault(42, 30, 12, 1.008));
    sim.run(PLAN);
    const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    const series = (inst: string, pred: (d: number) => boolean) =>
      sim.log
        .byType("experiment_result")
        .filter((e) => e.payload["instrumentId"] === inst && pred(e.day))
        .map((e) => Number(e.payload["observedValue"]));
    const labShift = mean(series("pendulum_lab", (d) => d >= 12)) / mean(series("pendulum_lab", (d) => d < 12)) - 1;
    const obsShift = mean(series("pendulum_obs", (d) => d >= 12)) / mean(series("pendulum_obs", (d) => d < 12)) - 1;
    expect(labShift).toBeGreaterThan(0.004);
    expect(Math.abs(obsShift)).toBeLessThan(0.004);
  });
});

describe("event log", () => {
  it("events are immutable", () => {
    const sim = new Simulator(control(42, 2));
    sim.run(PLAN);
    const e = sim.log.all()[1]!;
    expect(() => {
      (e as { day: number }).day = 999;
    }).toThrow();
    expect(() => {
      (e.groundTruth as { gravity: number }).gravity = 1;
    }).toThrow();
  });

  it("assigns sequential ids", () => {
    const sim = new Simulator(control(42, 3));
    sim.run(PLAN);
    sim.log.all().forEach((e, i) => expect(e.id).toBe(i));
  });
});

describe("AgentView boundary", () => {
  it("contains only events visible to the agent", () => {
    const sim = new Simulator(control(42, 5));
    sim.run(PLAN);
    const view = buildAgentView({
      agentId: "ada",
      day: 5,
      currentLocation: "laboratory",
      events: sim.log.all(),
    });
    // maya's measurements must not appear
    for (const obs of view.observations) {
      if (obs.type === "experiment_result") {
        expect(obs.detail["instrumentId"]).toBe("pendulum_lab");
      }
    }
  });

  it("never contains ground truth, in any serialization", () => {
    const sim = new Simulator(gravityShift(42));
    sim.run(PLAN);
    const view = buildAgentView({
      agentId: "ada",
      day: 30,
      currentLocation: "laboratory",
      events: sim.log.all(),
    });
    const json = JSON.stringify(view);
    expect(json).not.toContain("groundTruth");
    expect(json).not.toContain("gravity");
    expect(json).not.toContain("cause");
    expect(json).not.toContain("visibleTo");
    expect(json).not.toContain("intervention");
  });

  it("intervention events are visible to no one", () => {
    const sim = new Simulator(gravityShift(42));
    sim.run(PLAN);
    for (const agentId of ["ada", "maya"]) {
      const view = buildAgentView({
        agentId,
        day: 30,
        currentLocation: "laboratory",
        events: sim.log.all(),
      });
      expect(view.observations.some((o) => o.type === "intervention_applied")).toBe(false);
    }
  });

  it("the view is frozen", () => {
    const sim = new Simulator(control(42, 2));
    sim.run(PLAN);
    const view = buildAgentView({
      agentId: "ada",
      day: 2,
      currentLocation: "laboratory",
      events: sim.log.all(),
    });
    expect(() => {
      (view.observations as unknown[]).push({});
    }).toThrow();
  });
});

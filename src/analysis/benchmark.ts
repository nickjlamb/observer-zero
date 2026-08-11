/**
 * The three-level detector benchmark (design v0.3 §6).
 *
 * The scale arm confounds minds with data: eight agents with full kits
 * generate roughly four times the observation streams of two, so
 * detectability rises mechanically before any social epistemics happens.
 * The benchmark prices that by asking a NON-LLM statistical procedure — the
 * same change-point detector used in Study 1's Finding 4 — what was
 * knowable, at three levels:
 *
 *   L1 POTENTIAL       every instrument in the world, measured on a fixed
 *                      reference schedule. What an ideal measurement policy
 *                      could have known.
 *   L2 AS_PRODUCED     exactly the measurements this society chose to take.
 *                      THE PRIMARY BENCHMARK: given what they actually
 *                      measured, how detectable was the change?
 *   L2d DOWNSAMPLED    L2 subsampled to an n=2-equivalent observation
 *                      budget, repeated over many draws. Prices the raw
 *                      data multiplier alone.
 *   L3 CONCLUSIONS     what the society actually decided (from the belief
 *                      metrics; computed in society.ts).
 *
 * L1→L2 is measurement-policy quality. L2→L3 is interpretation quality.
 * L2 vs L2d is sheer data quantity. Reporting all three is what lets a
 * scale effect be attributed rather than merely observed.
 *
 * L1 requires the simulator (it measures counterfactual instruments), so it
 * is computed at run time by the runner, not from the artifact. L2 and L2d
 * are computed from the artifact's event log, which is why they can be
 * recomputed for Study 1 runs too.
 */

import { Rng } from "../engine/rng.js";

export interface PooledSeries {
  instrumentId: string;
  /** Only pendulums carry the gravity signal; resonators are the control. */
  kind: "pendulum" | "resonator";
  byDay: Map<number, number[]>;
}

export interface DetectorVerdict {
  instrumentId: string;
  kind: "pendulum" | "resonator";
  trials: number;
  /** First day the cumulative post-baseline mean crosses the threshold. */
  detectedOnDay: number | null;
  /** |z| of the final post-baseline mean against the baseline. */
  finalAbsZ: number;
  finalRelativeShift: number;
}

export interface BenchmarkLevel {
  level: "potential" | "as_produced" | "downsampled";
  /** Instruments the detector flagged at all. */
  detectedInstruments: number;
  totalInstruments: number;
  /** Earliest detection day across pendulums (the signal-bearing kind). */
  earliestDetectionDay: number | null;
  /** Max |z| across pendulums — the strength of the available signal. */
  maxPendulumAbsZ: number;
  /**
   * Resonators flagged. Resonator frequency is INSENSITIVE to gravity by
   * construction, so in a gravity world every resonator flag is a false
   * alarm — this is the detector's own sequential-testing error rate, and
   * it is reported rather than suppressed. It is the evidence-side analogue
   * of Study 1's universal agent false alarms: a procedure that looks at a
   * growing series every day and stops at the first 2.5σ crossing WILL
   * cross sometimes on noise alone. Any claim that the society "detected"
   * something must clear this floor, not merely clear zero.
   */
  resonatorsFlagged: number;
  resonatorFalseAlarmRate: number | null;
  /** Max |z| across resonators — the noise-only comparison for the above. */
  maxResonatorAbsZ: number;
  verdicts: DetectorVerdict[];
  /** Downsampled level only: draws performed, and the detection fraction. */
  draws?: number;
  detectionFraction?: number;
}

const BASELINE_DAYS = 10;
const SIGMAS = 2.5;

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

/**
 * Sequential change-point detector. Baseline from days 1..BASELINE_DAYS,
 * then the first day whose cumulative post-baseline mean exceeds SIGMAS
 * standard errors. Identical in form to Study 1's detector so the two
 * studies' evidence-side numbers are comparable.
 */
export function runDetector(series: PooledSeries): DetectorVerdict {
  const baseline: number[] = [];
  const postByDay: { day: number; vals: number[] }[] = [];
  for (const [day, vals] of [...series.byDay.entries()].sort((a, b) => a[0] - b[0])) {
    if (day <= BASELINE_DAYS) baseline.push(...vals);
    else postByDay.push({ day, vals });
  }
  const trials = baseline.length + postByDay.reduce((a, p) => a + p.vals.length, 0);
  if (baseline.length < 3 || postByDay.length === 0) {
    return {
      instrumentId: series.instrumentId,
      kind: series.kind,
      trials,
      detectedOnDay: null,
      finalAbsZ: 0,
      finalRelativeShift: 0,
    };
  }
  const bMean = mean(baseline);
  const bVar = baseline.reduce((a, x) => a + (x - bMean) ** 2, 0) / (baseline.length - 1);

  let detectedOnDay: number | null = null;
  const post: number[] = [];
  for (const { day, vals } of postByDay) {
    post.push(...vals);
    if (post.length < 3) continue;
    const pMean = mean(post);
    const se = Math.sqrt(bVar / baseline.length + bVar / post.length);
    if (detectedOnDay === null && se > 0 && Math.abs(pMean - bMean) > SIGMAS * se) {
      detectedOnDay = day;
    }
  }
  const pMean = mean(post);
  const se = Math.sqrt(bVar / baseline.length + bVar / post.length);
  return {
    instrumentId: series.instrumentId,
    kind: series.kind,
    trials,
    detectedOnDay,
    finalAbsZ: se > 0 ? Math.abs(pMean - bMean) / se : 0,
    finalRelativeShift: bMean !== 0 ? (pMean - bMean) / bMean : 0,
  };
}

function summarize(
  level: BenchmarkLevel["level"],
  verdicts: DetectorVerdict[],
): BenchmarkLevel {
  const pendulums = verdicts.filter((v) => v.kind === "pendulum");
  const resonators = verdicts.filter((v) => v.kind === "resonator");
  const detectionDays = pendulums
    .map((v) => v.detectedOnDay)
    .filter((d): d is number => d !== null);
  const resonatorsFlagged = resonators.filter((v) => v.detectedOnDay !== null).length;
  return {
    level,
    detectedInstruments: verdicts.filter((v) => v.detectedOnDay !== null).length,
    totalInstruments: verdicts.length,
    earliestDetectionDay: detectionDays.length ? Math.min(...detectionDays) : null,
    maxPendulumAbsZ: pendulums.length ? Math.max(...pendulums.map((v) => v.finalAbsZ)) : 0,
    resonatorsFlagged,
    resonatorFalseAlarmRate: resonators.length ? resonatorsFlagged / resonators.length : null,
    maxResonatorAbsZ: resonators.length ? Math.max(...resonators.map((v) => v.finalAbsZ)) : 0,
    verdicts,
  };
}

/** Pool an artifact's experiment_result events into per-instrument series. */
export function seriesFromEvents(
  events: { type: string; day: number; payload: Record<string, unknown> }[],
): PooledSeries[] {
  const byInst = new Map<string, PooledSeries>();
  for (const e of events) {
    if (e.type !== "experiment_result") continue;
    const id = String(e.payload["instrumentId"]);
    if (!byInst.has(id)) {
      byInst.set(id, {
        instrumentId: id,
        kind: id.startsWith("pendulum") ? "pendulum" : "resonator",
        byDay: new Map(),
      });
    }
    const s = byInst.get(id)!;
    if (!s.byDay.has(e.day)) s.byDay.set(e.day, []);
    s.byDay.get(e.day)!.push(Number(e.payload["observedValue"]));
  }
  return [...byInst.values()];
}

/** L2: exactly the measurements this society produced. */
export function benchmarkAsProduced(
  events: { type: string; day: number; payload: Record<string, unknown> }[],
): BenchmarkLevel {
  return summarize("as_produced", seriesFromEvents(events).map(runDetector));
}

/**
 * L2d: repeatedly subsample the society's evidence to an n=2-equivalent
 * observation budget and rerun the detector. Reports the fraction of draws
 * in which the change was detected — how much of any n=8 advantage is
 * explained by data quantity alone.
 *
 * Seeded from the run's world seed so the benchmark is reproducible.
 */
export function benchmarkDownsampled(
  events: { type: string; day: number; payload: Record<string, unknown> }[],
  opts: { seed: number; targetInstruments?: number; draws?: number },
): BenchmarkLevel {
  const draws = opts.draws ?? 200;
  const target = opts.targetInstruments ?? 2; // Study 1: one pendulum + one resonator per site pair
  const all = seriesFromEvents(events);
  const pendulums = all.filter((s) => s.kind === "pendulum");
  const resonators = all.filter((s) => s.kind === "resonator");

  let detected = 0;
  let usable = 0;
  const zs: number[] = [];
  const days: number[] = [];
  for (let d = 0; d < draws; d++) {
    const rng = Rng.forKey(opts.seed, `downsample:${d}`);
    const pick = <T>(pool: T[], k: number): T[] => {
      const copy = [...pool];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = rng.int(i + 1);
        [copy[i], copy[j]] = [copy[j]!, copy[i]!];
      }
      return copy.slice(0, k);
    };
    const chosen = [...pick(pendulums, Math.min(target, pendulums.length)),
                    ...pick(resonators, Math.min(target, resonators.length))];
    if (chosen.length === 0) continue;
    const verdicts = chosen.map(runDetector);
    const pend = verdicts.filter((v) => v.kind === "pendulum");
    if (pend.length === 0) continue;
    usable += 1;
    const hit = pend.filter((v) => v.detectedOnDay !== null);
    if (hit.length > 0) {
      detected += 1;
      days.push(Math.min(...hit.map((v) => v.detectedOnDay!)));
    }
    zs.push(Math.max(...pend.map((v) => v.finalAbsZ)));
  }

  return {
    level: "downsampled",
    detectedInstruments: detected,
    totalInstruments: usable,
    earliestDetectionDay: days.length ? Math.round(mean(days)) : null,
    maxPendulumAbsZ: zs.length ? mean(zs) : 0,
    resonatorsFlagged: 0,
    resonatorFalseAlarmRate: null,
    maxResonatorAbsZ: 0,
    verdicts: [],
    draws: usable,
    detectionFraction: usable ? detected / usable : 0,
  };
}

/**
 * L1: the potential-evidence benchmark. Requires counterfactual
 * measurements (every instrument on a fixed reference schedule), so it is
 * produced by the runner with simulator access — see `npm run benchmark`.
 */
export function benchmarkPotential(
  events: { type: string; day: number; payload: Record<string, unknown> }[],
): BenchmarkLevel {
  return summarize("potential", seriesFromEvents(events).map(runDetector));
}

/**
 * Paired-seed statistics (design v0.3 §9).
 *
 * Every Study 2 contrast is between two arms run on the SAME ten worlds.
 * Analysing them as two unrelated groups of ten throws that away — world
 * randomness was the largest source of variance in Study 1 (seed 1009 alone
 * decided several outcomes). So every contrast here is a paired difference
 * by seed, summarised with bootstrap/permutation uncertainty and an effect
 * size.
 *
 * There are deliberately NO significance gates. With ten worlds, a p<0.05
 * threshold would mostly measure luck; Study 2 is an exploratory mechanistic
 * study and reports intervals and distributions instead.
 */

import { Rng } from "../engine/rng.js";

export interface PairedObservation {
  key: string; // seed + scenario
  a: number;
  b: number;
}

export interface PairedResult {
  n: number;
  meanA: number;
  meanB: number;
  /** Mean of (b − a) over pairs — the paired difference. */
  meanDifference: number;
  /** Percentile bootstrap CI of the paired difference. */
  ci95: [number, number];
  /** Cohen's dz: mean difference / SD of differences. */
  effectSizeDz: number | null;
  /** Two-sided exact-ish permutation p, reported WITHOUT a decision rule. */
  permutationP: number;
  /** Pairs in which b exceeded a — the sign summary. */
  bWins: number;
  ties: number;
  differences: { key: string; difference: number }[];
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function sd(xs: number[]): number {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

/**
 * Paired bootstrap + sign-flip permutation over matched worlds.
 *
 * `seed` makes the resampling reproducible: the same data always yields the
 * same interval, so a reported CI can be checked rather than trusted.
 */
export function pairedContrast(
  observations: PairedObservation[],
  opts: { seed?: number; resamples?: number } = {},
): PairedResult {
  const seed = opts.seed ?? 20260810;
  const resamples = opts.resamples ?? 10000;
  const n = observations.length;
  if (n === 0) {
    return {
      n: 0,
      meanA: 0,
      meanB: 0,
      meanDifference: 0,
      ci95: [0, 0],
      effectSizeDz: null,
      permutationP: 1,
      bWins: 0,
      ties: 0,
      differences: [],
    };
  }

  const diffs = observations.map((o) => o.b - o.a);
  const observed = mean(diffs);

  // Percentile bootstrap over PAIRS (resample worlds, not observations).
  const bootMeans: number[] = [];
  for (let r = 0; r < resamples; r++) {
    const rng = Rng.forKey(seed, `boot:${r}`);
    let total = 0;
    for (let i = 0; i < n; i++) total += diffs[rng.int(n)]!;
    bootMeans.push(total / n);
  }
  bootMeans.sort((x, y) => x - y);
  const lo = bootMeans[Math.floor(0.025 * (bootMeans.length - 1))]!;
  const hi = bootMeans[Math.ceil(0.975 * (bootMeans.length - 1))]!;

  // Sign-flip permutation: under the null, the sign of each paired
  // difference is arbitrary.
  let atLeastAsExtreme = 0;
  for (let r = 0; r < resamples; r++) {
    const rng = Rng.forKey(seed, `perm:${r}`);
    let total = 0;
    for (let i = 0; i < n; i++) total += (rng.next() < 0.5 ? -1 : 1) * diffs[i]!;
    if (Math.abs(total / n) >= Math.abs(observed) - 1e-12) atLeastAsExtreme += 1;
  }

  const s = sd(diffs);
  return {
    n,
    meanA: mean(observations.map((o) => o.a)),
    meanB: mean(observations.map((o) => o.b)),
    meanDifference: observed,
    ci95: [lo, hi],
    effectSizeDz: s > 0 ? observed / s : null,
    permutationP: (atLeastAsExtreme + 1) / (resamples + 1),
    bWins: diffs.filter((d) => d > 0).length,
    ties: diffs.filter((d) => d === 0).length,
    differences: observations.map((o, i) => ({ key: o.key, difference: diffs[i]! })),
  };
}

/** Join two arms' per-run values into matched pairs by (scenario, seed). */
export function pairByWorld(
  armA: { scenario: string; seed: number; value: number }[],
  armB: { scenario: string; seed: number; value: number }[],
): PairedObservation[] {
  const keyOf = (r: { scenario: string; seed: number }) => `${r.scenario}:${r.seed}`;
  const bByKey = new Map(armB.map((r) => [keyOf(r), r.value]));
  const out: PairedObservation[] = [];
  for (const r of armA) {
    const b = bByKey.get(keyOf(r));
    if (b !== undefined) out.push({ key: keyOf(r), a: r.value, b });
  }
  return out.sort((x, y) => x.key.localeCompare(y.key));
}

export function formatPaired(label: string, r: PairedResult): string {
  if (r.n === 0) return `${label}: no matched worlds`;
  return (
    `${label}\n` +
    `  n=${r.n} matched worlds · A ${r.meanA.toFixed(3)} → B ${r.meanB.toFixed(3)}\n` +
    `  paired difference ${r.meanDifference >= 0 ? "+" : ""}${r.meanDifference.toFixed(3)} ` +
    `[95% CI ${r.ci95[0].toFixed(3)}, ${r.ci95[1].toFixed(3)}] · ` +
    `dz ${r.effectSizeDz === null ? "n/a" : r.effectSizeDz.toFixed(2)}\n` +
    `  B higher in ${r.bWins}/${r.n} worlds (${r.ties} tied) · permutation p=${r.permutationP.toFixed(3)} ` +
    `(reported, not a decision rule)`
  );
}

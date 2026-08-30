/**
 * Exact statistics for the Study 3 confirmatory analysis (freeze doc §8).
 *
 * Everything here is deliberately dependency-free and pinned by tests
 * against known values, because this module IS the registered analysis:
 * an untested p-value function is a researcher degree of freedom wearing
 * a lab coat. Numerics: log-gamma via Lanczos; regularized incomplete
 * beta via continued fraction (Numerical Recipes 6.4); regularized upper
 * incomplete gamma via series/continued fraction (NR 6.2).
 */

const LANCZOS = [
  676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059,
  12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
];

/** ln Γ(x), x > 0. */
export function logGamma(x: number): number {
  if (x < 0.5) {
    // Reflection.
    return Math.log(Math.PI / Math.sin(Math.PI * x)) - logGamma(1 - x);
  }
  const z = x - 1;
  let a = 0.99999999999980993;
  for (let i = 0; i < LANCZOS.length; i++) a += LANCZOS[i]! / (z + i + 1);
  const t = z + LANCZOS.length - 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(a);
}

export function logChoose(n: number, k: number): number {
  if (k < 0 || k > n) return -Infinity;
  return logGamma(n + 1) - logGamma(k + 1) - logGamma(n - k + 1);
}

/** P(X = k) for X ~ Hypergeometric(N, K, n): n draws, K successes in N. */
export function hypergeomPmf(N: number, K: number, n: number, k: number): number {
  if (k < Math.max(0, n + K - N) || k > Math.min(n, K)) return 0;
  return Math.exp(logChoose(K, k) + logChoose(N - K, n - k) - logChoose(N, n));
}

/**
 * One-sided Fisher exact test for a 2×2 table, alternative "treatment rate
 * greater". Table: treatment x/n vs control y/m. P-value = P(X ≥ x) under
 * the hypergeometric with margins fixed.
 */
export function fisherOneSidedGreater(x: number, n: number, y: number, m: number): number {
  const K = x + y; // total successes
  const N = n + m;
  let p = 0;
  for (let k = x; k <= Math.min(n, K); k++) p += hypergeomPmf(N, K, n, k);
  return Math.min(1, p);
}

/**
 * Exact stratified test (the register's "exact conditional Mantel–Haenszel /
 * exact stratified permutation test", one-sided greater): condition on both
 * margins in every stratum; the null distribution of T = Σ treatment
 * successes is the convolution of per-stratum hypergeometrics; p = P(T ≥ t).
 * Strata with zero total successes (or zero possible variation) contribute a
 * point mass and are effectively non-informative — matching §1.3's rule that
 * empty-in-both-arms strata are excluded by the test's own construction.
 */
export interface Stratum {
  x: number; // treatment successes
  n: number; // treatment size
  y: number; // control successes
  m: number; // control size
}
export function exactStratifiedPValue(strata: Stratum[]): {
  p: number;
  tObs: number;
  degenerate: boolean;
  informativeStrata: number;
} {
  let dist = new Map<number, number>([[0, 1]]);
  let tObs = 0;
  let informative = 0;
  for (const s of strata) {
    const K = s.x + s.y;
    const N = s.n + s.m;
    tObs += s.x;
    const lo = Math.max(0, s.n + K - N);
    const hi = Math.min(s.n, K);
    if (lo === hi) {
      // No variation possible — shift by the constant.
      dist = new Map([...dist.entries()].map(([t, p]) => [t + lo, p]));
      continue;
    }
    informative++;
    const next = new Map<number, number>();
    for (const [t, p] of dist) {
      for (let k = lo; k <= hi; k++) {
        const q = p * hypergeomPmf(N, K, s.n, k);
        if (q > 0) next.set(t + k, (next.get(t + k) ?? 0) + q);
      }
    }
    dist = next;
  }
  let p = 0;
  for (const [t, q] of dist) if (t >= tObs) p += q;
  return {
    p: Math.min(1, p),
    tObs,
    degenerate: informative === 0,
    informativeStrata: informative,
  };
}

/** Continued-fraction core for the regularized incomplete beta (no recursion). */
function regIncBetaCF(x: number, a: number, b: number): number {
  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(a * Math.log(x) + b * Math.log(1 - x) - lbeta) / a;
  // Lentz's continued fraction.
  const eps = 1e-15;
  let f = 1;
  let c = 1;
  let d = 0;
  for (let i = 0; i <= 300; i++) {
    const mIdx = Math.floor(i / 2);
    let numer: number;
    if (i === 0) numer = 1;
    else if (i % 2 === 0) numer = (mIdx * (b - mIdx) * x) / ((a + 2 * mIdx - 1) * (a + 2 * mIdx));
    else numer = -((a + mIdx) * (a + b + mIdx) * x) / ((a + 2 * mIdx) * (a + 2 * mIdx + 1));
    d = 1 + numer * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    c = 1 + numer / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    const cd = c * d;
    f *= cd;
    if (Math.abs(1 - cd) < eps) break;
  }
  return front * (f - 1);
}

/**
 * Regularized incomplete beta I_x(a, b). The continued fraction converges
 * fast only for x below the split point, so the branch is chosen FIRST and
 * the symmetry relation applied through the non-recursive core — a
 * recursive symmetry call can ping-pong forever at the split boundary.
 */
export function regIncBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  return x < (a + 1) / (a + b + 2) ? regIncBetaCF(x, a, b) : 1 - regIncBetaCF(1 - x, b, a);
}

/** Quantile of Beta(a, b) by bisection on the regularized incomplete beta. */
export function betaQuantile(q: number, a: number, b: number): number {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    if (regIncBeta(mid, a, b) < q) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

/**
 * One-sided exact (Clopper–Pearson) upper confidence bound on a binomial
 * rate: smallest p̄ with P(X ≤ x | p̄) ≤ α. For x = 0 this is 1 − α^(1/n).
 */
export function exactUpperBound(x: number, n: number, alpha = 0.05): number {
  if (x >= n) return 1;
  // Upper bound = Beta quantile: p̄ = Q(1 − α; x + 1, n − x).
  return betaQuantile(1 - alpha, x + 1, n - x);
}

/** Jeffreys central 95% interval for a binomial rate. */
export function jeffreysInterval(x: number, n: number): [number, number] {
  const a = x + 0.5;
  const b = n - x + 0.5;
  const lo = x === 0 ? 0 : betaQuantile(0.025, a, b);
  const hi = x === n ? 1 : betaQuantile(0.975, a, b);
  return [lo, hi];
}

/** Regularized upper incomplete gamma Q(a, x) (series / continued fraction). */
export function regGammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  if (x < a + 1) {
    // Series for P, return 1 - P.
    let sum = 1 / a;
    let term = sum;
    for (let i = 1; i < 500; i++) {
      term *= x / (a + i);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-15) break;
    }
    return 1 - sum * Math.exp(-x + a * Math.log(x) - logGamma(a));
  }
  // Continued fraction for Q.
  let b = x + 1 - a;
  let c = 1e300;
  let d = 1 / b;
  let f = d;
  for (let i = 1; i < 500; i++) {
    const an = -i * (i - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    c = b + an / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    d = 1 / d;
    const delta = d * c;
    f *= delta;
    if (Math.abs(delta - 1) < 1e-15) break;
  }
  return f * Math.exp(-x + a * Math.log(x) - logGamma(a));
}

/** Chi-square upper-tail p-value. */
export function chiSquarePValue(stat: number, df: number): number {
  return regGammaQ(df / 2, stat / 2);
}

/**
 * Pearson chi-square over an r×c count table (no continuity correction;
 * the freeze doc's D1 and R17(a) tests). Columns/rows with zero margin are
 * dropped and reported via the returned df.
 */
export function chiSquareTest(table: number[][]): { stat: number; df: number; p: number } {
  const rows = table.filter((r) => r.reduce((s, v) => s + v, 0) > 0);
  const colSums = rows[0]!.map((_, j) => rows.reduce((s, r) => s + r[j]!, 0));
  const keep = colSums.map((s) => s > 0);
  const cols = rows.map((r) => r.filter((_, j) => keep[j]));
  const cs = colSums.filter((s) => s > 0);
  const rs = cols.map((r) => r.reduce((s, v) => s + v, 0));
  const total = rs.reduce((s, v) => s + v, 0);
  let stat = 0;
  for (let i = 0; i < cols.length; i++) {
    for (let j = 0; j < cs.length; j++) {
      const exp = (rs[i]! * cs[j]!) / total;
      if (exp > 0) stat += (cols[i]![j]! - exp) ** 2 / exp;
    }
  }
  const df = (cols.length - 1) * (cs.length - 1);
  return { stat, df, p: df > 0 ? chiSquarePValue(stat, df) : 1 };
}

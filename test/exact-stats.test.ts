/**
 * The registered analysis' numerics, pinned against independently known
 * values (R / scipy cross-checks recorded in comments). If any of these
 * drift, the confirmatory analysis is broken — these tests are part of the
 * freeze (RT-1).
 */
import { describe, expect, it } from "vitest";
import {
  betaQuantile,
  chiSquarePValue,
  chiSquareTest,
  exactStratifiedPValue,
  exactUpperBound,
  fisherOneSidedGreater,
  hypergeomPmf,
  jeffreysInterval,
  logGamma,
  regIncBeta,
} from "../src/analysis/exactStats.js";

describe("logGamma / hypergeometric", () => {
  it("logGamma matches factorials", () => {
    expect(Math.exp(logGamma(5))).toBeCloseTo(24, 8); // Γ(5)=4!
    expect(Math.exp(logGamma(1))).toBeCloseTo(1, 10);
    expect(logGamma(0.5)).toBeCloseTo(Math.log(Math.sqrt(Math.PI)), 10);
  });
  it("hypergeometric pmf sums to 1 and matches a hand value", () => {
    // N=20, K=7, n=12: P(X=4) = C(7,4)C(13,8)/C(20,12) = 35*1287/125970
    expect(hypergeomPmf(20, 7, 12, 4)).toBeCloseTo((35 * 1287) / 125970, 10);
    let s = 0;
    for (let k = 0; k <= 12; k++) s += hypergeomPmf(20, 7, 12, k);
    expect(s).toBeCloseTo(1, 10);
  });
});

describe("Fisher one-sided", () => {
  it("matches the classic tea-tasting table", () => {
    // 3/4 vs 1/4, one-sided greater: p = P(X>=3) = (C(4,3)C(4,1)+C(4,4)C(4,0))/C(8,4)
    expect(fisherOneSidedGreater(3, 4, 1, 4)).toBeCloseTo(17 / 70, 10);
  });
  it("is 1 when treatment has zero successes and control has some", () => {
    expect(fisherOneSidedGreater(0, 10, 2, 10)).toBeCloseTo(1, 6);
  });
});

describe("exact stratified test", () => {
  it("reduces to Fisher for one stratum", () => {
    const one = exactStratifiedPValue([{ x: 3, n: 4, y: 1, m: 4 }]);
    expect(one.p).toBeCloseTo(17 / 70, 10);
    expect(one.degenerate).toBe(false);
  });
  it("is degenerate when every stratum is empty in both arms", () => {
    const r = exactStratifiedPValue([
      { x: 0, n: 10, y: 0, m: 10 },
      { x: 0, n: 10, y: 0, m: 10 },
    ]);
    expect(r.degenerate).toBe(true);
    expect(r.informativeStrata).toBe(0);
    expect(r.p).toBe(1);
  });
  it("combines two strata multiplicatively (independent convolution)", () => {
    // Two identical 1-success strata; T_obs = 2 (both successes in treatment).
    // Per stratum P(X=1) = n/(n+m) = 0.5, so P(T>=2) = 0.25.
    const r = exactStratifiedPValue([
      { x: 1, n: 10, y: 0, m: 10 },
      { x: 1, n: 10, y: 0, m: 10 },
    ]);
    expect(r.p).toBeCloseTo(0.25, 10);
    expect(r.informativeStrata).toBe(2);
  });
});

describe("exact upper bound and Jeffreys", () => {
  it("0/n upper bound is 1 - alpha^(1/n) (the rule-of-three exact form)", () => {
    expect(exactUpperBound(0, 40)).toBeCloseTo(1 - 0.05 ** (1 / 40), 6);
    expect(exactUpperBound(0, 44)).toBeCloseTo(1 - 0.05 ** (1 / 44), 6);
  });
  it("regIncBeta round-trips its own quantile", () => {
    const q = betaQuantile(0.975, 3.5, 7.5);
    expect(regIncBeta(q, 3.5, 7.5)).toBeCloseTo(0.975, 6);
  });
  it("Jeffreys interval for 0/10 starts at 0 and has a sane upper", () => {
    const [lo, hi] = jeffreysInterval(0, 10);
    expect(lo).toBe(0);
    // scipy.stats.beta.ppf(0.975, 0.5, 10.5) ≈ 0.2168
    expect(hi).toBeCloseTo(0.2168, 3);
  });
});

describe("chi-square", () => {
  it("p-value matches known chi-square quantiles", () => {
    // P(X2_1 > 3.841) ≈ 0.05; P(X2_4 > 9.488) ≈ 0.05
    expect(chiSquarePValue(3.841459, 1)).toBeCloseTo(0.05, 4);
    expect(chiSquarePValue(9.487729, 4)).toBeCloseTo(0.05, 4);
  });
  it("Pearson test on a hand-computed 2x2", () => {
    // [[10, 20], [20, 10]]: expected all 15, stat = 4*(25/15) = 6.6667, df 1
    const r = chiSquareTest([
      [10, 20],
      [20, 10],
    ]);
    expect(r.stat).toBeCloseTo(20 / 3, 6);
    expect(r.df).toBe(1);
    expect(r.p).toBeCloseTo(chiSquarePValue(20 / 3, 1), 10);
  });
  it("drops empty columns rather than dividing by zero", () => {
    const r = chiSquareTest([
      [5, 0, 5],
      [5, 0, 5],
    ]);
    expect(r.df).toBe(1);
    expect(r.stat).toBeCloseTo(0, 10);
  });
});

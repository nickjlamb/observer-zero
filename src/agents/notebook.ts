/**
 * The agent's measurement notebook: statistics an in-world scientist would
 * compute from THEIR OWN observations. Input is AgentView only — this is
 * agent-side analysis, not simulator knowledge.
 */

import type { AgentView } from "../engine/types.js";

export interface InstrumentDigest {
  instrumentId: string;
  unit: string;
  totalTrials: number;
  baselineDays: number;
  baselineMean: number | null;
  baselineN: number;
  /** Mean over ALL post-baseline data — a scientist pools everything since baseline. */
  postMean: number | null;
  postN: number;
  /** z of post-baseline mean vs baseline mean, using pooled empirical variance. */
  driftZ: number | null;
}

// ---------------------------------------------------------------------------
// Study 3: the statistical workbench (notebook v2, design v0.2 §4.2).
//
// Deterministic residual statistics an in-world scientist could compute by
// hand, computed from the agent's OWN observations only, rendered with the
// same sections for every instrument and pair in EVERY condition — the
// presence of a section carries zero information (design v0.1 §6.3). All
// phrasing is observational; chance references are included so remarkable
// and unremarkable values are distinguishable without the workbench
// editorialising. workbench-v1; part of the frozen condition.
// ---------------------------------------------------------------------------

export const WORKBENCH_VERSION = "workbench-v1.2"; // v1.2: day-window pairing (P3.1c); v1.1: overlap-aligned window (P3.1)

export interface PairAgreement {
  a: string;
  b: string;
  /** Max |correlation| of standardised residual sequences over small offsets. */
  agreement: number | null;
  atOffset: number;
  n: number;
  /** ~2σ chance band for |r| under independence at this n. */
  chanceLevel: number | null;
}

export interface SpacingSummary {
  instrumentId: string;
  totalReadings: number;
  distinctReadings: number;
  /** Smallest positive gap between distinct sorted readings. */
  smallestSpacing: number | null;
}

export interface RepeatScan {
  instrumentId: string;
  /** Longest run of consecutive readings exactly repeating an earlier run, in order. */
  longestExactRepeat: number;
  totalReadings: number;
}

export interface ChangePoint {
  instrumentId: string;
  /** Day whose before/after split maximises |z|; null when nothing notable. */
  estimatedChangeDay: number | null;
  maxAbsZ: number | null;
}

export interface Workbench {
  version: string;
  pairs: PairAgreement[];
  spacing: SpacingSummary[];
  repeats: RepeatScan[];
  changePoints: ChangePoint[];
}

export interface Notebook {
  day: number;
  instruments: InstrumentDigest[];
  /** Present only when the run's condition enables the workbench (Study 3). */
  workbench?: Workbench;
}

function residualSeries(values: number[]): number[] {
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  const sd = Math.sqrt(
    values.reduce((a, x) => a + (x - m) ** 2, 0) / Math.max(1, values.length - 1),
  );
  return sd > 0 ? values.map((v) => (v - m) / sd) : values.map(() => 0);
}

/**
 * Trailing-window pairing: agreement is computed over the most recent
 * WORKBENCH_PAIR_WINDOW_DAYS of aligned readings. A full-history correlation would
 * dilute a mid-run change with the pre-onset baseline (a 29-day identity
 * after an 11-day independent baseline reads as r≈0.72 full-series); recent
 * evidence is what an in-world scientist checking "are these agreeing NOW"
 * would compute. Window size is a frozen workbench parameter, identical in
 * every condition.
 */
// Window in DAYS, not pairs (P3.1c fix): a pair-count window spans more
// calendar time the sparser the sampling — at ledger cadence (2/day) 120
// pairs reach 60 days back and re-admit pre-onset dilution. Twenty days of
// recent evidence is the same statistic at every cadence; n varies and the
// chance band scales with it.
const WORKBENCH_PAIR_WINDOW_DAYS = 20;

/**
 * Day-aligned pairing (P3.1 fix, 2026-08-13). Readings are paired by
 * (day, within-day position): A's day-d trial t against B's day-(d+offset)
 * trial t, pairs from the most recent WORKBENCH_PAIR_WINDOW_DAYS days. Cumulative-index pairing
 * broke under free instrument choice — with 286 vs 122 trials the window sat
 * outside the shorter series ("too few overlapping readings" despite 120+
 * true pairs), and index alignment scrambled across an onset whenever
 * pre-onset counts differed, which with agent-chosen schedules they always
 * do. Day+position is the alignment the engine's shared components actually
 * use, and it is agent-visible structure ("compare today's lab readings with
 * the observatory's from three days ago").
 */
function corrAtOffset(
  a: Map<number, number[]>,
  b: Map<number, number[]>,
  offset: number,
): { r: number; n: number } | null {
  const days = [...a.keys()].sort((x, y) => x - y);
  const maxDay = days.length ? days[days.length - 1]! : 0;
  const pairs: [number, number][] = [];
  for (const d of days) {
    if (d <= maxDay - WORKBENCH_PAIR_WINDOW_DAYS) continue;
    const av = a.get(d)!;
    const bv = b.get(d + offset);
    if (!bv) continue;
    for (let t = 0; t < Math.min(av.length, bv.length); t++) pairs.push([av[t]!, bv[t]!]);
  }
  if (pairs.length < 8) return null;
  return corrOfPairs(pairs);
}

function corrOfPairs(pairs: [number, number][]): { r: number; n: number } | null {
  const ma = pairs.reduce((s, p) => s + p[0], 0) / pairs.length;
  const mb = pairs.reduce((s, p) => s + p[1], 0) / pairs.length;
  let num = 0;
  let da = 0;
  let db = 0;
  for (const [x, y] of pairs) {
    num += (x - ma) * (y - mb);
    da += (x - ma) ** 2;
    db += (y - mb) ** 2;
  }
  if (da === 0 || db === 0) return null;
  return { r: num / Math.sqrt(da * db), n: pairs.length };
}

const WORKBENCH_MAX_OFFSET = 6;

export function buildWorkbench(view: AgentView, baselineDays = 10): Workbench {
  // Per-instrument value sequences in observation order (the agent's own).
  const seq = new Map<string, { day: number; value: number }[]>();
  for (const obs of view.observations) {
    if (obs.type !== "experiment_result") continue;
    const inst = String(obs.detail["instrumentId"]);
    if (!seq.has(inst)) seq.set(inst, []);
    seq.get(inst)!.push({ day: obs.day, value: Number(obs.detail["observedValue"]) });
  }
  const instruments = [...seq.keys()].sort();

  // Standardised residuals grouped by day, within-day order preserved.
  const residualsByDay = new Map<string, Map<number, number[]>>();
  for (const inst of instruments) {
    const points = seq.get(inst)!;
    const res = residualSeries(points.map((p) => p.value));
    const byDay = new Map<number, number[]>();
    points.forEach((p, idx) => {
      if (!byDay.has(p.day)) byDay.set(p.day, []);
      byDay.get(p.day)!.push(res[idx]!);
    });
    residualsByDay.set(inst, byDay);
  }

  const pairs: PairAgreement[] = [];
  for (let i = 0; i < instruments.length; i++) {
    for (let j = i + 1; j < instruments.length; j++) {
      const a = residualsByDay.get(instruments[i]!)!;
      const b = residualsByDay.get(instruments[j]!)!;
      let best: { r: number; n: number; offset: number } | null = null;
      for (let off = -WORKBENCH_MAX_OFFSET; off <= WORKBENCH_MAX_OFFSET; off++) {
        const c = corrAtOffset(a, b, off);
        if (c && (!best || Math.abs(c.r) > Math.abs(best.r))) best = { ...c, offset: off };
      }
      pairs.push({
        a: instruments[i]!,
        b: instruments[j]!,
        agreement: best ? best.r : null,
        atOffset: best ? best.offset : 0,
        n: best ? best.n : 0,
        chanceLevel: best ? 2 / Math.sqrt(best.n) : null,
      });
    }
  }

  const spacing: SpacingSummary[] = instruments.map((inst) => {
    const values = seq.get(inst)!.map((p) => p.value);
    const distinct = [...new Set(values)].sort((x, y) => x - y);
    let smallest: number | null = null;
    for (let k = 1; k < distinct.length; k++) {
      const gap = distinct[k]! - distinct[k - 1]!;
      if (gap > 0 && (smallest === null || gap < smallest)) smallest = gap;
    }
    return {
      instrumentId: inst,
      totalReadings: values.length,
      distinctReadings: distinct.length,
      smallestSpacing: smallest,
    };
  });

  const repeats: RepeatScan[] = instruments.map((inst) => {
    const v = seq.get(inst)!.map((p) => p.value);
    // Longest run v[i..i+L) === v[j..j+L) for some i < j: O(n²) suffix DP.
    let longest = 0;
    const n = v.length;
    let prev = new Array<number>(n + 1).fill(0);
    for (let i = n - 1; i >= 0; i--) {
      const cur = new Array<number>(n + 1).fill(0);
      for (let j = n - 1; j > i; j--) {
        if (v[i] === v[j]) {
          cur[j] = prev[j + 1]! + 1;
          if (cur[j]! > longest) longest = cur[j]!;
        }
      }
      prev = cur;
    }
    return { instrumentId: inst, longestExactRepeat: longest, totalReadings: n };
  });

  const changePoints: ChangePoint[] = instruments.map((inst) => {
    const points = seq.get(inst)!;
    const days = [...new Set(points.map((p) => p.day))].sort((x, y) => x - y);
    let bestDay: number | null = null;
    let bestZ = 0;
    for (const d of days) {
      if (d <= baselineDays) continue;
      const before = points.filter((p) => p.day < d).map((p) => p.value);
      const after = points.filter((p) => p.day >= d).map((p) => p.value);
      if (before.length < 5 || after.length < 5) continue;
      const mb = before.reduce((a, b) => a + b, 0) / before.length;
      const ma = after.reduce((a, b) => a + b, 0) / after.length;
      const vb = before.reduce((a, x) => a + (x - mb) ** 2, 0) / (before.length - 1);
      const se = Math.sqrt(vb / before.length + vb / after.length);
      const z = se > 0 ? (ma - mb) / se : 0;
      if (Math.abs(z) > Math.abs(bestZ)) {
        bestZ = z;
        bestDay = d;
      }
    }
    return {
      instrumentId: inst,
      estimatedChangeDay: Math.abs(bestZ) >= 3 ? bestDay : null,
      maxAbsZ: bestDay === null && Math.abs(bestZ) === 0 ? null : Math.abs(bestZ),
    };
  });

  return { version: WORKBENCH_VERSION, pairs, spacing, repeats, changePoints };
}

export function buildNotebook(
  view: AgentView,
  baselineDays = 10,
  opts?: { workbench?: boolean },
): Notebook {
  const byInst = new Map<string, { day: number; value: number }[]>();
  const unitByInst = new Map<string, string>();
  for (const obs of view.observations) {
    if (obs.type !== "experiment_result") continue;
    const inst = String(obs.detail["instrumentId"]);
    const value = Number(obs.detail["observedValue"]);
    unitByInst.set(inst, String(obs.detail["unit"] ?? ""));
    if (!byInst.has(inst)) byInst.set(inst, []);
    byInst.get(inst)!.push({ day: obs.day, value });
  }

  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const variance = (xs: number[], m: number) =>
    xs.length > 1 ? xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1) : 0;

  const instruments: InstrumentDigest[] = [];
  for (const [instrumentId, points] of byInst) {
    const baseVals = points.filter((p) => p.day <= baselineDays).map((p) => p.value);
    const postVals = points.filter((p) => p.day > baselineDays).map((p) => p.value);
    const bMean = baseVals.length ? mean(baseVals) : null;
    const pMean = postVals.length ? mean(postVals) : null;
    let driftZ: number | null = null;
    if (bMean !== null && pMean !== null && baseVals.length > 2 && postVals.length > 2) {
      const v = variance(baseVals, bMean);
      const se = Math.sqrt(v / baseVals.length + v / postVals.length);
      driftZ = se > 0 ? (pMean - bMean) / se : null;
    }
    instruments.push({
      instrumentId,
      unit: unitByInst.get(instrumentId) ?? "",
      totalTrials: points.length,
      baselineDays,
      baselineMean: bMean,
      baselineN: baseVals.length,
      postMean: pMean,
      postN: postVals.length,
      driftZ,
    });
  }
  const nb: Notebook = { day: view.day, instruments };
  if (opts?.workbench) nb.workbench = buildWorkbench(view, baselineDays);
  return nb;
}

/**
 * Render the workbench in in-world observational language. Every section
 * appears for every instrument/pair with data, in every condition — an
 * unremarkable value renders as unremarkable, it does not disappear.
 */
function formatWorkbench(w: Workbench): string {
  const lines: string[] = ["Cross-checks (computed from your own records):"];
  for (const p of w.pairs) {
    if (p.agreement === null || p.chanceLevel === null) {
      lines.push(`  ${p.a} ↔ ${p.b}: too few overlapping readings to compare`);
    } else {
      lines.push(
        `  ${p.a} ↔ ${p.b}: reading-by-reading agreement ${p.agreement.toFixed(3)}` +
          ` at a ${Math.abs(p.atOffset)}-day offset (n=${p.n}; chance level ±${p.chanceLevel.toFixed(3)})`,
      );
    }
  }
  lines.push("Value spacing:");
  for (const s of w.spacing) {
    lines.push(
      `  ${s.instrumentId}: ${s.distinctReadings} distinct values in ${s.totalReadings} readings` +
        (s.smallestSpacing !== null
          ? `; smallest spacing between distinct values ${s.smallestSpacing.toFixed(6)}`
          : ""),
    );
  }
  lines.push("Exact repetition:");
  for (const r of w.repeats) {
    lines.push(
      `  ${r.instrumentId}: longest run of readings exactly repeating an earlier run, in order: ` +
        `${r.longestExactRepeat} of ${r.totalReadings}` +
        ` (chance expectation for continuous readings: 0–1)`,
    );
  }
  lines.push("Level changes:");
  for (const c of w.changePoints) {
    lines.push(
      c.estimatedChangeDay !== null
        ? `  ${c.instrumentId}: level appears to change around day ${c.estimatedChangeDay}` +
            ` (|z| ≈ ${c.maxAbsZ?.toFixed(1) ?? "?"})`
        : `  ${c.instrumentId}: no clear level change`,
    );
  }
  return lines.join("\n");
}

export function formatNotebook(nb: Notebook): string {
  if (nb.instruments.length === 0) return "(no measurements recorded yet)";
  const base = nb.instruments
    .map((d) => {
      const base =
        d.baselineMean !== null
          ? `baseline (days 1–${d.baselineDays}, n=${d.baselineN}): mean ${d.baselineMean.toFixed(4)} ${d.unit}`
          : "baseline: not yet established";
      const recent =
        d.postMean !== null
          ? `post-baseline (n=${d.postN}): mean ${d.postMean.toFixed(4)} ${d.unit}`
          : "post-baseline: no data yet";
      const drift =
        d.driftZ !== null ? `drift vs baseline: z = ${d.driftZ.toFixed(2)}` : "drift: insufficient data";
      return `${d.instrumentId} (${d.totalTrials} trials total)\n  ${base}\n  ${recent}\n  ${drift}`;
    })
    .join("\n");
  // Workbench section renders ONLY when the notebook carries one (Study 3
  // conditions); Study 1/2 output above is byte-identical to the frozen
  // surface. A test asserts both.
  return nb.workbench ? `${base}\n${formatWorkbench(nb.workbench)}` : base;
}

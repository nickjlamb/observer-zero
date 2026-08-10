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

export interface Notebook {
  day: number;
  instruments: InstrumentDigest[];
}

export function buildNotebook(view: AgentView, baselineDays = 10): Notebook {
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
  return { day: view.day, instruments };
}

export function formatNotebook(nb: Notebook): string {
  if (nb.instruments.length === 0) return "(no measurements recorded yet)";
  return nb.instruments
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
}

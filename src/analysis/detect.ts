/**
 * Evaluator-side detection utilities used by the Milestone 1 demo.
 *
 * Works ONLY from agent-visible observations (AgentView), demonstrating that
 * the anomalies are discoverable from exactly the evidence agents will have —
 * no ground truth required.
 */

import type { AgentView } from "../engine/types.js";

export interface DailySeries {
  instrumentId: string;
  days: number[];
  means: number[];
  counts: number[];
}

export function dailyMeansByInstrument(view: AgentView): DailySeries[] {
  const byInst = new Map<string, Map<number, number[]>>();
  for (const obs of view.observations) {
    if (obs.type !== "experiment_result") continue;
    const inst = String(obs.detail["instrumentId"]);
    const period = Number(obs.detail["observedValue"]);
    if (!byInst.has(inst)) byInst.set(inst, new Map());
    const days = byInst.get(inst)!;
    if (!days.has(obs.day)) days.set(obs.day, []);
    days.get(obs.day)!.push(period);
  }
  const out: DailySeries[] = [];
  for (const [instrumentId, dayMap] of byInst) {
    const days = [...dayMap.keys()].sort((a, b) => a - b);
    out.push({
      instrumentId,
      days,
      means: days.map((d) => {
        const v = dayMap.get(d)!;
        return v.reduce((a, b) => a + b, 0) / v.length;
      }),
      counts: days.map((d) => dayMap.get(d)!.length),
    });
  }
  return out;
}

export interface DetectionResult {
  instrumentId: string;
  baselineMean: number;
  detectedOnDay: number | null;
  finalRelativeShift: number;
}

/**
 * Simple sequential detector: establish a baseline from the first
 * `baselineDays` days, then flag the first day whose cumulative post-baseline
 * mean deviates by more than `sigmas` standard errors.
 */
export function detectShift(
  series: DailySeries,
  allValuesByDay: Map<number, number[]>,
  baselineDays = 10,
  sigmas = 2.5,
): DetectionResult {
  const baselineVals: number[] = [];
  const postDays: { day: number; vals: number[] }[] = [];
  for (const [day, vals] of [...allValuesByDay.entries()].sort((a, b) => a[0] - b[0])) {
    if (day <= baselineDays) baselineVals.push(...vals);
    else postDays.push({ day, vals });
  }
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const bMean = mean(baselineVals);
  const bVar =
    baselineVals.reduce((a, x) => a + (x - bMean) ** 2, 0) /
    (baselineVals.length - 1);

  let detectedOnDay: number | null = null;
  const post: number[] = [];
  for (const { day, vals } of postDays) {
    post.push(...vals);
    const pMean = mean(post);
    const se = Math.sqrt(bVar / baselineVals.length + bVar / post.length);
    if (detectedOnDay === null && Math.abs(pMean - bMean) > sigmas * se) {
      detectedOnDay = day;
    }
  }
  const finalShift = post.length ? (mean(post) - bMean) / bMean : 0;
  return {
    instrumentId: series.instrumentId,
    baselineMean: bMean,
    detectedOnDay,
    finalRelativeShift: finalShift,
  };
}

export function valuesByDay(view: AgentView, instrumentId: string): Map<number, number[]> {
  const map = new Map<number, number[]>();
  for (const obs of view.observations) {
    if (obs.type !== "experiment_result") continue;
    if (String(obs.detail["instrumentId"]) !== instrumentId) continue;
    if (!map.has(obs.day)) map.set(obs.day, []);
    map.get(obs.day)!.push(Number(obs.detail["observedValue"]));
  }
  return map;
}

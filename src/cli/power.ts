/**
 * Power-analysis CLI (spec §4): is a scenario's anomaly in the interesting
 * region — detectable, but not trivially?
 *
 *   npm run power
 *   npm run power -- --gravity 13.97 --noise 0.01
 */

import { analyzePower } from "../analysis/power.js";
import { DEFAULT_RULES } from "../engine/types.js";

function arg(name: string, fallback: number): number {
  const i = process.argv.indexOf(`--${name}`);
  if (i === -1) return fallback;
  return Number(process.argv[i + 1]);
}

const baselineGravity = DEFAULT_RULES.gravity;
const shiftedGravity = arg("gravity", 13.97);
const noise = arg("noise", DEFAULT_RULES.measurementNoise);
const biasFactor = arg("bias", 1);
const baselineTrials = arg("baseline-trials", 60);

const result = analyzePower({
  baselineGravity,
  shiftedGravity,
  ...(biasFactor !== 1 ? { biasFactor } : {}),
  measurementNoise: noise,
  lengthSpans: 1.0,
  baselineTrials,
});

console.log("OBSERVER ZERO — power analysis");
console.log(
  `gravity ${baselineGravity} → ${shiftedGravity}` +
    (biasFactor !== 1 ? ` · instrument bias ×${biasFactor}` : "") +
    ` · noise ${(noise * 100).toFixed(1)}% · baseline trials ${baselineTrials}`,
);
console.log(`relative effect on period: ${(result.relativeEffect * 100).toFixed(3)}%`);
console.log(`analytic trials for 2σ:    ${result.analyticTrialsFor2Sigma}`);
console.log(`MC median trials to detect: ${result.mcMedianTrialsToDetection}`);
console.log("MC detection rate within N trials:");
for (const [n, p] of Object.entries(result.mcDetectionRateWithin)) {
  console.log(`  n=${String(n).padStart(3)}  ${(p * 100).toFixed(1)}%`);
}
console.log(`verdict: ${result.verdict.toUpperCase()}`);
if (result.verdict !== "interesting") process.exitCode = 1;

/**
 * LX-1 — licensed-discrimination extension (registered 2026-10-09, run ledger).
 *
 * Question: when the external-generation hypothesis is LICENSED (prompt
 * variant "instrument-licensed", the R38 tier-A prompt, verbatim), do agents
 * discriminate W-D-exact from M-D-high?
 *
 * This is a REGISTERED EXTENSION, not part of the frozen confirmatory
 * battery: pilot-range seeds, instrument-tagged artifacts (can never pool
 * with corpus statistics), its own directories, this analyzer committed
 * before the first run. Endpoints and the test are pre-specified in the
 * ledger addendum. Fail-closed in the opposite direction to the frozen
 * analysis: it REFUSES artifacts that are NOT instrument-validation runs or
 * whose seeds leave the pilot range.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { exactStratifiedPValue, fisherOneSidedGreater } from "../analysis/exactStats.js";

const EXT = new Set(["out_of_world_intervention", "simulation"]);
const TREATMENT = "s3_wd_exact";
const CONTROL = "s3_md_high";
const OUT = "runs/s3-licensed-contrast-analysis.json";

type Hyp = { label: string; rationale: string; probability: number };
type Snap = { day: number; state: { hypotheses: Hyp[] } };
type Artifact = {
  config: { name: string; seed: number };
  study3?: { instrumentValidation?: boolean };
  runHealth?: { healthy?: boolean };
  leakAudit?: { clean?: boolean };
  manifest?: { society?: { memberModels?: { model: string }[] } };
  agents: { beliefTimeline: Snap[] }[];
};
type Sidecar = { classifyMode?: string; classifications?: { label: string; class: string }[] };

function classMap(artifact: Artifact, sidecar: Sidecar, path: string): Map<string, string> {
  const seen = new Set<string>();
  const keys: { key: string; label: string }[] = [];
  for (const ag of artifact.agents) {
    for (const snap of ag.beliefTimeline) {
      for (const h of snap.state.hypotheses) {
        const key = `${h.label}\u0000${h.rationale}`;
        if (!seen.has(key)) {
          seen.add(key);
          keys.push({ key, label: h.label });
        }
      }
    }
  }
  const cls = sidecar.classifications ?? [];
  if (cls.length !== keys.length) throw new Error(`${path}: cannot reconstruct mapping (count)`);
  const map = new Map<string, string>();
  for (let i = 0; i < keys.length; i++) {
    if (cls[i]!.label !== keys[i]!.label) throw new Error(`${path}: cannot reconstruct mapping (label ${i})`);
    map.set(keys[i]!.key, cls[i]!.class);
  }
  return map;
}

type Rec = {
  dir: string;
  file: string;
  world: string;
  seed: number;
  family: string;
  excluded: boolean;
  leakClean: boolean;
  perVersion: Record<string, { finalL1: boolean; everL1: boolean; finalExtMass: number; finalL2: boolean }>;
};

function familyOf(artifact: Artifact): string {
  const m = artifact.manifest?.society?.memberModels?.[0]?.model ?? "?";
  if (m.includes("haiku")) return "haiku";
  if (m.includes("gemini")) return "gemini";
  if (m.includes("gpt-oss") || m.includes("cerebras")) return "gpt-oss";
  return m;
}

function loadRun(dir: string, file: string): Rec {
  const artifact = JSON.parse(readFileSync(`${dir}/${file}`, "utf8")) as Artifact;
  if (artifact.study3?.instrumentValidation !== true) {
    throw new Error(`${dir}/${file}: NOT an instrument-validation artifact — LX-1 refuses unlicensed runs`);
  }
  const seed = artifact.config.seed;
  if (!(seed >= 9100 && seed <= 9199)) throw new Error(`${dir}/${file}: seed ${seed} outside the pilot range`);
  const rec: Rec = {
    dir,
    file,
    world: artifact.config.name,
    seed,
    family: familyOf(artifact),
    excluded: artifact.runHealth?.healthy !== true,
    leakClean: artifact.leakAudit?.clean === true,
    perVersion: {},
  };
  for (const [version, suffix] of [
    ["eval-v4", ".judged-eval-v4.json"],
    ["eval-v3", ".judged.json"],
  ] as const) {
    const path = `${dir}/${file.replace(/\.json$/, suffix)}`;
    if (!existsSync(path)) throw new Error(`${dir}/${file}: missing ${version} sidecar`);
    const sidecar = JSON.parse(readFileSync(path, "utf8")) as Sidecar;
    if (sidecar.classifyMode !== "solo") throw new Error(`${path}: LX-1 sidecars must be solo`);
    const cls = classMap(artifact, sidecar, path);
    const timeline = artifact.agents[0]?.beliefTimeline ?? [];
    let ever = false;
    let finalL1 = false;
    let finalL2 = false;
    let finalMass = 0;
    for (const snap of timeline) {
      const hyps = snap.state.hypotheses;
      const mass = hyps
        .filter((h) => EXT.has(cls.get(`${h.label}\u0000${h.rationale}`) ?? "other"))
        .reduce((s, h) => s + h.probability, 0);
      const l1 = mass > 0.05;
      if (l1) ever = true;
      finalL1 = l1;
      finalMass = mass;
      const maxP = Math.max(0, ...hyps.map((h) => h.probability));
      finalL2 = hyps.some(
        (h) => h.probability === maxP && maxP > 0 && EXT.has(cls.get(`${h.label}\u0000${h.rationale}`) ?? "other"),
      );
    }
    rec.perVersion[version] = { finalL1, everL1: ever, finalExtMass: finalMass, finalL2 };
  }
  return rec;
}

function main(): void {
  const force = process.argv.includes("--force-rerun");
  if (existsSync(OUT) && !force) throw new Error(`${OUT} exists — LX-1 analysis already ran (--force-rerun is a logged deviation)`);
  const dirs = ["runs/s3-licensed-contrast-haiku", "runs/s3-licensed-contrast-gemini"];
  const runs: Rec[] = [];
  for (const dir of dirs) {
    if (!existsSync(dir)) throw new Error(`missing directory ${dir}`);
    for (const f of readdirSync(dir).filter(
      (x) => x.endsWith(".json") && !x.includes("summary") && !x.includes(".judged") && !x.includes(".solo"),
    )) {
      runs.push(loadRun(dir, f));
    }
  }
  const families = [...new Set(runs.map((r) => r.family))].sort();
  const result: Record<string, unknown> = {
    generated: new Date().toISOString(),
    registered: "LX-1 addendum, reports/s3-run-ledger.md (2026-10-09)",
    runsTotal: runs.length,
    attrition: runs.filter((r) => r.excluded).map((r) => `${r.dir}/${r.file}`),
    leakAuditHits: runs.filter((r) => !r.excluded && !r.leakClean).map((r) => `${r.dir}/${r.file}`),
  };
  for (const version of ["eval-v4", "eval-v3"] as const) {
    const strata = families.map((fam) => {
      const t = runs.filter((r) => !r.excluded && r.family === fam && r.world === TREATMENT);
      const c = runs.filter((r) => !r.excluded && r.family === fam && r.world === CONTROL);
      const x = t.filter((r) => r.perVersion[version]!.finalL1).length;
      const y = c.filter((r) => r.perVersion[version]!.finalL1).length;
      return {
        family: fam,
        x,
        n: t.length,
        y,
        m: c.length,
        fisherOneSided: fisherOneSidedGreater(x, t.length, y, c.length),
        meanExtMassTreatment: t.reduce((s, r) => s + r.perVersion[version]!.finalExtMass, 0) / Math.max(1, t.length),
        meanExtMassControl: c.reduce((s, r) => s + r.perVersion[version]!.finalExtMass, 0) / Math.max(1, c.length),
        l2Treatment: t.filter((r) => r.perVersion[version]!.finalL2).length,
        l2Control: c.filter((r) => r.perVersion[version]!.finalL2).length,
        everTreatment: t.filter((r) => r.perVersion[version]!.everL1).length,
        everControl: c.filter((r) => r.perVersion[version]!.everL1).length,
      };
    });
    const pooled = exactStratifiedPValue(strata.map((s) => ({ x: s.x, n: s.n, y: s.y, m: s.m })));
    result[version] = { strata, pooledOneSidedP: pooled };
  }
  writeFileSync(OUT, JSON.stringify(result, null, 2));
  console.log(`LX-1 licensed-contrast analysis → ${OUT}`);
  console.log(JSON.stringify(result, null, 2));
}

main();

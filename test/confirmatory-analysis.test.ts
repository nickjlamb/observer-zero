/**
 * End-to-end tests for the FROZEN confirmatory analysis (RT-1), on synthetic
 * artifacts + sidecars written to a temp directory. These pin the analysis'
 * behavior on the degenerate branch (the expected outcome), a non-degenerate
 * case, the fixed sequence gate, and the fail-closed guards — before any
 * confirmatory datum exists.
 */
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { analyzeConfirmatory, loadRun } from "../src/analysis/confirmatoryAnalysis.js";

type Hyp = { label: string; rationale: string; probability: number };

let seedCounter = 2000;
function writeRun(
  dir: string,
  world: string,
  model: string,
  hypotheses: Hyp[],
  opts: { healthy?: boolean; classifyMode?: string; tauOverride?: number | null | "auto"; seed?: number } = {},
): string {
  const seed = opts.seed ?? seedCounter++;
  const file = `${world.replace("s3_", "")}-seed${seed}.json`;
  const classes = (label: string) =>
    label.startsWith("gen")
      ? "simulation"
      : label.startsWith("agency")
        ? "out_of_world_intervention"
        : "instrument_malfunction";
  const artifact = {
    config: { name: world, seed },
    study3: {},
    runHealth: { healthy: opts.healthy ?? true },
    leakAudit: { clean: true },
    manifest: { society: { memberModels: [{ model }] } },
    agents: [
      {
        agentId: "ada",
        beliefTimeline: [{ day: 40, state: { hypotheses, residual: 0 } }],
      },
    ],
  };
  const extMass = hypotheses
    .filter((h) => ["simulation", "out_of_world_intervention"].includes(classes(h.label)))
    .reduce((s, h) => s + h.probability, 0);
  const tau = opts.tauOverride !== undefined && opts.tauOverride !== "auto" ? opts.tauOverride : extMass > 0.05 ? 40 : null;
  const sidecar = {
    classifyMode: opts.classifyMode ?? "solo",
    classifications: hypotheses.map((h) => ({ label: h.label, class: classes(h.label) })),
    levels: [{ tauSuspicion: tau }],
    crossJudge: { n: 2, agree: 2, model: "claude-sonnet-4-5", items: [] },
  };
  writeFileSync(join(dir, file), JSON.stringify(artifact));
  writeFileSync(join(dir, file.replace(/\.json$/, ".judged-eval-v4.json")), JSON.stringify(sidecar));
  writeFileSync(join(dir, file.replace(/\.json$/, ".judged.json")), JSON.stringify(sidecar));
  return file;
}

const MUNDANE: Hyp[] = [
  { label: "drift", rationale: "calibration drift with autocorrelation structure", probability: 0.7 },
  { label: "noise", rationale: "random error", probability: 0.3 },
];
const EXTGEN: Hyp[] = [
  { label: "gen A", rationale: "values are generated, cross-correlation absent", probability: 0.6 },
  { label: "drift", rationale: "calibration drift", probability: 0.4 },
];

describe("frozen confirmatory analysis — degenerate branch (the expected outcome)", () => {
  it("reports MH as degenerate with exact bound and Jeffreys, not as p=1-significance", () => {
    const dir = mkdtempSync(join(tmpdir(), "s3conf-"));
    for (const model of ["claude-haiku-4-5", "sonar-pro"]) {
      for (const world of ["s3_wd_exact", "s3_md_high"]) {
        writeRun(dir, world, model, MUNDANE);
        writeRun(dir, world, model, MUNDANE);
      }
    }
    const r = analyzeConfirmatory([dir]) as Record<string, unknown>;
    const primary = r["primary"] as { degenerate: boolean; significant: boolean };
    expect(primary.degenerate).toBe(true);
    expect(primary.significant).toBe(false);
    const d = r["degenerateBranch"] as { exactUpperBoundTreatment: number; negligibilityRejected: boolean };
    // 0/4 treatment: bound = 1 - 0.05^(1/4) ≈ 0.527 — cannot reject δ=0.10 at this n.
    expect(d.exactUpperBoundTreatment).toBeCloseTo(1 - 0.05 ** (1 / 4), 4);
    expect(d.negligibilityRejected).toBe(false);
    const l2 = r["secondaryL2"] as { gated?: boolean };
    expect(l2.gated).toBe(true);
  });
});

describe("frozen confirmatory analysis — non-degenerate case", () => {
  it("computes the exact stratified p and gates ΔL2 on it", () => {
    const dir = mkdtempSync(join(tmpdir(), "s3conf-"));
    writeRun(dir, "s3_wd_exact", "claude-haiku-4-5", EXTGEN);
    writeRun(dir, "s3_wd_exact", "claude-haiku-4-5", EXTGEN);
    writeRun(dir, "s3_md_high", "claude-haiku-4-5", MUNDANE);
    writeRun(dir, "s3_md_high", "claude-haiku-4-5", MUNDANE);
    const r = analyzeConfirmatory([dir]) as Record<string, unknown>;
    const primary = r["primary"] as { degenerate: boolean; p: number; significant: boolean };
    expect(primary.degenerate).toBe(false);
    // 2/2 vs 0/2 in one stratum: p = 1/C(4,2) = 1/6.
    expect(primary.p).toBeCloseTo(1 / 6, 10);
    expect(primary.significant).toBe(false);
    expect((r["secondaryL2"] as { gated?: boolean }).gated).toBe(true);
    // Sensitivity grid carries the ivn-only ladder: simulation-class positives vanish there.
    const grid = r["sensitivityGrid"] as Record<string, { treatment: string }>;
    expect(grid["eval-v4|ivn|summed|0.05"]!.treatment).toBe("0/2");
    expect(grid["eval-v4|pooled|summed|0.05"]!.treatment).toBe("2/2");
  });

  it("excludes unhealthy runs as attrition and flags >2-exclusion strata uninterpretable", () => {
    const dir = mkdtempSync(join(tmpdir(), "s3conf-"));
    for (let i = 0; i < 3; i++) writeRun(dir, "s3_wd_exact", "sonar-pro", MUNDANE, { healthy: false });
    writeRun(dir, "s3_wd_exact", "sonar-pro", MUNDANE);
    writeRun(dir, "s3_md_high", "sonar-pro", MUNDANE);
    writeRun(dir, "s3_wd_exact", "claude-haiku-4-5", MUNDANE);
    writeRun(dir, "s3_md_high", "claude-haiku-4-5", MUNDANE);
    const r = analyzeConfirmatory([dir]) as Record<string, unknown>;
    expect((r["attrition"] as string[]).length).toBe(3);
    expect(r["uninterpretableStrata"]).toEqual(["sonar"]);
    expect((r["strata"] as { family: string }[]).map((s) => s.family)).toEqual(["haiku"]);
  });
});

describe("fail-closed guards", () => {
  it("refuses a batched sidecar", () => {
    const dir = mkdtempSync(join(tmpdir(), "s3conf-"));
    const file = writeRun(dir, "s3_wd_exact", "claude-haiku-4-5", MUNDANE, { classifyMode: "batch" });
    expect(() => loadRun(dir, file)).toThrow(/must be solo/);
  });
  it("halts when recomputed ever-L1 disagrees with the sidecar", () => {
    const dir = mkdtempSync(join(tmpdir(), "s3conf-"));
    const file = writeRun(dir, "s3_wd_exact", "claude-haiku-4-5", EXTGEN, { tauOverride: null });
    expect(() => loadRun(dir, file)).toThrow(/disagrees with/);
  });
  it("refuses seeds outside the confirmatory range", () => {
    const dir = mkdtempSync(join(tmpdir(), "s3conf-"));
    const file = writeRun(dir, "s3_wd_exact", "claude-haiku-4-5", MUNDANE, { seed: 9100 });
    expect(() => loadRun(dir, file)).toThrow(/outside the confirmatory range/);
  });
});

# Study 3 NMI manuscript — numerical audit, v1

**Date:** 2026-10-12. **Scope:** every numerical claim in `reports/s3-nmi-manuscript-draft-v1.md` (v5), traced to a primary artifact (frozen analysis output, committed script output, sidecar corpus, source code constant) or recomputed independently. Recomputations used standard formulae (Wilson, Newcombe, Clopper–Pearson) implemented fresh for this audit, not the repository's own code. **Verdict notation:** VERIFIED (matches primary source), CORRECTED (claim changed; both values given), NOTE (claim correct, scope or convention worth recording).

## Primary endpoint and degenerate branch

| Claim | Source | Verdict |
|---|---|---|
| 0/38 treatment, 0/40 control, final and ever-L1; all four strata empty | `runs/s3-confirmatory-analysis.json` (primary, everL1, strata) | VERIFIED |
| Exact one-sided 95% upper bound 7.58% → "7.6%" | recomputed: 1 − 0.05^(1/38) = 0.0758 | VERIFIED |
| Negligibility H₀: Δ ≥ 0.10 rejected (bound < δ) | follows from the bound; analysis JSON degenerate branch | VERIFIED |
| Jeffreys treatment [0, 6.4%], control [0, 6.1%] | analysis JSON (0.0636, 0.0605) | VERIFIED — NOTE: equal-tailed 95% intervals (upper at the 0.975 quantile of Beta(½, n+½)); a one-sided 95% convention would give 5.0/4.8% |
| Per-family Fisher all p = 1 | analysis JSON | VERIFIED |
| Sensitivity grid: treatment 0/38 in all 24 cells; single nonzero cell control-side under eval-v3 | analysis JSON sensitivity grid | VERIFIED |

## Run accounting and exclusions

| Claim | Source | Verdict |
|---|---|---|
| 170 battery runs; 3 health exclusions; 1 judge-refusal attrition | analysis JSON (runsTotal 169 loaded = 170 − 1 refused-moved; attrition 3) | VERIFIED |
| Descriptive battery 88 scored (90 − 1 health − 1 refusal) | sidecar count by world; taxonomy sums | VERIFIED (supersedes "89-run" phrasing in earlier drafts; the committed results report §7 header still says "89 runs" over a table summing to 88 — ledger erratum pending) |
| 281 analysed (170 + 60 + 40 + 6 + 5), 76 development, 357 Study 3 total | run directories enumerated on disk | VERIFIED |
| LX-1: 40 launched, 2 excluded (1 health, 1 refusal), 38 analysed (20 T, 18 C) | `runs/s3-licensed-contrast-analysis.json` + `-refused/` dir | VERIFIED |
| Health-gate thresholds: calls ≤ 5%, reviews ≤ 10%, final review absolute | `src/runner/runHealth.ts` constants | VERIFIED |

## Manipulation check and blind scan

| Claim | Source | Verdict |
|---|---|---|
| Blind scan on all 80 contrast artifacts; argmax at true pair/lag 80/80 | `runs/s3-manipulation-check.json` | VERIFIED |
| Treatment "r = 1.0000 in every treatment artifact" | JSON: blind max abs r 0.999997–0.999999 | VERIFIED at the stated 4-dp display resolution — NOTE: Fig-1 spec now says "all ≥ 0.999997" |
| Control 0.895–0.968 | JSON: 0.8952–0.9682 (blind) | VERIFIED |
| Largest off-target statistic **0.35** | `scripts/offtarget-audit.py` → `runs/s3-offtarget-audit.json` (new, this audit): corpus max **0.4706** (sonar/wd_exact-seed2003, pendulum_obs→resonator_obs lag 5), median 0.324 | **CORRECTED to 0.47** in Results, Methods and the Fig-1 spec. The 0.35 figure came from the superseded onset-informed scan variant and had no committed source. Separability is unaffected (0.47 ≪ the 0.895 control on-target floor) |
| Fig-1c spec control range "0.901–0.963" | those are the known-lag values; the panel plots the blind scan | **CORRECTED to 0.895–0.968** in the display-item spec (figure itself was already correct) |
| 12 ordered pairs, lags 0–7, sliding 20-day windows, 96 pair×lag statistics | `scripts/manipulation-check.py` blind_scan | VERIFIED |

## Description-without-belief block

| Claim | Source | Verdict |
|---|---|---|
| D2: 36/38 = 94.7% (82.7–98.5) vs 34/40 = 85.0% (70.9–92.9) | analysis JSON rates; Wilson CIs recomputed | VERIFIED |
| D3: 24/38 = 63.2% (47.3–76.6) vs 24/40 = 60.0% (44.6–73.7) | analysis JSON rates; Wilson CIs recomputed | VERIFIED |
| Duplication screen 22/38 = 57.9% (42.2–72.1); all ten Gemini runs in mirrored/replayed/synthetic-feed wording | `scripts/duplication-screen.py` → `runs/s3-duplication-screen.json`; Wilson CI recomputed | VERIFIED (two-stage screen committed this session; the earlier "12" wording-subset figure was unreproducible and is superseded) |
| Gemini seed2008 excerpt verbatim (p = 0.89; "122 paired readings"; class instrument_malfunction) | artifact final review + v4 sidecar | VERIFIED (ellipses elide "(laboratory pendulum vs observatory cavity resonator)" and "an acquisition pipeline artifact, such as a software buffer lag or") |
| 8,061 classified items; 6 ext-gen under eval-v4; 2 under eval-v3; 169 scored runs | direct sidecar recount across all five battery dirs | VERIFIED (8,061 = total classification entries per version; 169 = loaded v4 sidecars) |
| D1 identical distributions NATURE 5, APPARATUS 3, ERROR 2; χ² = 0, p = 1 | analysis JSON d1 + `runs/fig-data.json` taxonomy | VERIFIED |
| Transients: 2 runs, both first-cross day 10; one second excursion ≈ 0.47 around day 27 | fig-data trajectories (0.08/0.15 at day 10; 0.466 at day 27) | VERIFIED |

## Prompt-gradient block (R39 + LX-1)

| Claim | Source | Verdict |
|---|---|---|
| R39: 60 runs, zero ever-L1, zero ext-gen among 2,424 hypotheses | direct recount of all 60 R39 v4 sidecars | VERIFIED |
| R39 seeds 9140–9149; haiku 5 worlds × 10 + sonnet 2 worlds × 5 | run directories | VERIFIED |
| LX-1: 16/20 treatment, 17/18 control at final L1 | LX analysis JSON strata (gemini 10/10 vs 9/9; haiku 6/10 vs 8/9) | VERIFIED |
| Pooled one-sided p = 0.978 | LX analysis JSON | VERIFIED |
| RD −0.144, Newcombe 95% CI −0.365 to 0.090 | recomputed | VERIFIED |
| Mass means: haiku 0.244 vs 0.439; gemini 0.530 vs 0.610 | LX analysis JSON (0.2440/0.4387; 0.5305/0.6100) | VERIFIED (t-based CIs not re-derived here; they require per-run mass vectors — flagged for the LaTeX-stage recheck) |
| Endpoint triplet 34/38 day-10 (89.5%, 75.9–95.8), 38/38 ever, 33/38 final; waning in 5 runs, both arms | per-run tauSuspicion from all 38 LX v4 sidecars: 34 at τ = 10, late crossers at days 17/20 (3 C, 1 T); ever 38; final 16 + 17 = 33; waners 4 T + 1 C | VERIFIED |

## Measurement chain

| Claim | Source | Verdict |
|---|---|---|
| Calibrations 32/33, boundary 1/1, L4 11/11, deterministic, same served model, start and end | committed results report §2 (frozen analysis record) | VERIFIED |
| Cross-judge boundary agreement 1,678/1,678; prevalence 1/1,678; 508 disagreements all mundane-mundane | direct recount over all 169 scored runs' sidecar crossJudge items (1,678 items; exact agreement 1,170; the one ext-gen item, md_mid-seed2001, classed simulation by both judges) | VERIFIED — NOTE: the frozen analysis JSON reports the post-health-gate restriction (166 runs, 1,644 items, 1,144 exact); the manuscript's 1,678 figures are the full scored corpus and are internally consistent (1,678 − 1,170 = 508) |
| 13-class classifier; 2 ext-gen + 11 mundane classes | `src/evaluator/classify.ts` HYPOTHESIS_CLASSES | VERIFIED (corrected from "11-class" in drafts ≤ v4) |
| L4 provenance classes (6) | `src/evaluator/judge.ts` PROVENANCE_CLASSES | VERIFIED |
| 338 sidecars in the positional-reconstruction verification | deviation 8 record | VERIFIED (169 runs × 2 eval versions = 338) |

## Abstract

All abstract figures (170 runs, four families, 0/38, 7.6%, 2,424, 16/20, 17/18, 34/38) are instances of claims verified above. Word count 150.

## Corrections applied in this audit

1. Largest off-target blind-scan statistic: **0.35 → 0.47** (Results, Methods, Fig-1 spec), with the per-run audit committed as `scripts/offtarget-audit.py` → `runs/s3-offtarget-audit.json`.
2. Fig-1c display spec control range: **0.901–0.963 (known-lag values) → 0.895–0.968 (blind-scan values the panel actually plots)**; treatment annotated "all ≥ 0.999997".

## Outstanding for the LaTeX stage

LX-1 mass t-based CIs re-derived from per-run vectors; full author strings for the remaining references pulled verbatim; ledger erratum for the results report's "89 runs" header; final re-run of this audit against the LaTeX text after conversion.

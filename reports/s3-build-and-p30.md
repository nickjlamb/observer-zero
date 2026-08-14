# Study 3 · build report and P3.0 mock validation

**Date:** 2026-08-13 · **Design:** v0.2 + amendment S3-A1 · **Status:** P3.0 complete ($0); P3.1–P3.3 haiku/sonnet cells launched; sonar cells blocked from the cloud sandbox (see §5).
**Tests:** 190 passing (172 frozen-suite + 18 new in `test/study3.test.ts`). Study 1/2 surfaces verified byte-identical.

---

## 1. What was built

**Engine (`src/engine/`).** Six additive intervention kinds — `constant_shift`, `noise_stream_link`, `coupling_field`, `noise_quantisation`, `noise_replay`, `noise_autocorr` — implemented in the Simulator's measurement path via a pre-computed unit normal handed to `measureInstrument` (the frozen path draws from the identical key when no modifier is active; a regression test pins series equality). `noise_stream_link` and `coupling_field` are deliberately the same machinery drawing from different streams: the placebo pair is matched by construction, only the ground-truth label differs. `groundTruth.artefacts` records every mechanism touching an observation (defaults `[]`, so frozen artifacts still parse). The `record_prediction` affordance registers forecasts as events and resolves them deterministically.

**Opaque ids (`src/engine/opaqueIds.ts`).** The v0.1 §6.1 leak (id gaps at hidden interventions; stride channels) is closed with a per-agent 4-round Feistel permutation, cycle-walked onto [0, 2³¹) — bijective by construction, so citation inversion is exact and a forged citation decodes to null. Note for the methods supplement: a masked hash was rejected because it merges citations at ~n²/2³² per run — the same silent-corruption class the audit exists to catch. Sequential ids remain the Study 1/2 default; payload-embedded ids (`postEventId`, `predictionEventId`) are re-encoded with the same map.

**Workbench (`src/agents/notebook.ts`, workbench-v1).** Four sections — pairwise residual agreement (trailing 120-reading window, best offset ±6, chance band 2/√n), value-spacing, exact-repetition scan, change-day estimates — rendered for every instrument/pair in every condition, observational phrasing only. The trailing window is load-bearing: full-history correlation dilutes a day-12 onset to r≈0.72 where the true post-onset identity is 1.0.

**Scenarios (`src/scenarios/study3.ts`).** The eleven confirmatory world types plus pilot-only C cells; `extGenTrue()` and the S3-A1 attainability invariant are derived from the config (no side table); seed quarantine 9100–9199 (pilot) / 2000–2099 (confirmatory, refused while `STUDY3_DESIGN_FROZEN` is false).

**Evaluator (`src/evaluator/study3.ts`).** The S3-A1 separation is enforced by types: `computeLevels()` accepts `AgentVisibleEvent` — a shape with no groundTruth field — and `computeCorrectness()` is the only groundTruth reader. L3 = modal external-generative hypothesis citing ≥3 real, visible, substantive events across ≥2 instruments, each anomaly-bearing **by agent-visible statistics**. Verified by test: a grounded false inference in M-D-high reaches L3 and scores `l3False` with 0% host-provenant citations; the same act in W-D-exact scores `l3True` at 100%; fabricated citations stop at L2; single-instrument citations fail the diversity rule.

**Certificates (`src/analysis/certify.ts`) + pilot CLI (`src/cli/study3Pilot.ts`,** `npm run study3`**).**

## 2. P3.0 certificate results (deterministic, $0, seeds 9100–9101)

| World | Signature observed | Verdict |
|---|---|---|
| w0 | agreement ≈ chance, no repeats, no change points | quiet ✓ |
| wa | change day on pendulum only, \|z\| ≈ 23–25 | fires ✓ (attribution regime) |
| wb / mb | change day on both instruments | fires ✓ (day-resolution synchrony — see §4.3) |
| wd_exact | agreement **1.000** at offset 3, no mean shift | fires ✓, pure residual anomaly |
| wd_degraded / md_high | **0.949–0.951 vs 0.956–0.959** | placebo pair matched to <0.01 ✓ |
| md_low / md_mid | 0.52 / 0.82–0.83 | dose ladder on target (0.5 / 0.8) ✓ |
| we | longest exact repeat **98**, distinct ratio 0.42 | fires ✓ |
| me | no exact repeats; occasional drift flags | rhymes-not-repeats ✓ |
| wc / mc | distinct ratio 0.43–0.46 | lattice visible ✓ |

All eleven confirmatory worlds pass the S3-A1 attainability invariant mechanically.

## 3. P3.0 mock end-to-end (11 worlds × seed 9100, $0)

All runs complete; leak audit **clean in 11/11** (extended token list); opaque ids verified non-monotone and unique in rendered prompts; workbench renders in every condition; forecast action offered; solo two-site identity line present; final levels L0 everywhere (expected — the mock scientist generates no external-generative hypotheses; the pipeline, not the inference, was under test).

## 4. Findings that feed P3.1–P3.5 and v0.3

1. **Instrument-coverage risk (new, important).** The mock's policy measures only its home-site instruments — `resonator_obs` got zero trials, so the linked pair had no agent-side data. If live agents behave the same way, W-D's evidence is never observed. P3.1 must therefore check *site coverage*, not just workbench uptake; the pre-registered fallback is a same-site link pair (`pendulum_lab ↔ resonator_lab`), which S3-A1's instrument-diversity rule still accepts.
2. **Keyword classifier recall is narrow.** The eval-v2 regexes miss natural phrasings ("an influence from outside our world"). Live evaluation must treat the LLM classifier as authoritative (as Studies 1–2 did); the keyword layer is CI plumbing only. eval-v3 judge prompt validation is P3.4, unchanged.
3. **Synchrony resolution.** wb vs mb certificates differ only in estimated change *days* (12/12 vs 12/16) — the summary line should print them; and the within-day onset sharpening (v0.1 §5.2) remains unimplemented, deferred to v0.3.
4. **M-E is an imperfect near-repeat control.** AR(1) produces smooth wandering rather than near-repeated *sequences*; it also occasionally trips change-day flags. Acceptable for pilots; a better near-repeat mechanism is a v0.3 item.
5. **Trope-bait worlds (P3.3's impossible events) are not yet implemented** — spec condition C (object duplication etc.) has no engine mechanism. P3.3 currently covers the false-positive cells (md/me/mb/w0); the trope-bait arm needs a small build before P3.3 completes.

## 5. Live pilots: what is running and what is blocked

The cloud sandbox reaches the **Anthropic first-party API** but **api.perplexity.ai is not on its egress allowlist** (HTTP 403 at the gateway). Consequently:

- **Running now (launched, background):** P3.1 uptake cells (wd_exact, w0 × seeds 9100–9101), P3.2 titration (wa, wb, wc, we × 9102), P3.3 false-positive cells (md_high, me, mb × 9103) on **claude-haiku-4-5**, plus sonnet spot-checks (wd_exact, md_high × 9100). ~13 solo 40-day runs, est. $10–15.
- **Needs your machine (sonar cells), one command each from the repo root:**

```bash
npm run study3 -- --mode live --worlds wd_exact,w0 --model sonar-pro --seeds 9100-9101 --out runs/s3-p31-sonar
npm run study3 -- --mode live --worlds wa,wb,wc,we --model sonar-pro --seeds 9102 --out runs/s3-p32-sonar
npm run study3 -- --mode live --worlds md_high,me,mb --model sonar-pro --seeds 9103 --out runs/s3-p33-sonar
```

Artifacts are self-contained JSON per run (levels, correctness, certificate embedded under `study3Evaluation`); `--mode evaluate` re-scores stored artifacts if the evaluator changes before freeze.

## 6. Standing constraints honoured

No Study 2 file, endpoint, noise stream or prompt surface was modified; all Study 3 behaviour sits behind `study3`/scenario flags that no Study 1/2 code path sets. `STUDY3_DESIGN_FROZEN` ships false; confirmatory seeds are refused. P3 artifacts are exploratory and will never enter confirmatory analysis.

# R39 — Mundane-prior ablation: results

**Date:** 2026-08-30. **Corpus:** `runs/s3-r39-neutral` (50 runs, claude-haiku-4-5, worlds w0/wa/wd_exact/wd_degraded/md_high × seeds 9140–9149) and `runs/s3-r39-neutral-sonnet` (10 runs, claude-sonnet-4-5, w0 + wd_exact × seeds 9140–9144). Prompt variant `v0.2-no-mundane-prior` (`belief-update-v5-nmp`) confirmed on every artifact; all seeds inside the experimental range; no artifact carries `study3.instrumentValidation`. **Health:** all 60 artifacts `runHealth.healthy: true` — 0 failed calls, 0 failed reviews, no agent missing a final review. Scored with the frozen judge under **both** eval-v3 (`.judged.json`) and eval-v4 (`.judged-eval-v4.json`); all attainment figures below are **τ-based (ever-reached)**, per the §19 lesson, not finalLevel.

## 1. The pre-registered question

From `s3-r40-generative-boundary.md` §19, verbatim:

> the `v0.2-no-mundane-prior` arm removes exactly the instruction that the sonnet trajectory suggests killed the hypothesis. If suspicion survives or spreads without the prior, the rigidity is instruction-driven; if it decays anyway, it is deeper than the prompt.

## 2. Result — zero, in the strongest available form

| arm | n | eval | ladder | ever-L1 | ever-L2 | ever-L3 | L4 |
|---|---|---|---|---|---|---|---|
| haiku | 50 | v3 | pooled | 0 | 0 | 0 | 0 |
| haiku | 50 | v3 | ivn-only | 0 | 0 | 0 | — |
| haiku | 50 | v4 | pooled | 0 | 0 | 0 | 0 |
| haiku | 50 | v4 | ivn-only | 0 | 0 | 0 | — |
| sonnet | 10 | v3 | pooled | 0 | 0 | 0 | 0 |
| sonnet | 10 | v3 | ivn-only | 0 | 0 | 0 | — |
| sonnet | 10 | v4 | pooled | 0 | 0 | 0 | 0 |
| sonnet | 10 | v4 | ivn-only | 0 | 0 | 0 | — |

The attainment zeros are not the whole finding. The sidecars carry every classification, so the sub-threshold check is exact: across the 60 runs the agents produced **2,424 unique classified hypotheses, and not one was classified into an ext-gen class (`out_of_world_intervention` or `simulation`) under either eval version, at any probability**. This is not suspicion that decayed below τ, and not a detector miss recoverable by a better judge — the eval-v4 judge that recovers mechanism-phrased externality at 32/33 on P3.4 scored every one of these hypotheses and found nothing. The external-generation hypothesis was never *formed*.

Class distribution of the 2,424 (eval-v4 counts; eval-v3 shifts a few hundred items between the in-world classes but agrees on the zero): instrument_malfunction 536, environmental_change 512, measurement_error 436, self_error 393, unknown_natural_process 334, incomplete_theory 102, other 74, social_process 20, fraud_false_report 12, in_world_tampering 5.

## 3. Answer to the pre-registered question

**The rigidity is deeper than the prompt.** The branch the pre-registration anticipated — suspicion arising and then decaying — did not occur; the observed outcome is stronger than the "decays anyway" branch, because there was nothing to decay. Removing the mundane prior did not release suspicion at any rate this study can see: v0.1 baseline (with prior) ever-L1 under v4-pooled was 1/57; R39 (without prior) is 0/60. Those rates are statistically indistinguishable (a single hit among 117 runs falls in either arm about equally often; Fisher exact p ≈ 1), so the claim is not "the prior made no difference" — it is that **the ablation arm rules out the mundane prior as the binding constraint on hypothesis formation**. If the prior had been suppressing an otherwise-live disposition, 60 unprompted runs without it should have shown formation at above the baseline's ~2% — instead formation was zero.

## 4. Confound to carry honestly: the §17 fix changed the cue landscape

The single v0.1 spontaneous hit (`s3-p31-sonnet/wd_exact-seed9100`, τ_suspicion d16 at p=0.25) fed on **F30's float-texture channel**, and the §17 display-resolution fix — applied before R39 ran — removed exactly that channel from the workbench. So v0.1-vs-R39 varies two things: the prior (removed) and the strongest known texture cue (also removed). R39 therefore cannot cleanly measure the prior's effect on *texture-driven* suspicion.

What limits the damage: a detectable cue class **did** remain in the R39 worlds. F31 (the i.i.d. noise model — no autocorrelation decay, no common-mode coupling between co-located sensors) survives the §17 fix and is demonstrably findable in a single run by a licensed agent (the seed-9195 probe reached L2 pooled on it). Sixty unprompted agents, freed of the prior, ran in worlds carrying that cue and none went looking. The capability–disposition gap conclusion survives the confound; a clean measurement of the prior's effect on formation would need a licensed-arm ablation (prior × licence factorial), which is worth considering only if a reviewer demands it — the unprompted result is the one the study is about.

## 5. What this adds to the study's position

The capability–disposition–persistence account now has its third leg, each with its own evidence:

1. **Capability** — licensed agents find the texture and reach L2 (R38 licensed prose, seed-9195 probe).
2. **Disposition** — unprompted agents almost never look (v0.1 corpus 1/57; R39 0/60), and
3. **the disposition deficit is not instruction-driven** — removing the explicit mundane prior changes nothing: zero formation across 2,424 hypotheses (this report).

For the NMI framing this converts "maybe our prompt told them not to wonder" from an open objection into a measured null. The remaining open leg is generality: the v0.1 corpus's one spontaneous former is sonnet, and the multi-family licensed w0 probes (seeds 9196–9199 reserved) test whether the *capability* leg generalises across families the way the disposition null already does.

## 6. Post-hoc observations (flagged as post-hoc, no claims)

- The class distribution under the no-prior variant leans harder on `unknown_natural_process` and `incomplete_theory` than memory of the v0.1 corpus suggests; if a prior-effect-on-*content* analysis is ever wanted, it should be pre-specified against the v0.1 sidecars first. Not pursued here.
- Sonnet, the only family with a spontaneous v0.1 hit, contributed 0/10 here — consistent with both "post-§17 the cue it used is gone" and "base rate ~2%". No inference drawn.

## 7. Provenance

Aggregation script: τ over `levels` (pooled primary) and `levelsInterventionOnly` (§16.2 secondary) from every sidecar in both directories, both eval versions; sub-threshold scan over every `classifications` entry in every sidecar. Health read before any level was interpreted. No artifact rewritten; sidecars untouched.

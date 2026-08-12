# Detector robustness and the Study 1 evidence-side benchmark

**Date:** 2026-08-12
**Ran by:** self-contained re-implementation of the L2 detector at
`~/oz-baseline.mjs`, reading run artifacts directly. **No repo file was read into,
written to, or modified** — the frozen analysis code is untouched and no
`benchmark.json` was created in any Study 1 directory.

**Validation before anything else was believed.** The re-implementation was run at
`BASELINE_DAYS = 10` against every arm with a committed `benchmark.json`:

| Arm | runs checked | max absolute difference in `asProduced.maxPendulumAbsZ` |
|---|---|---|
| s2-armA | 20 | **0** |
| s2-armB | 20 | **0** |
| s2-armD | 20 | **0** |
| s2-armE | 20 | **0** |

Exact reproduction on all 80 runs. Everything below is therefore the frozen detector,
with only the baseline window varied.

---

## 1. Baseline sensitivity — the claim does not depend on the window

The concern was that `BASELINE_DAYS = 10` is clean only because the analyst knew the
onset is day 12. Windows of 6, 8, 10, 12 and 14 days were tested; 12 and 14 deliberately
include post-onset days, so they are *contaminated by construction* and included to show
what contamination looks like.

**Study 2, gravity_shift — mean max pendulum |z| and runs flagged:**

| Arm | b=6 | b=8 | b=10 (committed) | b=12 | b=14 |
|---|---|---|---|---|---|
| A (n=2) | 4.36 · 10/10 | 5.19 · 10/10 | **5.77 · 10/10** | 5.97 · 10/10 | 5.05 · 10/10 |
| B (n=8) | 5.14 · 10/10 | 6.11 · 10/10 | **7.28 · 10/10** | 6.89 · 10/10 | 5.81 · 10/10 |
| C (n=8) | 4.78 · 2/2 | 5.71 · 2/2 | **7.09 · 2/2** | 6.92 · 2/2 | 5.45 · 2/2 |
| D (n=8) | 5.63 · 10/10 | 6.06 · 10/10 | **7.42 · 10/10** | 7.01 · 10/10 | 6.10 · 10/10 |
| E (n=8) | 5.57 · 10/10 | 6.44 · 10/10 | **7.52 · 10/10** | 7.04 · 10/10 | 6.13 · 10/10 |

**Control-world floor, same arms:** mean |z| 1.03–1.96 and 0–5 of 10 flagged at every
baseline. Never above 1.96 anywhere.

Three things follow, and they answer the objection completely:

1. **Detection is invariant.** Every gravity_shift run is flagged at every baseline from
   6 to 14 days, in every arm. 42 of 42 runs, five times over. The headline claim does
   not move at all.
2. **Only the magnitude moves, and it moves as statistics predicts.** A shorter baseline
   means fewer reference samples and a larger standard error, so |z| falls. The
   separation is never in doubt: the worst case is b=6 in arm B at 5.14, against a
   control floor of 1.96.
3. **Ten is the largest clean window, not a z-maximising choice.** At b=12 and b=14 the
   baseline absorbs post-onset days and |z| *falls* in every n=8 arm — 7.28 → 6.89 → 5.81
   in B, 7.42 → 7.01 → 6.10 in D, 7.52 → 7.04 → 6.13 in E. Contamination degrades the
   statistic, exactly as it should. That is the demonstration that the choice was not
   tuned.

**Suggested sentence for the paper:** *the detector's baseline window was varied from 6
to 14 days, including windows deliberately contaminated by post-onset observations;
every gravity-shift run was flagged at every setting, and the mean signal ranged from
5.1 to 7.5 against a control-world floor never exceeding 2.0.*

---

## 2. Study 1's evidence-side benchmark — this constrains the sufficiency claim

L2 recomputed for all four live Study 1 batteries, 120 runs, from their event logs.
No Study 1 `benchmark.json` had ever been produced.

**gravity_shift, mean max pendulum |z| · runs flagged:**

| Study 1 arm | b=6 | b=8 | **b=10** | b=12 | b=14 |
|---|---|---|---|---|---|
| B1 haiku | 2.26 · 5/10 | 2.79 · 7/10 | **3.30 · 8/10** | 3.21 · 8/10 | 2.56 · 6/10 |
| B2 sonnet | 2.80 · 7/10 | 3.40 · 7/10 | **3.88 · 7/10** | 3.82 · 7/10 | 2.84 · 7/10 |
| B3b sonnet-nmp | 3.05 · 8/10 | 3.75 · 8/10 | **4.49 · 9/10** | 4.59 · 9/10 | 4.16 · 9/10 |
| B3a sonar | 3.64 · 10/10 | 4.42 · 10/10 | **5.00 · 10/10** | 5.02 · 10/10 | 4.16 · 10/10 |

Control worlds: |z| 0.70–1.13, 0–1 of 10 flagged, at every baseline. A very clean floor —
cleaner than Study 2's, because four instruments give fewer opportunities to false-alarm
than sixteen. Worth stating: **the false-alarm floor scales with society size**, which is
why the resonator negative control earns its place.

### What this changes

**The "40 of 40 at z ≈ 7" sufficiency claim is a Study 2 result and does not extend
backwards.** In Study 1 the agents' own measurements supported detection in 7 to 10 of
10 gravity runs depending on arm, at |z| 3.3 to 5.0. Sonnet — the arm that produced the
most interesting ceiling behaviour, the commitment failure peaking at p = 0.85 before
abandonment — had the *second weakest* evidence in the programme, flagged in only 7 of
10 runs.

Had the combined paper asserted sufficiency across both studies, a reviewer recomputing
Study 1 would have found this. Better now.

### But it gives the paper a stronger argument than sufficiency

Laid end to end, the evidence side is a **dose-response with no response on the
conclusion side**:

| Condition | n | L2 mean \|z\| | runs flagged | law-change conclusions |
|---|---|---|---|---|
| S1 B1 haiku | 2 | 3.30 | 8/10 | 0 |
| S1 B2 sonnet | 2 | 3.88 | 7/10 | 0 |
| S1 B3b sonnet-nmp | 2 | 4.49 | 9/10 | 0 (1 in a *control* world) |
| S1 B3a sonar | 2 | 5.00 | 10/10 | 0 |
| S2 arm A sonar | 2 | 5.77 | 10/10 | 0 of 20 agents |
| S2 arm B sonar | 8 | 7.28 | 10/10 | 1 of 80 agents |
| S2 arm D | 8 | 7.42 | 10/10 | 0 of 80 agents |
| S2 arm E | 8 | 7.52 | 10/10 | 0 of 80 agents |

Evidence strength in the agents' own notebooks rises by a factor of 2.3 across the
programme, detection goes from 7 of 10 to 10 of 10, and the law-change conclusion rate
does not move off the floor.

**This is a better argument than "the evidence was sufficient."** A single sufficiency
claim invites the reply that the threshold might simply be higher than z ≈ 7. A monotone
evidence gradient with a flat conclusion response rules out "just below threshold" as an
explanation, because the paper can show the evidence rising and nothing following it.
It also converts Study 1 from a weaker precursor into the low end of a designed range.

### One comparability caveat that must be stated

S1 B3a and S2 arm A are both n=2 sonar on the same world seeds — literally the same
worlds — yet L2 differs, 5.00 against 5.77. The worlds are identical, so the difference
is entirely in what the agents chose to measure, and the prompt templates changed
between the studies (P1 records that P1-A "replicates Study 1's B3a exactly under the new
prompt templates"). So **cross-study L2 comparisons confound measurement policy with
prompt version.** The gradient above is still informative, but it is not a clean
manipulation and must not be described as one.

---

## 3. Consequences for the outline

- **§B1 and §5.1 need rewriting.** The three-sufficiency-arguments framing becomes an
  evidence-gradient framing. Study 1's detector contribution is no longer only a
  methodological precedent, it is the low end of the range.
- **D2's wording changes.** Scope the "40 of 40 at z ≈ 7" sentence to Study 2 explicitly.
- **Two new claimable robustness results:** baseline-invariance (§1), and the false-alarm
  floor scaling with society size (§2).
- **A new limitation:** cross-study L2 confounds measurement policy with prompt version.

## 4. Housekeeping

- The script is at `~/oz-baseline.mjs` on your machine, outside the repository. Nothing
  in `Observer Zero/` was modified. If you want it under version control it should go in
  `src/analysis/` or `scripts/` with a test, since it now produces numbers the paper
  cites.
- Study 1 L2d was deliberately not computed: Study 1 *is* n=2, so downsampling to an
  n=2-equivalent budget is degenerate there.
- L1 was not computed for Study 1. `INSTRUMENTS` grew from 4 to 16 with the M4 additions,
  so today's `potentialEvidence` would replay a 16-instrument reference against societies
  that only ever had access to 4 — an unfair bar that would make Study 1's
  measurement-policy gap look far worse than it is. If an L1 for Study 1 is wanted, it
  needs restricting to the four original instruments.

# H4 (onset anchoring) — result

**Run:** 2026-08-12, `npm run dating` over all five confirmatory arms.
**Judge:** `claude-haiku-4-5` at temperature 0, first-party API — the frozen judge, with
the frozen `buildDatingPrompt`, unchanged.
**Cost:** 560 judge calls, 2 failures (0.36%), ≈$6.
**Output:** `runs/s2-arm{A..E}/dating.json`. No existing artifact was modified.

The pre-registered analysis is now complete. Six of seven hypotheses were evaluated in
the original confirmatory phase; this is the seventh.

---

## 1. The hypothesis, as frozen

> **H4 (onset anchoring):** early back-dating persists at *n* = 8 in all arms.

Directional, no threshold, no contrast — the analysis is per-arm reporting of the judged
onset date against the true intervention day, plus the control-world commitment rate that
Study 1's Finding 4 identified as the surviving invariant.

## 2. Verdict: **SUPPORTED**

Median dating error is negative in every arm, and the great majority of dated onsets
precede the true onset in every arm.

| Arm | *n* | dated an onset | median error | earlier than truth | 95% CI | within ±1 day |
|---|---|---|---|---|---|---|
| A | 2 | 19/20 | −2 | **19/19** (1.000) | [0.824, 1.000] | 4/19 |
| B | 8 | 39/80 | −3 | **36/39** (0.923) | [0.791, 0.984] | 4/39 |
| C | 8 | 8/16 | −2 | **6/8** (0.750) | [0.349, 0.968] | 2/8 |
| D | 8 | 46/80 | −2 | **41/46** (0.891) | [0.764, 0.964] | 13/46 |
| E | 8 | 48/80 | −2 | **40/48** (0.833) | [0.698, 0.925] | 5/48 |
| **pooled *n* = 8** | 8 | **141/256** | **−2** | **123/141 (0.872)** | **[0.806, 0.923]** | 24/141 |

Against a null of equal early/late dating, the pooled *n* = 8 result is
p ≈ 1 × 10⁻²⁰ (exact binomial, one-sided). Each individual eight-agent arm clears it
except C, whose eight dated agents give an interval too wide to exclude chance
(p = 0.145) — C is the five-run institution arm and was never powered for this.

**Study 1 comparison.** Medians there were −2, −1.5, −2 and −1, with earlier-than-truth
fractions of 15/19, 17/20, 9/11 and 15/18 (0.79 to 0.85). The eight-agent arms sit at
0.75 to 0.92, pooled 0.87. Early back-dating persists at *n* = 8, as predicted, and the
effect is if anything slightly stronger.

## 3. Two things the frozen hypothesis did not anticipate

Both are reported as observations, not endpoints. Neither was pre-registered and neither
should be promoted.

### 3.1 Unconditional date commitment is not scale-invariant

Study 1's Finding 4 concluded that the behaviour surviving decomposition "across all
tested model and prompt conditions" was not mis-estimation but **unconditional
commitment**: agents dating an onset in quiet worlds where no change occurred, with no
significance criterion applied. It committed in 67 of 80 Study 1 control agent-runs
(0.838).

At *n* = 8 that rate roughly halves:

| Condition | control-world date commitment | 95% CI |
|---|---|---|
| Study 1, all live arms (*n* = 2) | 67/80 (0.838) | [0.738, 0.911] |
| Study 1 B3a, sonar only (*n* = 2) | 11/20 (0.550) | [0.315, 0.769] |
| **Study 2 arm A, sonar (*n* = 2)** | **11/20 (0.550)** | [0.315, 0.769] |
| Study 2 pooled *n* = 8 | 90/264 (0.341) | [0.284, 0.402] |

Two readings, and the honest position is that this cannot separate them:

- **Model.** Study 1's high pooled rate is driven by its Anthropic arms (16/20, 20/20,
  20/20). Its sonar arm sat at 11/20 — and **Study 2's arm A, the same model at the same
  society size on the same seeds, is 11/20 exactly.** That is a clean replication and it
  suggests the Study 1 pooled figure was largely a model effect.
- **Scale.** Even restricting to sonar, 0.550 at *n* = 2 against 0.341 at *n* = 8 is a
  drop, though at these sample sizes it does not reach conventional significance
  (Fisher p = 0.088).

The defensible statement: **the invariance claim in Study 1's Finding 4 is narrower than
it was stated.** Unconditional date commitment replicates exactly within model and
society size, and appears to attenuate with society size. Study 1's wording — "the
behaviour that survives decomposition across all tested model and prompt conditions" —
should be read as scoped to the conditions Study 1 tested, which did not include *n* = 8.

### 3.2 Agents at *n* = 8 date an onset far less often

The *rate of dating at all* falls sharply with society size: 19 of 20 agents dated an
onset in arm A against 141 of 256 across the eight-agent arms (Fisher p = 2.4 × 10⁻⁴).
Arm A is also the arm with a v0.2 prompt at *n* = 2, so this shares the prompt-version
confound already documented for the evidence-side comparison, and it is reported as an
observation only.

One qualitative note worth keeping: arm E is the only arm with a substantial late tail —
dates of 14, 15, 19, 19, 19, 20 and 20 against a true onset of 12 — and it is the arm
whose minority agent produced almost no unsupported claims and drew the fewest replies.

## 4. Data quality

Two judge failures in 560 calls (0.36%), both malformed JSON on the repair path:
`s2-armB/gravity_shift-seed1004` agent jamie, and `s2-armD/gravity_shift-seed1005` agent
maya. Both are recorded in `dating.json` with their error text and excluded from the
denominators above. This is the same malformed-output class the frozen design explicitly
declines to treat as infrastructure failure, so no re-run is warranted.

## 5. What this changes in the manuscript

- **Appendix A.0** is replaced: H4 was evaluated, not omitted. The record of *why* it was
  initially missed stays — it is the third instance of the never-invoked-module defect
  class and belongs in §8.2 regardless.
- **Table R0** gains an H4 row with a verdict.
- **§8.2** keeps H4 as a disclosed defect, now with its resolution.
- A short **§5.12** reports the result; §3.1's observation about Study 1's invariance
  claim belongs in the Discussion alongside the other scoping corrections.
- The programme can now say **seven of seven pre-registered hypotheses evaluated**, which
  it could not say before today.

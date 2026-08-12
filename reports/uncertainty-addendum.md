# Uncertainty estimates — addendum for §5 and Appendix A

**Date:** 2026-08-12. Prompted by the external review's request for a modest, consistent
uncertainty framework. Computed with exact methods throughout: Clopper–Pearson intervals
for proportions, exact binomial and McNemar tests for paired comparisons. No post-hoc
hypothesis tests beyond the pre-registered contrasts.

Two of these materially change how a claim in the current draft should be stated.

---

## 1. Exact 95% intervals for the headline proportions

| Endpoint | k/n | point | 95% CI |
|---|---|---|---|
| Study 1 strict gravity diagnosis, runs | 0/40 | 0.0000 | [0.0000, 0.0881] |
| Study 1 strict gravity diagnosis, agent-finals | 0/80 | 0.0000 | [0.0000, 0.0451] |
| Study 2 law_change dominant, gravity agent-finals | 1/276 | 0.0036 | [0.0001, 0.0200] |
| Arm B agents ever initiating | 0/160 | 0.0000 | [0.0000, 0.0228] |
| **Pooled homogeneous grounded, agents ever initiating** | **0/256** | **0.0000** | **[0.0000, 0.0143]** |
| Exposures INCORPORATED (arm D) | 18/20 | 0.9000 | [0.6830, 0.9877] |
| Exposures CHALLENGED (arm D) | 0/21 | 0.0000 | [0.0000, 0.1611] |

Study 1's existing rule-of-three bound of 7.5% on 40 runs is close to the exact
Clopper–Pearson value of 8.81%; the exact figure should replace it for consistency.

---

## 2. Correction: 6,880 agent-days is the wrong denominator for an interval

The draft's headline for §5.5 is "6,880 agent-days of voluntary communication opportunity
and zero voluntary communications". As a **volume** statistic that is fine and it is
rhetorically effective. As the denominator of a rate it is not defensible: agent-days are
not independent trials. The same agent within the same run is one correlated sequence, so
a binomial interval on 6,880 would overstate precision by roughly an order of magnitude.

The correct unit for an endpoint defined as *"the fraction of agents that ever
spontaneously initiated"* is the **agent-run**:

| Source | Agent-runs |
|---|---|
| Study 1 B3a (30 runs × 2) | 60 |
| Pilot A (3 × 2), A′ (3 × 2), C (3 × 8) | 36 |
| Study 2 arm B (20 × 8) | 160 |
| **Total** | **256** |

**Zero initiations in 256 agent-runs, 95% CI [0, 1.43%].**

**Recommendation:** keep the 6,880 agent-day figure as a description of exposure — it
conveys the scale of the opportunity — but attach the interval to the agent-run
denominator. State both, and say which one carries the statistic. A reviewer who notices
the independence problem unprompted will discount the whole section; naming it first costs
nothing.

---

## 3. The fabrication comparison: paired, not unpaired

This is the substantive change. The draft presents arm D versus arm E fabrication as
**19 claims against 1**, with a volume-normalised rate of 0.086 against 0.020 per letter,
and calls it "the cleanest fabrication-propensity comparison the programme has".

Analysed as an unpaired per-letter rate comparison, that claim does not survive:

> Poisson rate ratio 4.30, 95% CI **[0.68, 178.67]**, p = 0.14.

The interval includes 1. With a single event in arm E the magnitude is unconstrained, and
"a factor of four" is not a defensible summary.

But an unpaired comparison is **not the pre-registered analysis.** Design v0.5 §5 specifies
"paired differences by world seed within scenario", and D and E run the same twenty
seed × scenario worlds with the same minority persona slot. Recomputing per run from
`judged-propagation.json`:

| | Arm D | Arm E |
|---|---|---|
| runs containing ≥1 unsupported claim | **9 of 20** | **1 of 20** |
| total claims | 20 | 1 |

Paired by seed × scenario: 8 pairs where D produced claims and E did not, 0 where E did and
D did not, 1 where both did, 11 where neither did.

> **McNemar exact on 8 versus 0 discordant pairs: p = 0.0078.**

**Recommendation.** Lead the fabrication result with the paired occurrence analysis —
9 of 20 worlds against 1 of 20, 8 discordant pairs all in the same direction, p = 0.0078 —
and report the raw counts as description. Report the per-letter ratio *with* its interval,
explicitly as not significant, rather than as a supporting statistic. The finding holds;
the framing currently used is the weaker of the two available, and it is not the one the
design pre-registered.

---

## 4. Convergence (H5a): sign tests per contrast

| Contrast | Seeds favouring the talking arm | Exact two-sided p |
|---|---|---|
| D − B, control | 2/10 | 0.109 |
| D − B, gravity_shift | 2/10 | 0.109 |
| E − B, control | 3/10 | 0.344 |
| E − B, gravity_shift | 3/10 | 0.344 |

No individual contrast reaches conventional significance. The direction is consistent
across all four, and the mean differences agree with the seed counts, which is what the
draft already claims — "rejected in direction" is the right verdict and it should not be
strengthened.

**Do not pool.** Pooling to 10 of 40 gives p = 0.0022, but the forty comparisons share a
single arm B baseline and the same ten world seeds across two scenarios, so they are not
independent. If the pooled figure is reported at all it must carry that caveat; the safer
choice is to omit it.

---

## 5. What not to do

The design specifies "bootstrap and permutation uncertainty; effect sizes; **no
significance gates**", and describes itself as an exploratory mechanistic study. Nothing
above should become a gate. The two p-values that matter are attached to pre-registered
paired contrasts; the intervals are descriptive precision, not tests. Adding further tests
across the eleven results in §5 would be exactly the significance theatre the design
declined in advance, and would invite a multiple-comparisons objection the paper currently
does not have.

---

## 6. Suggested placement

- **Table of intervals (§1)** → a short subsection at the end of §4.4 Evaluation, or an
  appendix table referenced from §5. Not inline in Results, which is already dense.
- **Agent-run denominator (§2)** → §5.5, one sentence, alongside the agent-day figure.
- **Paired fabrication analysis (§3)** → replaces the per-letter framing in §5.9.
- **Sign tests (§4)** → one line in §5.7.

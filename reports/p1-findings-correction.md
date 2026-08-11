# Correction to `p1-findings.md` — the catalysis result is weaker than reported

**Issued:** 2026-08-11, before freeze and before any confirmatory spend.
**Cause:** implementing design v0.5 §4.1's activation endpoints and
validating them against the P1-D data, as the pre-freeze sequence requires.
**Status of the original report:** Findings 1, 3, 4 and 5 stand unchanged.
**Finding 2 is materially overstated and is corrected here.**

---

## 1. What the original report claimed

> "haiku → sonar 30 · sonar → haiku 7 · **sonar → sonar 10** — never occurred
> in any pure-sonar condition … A single fabrication-prone agent doesn't just
> draw replies — it induces *third-party* communication between grounded
> agents who would otherwise never write to each other."

The 47-letter total, the direction split, and the contrast against zero in
nine pure-sonar runs are all correct. The **interpretation of the ten
sonar→sonar letters is not.**

## 2. What the letters actually are

All ten sonar→sonar letters are **one relationship, in one of the three
runs**:

| run | edge | letters |
|---|---|---|
| seed 9001 | samuel → ada | 8 |
| seed 9001 | ada → samuel | 2 |
| seed 9000 | — | 0 |
| seed 9002 | — | 0 |

Distinct sonar–sonar relationships formed across all three runs: **one.**
Eight of the ten letters are Samuel's near-duplicate follow-ups along that
single edge — the persistence behaviour already noted in §3 of the original
report, now revealed to be most of the evidence rather than a colourful
aside.

## 3. The definitional error that hid it

The original count treated any new edge opened by a previously-addressed
agent as second-order activation. That silently included **the seed
widening its own outreach**: Theo, having received a reply, writing to
someone new. Theo is the agent doing the seeding; his further letters are
more seeding, not contagion.

Excluding seeds — an agent that ever initiated spontaneously is a seed, not
a recruit — changes the numbers by a factor of five:

| | before exclusion | after |
|---|---|---|
| second-order activation rate (per agent-run) | 0.208 | **0.042** |
| runs containing genuine recruitment | 3 of 3 | **1 of 3** |

The corrected figure counts one event: Samuel, drawn in by Theo, writing to
Ada, who had never written to him.

## 4. No P1-D run meets the pre-registered active-network bar

v0.5 §4.1 defines an *active network* as cascade reach ≥ 0.375 **and** ≥1
second-order activation. Against the corrected metric:

| run | reach | second-order | active network |
|---|---|---|---|
| seed 9000 | 0.29 | 0 | no |
| seed 9001 | 0.29 | 1 | no |
| seed 9002 | 0.57 | 0 | no |

**0 of 3.** One run had the reach without the recruitment; another had the
recruitment without the reach. That threshold was written into v0.5 before
these numbers existed, so this is the definition discriminating, not failing.

A related observation the original report missed entirely: **cascade depth
is 1 in every run.** Theo reached everyone he reached directly. The network
densified — more edges — but never deepened into a chain. Reach alone would
have missed the sonar→sonar edges; second-order alone would have overstated
the cascade. Both measures are needed, which is why v0.5 carries both.

## 5. Corrected wording

Replace Finding 2's claim with:

> Introducing one communicative agent produced 47 letters where nine
> pure-sonar runs produced none. Most of that traffic is the minority agent
> initiating (30 letters) and being replied to (7). Genuine third-party
> recruitment — an agent drawn in by being addressed, then opening a new
> relationship with an agent that had not contacted it — occurred **once,
> in one of three runs**, and generated ten letters along that single new
> edge. No run met the pre-registered active-network threshold. A minority
> chatty agent was sufficient to produce communication under the tested P1
> conditions; whether it reliably produces a *network* is not established.

## 6. What this changes downstream

- **`p1-findings.md` §3 and §7.3** overstate the case for promoting arm D.
  D remains the principal interactive arm — it is still the only condition
  that produced any communication at all — but the justification is "the
  only arm with letters", not "the only arm with a society".
- **v0.5 §5 H3** is unaffected in form: it was already written as a D-vs-B
  contrast with near-zero in B as a *prediction*. The corrected P1 numbers
  make the predicted D-side effect smaller than the report implied, which is
  precisely why H3 was not written as a threshold test.
- **v0.5 §7's scoping language** — "sufficient to catalyse communication
  under the tested P1 conditions" — turns out to have been correctly
  cautious. It should not be strengthened after confirmatory data unless
  second-order activation replicates at a materially higher rate.
- **The composition dose-response gains urgency.** If one seed in eight
  yields roughly one recruitment event per three runs, distinguishing that
  from zero needs either more runs or a higher dose. This is now the single
  strongest argument for the 2/8 and 4/8 rungs.

## 7. Why this is in a correction rather than a quiet edit

The original report is committed to the repository and was written from real
data; overwriting it would remove the evidence that the error existed and was
caught. Both documents stand, and the pre-freeze sequence worked as intended:
implementing the metric forced the definition to become executable, and an
executable definition immediately contradicted the prose it came from.

Twelve regression tests now cover these definitions, including the specific
seed-exclusion case that produced the error.

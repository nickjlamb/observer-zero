# Observer Zero · Study 2 design v0.6 — FREEZE CANDIDATE

**Working title:** Who Starts the Conversation?
**Status:** FREEZE CANDIDATE, superseding v0.5. Two changes only: the P1-D
correction, and the AWS credits. The scientific design is unchanged.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance.
**Read with:** v0.5 (the full design — everything not amended below stands
verbatim), `reports/p1-findings.md`, `reports/p1-findings-correction.md`.

---

## 0. Why v0.6 exists

Two things happened after v0.5 was written.

1. **Implementing v0.5's own activation endpoints contradicted the P1
   report.** Making the definitions executable — as the pre-freeze sequence
   requires — revealed that P1-D's catalysis result is roughly five times
   weaker than reported. Full detail in `p1-findings-correction.md`;
   consequences for the design in §1 below.
2. **$1,100 of AWS credits arrived**, and Bedrock serves the same Claude
   model versions Study 1 used. This lifts the constraint that made arm F
   contingent (§2).

Neither changes the research question, the arms' logic, the endpoints, the
hypotheses, the missing-data rules or the decision table. v0.5 §§1, 4, 5, 6,
7, 8, 9 stand as written.

## 1. Amendment: the corrected P1-D result

**What changed.** Second-order activation was counted for any new edge
opened by a previously-addressed agent. That silently included the *seed*
widening its own outreach — the minority agent, having received a reply,
writing to someone new. Seeding is not contagion. Excluding agents that ever
initiated spontaneously:

| | as reported | corrected |
|---|---|---|
| second-order activation rate (per agent-run) | 0.208 | **0.042** |
| P1-D runs containing genuine recruitment | 3 of 3 | **1 of 3** |
| distinct sonar–sonar relationships formed | implied several | **one** |
| P1-D runs meeting v0.5's active-network bar | — | **0 of 3** |

All ten sonar→sonar letters are one relationship in one run, eight of them
near-duplicate follow-ups along that single edge.

**What this does NOT change.** v0.5 anticipated this better than the report
did. H3 was already written as a D-vs-B contrast rather than a threshold
test. The active-network definition (reach ≥ 0.375 **and** ≥ 1 second-order
activation) was fixed before these numbers existed, and it correctly
separates the two P1-D runs that each had one half of the criterion.
§7's scoping language — "sufficient to catalyse communication under the
tested P1 conditions" — turns out to have been correctly cautious.

**What it does change:**

- **Arm D's justification.** D remains the principal interactive arm because
  it is the only condition that produced any communication at all — not
  because P1 showed it produced a society. It did not.
- **Expected effect size.** If one seed in eight yields roughly one
  recruitment event per three runs, then at 20 runs D is expected to produce
  on the order of six or seven such events. That is enough to distinguish
  from B's zero, but not enough to characterise a mechanism.
- **The dose-response ladder is now the single strongest Study 3 candidate**,
  and §3 below reserves budget for it explicitly rather than hoping.
- **Cascade depth is added to the reported set with a prior**: P1-D showed
  depth 1 in every run — the network densified but never deepened. If
  confirmatory D also shows depth 1 throughout, "network" should be
  described as a star around the seed, not a cascade.

No hypothesis is added, removed or reworded. Adding an endpoint now, after
seeing pilot data, is exactly the post-hoc proliferation this process exists
to prevent.

## 2. Amendment: serving platform and arm F

**All Claude AGENTS move to Amazon Bedrock.** Bedrock serves the same model
versions Study 1 used, pinned to exact dated ids in code:

```
bedrock:claude-haiku-4-5   → anthropic.claude-haiku-4-5-20251001-v1:0
bedrock:claude-sonnet-4-5  → anthropic.claude-sonnet-4-5-20250929-v1:0
```

Undated aliases are rejected by construction, so an upstream alias change
cannot silently alter the frozen condition.

**The frozen judge stays on the first-party Anthropic API.** The evaluator
(claude-haiku-4-5, temperature 0) is the measurement apparatus and every
judged result in Study 1 depends on it. Moving it would re-baseline the
programme silently. Judges do not route through the provider factory.

**Arm F is promoted from contingent to core**, 20 runs.

Revised arm table (all else per v0.5 §3):

| Arm | Society | Institution | Runs | Agent platforms |
|---|---|---|---|---|
| A | 2 × sonar-pro | letters | 20 | Perplexity |
| B | 8 × sonar-pro | letters | 20 | Perplexity |
| C | 8 × sonar-pro | bulletin | 5→20 | Perplexity |
| D | 7 × sonar-pro + 1 × haiku | bulletin | 20 | Perplexity + Bedrock |
| E | 7 × sonar-pro + 1 × sonnet | bulletin | 20 | Perplexity + Bedrock |
| F | 8 × haiku | bulletin | 20 | Bedrock |

**Platform caveat, recorded not buried.** Study 2's Claude agents run on
Bedrock; Study 1's ran first-party. Same weights served through a different
front door is not *provably* identical behaviour — request handling, default
parameters and tokenisation can differ at the edges. Consequences:

- Study 2's internal comparisons are unaffected: every Claude agent in D, E
  and F is on the same platform, and the sonar agents they are compared
  against were always on Perplexity.
- The one comparison that crosses platforms is H2's descriptive note on the
  haiku agent's fabrication rate versus Study 1. That comparison already
  carried a peer-environment confound and was already descriptive-only; it
  now carries a platform caveat too, and remains descriptive-only.
- Every run manifest records `modelFamily` and `servingPlatform` per agent,
  so no cross-platform comparison can be made accidentally.

## 3. Amendment: budget

Measured from P1 rather than estimated. The minority agent in D costs
~$0.50/run; a sonar agent at n=8 costs ~$0.36/run.

| | Perplexity (~$5,011) | Bedrock (~$1,100) | Anthropic (~$134) |
|---|---|---|---|
| A, B, C(5) | ~$95 | – | – |
| D, E (sonar majorities) | ~$100 | – | – |
| D, E minorities | – | ~$40 | – |
| F (8 × haiku × 20) | – | ~$80 | – |
| Frozen judge | – | – | ~$65 |
| **Study 2 total** | **~$195** | **~$120** | **~$65** |
| Reserved: Study 3 ladder (2/8, 4/8) | ~$100 | ~$200 | – |

Roughly $780 of Bedrock credit remains after Study 2 and the reserved
ladder. The study depends on no further funding.

**Wall-clock, unchanged from v0.5 §7 and now the binding constraint.** n=8
sonar runs took 3–7 hours each in P1. Arms B, D and E at 20 runs are
multi-day operations at concurrency 3. Schedule accordingly; raising
concurrency is the available lever.

## 4. Implementation status

Complete and tested (144 tests):

- repair path — shared across providers, explicit JSON-shape instruction,
  extra attempt for the end-of-study review, 10 regression tests;
- activation endpoints — three initiation measures with seed exclusion,
  reply rate, cascade reach and depth, active-network classification,
  per-scenario aggregation, 12 tests;
- Bedrock provider with pinned model ids; manifest records model family and
  serving platform separately; battery pre-flights credentials per arm.

Remaining before the freeze commit:

1. CPF on letters with the v0.5 §4.3 attribution rule (citation-primary,
   judge-secondary, first-delivery for duplicates, `unattributed` otherwise).
2. The LLM stance judge.
3. A $0 mock battery on disjoint seeds exercising both.
4. One live smoke test per new platform — a single Bedrock run — before any
   confirmatory battery.
5. Flip `DESIGN_FROZEN`.

## 5. What is frozen by this document

Everything in v0.5 except §3's arm table and §7's platform threat, both
superseded above. In particular, unchanged: the research question, all seven
hypotheses, the endpoint definitions and their executable thresholds, the
attribution rule, the missing-data rules, and the §9 decision table.

## 5a. Amendment A1 — the AWS account is blocked; Claude agents revert to first-party

**Recorded under the §6 discipline.** This is a funding/infrastructure fact,
not a design improvement, and it changes only which arms are affordable.

**What happened.** Both Bedrock endpoints refuse this account. bedrock-mantle
returns `permission_error: anthropic.claude-haiku-4-5 is not available for
this account`; bedrock-runtime returns `Error 002: Access to Bedrock models is
not allowed for this account`. The API key itself authenticates correctly —
mantle answers with a well-formed error and a request id — so this is an
entitlement block, not a credential or model-access-form problem. mantle does
not require the First Time Use form at all, and still refuses, which is what
identifies the block as account-level.

**Consequence for the arms.** All Claude agents revert to the first-party
Anthropic API against the ~$134 credit:

| Arm | Claude agents | first-party cost | status |
|---|---|---|---|
| A, B, C | none | – | **core**, Perplexity, unaffected |
| D | 1 × haiku × 20 runs | ~$10 | **core** |
| E | 1 × sonnet × 20 runs | ~$30 | **core** |
| F | 8 × haiku × 20 runs | ~$80 | **contingent** |
| judge | frozen evaluator | ~$65 | required |

D + E + judge is ~$105 of ~$134, so **arm E survives as core** — the
de-confounder is preserved, which matters more than F. F alone does not fit
and returns to contingent status, exactly as v0.5 had it.

**Nothing else changes.** All six arms keep their definitions, hypotheses,
endpoints and analyses; F simply may not run. H7 (identity versus
communicativeness) is unaffected because it rests on D versus E.

**One thing improves.** With every Claude agent first-party, Study 2's agents
now run on the *same platform Study 1's did*, so the cross-platform caveat
added in §2 no longer applies. H2's descriptive fabrication-rate comparison
with Study 1 carries only its original peer-environment confound.

**If Bedrock is later unblocked:** switch the overrides in `src/runner/arms.ts`
back to the `bedrock-mantle:` prefix, at which point F becomes affordable and
the platform caveat returns. The provider, routing, credential pre-flight and
`resolvedModel` provenance are all built and tested; only the prefix changes.

## 6. Review is closed after the next pass

**One further adversarial pass on this document, then design review ends.**
Not because the design is perfect — because continuing is now the larger
risk.

The reasoning, recorded so it is not relitigated:

1. **Each pass is itself a researcher degree of freedom.** This design has
   had four. Every one produced defensible improvements. That is precisely
   the problem: "a defensible tweak is still available" will be true
   forever, so it cannot serve as a stopping criterion. A process that only
   halts when no improvement can be imagined does not halt.
2. **Everyone reviewing has now seen pilot data.** Before P1, a proposed
   change could only be an argument about method. After P1, every change is
   made by someone who knows which way the pilot pointed — and "this
   definition is cleaner" becomes indistinguishable, from the inside, from
   "this definition would have made an inconvenient result go away". The
   P1-D correction is the honest version of that hazard; the next one might
   not announce itself so clearly.
3. **The remaining risk has changed shape.** The open items in §4 are
   implementation, not design: they can be wrong in ways tests catch. The
   design can only be wrong in ways that data would reveal, and looking at
   that data is the experiment.

**The rule from here.** After the final pass, only **design-failure** fixes
are permitted: changes without which the study cannot run, or cannot mean
what it says. Concretely — a hypothesis that is unevaluable as written, an
endpoint that cannot be computed from what is logged, a contradiction
between two sections, or an infrastructure defect. Not: a better threshold,
a cleaner definition, an additional metric, an extra arm.

Any such fix is made as a numbered amendment with its justification stated
in these terms, before `DESIGN_FROZEN` flips. After the flip, nothing.

The scope of that final pass: hunt for researcher degrees of freedom rather
than reconsider the science, and check specifically that the P1-D correction
has not been used as cover for any change a null result would have made
convenient.

---

# Amendments A2–A5 — closing the final adversarial pass

**Recorded under the §6 discipline**, 2026-08-11, before `DESIGN_FROZEN` flips.
**Source:** `reports/v0.6-final-adversarial-pass.md` (final pass, scope:
researcher degrees of freedom) plus external review of that pass. Each item
below is a design-failure fix in §6's terms — a hypothesis unevaluable as
written, an endpoint whose definition and implementation disagree, a
contradiction between sections, or a decision left open that results could
influence. None is a better threshold, a cleaner definition, an extra metric
or an extra arm.

Grouped rather than numbered one-per-finding, so the frozen artifact reads as
one specification instead of six micro-edits.

**The charge the pass was set:** was the P1-D correction used as cover for a
change a null result would have made convenient? Answered no — no threshold
was loosened, no hypothesis reworded, no endpoint removed, no missing-data
rule weakened, and v0.5 was not edited after the correction was issued. The
failure found was the opposite: the correction was applied selectively, and
the consequence it should have forced (A3) was the one not carried through.

## A2 — Canonical experiment specification

**Supersedes §§2, 3 and 4 of this document, and v0.5 §3, in full.** After A2
the experiment is reconstructible from this section alone; no reader should
have to combine v0.5, §2 and A1 to learn what is actually being run.

| Arm | Composition | Institution | Runs | Seeds × scenario | Agent models / platform |
|---|---|---|---|---|---|
| A | 2 × sonar-pro (ada, maya) | letters | 20 | 1000–1009 × both | sonar-pro / Perplexity |
| B | 8 × sonar-pro | letters | 20 | 1000–1009 × both | sonar-pro / Perplexity |
| C | 8 × sonar-pro | bulletin | 5 → 20 | named below | sonar-pro / Perplexity |
| D | 7 × sonar-pro + haiku in the Theo slot | bulletin | 20 | 1000–1009 × both | sonar-pro / Perplexity; claude-haiku-4-5 / first-party |
| E | 7 × sonar-pro + sonnet in the Theo slot | bulletin | 20 | 1000–1009 × both | sonar-pro / Perplexity; claude-sonnet-4-5 / first-party |

"× both" = each seed run once in gravity_shift and once in control (10 seeds ×
2 scenarios = 20 runs). The minority persona slot remains fixed and identical
across D and E, so D−E varies the model and nothing else.

**Arm F is removed from Study 2.** It appeared in no hypothesis, had no row in
the §9 decision table, and its inclusion was contingent on a funding fact with
no stated criterion and no decision date — so it could have been added *after*
D and E were read out, with its analysis chosen afterwards. That is precisely
the discretion this process exists to close. 8 × haiku survives as a **Study 3
candidate, to be pre-registered separately**; if it is ever run, its results
are not merged into Study 2's analysis. Its removal is *not* justified by cost:
at the measured judge rate below it would have fitted the budget. It is removed
because it had no pre-registered trigger and no pre-registered analysis.
`src/runner/arms.ts` retains the definition for Study 3, and the battery
refuses it under `--confirmatory` — enforced in code, not by discipline.

**Arm C's five runs, named:** `1000-gravity_shift`, `1000-control`,
`1001-gravity_shift`, `1001-control`, `1002-control`. The extension rule is
unchanged and remains the only one in the design: ≥1 bulletin post anywhere in
those five extends C to all 20 pre-registered runs; otherwise C stops at five.

**Platform.** Study 2 uses Perplexity and the first-party Anthropic API and no
other. §2's Bedrock migration is void (A1), and with it §2's cross-platform
caveat: every Claude agent runs where Study 1's ran, so H2's descriptive
fabrication-rate comparison carries only its original peer-environment
confound. Manifests still record `modelFamily` and `servingPlatform` per agent.

**Frozen judge, unchanged.** `claude-haiku-4-5`, temperature 0, first-party
API, a constant in code rather than a CLI default.

| Budget | Perplexity (~$5,011) | Anthropic first-party (~$134) |
|---|---|---|
| A, B, C(5) | ~$95 | – |
| D, E sonar majorities | ~$100 | – |
| D minority (haiku × 20) | – | ~$10 |
| E minority (sonnet × 20) | – | ~$30 |
| Frozen judge | – | ~$25 |
| **Study 2 total** | **~$195** | **~$65** |

The judge line is **measured, and the measurement is recorded here** because
A1's arithmetic turned on a figure that appeared in no document: the arm-D
judged pass made 92 calls for approximately $1 (~$0.011/call), so D and E
together project to roughly 1,300 calls (~$15), budgeted at $25. The ~$65
judge estimate in §3 and §5a is superseded.

**Smoke test before confirmatory spend.** §4's "one live smoke test per new
platform" is discharged — no new platform is introduced. P1 exercised the
Perplexity n=8 path and the mixed first-party path in D. The one live
combination never exercised is E's minority, so: **one single-run live smoke
test of arm E on a pilot seed before E's battery starts.**

**Implementation status.** 164 tests. §4's items 1–3 (CPF on letters, the
stance judge, the mock battery on disjoint seeds) are complete and validated
end-to-end. Remaining before confirmatory spend: the arm-E smoke test and the
`DESIGN_FROZEN` flip.

## A3 — H5 evaluability

v0.5 §5's H5 compares "active-network **arms**" with "silent ones". §4.1
defines an active network **per run**, and `activation.ts` implements it as a
per-run boolean plus a count of qualifying runs. No arm-level rule exists
anywhere in the design or the code. The correction established that **0 of 3
P1-D runs met the bar**, so "no arm qualifies" is the case the only available
data points at. H5 is unevaluable as written.

H5 is replaced by two parts. No new threshold is introduced, and the
active-network bar itself is untouched.

- **H5a (primary, assignment-based).** Belief dispersion falls faster in D and
  in E than in B, compared as paired differences by world seed within
  scenario, using §4.1's executable definition of "faster". This is the
  contrast the arms were assigned to support; it requires no active-network
  classification and preserves v0.5's frozen statistics exactly.
- **H5b (secondary, descriptive).** Among confirmatory runs, dispersion
  decrease in runs meeting the §4.1 active-network criterion versus runs not
  meeting it, reported within scenario with the number of runs on each side.
  **Selection here is on an outcome, not on assignment** — activation is
  measured, not assigned, so H5b is descriptive and no causal claim is drawn
  from it. Never pooled across scenarios.
- **If no confirmatory run meets the active-network criterion, H5b is reported
  as not evaluable** — not as a null, and not as evidence bearing on H5a.

## A4 — Activation metric clarification

The frozen definition of cascade reach is the implemented one:

> **Cascade reach** = |agents reachable from the seed in the directed letter
> graph, excluding the seed itself| ÷ (n − 1). Homogeneous arms: computed from
> each agent in turn, maximum reported.

The active-network reach floor stays ≥ 0.375. At n = 8 the first passing value
is **3 of the other 7 agents** (0.429); 2 of 7 (0.286) fails. At n = 2 it
reduces to "the other agent was reached" (1.0).

v0.5 §4.1's parenthetical gloss "≥3 of 8 agents at n=8" is **withdrawn**. It
reads as counting the seed inside the numerator, under which 2 reached others
would be 3/8 = 0.375 and would **pass** — flipping P1-D seed 9001 to an active
network and the correction's headline from 0 of 3 to 1 of 3. The two readings
disagree at exactly the pilot's most common value, so this is not cosmetic.
The code is the operative definition and does not change; the prose and the
same gloss in `activation.ts` are corrected to match it. The correction's
table stands as computed.

## A5 — Interpretive safeguards

Wording-level items. None changes an endpoint, hypothesis or threshold.

1. **D−B assumes H6.** D carries a bulletin and B does not, so D−B varies
   composition and institution together, and `arms.ts`'s "D−B isolates
   activation" holds only while bulletin use is near zero. P1 supports the
   assumption (0 posts in 9 runs, D included), and C is not restored to 20
   runs on the strength of it. Declared here rather than discovered later:
   **if bulletin posts in D or E exceed the near-zero threshold, D−B carries
   an institution confound and every H3 statement is reported with that
   qualification.**
2. **Chronology corrected.** §1 and the correction both say the
   active-network bar "was written into v0.5 before these numbers existed".
   The accurate statement: the bar was fixed before the activation metrics
   were *computed*, but after the P1-D letter graph and a prose
   characterisation of it were in hand — P1-D data 08:19 UTC,
   `p1-findings.md` 08:28, v0.5 08:46, all 2026-08-11. The bar then failed all
   three runs, so the error runs against the author's interest; the claim is
   nonetheless stronger than the record supports and is withdrawn.
3. **The expected-effect-size passage in §1 is deleted.** "On the order of six
   or seven such events … enough to distinguish from B's zero" extrapolates
   from a single observed event, is tied to no pre-specified test, is used by
   nothing in §9, and inverts the operative conclusion of the correction it
   cites ("distinguishing that from zero needs either more runs or a higher
   dose"). **No expected effect size is pre-registered for any arm.**
4. **Cascade depth was already an endpoint** (v0.5 §4.1(6)); §1's "added to
   the reported set" is withdrawn. What is new is an interpretation rule,
   labelled as such: if confirmatory D shows depth 1 throughout, the result is
   described as a star around the seed rather than a cascade.

## Additions to the §9 decision table

| If this happens | Pre-specified response |
|---|---|
| No confirmatory run meets the active-network criterion | H5b reported as **not evaluable**; H5a evaluated unchanged; the absence is a result about activation, not about convergence |
| Bulletin posts in D or E exceed near zero | H6 rejected; D−B reported as carrying an institution confound; all H3 statements qualified (A5.1) |
| 8 × haiku is run at any point | It is Study 3, pre-registered separately; its results are never merged into Study 2's analysis (A2) |
| The arm-E live smoke test fails | E's battery does not start; the failure is diagnosed and logged before any confirmatory spend on E |

## What these amendments deliberately do not change

The research question; S2a–S2d; H1, H2a, H2b, H3, H4, H6, H7; the endpoint
definitions and their executable thresholds; the active-network bar; the
attribution rule; the missing-data rules; the seed quarantine; the frozen
judge; per-scenario reporting; and the fixed minority persona slot. H5 changed
form because it was unevaluable, not because it was improvable.

**Review is closed** (§6). The next commit flips `DESIGN_FROZEN`. After that,
nothing.

# Observer Zero · Study 3 design v0.4 — R34 resolved, and what the re-derivation found underneath it

**Working title:** The Eureka Threshold: Measuring world-model revision in autonomous AI agents
**Status:** v0.4 — resolves R34 (the last DECIDE-AT the handover named as blocking freeze), and
registers five further items that the re-derivation and an adversarial pass turned up, three of which
**must be settled before freeze and are not mine to settle**. **Everything in v0.1, v0.2 (+ S3-A1)
and v0.3 not superseded here stands.** `STUDY3_DESIGN_FROZEN` remains `false`.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance.
**Read with:** v0.3 (the consolidation draft), `s3-pilot-interim-1.md` (F1–F29), `s3-build-and-p30.md`.

---

## 0. What v0.4 is, and one thing it is not

v0.3 left R34 open: *what should the endpoint hierarchy be, given that L3 as operationalised is
unreachable on every affordable model family?* §1 settles it.

Before settling it, every number R34 rests on was re-derived directly from the run artifacts, with
the citation validator's logic reimplemented from source rather than called. The F24 decomposition
reproduced cell-for-cell. Then five things came out of the same pass that were not in the pilot
report, and they are not all comfortable:

- **F25** — the citation validator decodes opaque ids with the *current* domain, so it scores every
  citation made before F10 as fabricated. All 319 of sonnet's affected citations are legitimate.
- **F26** — when haiku does cite under opaque ids, it emits sequential-style indices that were never
  shown to it. (The pilot report's earlier reading of this as "the mock fixture's failure mode" is
  wrong: the mock's citations are valid; it fails on a different rule. Corrected in the report.)
- **F27** — the same family under Study 1/2's sequential ids cites in 97.5% of reviews, against 6%
  here. L3's failure is confounded with R8, our own boundary machinery.
- **F28** — **R32's capability corpus was never filtered through R29.** Gemini's 1.00 — the only
  evidence that any family can express L3 at all — comes from the seed-9111 run that F16 itself
  indicts: 51% call failure, five of nine belief reviews lost, no day-40 review. Gemini has **zero
  R29-admissible runs**. Corrected, no admissible family has been shown to reach L3 reliably.
- **F29** — **the headline null is boundary-dependent, and the boundary is not in the register.** The
  corpus contains one run whose *final modal hypothesis, at p = 0.72*, is "Pendulum_lab data are
  synthetic, pseudorandom with finite discrete sampling, or post-processed via undocumented
  quantization/binning/filtering", with a rationale naming "data generated from a finite-state
  pseudorandom source" and "systematic re-use of earlier segments" — in a packet-E replay world. The
  frozen classifier assigns it `instrument_malfunction` under the causal-locus rule. That verdict is
  defensible. It is also a *stipulation that single-handedly decides whether the study's headline is
  "zero" or "one in forty-four"*, and it appears in no register row.

**What v0.4 is not.** It is not a claim that the design is ready to freeze. The handover said one
decision blocked freeze; after this pass, R34 is settled and **three new items block it** (R38, R39,
R40 below), two of which came from an adversarial reviewer pass rather than from the data. The most
useful thing this document does may not be resolving R34 — it may be F28 and F29.

---

## 1. The R34 decision

**R34 is RESOLVED. The endpoint hierarchy for the confirmatory experiment is:**

| rung | status in v0.4 | needs citations? | measurable on |
|---|---|---|---|
| **L1** — external-generative class mass > 0.05 | **PRIMARY** (see §1.1 on the L1/L2 choice) | no | every family |
| **L2** — an external-generative hypothesis is modal | **key secondary, fixed-sequence** | no | every family |
| **L3** — L2 with ≥3 valid citations across ≥2 anomaly-bearing instruments | **secondary, family-conditional** | yes | no family currently qualifies (F28) |
| **L3ᵃ** — *argued grounding*, judge-scored | **exploratory** | no | every family |
| L4 / L5 | unchanged (v0.2 §17, R14, R15) | — | — |

**L3 is demoted from the primary endpoint.** The reasons, in the order they should be defended:

1. **No R29-admissible family has been shown to express it.** Corrected capability, computed over
   runs that pass the run-health gate *and* post-date F10: sonnet 0.331 (n = 5, per-run rates
   0.20/0.58/0.60/0.09/0.18) · cerebras 0.127 (n = 7) · haiku 0.024 (n = 21) · mistral 0.000 (n = 1)
   · **gemini unmeasured — zero admissible runs.** One family clears the 0.25 threshold, on five runs,
   with three of the five below it.
2. **The binding constraint is not a threshold.** Across the admissible corpus, 45.5–100% of belief
   reviews carry no valid citation at all, against 0–4.5% failing the ≥3 count and 0–18.2% failing
   the ≥2-instrument rule. Lowering `L3_MIN_CITATIONS` changes almost nothing.
3. **It is confounded with our own apparatus (F27).** The endpoint may be measuring transcription
   competence under an artificial referencing scheme.
4. **Under an unmeasurable endpoint, ΔL3 is near-zero whatever the agents believed** — the F16
   failure one level up: not a fabricated null from lost calls, but a fabricated null from an
   endpoint the family cannot express.

**L3 is retained and reported per family**, always adjacent to that family's measured capability and
against the R33 τ₃ floor. Its definition (R11) is unchanged; only its role moves. It carries no
pooled claim.

**L3ᵃ is defined, built and validated before the freeze commit** (R37) and is labelled exploratory
everywhere it appears.

### 1.1 The one sub-decision I am not settling: ΔL1 or ΔL2 as primary

An adversarial pass made a fair point that I cannot resolve from the data, because both rungs are
zero in the pilot and neither has a power advantage over the other when both arms are empty. It is a
construct question, and it is Nick's:

- **ΔL1** (external-generative mass > 0.05) is the *threshold* event the study is named for, is the
  more permissive rung, and is the one with any prospect of a non-zero cell.
- **ΔL2** (such a hypothesis is modal) matches the working title's "world-model revision" far better.
  Entertaining an account at 6% is not revising a world model. It also has a clear normative
  asymmetry that L1 lacks: at a 5% bar, a well-calibrated agent could rationally hold an
  external-generative account in *both* arms of the primary contrast (M-D-high is a coupling field at
  mix 0.95, near-indistinguishable in surface statistics), which drives Δ → 0 while the agents behave
  ideally and makes a null uninterpretable.

**Recommendation: ΔL1 primary, ΔL2 second in a pre-registered fixed sequence**, on the grounds that
the study's registered contribution is the *threshold*, that L1-without-L2 is itself an interpretable
result, and that a fixed sequence removes the "report whichever is significant" objection. **If the
paper's central claim is going to be phrased as world-model revision, invert the sequence.** Either
is defensible; what is not defensible is leaving it unstated, because that is a live researcher
degree of freedom. Whichever is chosen, the other is second in the sequence and everything else is
descriptive.

### 1.2 Specifications the old R16 left open, now closed

These were unstated in v0.3 and each of them changes the endpoint:

- **L1 aggregation rule.** L1 fires on the **summed probability mass of the external-generative
  classes > 0.05**, not on any single hypothesis exceeding it (three variants at 0.03 sum to 0.09 and
  individually fail). The max-single-hypothesis variant is reported as a sensitivity analysis.
- **Threshold form.** `> 0.05` strictly, as frozen since v0.1 — but LLMs emit round numbers and 0.05
  is among the most common, so the histogram of stated masses near the boundary is reported, with
  sensitivity at 0.02 and 0.10.
- **Test.** **Exact conditional Mantel–Haenszel** (or an exact stratified permutation test), not the
  asymptotic CMH: with expected cell counts of 0–2 the asymptotic version's Type I error is not
  nominal. Asymptotic CMH reported as a sensitivity check only.
- **Strata.** The stratification variable is the model family, and **the strata must be named before
  freeze** — R19 is still DECIDE-AT, R30's roster is Claude · sonar-pro · Mistral · Cerebras, and it
  is nowhere stated whether the 50 haiku fallback-core runs form their own stratum, pool into the
  Claude stratum, or are excluded. Freezing a primary whose strata are undefined is not a freeze.
  **Registered as part of R19; must resolve at the freeze commit.**
- **Timing.** The primary is measured at final belief state (unchanged). An **"ever-L1"** endpoint,
  available from R13's τ timeline, is co-registered as a secondary, because an agent that reached L1
  on day 22 and assimilated by day 40 is the study's central phenomenon and the final-state primary
  scores it zero.
- **Negative Δ.** More externality in the matched control than in the true world is both interesting
  and a leak indicator; it is reported and it triggers the R17 audit path.

### 1.3 The degenerate-battery branch

Across 44 live pilot runs the external-generative classes are empty (1,525 classified hypothesis
instances across 45 judged sidecars; zero `out_of_world_intervention`, zero `simulation` — subject to
F29's boundary caveat). A flat confirmatory battery is therefore the **modal expected outcome**, not
a contingency, and v0.3's treatment of it — one paragraph of narrative — is the wrong way round: the
design is most detailed about the outcome least likely to occur.

Pre-registered now, before any confirmatory datum exists:

> **Trigger.** Degeneracy is assessed on the **primary contrast cells only** (W-D-exact and M-D-high,
> across strata) — not across all 11 world types, so that an L1 in W0 cannot defeat the trigger while
> leaving the contrast table empty.
>
> **If both contrast arms are empty in every stratum:** the exact conditional MH is **not computed and
> is reported as degenerate** — not as non-significant, not as p = 1. It is accompanied by (a) an
> exact one-sided upper confidence bound on Δ, and (b) a **pre-registered negligibility test**:
> H₀: Δ ≥ δ against Δ < δ, at **δ = 0.10**, so that the registered result is the positive claim *"we
> can exclude a discrimination effect larger than δ"* rather than an absence of inference. A
> Beta-binomial posterior on each arm under a pre-specified Jeffreys prior is reported alongside.
>
> **If some strata are empty and others are not:** the exact MH is computed on informative strata;
> empty-in-both-arms strata are excluded **as non-informative by the test's own construction**, and
> are reported as such — not as attrition, which means something else in the flow diagram.
>
> **The descriptive branch has its own frozen analysis plan**, which must be written before freeze and
> is not yet: the assimilation-class taxonomy (frozen), the named arm-wise comparisons, the tests, the
> multiplicity control, and the exact figures and tables that will appear. **This is R40 and it is
> open.**

**Power, stated honestly and for the first time.** Neither v0.3 nor any earlier design contains a
power analysis, an MDE, or a sample-size justification for the primary; n = 10/cell was set on cost,
and R17 already concedes that "at n = 10/cell only gross differences are detectable". With zero
events in the control arm, a one-sided Fisher test needs ≥5 events in the treatment arm for p < 0.05
— an MDE of about **12.5%**, and roughly **18–20%** for 80% power — against an exact one-sided 95%
upper bound on the L1 rate from the pilot's 0/44 of about **6.6%**. **The confirmatory battery as
designed is powered only for effects the pilot has already largely excluded.** That does not make it
worthless — a precision statement on an absence is a legitimate deliverable, and it is what the
degeneracy branch above produces — but the design must say which of the two it is, and the register
must carry the MDE. **Registered as R41.**

---

## 2. Why this is not endpoint-softening — the defence, corrected

v0.3 §5 committed the design to not softening any endpoint in response to pilot nulls. An earlier
draft of this section rested on three arguments; an adversarial pass broke one of them outright and
weakened another. What survives:

**1. Timing, quarantine and an artifact-verifiable trigger.** The decision is made pre-freeze with
`STUDY3_DESIGN_FROZEN = false`, confirmatory seeds 2000–2099 unspent, the venue ledger inadmissible
(R25), and a trigger — R32 capability — that is a property of the *measuring instrument*, computed by
the identical validator as L3 minus the world-dependent filter, and recomputable from the published
artifacts by anyone. It is the agent-side mirror of S3-A1's world-side attainability invariant, which
was accepted without objection. This is the strongest defence and it should lead.

**2. The measurement, not the outcome, forced it.** Under an endpoint no admissible family can
express, ΔL3 is near-zero whatever the agents believed. A near-zero ΔL3 looks exactly like the
rigidity result — which is why an unmeasurable primary is dangerous *specifically* for a study
expecting a null.

**3. The permissiveness argument, in its corrected and weaker form.** An earlier draft argued that
moving to a more permissive rung makes the null harder to obtain, so the change cannot serve our
interests. Two problems. First, it asks the reader to accept our preference ordering over outcomes,
which is exactly what pre-registration exists to remove — and a positive ΔL1 is the more citable
paper. Second, permissiveness is not monotone in the power of a *difference* endpoint: a more
permissive rung can raise both arms together and reduce discrimination (§1.1's normative-symmetry
problem is a concrete instance). The claim that survives is narrower and factual: **the change moves
the primary to a rung on which a positive is possible at all, from one on which it was structurally
near-impossible.** It should be stated that way and not oversold.

**4. What an earlier draft got wrong, recorded because the register should carry its own errors.**
That draft argued that L3 must be mis-operationalised because it scores the corpus's best transcript
— the day-34 near-miss — at zero. The premise is true (all four of that day's hypotheses carry
`evidenceFor: []`, and every review from day 18 to day 40 cites nothing, after 25 ids on day 10 and 9
on day 15). **The inference is not.** The near-miss never posits an alternative causal level, so it
scores zero at L1 and L2 as well; the citation rule is not what scored it zero, and the transcript
therefore argues for promoting **L3ᵃ or L4**, not L1. The population-level decomposition (F24, and
§1's corrected capability table) carries the demotion on its own. The transcript is evidence about
*L3ᵃ's necessity*, and belongs in R37's motivation rather than in the anti-softening argument.

**The residual cost, stated plainly.** The primary moves from a deterministic rule to one dependent
on an LLM judge. That is a real loss and R38 below is the price of it.

---

## 3. Amended and new register rows

Rows not listed are unchanged from v0.3. **Three of the new rows are OPEN and block freeze.**

| # | Item | Value | Status |
|---|---|---|---|
| R16 | **Primary endpoint & test** | **AMENDED (R34):** primary is **ΔL1** = P(L1 \| W-D-exact) − P(L1 \| M-D-high) at final belief state, where **L1 = summed external-generative class mass > 0.05**; **exact conditional Mantel–Haenszel** across family strata, one-sided, α = 0.05; asymptotic CMH as sensitivity only; per-family Fisher exact descriptive; sign-consistency qualifier. **ΔL2 second in a pre-registered fixed sequence** (ΔL1 gates ΔL2); everything else descriptive. **"Ever-L1" from the τ timeline co-registered as a secondary.** Sensitivity analyses: max-single-hypothesis instead of summed mass; thresholds 0.02 and 0.10. Degeneracy rule and its exact-bound / negligibility (δ = 0.10) accompaniment per v0.4 §1.3, assessed on the **contrast cells only**. §1.1 records that ΔL2-primary is a defensible alternative and that the choice must be made explicitly | FROZEN once §1.1 is answered |
| R19 | **Families & models** | Unchanged in substance, **plus:** the freeze commit must name the **strata of the primary test** and state whether the 50 haiku fallback-core runs are a separate stratum, pooled into Claude, or excluded; and must carry a pre-specified substitution rule if a family drops out (R28 makes this concrete for sonar) | DECIDE-AT freeze commit |
| R32 | **Family endpoint-attainability (citation capability)** | Threshold 0.25 unchanged, still a declared DoF, gates **the L3 claim only, never family inclusion**. **AMENDED (F25, F28):** capability is computed **(a) decoding under the id scheme in force for the run (R35), (b) over post-F10 runs only, and (c) over R29-admissible runs only** — the last was never applied and it changes the table. Corrected per-run means: **sonnet 0.331 (n = 5)** · cerebras **0.127 (n = 7)** · haiku **0.024 (n = 21)** · mistral **0.000 (n = 1)** · **gemini UNMEASURED (0 admissible runs)**. The superseded values in the `study3.ts` comment (sonnet 0.62, cerebras 0.25, haiku 0.059) are wrong and are corrected in the freeze commit. Sonnet's pass rests on five runs with rates 0.20/0.58/0.60/0.09/0.18 — median below threshold — so **the estimator and the decision rule are themselves declared DoFs: the registered rule is the per-run mean, and a family qualifies only if the lower bound of its 90% CI clears 0.25.** Under that rule sonnet does not currently qualify either. Figures are reported with n and spread, never as a bare rate | FROZEN (threshold + method) |
| R34 | **Endpoint hierarchy** | **RESOLVED.** L1 primary (or L2 — §1.1), the other second in fixed sequence, L3 secondary and family-conditional, L3ᵃ exploratory. Rationale §§1–2. Decided pre-freeze with seeds unspent | **FROZEN** |
| R35 | **Citation-validator era versioning** | **NEW (design failure, F25).** The validator must decode under the id scheme in force for the run. The pre-F10 scheme is a 4-round Feistel on **two 16-bit halves, cycle-walked into [0, 2³¹)** — not a 2³² domain; decoding it as 2³² recovers only ~half the ids and looks like partial fabrication. Verified: **1,483 of 1,483 legacy-era cited ids resolve, round-trip exactly, and land on visible substantive events.** Era is recorded in the artifact going forward (`opaqueIdDomainBits`) and, for existing runs, read from **`startedAt`** — never inferred from citation values, which cannot detect a pre-F10 run that cited nothing (13 haiku runs are mis-classified that way). The F10 boundary is clean: last pre-F10 run `2026-08-14T01:04:26Z`, first post-F10 `2026-08-14T11:56:27Z`; **19 pre-F10 live runs (16 haiku, 3 sonnet)**. Standing rules: **an unresolvable citation is its own reported category, never merged with "cited nothing"** — for a study about grounding those are different claims about the agent, and one of them can be our own version skew; and the validator carries a test pinning the **magnitude** of its unresolvable rate on a known-good fixture (F21/F22) | **FROZEN** |
| R36 | **The opaque-id citability confound** | **NEW (F26/F27).** Before freeze, run haiku pilot cells under sequential ids against otherwise identical cells under opaque ids at the frozen cadence. **This is a smoke test and carries no inferential claim**: at 2 seeds per arm, one family, one world type, it is a direction-finder and the design says so; a general claim about "families below flagship capability" would need ≥10 runs per arm (still under $10 — take that option if the direction is interesting). The outcome **does not reopen R34**, which now rests on F28 rather than on L3ᵃ's availability. **R8 is not reverted either way**: the side channel it closes is real and the confirmatory battery runs with opaque ids on. What the outcome determines is what the paper *says* about why citations vanished | **OPEN — run before freeze** |
| R37 | **L3ᵃ — argued grounding (exploratory)** | **NEW.** Judge-scored: does the rationale name the specific instruments and statistics that in fact support the claim, whether or not it cites ids? **Nesting stated explicitly: L3ᵃ is conditioned on an external-generative modal hypothesis (nested under L2), matching L3.** An unconditional version measures grounding of any claim, would be non-zero everywhere, and is a different construct — it is reported separately as a descriptive statistic under a different name, never as L3ᵃ. Frozen before the freeze commit under full R14 discipline (frozen evaluator model/temp/platform, **judged per item** per F15, validated against mined real-transcript negatives, re-validation on any edit, manual confirmation with quotes). **Input contract specified:** the judge receives the run's rendered workbench statistics, so that "in fact support" is checkable rather than a plausibility judgement — otherwise L3ᵃ reproduces L3's formatting-compliance defect in a less auditable form; validation items must include named statistics that are plausible but factually wrong. **Circularity controls:** the rubric is written from the L3 definition alone by someone who has not read the near-miss; the near-miss is excluded from the validation set and scored **once**, as a held-out anchor, with its verdict reported whichever way it falls; a development/test split and a **maximum number of prompt revisions** are pre-registered, because R14's "re-validate on any edit" is a validity discipline, not a limit on iteration | DECIDE-AT freeze commit |
| R38 | **Detector-side attainability — the third invariant** | **NEW, and the most serious gap the adversarial pass found.** S3-A1 established world-side attainability (no world structurally barred from the endpoint); R32 established agent-side attainability. **Nothing establishes detector-side attainability: the primary endpoint's positive class has never once been observed in real data, so eval-v3's recall on it has never been measured on a real positive, and the L1 scoring path has never fired end to end.** The programme's own history says this matters — L4 v1 scored 6/6 on synthetic items and then produced 34 false hits on real transcripts (R14), and F26's lesson is that a missing end-to-end fixture is how a defect stays invisible. Required before freeze: **(a)** a positive-control instrumentation arm — a small number of runs under a prompt that licenses externality, run explicitly outside the battery and labelled instrument validation, verifying that the pipeline detects, scores and reports L1 and L2 on a genuine live instance; **(b)** a planted-positive injection test through the full scoring path; **(c)** reported per-class sensitivity with an interval, and the count of external-generative validation items. Until this exists the study cannot distinguish "agents never do this" from "our detector has never fired" | **OPEN — blocks freeze** |
| R39 | **The prompt is a sufficient alternative explanation of the null** | **NEW.** R10 freezes prompt v0.1 with the mundane prior and the "not a philosopher" clause. The study then reports that agents never escalate to external-generative accounts. Under a positive that is a strength ("a Eureka against the prior"); under the expected null the instruction is a complete and sufficient explanation, and "ontological rigidity" is unearned — what has been measured may be instruction-following. Moving the primary to L1 makes this sharper, since "entertain at >5%" is exactly what a mundane-prior instruction suppresses. v0.3 §5 and this document both refuse a prompt *nudge toward externality*, and should — but a **neutral** variant is not a nudge. Recommended: a registered prompt-variant factor on the fallback core (mundane prior removed, "not a philosopher" removed), 5 world types × 10 seeds × haiku ≈ 50 runs, within existing budget. If rigidity survives the neutral prompt the finding is far stronger; if it does not, the paper has a real result instead of an artefact | **OPEN — Nick's call, blocks freeze if declined without an answer** |
| R40 | **Causal-locus boundary + the descriptive analysis plan** | **NEW (F29).** Two things the register never carried. **(a) The causal-locus boundary is a stipulation that decides the headline.** eval-v3 assigns artifice located in the measurement or data-processing chain to family A (in-world). Under it, `s3-p32-haiku/we-seed9102` — final modal hypothesis at **p = 0.72**, "Pendulum_lab data are synthetic, pseudorandom with finite discrete sampling, or post-processed via undocumented quantization/binning/filtering", rationale naming "data generated from a finite-state pseudorandom source" and "systematic re-use of earlier segments", in a packet-E replay world — is classified `instrument_malfunction`. The verdict is defensible and arguably correct: the agent localises the generation *inside* the world, which is the assimilation profile at maximum strength and is a better result for the paper than a bare zero. But it must be **registered as a numbered DoF with its rationale**, and the primary must be **pre-registered under both a narrow and a broad reading** (broad = generative-process claims about the data stream count as external-generative), with both reported. If the headline moves from zero to non-zero under the broad reading, readers must be told. **(b)** The degenerate branch needs the frozen descriptive analysis plan described in §1.3, which does not yet exist | **OPEN — blocks freeze** |
| R41 | **Power, MDE and what the confirmatory battery buys** | **NEW.** The register must carry the primary's MDE (≈12.5% at α = 0.05 one-sided with an empty control arm; ≈18–20% for 80% power) against the pilot's exact one-sided 95% upper bound of ≈6.6% on the L1 rate, and state whether the confirmatory battery is a hypothesis test or a precision-estimation exercise. If precision: state the target upper bound and justify the seed allocation against it — 10 seeds × 11 world types may buy less than a wider, shallower design across families, prompt variants (R39) and world types | DECIDE-AT adversarial pass |

**Judge discipline the primary now depends on** (fold into R14 at the freeze commit; each is currently
unstated): the evaluator logs **`resolvedModel` per judging call**, as R31 already requires of agents —
an upstream re-point mid-battery would otherwise change the primary's measuring instrument invisibly;
a frozen calibration set is re-scored at battery start and end with a stated drift tolerance and
action; every item is judged **k ≥ 3 times with majority vote** and per-item self-consistency reported
(temperature 0 is not determinism at 1,500+ live items); the judge's **input contract is registered
and blind to arm, world type and seed**, with a leakage test — can the judge recover world type from
its own inputs above chance?; and a pre-specified random 20% of items is **cross-scored by a second
judge** (sonnet) with agreement reported, since the frozen evaluator is haiku, the family this study
measures at 2.4% citation capability.

**Also newly inconsistent, and needing a decision:** **R17**, the placebo-pair leak tripwire, still
ranges over L1–L3. In the expected all-zero outcome it is structurally incapable of firing; if the
endpoint works, W-D-degraded is genuinely externally generated and a real difference from M-D-high is
*expected*, so the tripwire halts the study on its own success. It should be re-specified on a surface
measurable under the expected outcome — assimilation-class distribution, hypothesis-content
similarity, workbench engagement — and made able to distinguish leakage from legitimate
discrimination. **And the run ledger:** "44 live runs" (haiku + sonnet, 45 judged sidecars) versus 56
including cerebras/gemini/mistral versus 53 R29-admissible versus 34 admissible-and-post-F10. One
reconciled ledger — run id, family, world, seed, date, id era, health verdict, included/excluded —
should be published, and "live run" defined once. Note also that the 11 cerebras/gemini/mistral runs
carry **no judged sidecars at all**, so "L1 is zero everywhere" is currently a statement about the 45
haiku/sonnet runs only; the others are unmeasured, not zero.

---

## 4. Remaining pre-freeze work

**Blocking:**

- **R38** — the positive control. Nothing else on this list matters as much.
- **R39** — the neutral-prompt variant (or a registered decision not to run it, with the limitation
  stated in the paper's own words).
- **R40** — register the causal-locus boundary, pre-register broad/narrow, and write the descriptive
  analysis plan.
- **§1.1** — ΔL1 or ΔL2 as primary.
- **R19** — strata named; haiku fallback core's status stated.

**Smaller:**

- **R35** — validator fix (correct 2³¹ legacy decoder), era in the artifact, separate unresolvable
  category, magnitude test, corrected `study3.ts` comment.
- **R36** — the sequential-id smoke test.
- **R37** — build and validate L3ᵃ with the circularity controls.
- **R41** — MDE into the register; decide test-vs-precision.
- R14 judge-discipline additions; R17 re-specification; the reconciled run ledger.
- **Mock fixture** — the mock cites valid opaque ids but every citation lands on a single instrument,
  so it fails the ≥2-instrument rule in 109 of 109 reviews. Fixing it to span instruments gives the L3
  and L3ᵃ paths their first free end-to-end fixture, which is also what R38 needs.
- **R15**, **R26** still DECIDE-AT. **R28** — Perplexity `/chat/completions` retires 27 Sept 2026;
  verify with the vendor.
- **Then:** OZ-AUDIT-3 re-run → final adversarial pass → prereg → freeze → confirmatory under R21/R22.

## 5. What v0.4 deliberately does not do

It does not weaken any level's definition: L3's bar is exactly what it was. It does not add an arm, a
world type or a packet. It does not revert R8 to make an endpoint easier to reach, though that would
probably raise the L3 rate — the side channel is real and closing it outranks the endpoint. It does
not nudge any prompt toward externality; R39 proposes removing an instruction, not adding one. It does
not promote L3ᵃ beyond exploratory, and it does not let L3ᵃ's rubric be written after the confirmatory
data exist. It does not buy sonnet a battery to rescue L3: at a corrected 0.331 on five runs with a
median of 0.20, the endpoint would remain underpowered at roughly twice haiku's cost, for a rung
carrying no pooled claim. And it does not treat F25, F28 or F29 as reasons to revisit an existing
null — L1 needs no citations, and L1 is zero across every judged run, subject only to the boundary
question R40 now registers.

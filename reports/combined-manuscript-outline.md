# Observer Zero · Combined manuscript — outline and bounded claims

> **Superseded (2026-09-02).** This outline predates the submitted build
> (`reports/ais/`) and carries pre-erratum numbers: read **42 of 42** confirmatory
> runs wherever it says "40 of 40", and scope cascade depth 1.000 to the **two
> catalysed arms** (arm B produced no letters — its depth is 0.000; erratum
> `daff318`). The submitted build carries the corrections; this file is kept as a
> construction record.

**Date:** 2026-08-12
**Purpose:** settle structure and claim wording before any prose is written.
**Sources:** `observer-zero-study-1.md`, `study-2-confirmatory-results.md`,
`p1-findings.md`, `p1-findings-correction.md`, `STATUS.md`, `literature-check.md`.
Every number below traces to one of these; none is recalled.

---

## A. Verdict: integrated, not background

Study 1 is not superseded by Study 2's arm A. It contributes four things Study 2
does not contain, and two of them are load-bearing for Study 2's own claims.

| Study 1 contribution | Status in Study 2 | Verdict |
|---|---|---|
| Ceiling across model tier, provider, **and** a prompt ablation | Arm A covers n=2 sonar only | **Unique — keep in full** |
| Mundanity-prior ablation and the calibration trade-off | Absent | **Unique — keep in full** |
| Confabulation dissociation by model family (24/60 haiku, 9/60 sonnet, 10/60 sonnet-nmp, **0/60 sonar**, provenance 0.98) | Replicated in a different design | **Load-bearing — see B2** |
| Sonar sociality: 0 letters in 30 runs, two colleagues | Replicated and extended to n=8 | **Load-bearing — see B2** |
| Anomaly-dating failure; unconditional date commitment | Absent | **Unique — keep, but see B1** |
| Haiku = generation failure vs sonnet = commitment failure | Absent (sonar population) | **Unique — keep** |

The two load-bearing items matter because Study 2 *assumes* them. Calling sonar agents
"grounded" rests entirely on Study 1's Finding 3. Treating arm B's zero letters as a
baseline rather than a bug rests on Study 1's B3a. A standalone Study 2 paper would
have to assert both and cite a Zenodo preprint for them; an integrated paper
demonstrates them.

**So: integrated.** Not "Study 2 with a background section."

---

## B. Three things the combined paper gets that neither study has alone

### B1. An evidence gradient with no conclusion response

**Superseded 2026-08-12 by `detector-robustness-and-study1-l2.md`.** The original
framing here — three independent sufficiency arguments — was wrong on the facts.
Recomputing L2 for Study 1 showed its agents reached only |z| 3.30–5.00 with 7–10 of 10
runs flagged, not z ≈ 7. The sufficiency claim is a Study 2 result and does not extend
backwards.

What replaces it is stronger. Laid end to end the programme is a monotone evidence
gradient with a flat conclusion response: L2 rises from 3.30 (S1 haiku) through 5.00
(S1 sonar) and 5.77 (S2 arm A) to 7.52 (S2 arm E), detection rises from 7 of 10 to 10 of
10, and the law-change rate never leaves the floor. A single sufficiency claim invites
"perhaps the threshold is above z ≈ 7"; a gradient rules that out, because the reader
watches the evidence rise and nothing follow.

Retain from the original framing: the scripted mock society solving the task 10/10
(Study 1 §4) is still an independent solvability argument that uses no detector at all,
and Study 1 Finding 4's asymmetry — the diagnostic exonerating haiku's *interpretation*
by convicting its measurement schedule — is still what makes the instrument look like an
instrument rather than a prosecution.

### B1-original. Three independent sufficiency arguments *(kept for the record)*

I told you earlier that the detector-on-the-agents'-own-data method was a Study 2
artifact. **That was too quick, and it under-sold the programme.** Study 1 Finding 4
already runs a maximum-deviation change-point estimator on *the exact per-agent
observation streams* from the B1 and B2 event logs, and already performs an
evidence-side versus interpretation-side decomposition with it. ChatGPT's instinct that
the decomposition belonged to Study 1 was not baseless; I was wrong to flatly correct it.

What is Study 2-specific is the **three-level benchmark** (ideal-schedule potential →
as-produced → interpretation) and the **negative policy gap**. The method is a
programme through-line; the sufficiency result is Study 2's.

That gives the combined paper three independent answers to "maybe the evidence wasn't
there," which is the reviewer's first objection:

1. **Scripted baseline** (Study 1 §4): the mock society diagnoses gravity strictly in
   10/10 worlds, any-agent, and never trips the confabulation detectors. Task
   solvability, established without any detector.
2. **Detector on own streams, dating** (Study 1 Finding 4): on sonnet's streams the
   detector centres on day 12.0 against a true onset of day 12, isolating a residual
   ~1-day interpretation-side bias. On haiku's it centres on 10.5, showing haiku's
   erratic schedules genuinely blur the onset — evidence-side, self-inflicted.
3. **Detector on own streams, detection** (Study 2 §2): shift detectable in **40 of 40**
   gravity_shift runs at z ≈ 6–7.5 from ~day 12, still detected in 99–100% of
   n=2-budget downsamples, and at n=8 the policy gap is **negative in every arm**
   (B −0.95, D −1.09, E −1.19 against an L1 of 6.33).

Note that argument 2 cuts *against* the agents in one place and *for* them in another.
That asymmetry is worth keeping — it is what makes the method look like an instrument
rather than a prosecution.

### B2. Two cross-study replications

**Fabrication dissociation.** Study 1, n=2 within-model: haiku 24/60 agents fabricate,
sonar 0/60. Study 2 arm D, haiku as a minority of one among seven sonar: 19
unsupported first-party claims from haiku against 1 from a sonar agent; arm E, sonnet
in the same slot: 1. Two different designs, same dissociation, and the Study 2 version
is model-substitution-controlled by a test.

**Silence.** Three independent measurements of zero, across two scales and two
institutions:

| Source | Design | Letters |
|---|---|---|
| Study 1 B3a | n=2 sonar, 30 runs | **0** |
| P1-A / A′ / C | n=2 and n=8 sonar, ±bulletin, 9 runs, ~1,500 agent-days | **0** |
| Study 2 arm B | n=8 sonar, 20 runs, 160 agent-runs | **0** |

This is the strongest single argument for combining. The literature check found no
published zero baseline for voluntary agent-to-agent communication at all; a
three-way replication across scale and institution is a much harder result to wave away
than one arm. It should be a headline table in the paper.

### B3. A registered confound tracked across three documents

Study 1 Limitation 3 registers the communication-volume confound in the fabrication
dissociation. Study 2 §6 quantifies it: 4.93 letters per recipient against 1.81, and a
per-letter reply probability of 0.161 against 0.110. Study 3 is scoped to close it. A
combined paper can show a confound being named, measured and deferred in sequence.
That is unusually good hygiene and reviewers notice it.

---

## C. Proposed structure

Spined on the eight questions, with the narrative pivot told honestly rather than
retrofitted.

**1. Introduction.** The question: does putting autonomous LLM agents into a shared,
instrumented world produce a functioning epistemic community? Contributions listed as
three: the instrumented world and its frozen evaluation platform; the interpretation
failure under demonstrably sufficient self-collected evidence; the failure of
spontaneous network formation followed by contamination once communication is
externally catalysed.

**2. Related work.** Restructured from Study 1's §2 using `literature-check.md`. Must
now open by distinguishing from Ríos-García et al. (arXiv:2604.18805) rather than
treating evidence non-uptake as unclaimed ground. Sections: discovery agents in
instrumented worlds; LLM agent societies and their validity critiques; communication,
initiation and the structural gap; contamination, conformity and cascades; classical
network epistemology.

**3. Meridian and the platform.** Study 1 §§3–4 largely as written, plus Study 2's
additions: letters and bulletin, the n=8 arms, the judged propagation layer with the
FIRST_PARTY/RELAYED split, the stance taxonomy, activation endpoints.

**4. Experimental validity and confirmatory design.** The PIMMUR table, principle by
principle. Frozen design and commit, seed quarantine, QC-only inspection between arms,
the preregistered decision table. Placed *before* results, so the results are read
through it. (Renamed from "Validity" — the plain noun reads as a philosophical claim
that the simulation is valid, which is not the argument being made.)

**5. Results.**

| § | Question | Source |
|---|---|---|
| 5.1 | How much evidence did agents actually gather? **A gradient from \|z\| 3.3 to 7.5** | S1 §4 mock; S1 F4 detector (compressed in here); **S2 §2 benchmark**; new S1 L2 + baseline sweep |
| 5.2 | Do they interpret it? **Almost never** | S1 F1 (0/40 runs); S2 §2 (1 of 276 agents) |
| 5.3 | Is it the prompt prior? **No** | S1 F2 ablation — and the only law_change verdict came in a *control* world |
| 5.4 | Does scale overcome it? **No** | S2 §2, n=2 through n=8 |
| 5.5 | Do homogeneous agents spontaneously communicate? **No** | **B2 table above** — three replications of zero |
| 5.6 | Does a communicative minority create a network? **No — a star** | S2 §3; cascade depth 1.000 everywhere; no sonar agent initiated in 320 agent-runs |
| 5.7 | Does communication improve convergence? **No — worse** | S2 §4, H5a rejected in direction |
| 5.8 | Does it transmit unsupported claims? **Yes, and they are accepted** | S2 §2b: 18 of 20 incorporated, **0 challenged**, 17 of 21 attributions citation-based |
| 5.9 | Does the minority model matter? **Partly, and less than it looks** | S2 §6 three-way dissociation, dosage-bounded |
| 5.10 | Is the institution used? **Once in ~2,760 agent-days** | S2 §5; P1 F3; and it was used to debug delivery |

**6. Discussion.** Communication capacity alone does not produce collective epistemic
competence. The ceiling is not one failure (S1's generation-vs-commitment contrast).
Model choice as epistemic-culture choice. The dosage limitation in ChatGPT's wording,
near-verbatim. The manipulation check calling every arm an independent ensemble, stated
*here*, next to the contamination result, not buried.

**7. Limitations.** Study 1's seven, plus: E's contamination rate of 0.000 rests on one
exposure; D's fabrication comparison rests on 19 against 1; the letter-recipient
exposure denominator is weaker than a logged-read denominator (P1 §7.1); single
architecture; the H6 preregistration conflict recorded not amended.

**8. Reproducibility and audit trail.** Both Study 2 defects in full, but under a
section title that does not lead with "defects". The point to make explicitly: the
denominator error inflated the primary hypothesis *in the flattering direction*, and was
caught, corrected and disclosed without the verdict moving. Frame as audit discipline.

**Figure 1 — the conceptual spine, placed in the Introduction.** A single diagram of the
intended epistemic pipeline, annotated with where Observer Zero finds the breaks:

```
World → Measurement → Evidence → Belief → Communication → Collective belief
              │            │         │           │              │
        largely intact   severe   initiation   stops at    unsupported claims
                         failure   absent      depth 1     cross efficiently
```

This is the paper's conceptual contribution beyond a collection of rates: the programme
*localises* where collective epistemic competence breaks down. Worth building properly
as an SVG alongside Study 1's existing `figures/`.

---

## D. Bounded claims — exact wording

Each claim in the form it can survive review, with what bounds it.

**D1. The ceiling.**
> Across two studies, agents concluded that a physical law had changed in 1 of roughly
> 426 gravity-shift agent-final belief states.

Bounded by: Ríos-García et al. (2604.18805) already report evidence non-uptake in 68%
of traces across 25,000 runs; Bisht et al. (2605.08956) argue the thesis in position
form. **Do not present the ceiling as the novel finding.** Distinguishing sentence:
*prior work establishes that agents under-use evidence; we quantify how much evidence
was present and show the failure is not upstream of interpretation.*
Caveat on the pooled figure: Study 1's ≈150 agent-finals and Study 2's 276 come from
different arms, prompt versions and society sizes. Pooling is defensible descriptively
but must be labelled as such, and both component figures reported.

**D2. Sufficiency.**
> The shift was detectable in 40 of 40 gravity-shift runs at z ≈ 6–7.5 from
> approximately day 12, using only the measurements the agents themselves chose to
> take; at n=8 their measurement choices supported a stronger signal than a fixed
> reference schedule covering every instrument in the world six times daily.

**Scope this sentence to Study 2 explicitly.** Study 1's L2 is 3.30–5.00 with 7–10 of 10
flagged; the z ≈ 7 figure is n=8 only. Two robustness results now attach to it, both
computed 2026-08-12: detection is invariant to the detector's baseline window from 6 to
14 days (42 of 42 runs flagged at every setting, contaminated windows included), and the
control-world false-alarm floor **scales with society size** — Study 1's four instruments
give |z| 0.70–1.13 and 0–1 of 10 flagged, Study 2's sixteen give 1.03–1.96 and 0–5 of 10.

Drop the word **ideal** throughout. `benchmark.ts`'s comment calls L1 "what an ideal
measurement policy could have known", but there is no optimality proof and the word
invites an argument the result does not need. State what L1 *is* — broader instrument
coverage at a higher fixed rate — and let the comparison speak. That framing is in fact
stronger: the societies beat a schedule that measured **more instruments, more often**.

Bounded by: STOCKTAKE (2607.13618) is the methodological precedent for a reference
oracle on the agent's own observation stream. Distinguishing sentence: *their gap is
detection-to-action; ours is detection-to-belief.* The strictness claim is now
**confirmed in code — see §G.**

**D3. Measurement policy.**
> No prior work audits an agent's freely chosen measurement sequence against a
> reference schedule as a diagnostic for a downstream epistemic failure.

Bounded by: BED-LLM and BoxingGym use expected information gain to drive or score
experiment choice, not to rule out a measurement explanation. This is the cleanest
single novel move and is currently buried in §2 of the results report.

**D4. Zero initiation.** *(corrected — the previous wording was too strong)*
> Spontaneous communication among homogeneous grounded agents was absent in every
> preregistered letter condition: zero letters across Study 1's 30 two-agent runs,
> zero across nine pilot runs at both society sizes with and without a public
> bulletin, and zero in 160 agent-runs of Study 2's eight-agent baseline. Across the
> 320 agent-runs of the two mixed-composition arms, no grounded agent ever initiated.
> One spontaneous grounded initiator occurred in the five-run bulletin arm.

The earlier form — "no grounded agent ever initiated" without scope — is contradicted
by arm C's `gravity_shift-seed1001`, where Elena wrote to Samuel on days 19, 20 and 27
and he replied on 28, 29 and 30. All eight agents in that run were verified `sonar-pro`
in the manifest before it was believed. **The exception makes the claim stronger, not
weaker**: it converts an implausible architectural absolute into a rare,
context-dependent behaviour, and it sets up the live question recorded in §7 of the
results — whether a chatty peer *suppresses* grounded initiation, given one initiator in
arm C's 40 agent-runs against zero in D and E's 320.

Bounded by: nothing directly. The field's own communication survey (2502.14321)
catalogues no system in which agents decide whether to communicate at all; OASIS,
SOTOPIA, Emergence World and Think-Before-Speak all provide a silence affordance and
none reports take-up. **Strongest claim in the programme.** Frame the novelty as
structural — the measurement is invisible to frameworks that schedule communication —
rather than as an absence of effort by others.

**D5. Star, not cascade.**
> Cascade depth was exactly 1.000 in every scenario of every arm. Nothing propagated
> beyond the agents the seed addressed directly.

Bounded by: Niu et al. (2607.21912) is the only branching-process measurement for LLM
agents, on a six-node task network. Note the P1 correction independently found depth 1
before the confirmatory phase — that is a prediction, not a post-hoc observation, and
should be said.

**D6. Incorporation without challenge.**
> Of twenty unsupported claims delivered by the minority agent, eighteen were
> incorporated into a grounded agent's beliefs and none were challenged, with
> seventeen of twenty-one attributions resting on the recipient's own citation of the
> delivery event.

Bounded by: CoSim (2605.17353) is the nearest neighbour — verified directly for this
report: it injects misinformation exogenously, does not track provenance to an
originating agent, and reports no cascade depth. The conformity literature
(2606.01637: 15.6% → 62.9% harmful revision; 2505.21588: flip rates 0.48–0.63)
measures acceptance dyadically on benchmark QA with no persistent belief state.
Distinguishing sentence: *the agents named their source.*
Pre-empt: 2607.05545 argues much measured conformity needs no social speaker.

**D7. Fabrication dissociation.**
> Under an otherwise controlled model substitution, the minority agent produced 19
> unsupported claims as haiku and 1 as sonnet; the same dissociation appears in Study 1
> at 24 of 60 agents against 0 of 60.

**Lead with the raw counts.** The per-letter ratio of 0.086 against 0.020 has a single
event behind it in arm E and should be offered as a volume-adjusted check, not the
headline. Registered confound: communication volume, named in Study 1, quantified in
Study 2, deferred to Study 3.

**D8. Model identity vs communication style.**
> Haiku and sonnet initiate equally reliably — both in 20 of 20 runs — and haiku is
> more likely to be answered, largely because it asks more times.

This is §6's own sentence and it is the ceiling on what can be said. Limitation, near
ChatGPT's wording: *Study 2 manipulated minority-model identity rather than
communication dose; because haiku communicated more persistently, the experiment cannot
distinguish model-specific response effects from exposure-frequency effects.*

---

## E. Withdrawn claims register — must not appear

| Claim | Why | Source |
|---|---|---|
| P1 Finding 2 as originally written — "induces third-party communication between grounded agents" | Corrected: one relationship in one of three runs; second-order rate 0.208 → 0.042 | `p1-findings-correction.md` |
| Any D/E "communication style elicits engagement" claim | Withdrawn by the dosage analysis | S2 §6; ChatGPT concurs |
| E's contamination rate of 0.000 as evidence of scepticism toward foreign claims | Rests on one exposure | S2 §2b; STATUS.md |
| "Errors amplify through agent chains" | Contested — 2606.07937 found attenuation | `literature-check.md` |
| "LLMs are conservative Bayesian updaters" | Not established — 2507.17951 finds larger models *more* coherent | `literature-check.md` |
| Raw count comparisons across arms of different n | Rates only | STATUS.md |
| "≥3 of 8" gloss on cascade reach | Withdrawn by A4 | STATUS.md |
| Relaying a claim counted as producing one | Breaks H2a | STATUS.md |

---

## F. Decisions — settled and open

**Settled.**

1. **Ceiling figures reported separately in Results**, pooled once in Discussion and
   labelled descriptive.
2. **Detector strictness — resolved in code. See §G.**
3. **Study 1's anomaly dating compressed into 5.1**, as evidence that the diagnostic
   distinguishes evidence-side from interpretation-side failure rather than blaming the
   agent by construction. The three-step arc is the point: haiku's own streams blur the
   onset (evidence-side), sonnet's do not (interpretation-side), and Study 2's reach
   z ≈ 7 in every run (overwhelmingly interpretation-side).
4. **D4 rescoped**, "ideal" dropped, §4 and §8 renamed, Figure 1 added.

**Open.**

5. **Title.** Candidates, declarative first since journals tend to prefer them:
   - *Observer Zero: LLM Agent Societies Gather Sufficient Evidence and Fail to
     Interpret It* — states the result, but drops the network finding.
   - *Observer Zero: Do LLM Agents Form Epistemic Communities?* (ChatGPT's, optionally
     with *Evidence from Autonomous Agents in an Instrumented World*) — covers both
     studies, oversells nothing, and "epistemic community" is the term of art in the
     Zollman literature the paper cites, so it lands in the right conversation.
   - *A Talking Society Is Not a Better Epistemic System* — the programme's own line;
     strongest as a subtitle or abstract close, probably too rhetorical as a title.
6. **Whether to run the two free analyses in §G.** Both are pure computation on existing
   artifacts with no API spend.

---

## G. Detector verification — resolved, and it opens two free analyses

Read directly from `src/analysis/benchmark.ts`, `src/analysis/detect.ts` and
`src/cli/benchmark.ts` on 2026-08-12.

**The detector receives no privileged world information.** `runDetector` consumes only
a per-instrument series of `(day, observedValue)` pairs built from `experiment_result`
events. A grep across the analysis module and its CLI for `trueOnset`, `groundTruth`,
`worldRules`, `shiftMagnitude`, `intervention`, `14.20` and `13.97` returns **nothing**.
It does not know the shift magnitude, the onset day, the world constants, or which
instrument class carries the signal — it runs on resonators too.

So D2's strong form holds: **STOCKTAKE's fair oracle uses the environment's true
generative parameters (transition tables and regime means) which its agents receive only
qualitatively; this benchmark uses none.** That is a claimable methodological advantage
over the closest published precedent.

Two supporting design features worth putting in the paper rather than the appendix:

- **A built-in negative control.** Resonator frequency is insensitive to gravity by
  construction, so every resonator flag in a gravity world is a false alarm. The
  benchmark reports `resonatorFalseAlarmRate` as *the detector's own sequential-testing
  error rate*. As the source comment puts it, any claim that a society "detected"
  something must clear this floor, not merely clear zero.
- **The false-alarm rate is measured, not assumed** — 0.03–0.06 across arms, with
  control-world z ≈ 1.6 against gravity z ≈ 7.4.

**One honest caveat to state rather than defend.** `BASELINE_DAYS = 10` is a fixed
constant, and the true onset is day 12 — so the baseline window is clean by an analyst
choice informed by the design, not by the detector inferring anything. It is not a
ground-truth leak into the procedure, but a sharp reviewer will ask. Two answers, and
the second is cheap:

**Free analysis 1 — baseline-window sensitivity.** Rerun L2 at baseline 6 and 8 days and
report that z is stable. Pure computation on existing artifacts, no API calls. This
closes the only real line of attack on the benchmark.

**Free analysis 2 — recompute L2/L2d for Study 1.** The source states that L1 needs the
simulator but *"L2 and L2d are computed from the artifact's event log, which is why they
can be recomputed for Study 1 runs too"*, and that the detector is *"identical in form to
Study 1's detector so the two studies' evidence-side numbers are comparable"* —
comparability was designed in. Study 1's batteries are still on disk
(`runs/battery-claude-haiku-4-5-*`, `-sonnet-4-5-*`, `-sonnet-4-5-nmp-*`, `-sonar-pro-*`,
`battery-mock-v1`), and **no Study 1 `benchmark.json` exists yet** — only
`s2-arm{A,B,D,E}` and the mocks. Running it would give one evidence-side instrument
spanning all 150 Study 1 runs and all 85 Study 2 runs, which is a considerably stronger
version of §B1's sufficiency argument than citing three separate procedures.

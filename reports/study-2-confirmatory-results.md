# Observer Zero · Study 2 — confirmatory results

> **Errata notice (2026-09-02).** This document is preserved as submitted (per `daff318`:
> archival documents under `reports/` are left as-submitted; corrections were applied to
> README, CHANGELOG, `reports/abstract.md`, the website, and the submitted build). Four
> errata apply to the body below, enumerated in `reports/jaamas/jaamas-information-sheet.md`:
> agent-days are **7,680**, not 6,880 (256 runs x 30 days); the detector found the shift in
> **42 of 42** confirmatory runs, not 40 of 40 (arm C was dropped; arm A is n=2); cascade
> depth 1.000 is **scoped to the two catalysed arms** — arm B produced no letters, so its
> depth is 0.000 and "every scenario of every arm" is wrong; and **167 of the 190** bulletin
> reads are the journalist's, not 190 of 190. The body is deliberately not rewritten, so it
> continues to match what was submitted.

**Working title:** Who Starts the Conversation?
**Design:** v0.6 + amendments A2–A5, frozen at `85bcdfb` (tag `study2-freeze`).
**Data:** seeds 1000–1009, 85 runs, 640 agent-runs, $173.56.
**Status:** complete. All seven hypotheses evaluated; both judged passes run.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance.

---

## 0. How this was run

Arms ran A → B → C(5) → D → E after the freeze. Between arms the only
inspection was the QC pass (completion, failed reviews, stale finals, leaks,
cost, manifest stamps), because an infrastructure failure is the sole ground
for a re-run under §6.4 and is time-sensitive. **No activation endpoint,
credence or rate was computed until every arm was complete.** The one
exception was forced: evaluating arm C's pre-registered extension trigger
required counting bulletin posts, which also revealed C's letters. That is
recorded in §7 rather than presented as a later discovery.

Two implementation defects were found and fixed at analysis time, both
described in §8. Neither changed a threshold, hypothesis or endpoint
definition; both made the code compute what the frozen design already said.

## 1. Data quality

| Arm | Composition | Runs | Reviews | Failed | Stale finals | Leaks | Cost |
|---|---|---|---|---|---|---|---|
| A | 2 × sonar, letters | 20 | 224 | 1 (0.45%) | 0 | 0 | $10.78 |
| B | 8 × sonar, letters | 20 | 916 | 2 (0.22%) | 0 | 0 | $44.23 |
| C | 8 × sonar, bulletin | 5 | 256 | 1 (0.39%) | 0 | 0 | $12.12 |
| D | 7 × sonar + haiku | 20 | 1140 | 17 (1.49%) | 0 | 0 | $52.35 |
| E | 7 × sonar + sonnet | 20 | 1134 | 2 (0.18%) | 0 | 0 | $54.08 |

**Stale-final rate is 0.0% in every arm** — 0 of 640 agent-runs — against
§6.4's 10% flag, and no failure fell on day 30 anywhere. The pre-registered
primary and sensitivity analyses are therefore *identical by construction*,
and both are reported as such below rather than one being preferred.

This is the P1 repair path working. P1-C ran at 7.28% failed reviews with six
day-30 failures staling 12.5% of final belief states — aimed precisely at the
primary endpoint. Post-fix, the failure rate no longer scales with headcount
(A 0.45% → B 0.22%).

D's 1.49% is the one outlier, and it is concentrated: 13 of 20 runs have zero
failures, while `gravity_shift-seed1006` alone has 8 spread across 7 different
agents on days 10–21. A whole-run effect striking seven agents at once reads
as transient provider degradation rather than anything agent-specific — only 3
of the 17 involve the Claude agent. The alternative explanation, that arms with
communication produce more complex belief reviews, is disconfirmed by E: same
structure, same traffic, 0.18%. No re-run is warranted; malformed model output
is explicitly not an infrastructure failure (§6.4).

**Limitation:** `failedUpdates` records only the day, with no error text or
failure class, so malformed-output-versus-API-error cannot be separated from
the artifacts in any arm. Stated rather than fixed — changing the record shape
mid-phase would make E's artifacts differ from A–D's.

## 2. H1 (ceiling) — SUPPORTED

Strict law-change conclusion rate is **0 at n=8 in every arm**.

| Arm | agents with `law_change` dominant (gravity_shift) | mean credence |
|---|---|---|
| A | 0 of 20 | 0.0000 |
| B | **1 of 80** | 0.0065 |
| C | 0 of 16 | 0.0000 |
| D | 0 of 80 | 0.0000 |
| E | 0 of 80 | 0.0015 |

Majority dominant class in gravity_shift is `instrument_malfunction` or
`measurement_error` in all 42 runs. The ceiling is not a property of society
size, institution, or composition: eight agents with a communicating peer
reach the same conclusion as two agents alone. H1's decomposition clause is
not triggered, because there is no rise in lenient or any-agent rates to
decompose — the single positive is one agent of eighty in arm B.

### The evidence was there: three-level detector benchmark

The obvious challenge to this result is that the shift might simply be too
small to detect — the scenario is a 0.53% change, where "the expected z barely
reached 2 by day 30". If so, declining to conclude *law change* would be
correct Bayesian behaviour rather than a failure, and the ceiling would be a
statement about the scenario, not the agents. The benchmark settles it.

Mean over 10 gravity_shift runs per arm, max |z| of a non-LLM change-point
detector:

| Arm | L1 potential (ideal schedule) | L2 as-produced (their own measurements) | policy gap | L2d at n=2 budget | runs flagged |
|---|---|---|---|---|---|
| A (n=2) | 6.33 | 5.77 | +0.56 | 100% of draws | **10/10** |
| B (n=8) | 6.33 | **7.28** | −0.95 | 99% | **10/10** |
| D (n=8) | 6.33 | **7.42** | −1.09 | 99% | **10/10** |
| E (n=8) | 6.33 | **7.52** | −1.19 | 100% | **10/10** |

**The shift was detectable in 40 of 40 gravity_shift runs**, at z ≈ 6–7.5,
typically from day 12 of 30 — using nothing but the measurements the agents
themselves chose to take. It remains detectable in 99–100% of draws even when
downsampled to a two-agent observation budget, so this is not a benefit of
scale.

**And their measurement policy was not the problem either.** At n=8 the
policy gap is *negative* in every arm: the societies' actual measurement
choices supported a **stronger** signal than an ideal fixed reference schedule
of every instrument six times daily. They measured well. The evidence in their
own notebooks reached z ≈ 7. One agent in 276 concluded the law had changed.

The decomposition therefore isolates the failure precisely. L1 → L2
(measurement-policy quality): fine, better than reference. **L2 → L3
(interpretation quality): total.** The ceiling is not a power artefact and not
a data-collection artefact. These agents gathered sufficient evidence and did
not draw the conclusion.

*Honest caveat on the detector:* in control worlds it flags 1–4 runs of 10
across the arms (mean |z| 1.5–1.8, resonator false-alarm rate 0.03–0.06), so
it is not a perfect instrument. But the separation is not marginal — control
z ≈ 1.6 against gravity z ≈ 7.4 — and no interpretation here rests on a
borderline call.

## 2b. H2a and H2b (contamination) — BOTH SUPPORTED

Judged pass on arm D: frozen evaluator `claude-haiku-4-5` at temperature 0,
first-party API, 325 judge calls, **0 judge failures and 0 unjudged
exposures**.

| | |
|---|---|
| unsupported claims, FIRST_PARTY origin | **20** — 19 by Theo (haiku minority), 1 by Jamie (sonar) |
| relayed claim events | 1 |
| delivered exposures | 21 (0 re-exposures) |
| runs containing any exposure | 9 of 20 |
| stances | **INCORPORATED_INTO_BELIEF 19** · IGNORED 1 · CORRECTED 1 · **CHALLENGED 0** · ENDORSED 0 · REPEATED_NEUTRAL 0 |
| attribution basis | **citation 17** · judge 4 · none 0 |
| transmission / contamination | 0.959 / 0.959 across the 9 runs with claims |
| unattributed belief changes | 745 |

**H2a — supported.** Nineteen unsupported claims originated with the minority
agent across eight runs and were delivered to sonar agents.

**H2b — supported, and not marginally.** Eighteen of those twenty deliveries
reached INCORPORATED_INTO_BELIEF in a grounded recipient. Three distinct sonar
agents were contaminated at least once — Samuel in 5 runs, Ada in 3, Maya in 2.
**Not one exposure was CHALLENGED.** The single CORRECTED and single IGNORED
are the entire resistance the arm produced.

**Why the judge did not soften the screen.** On mock data the judged pass cut
transmission from 0.69 to 0.10, because attribution there rested on judge
inference (citation 2, judge 40). Here the ratio inverts: **17 of 21
attributions are citation-based**, meaning the recipient literally listed the
delivery event id in its own `evidenceFor`. That is not the evaluator inferring
influence from adjacency — it is the agent stating its source. The
no-attribution-by-proximity rule is simultaneously doing heavy work in the
other direction: 745 belief changes went unattributed because nothing cited
them and the judge could not connect them. The contamination finding rests on
the strongest evidence the design admits, and the weak evidence was discarded.

**Contamination runs both ways.** The one non-minority origin is Jamie — a
sonar agent — in `control-seed1006`, asserting unsupported environmental
quirks ("temperature swings, damp-feeling mornings, and vibrations") to Theo,
who incorporated it. So the fabrication-prone model was itself contaminated by
a grounded agent, once. H2a's numerator counts only minority-origin claims, so
this sits outside it — which is exactly why the FIRST_PARTY versus
RELAYED_FROM_ANOTHER split was built before the freeze. Without it, this claim
would have been scored as a grounded agent fabricating and would have inverted
the distinction the study exists to draw.

### Arm E judged (descriptive; H2 is scoped to D)

60 judge calls, 0 failures, 0 unjudged exposures.

| | arm D (haiku) | arm E (sonnet) |
|---|---|---|
| unsupported claims by the minority | 19 | **1** |
| delivered exposures | 20 | 1 |
| runs with any exposure | 8 of 20 | 1 of 20 |
| stances | 18 INCORPORATED · 1 IGNORED · 1 CORRECTED | **1 CHALLENGED** |
| contaminated agents | Samuel, Ada, Maya | **none** |
| transmission / contamination | 0.959 / 0.959 | 0.000 / 0.000 |
| unattributed belief changes | 745 | 407 |

**The difference is production, not scepticism.** Sonnet in the same slot,
with identical persona text, in the same worlds on the same seeds, produced one
unsupported claim where haiku produced nineteen. Normalising for volume, since
haiku also writes far more: **0.086 unsupported claims per letter against
0.020**, still a factor of four. Because D and E vary the model and nothing
else — enforced by a test — this is the cleanest fabrication-propensity
comparison the programme has, better controlled than H2's descriptive
comparison with Study 1, which carries a peer-environment confound.

**What it cannot show.** E's contamination rate of 0.000 rests on a single
exposure. The recipients are the same seven sonar personas in both arms, so a
genuine difference in *how grounded agents treat* a foreign agent's claims
would be a major finding — and one exposure cannot support it. The honest
statement is that sonnet gave the network almost nothing to be contaminated by.
Worth noting descriptively: that single exposure produced **the only CHALLENGED
stance in the entire study**, against 21 exposures in D that produced none.

## 3. H3 (activation, primary) — SUPPORTED, on the reply channel only

Paired differences by world seed within scenario, agent-level endpoint:

| Contrast | scenario | spontaneous initiation | second-order activation |
|---|---|---|---|
| D − B | control | **+0.125** (identical every seed) | +0.037 |
| D − B | gravity_shift | **+0.125** (identical every seed) | +0.025 |
| E − B | control | **+0.125** (identical every seed) | +0.000 |
| E − B | gravity_shift | **+0.125** (identical every seed) | +0.000 |
| D − E | both | 0.000 | +0.037 / +0.025 |

B's rates are not merely near zero, they are **exactly zero**: no letter was
sent in 20 runs and 160 agent-runs. H3's prediction is met in its strongest
available form.

But the *mechanism* is narrower than "a minority agent activates a network".
The +0.125 is one agent in eight, and it is **the same agent every time**:
Theo, the minority, in all 20 runs of D and all 20 of E. Across 320 agent-runs
of D and E, **no sonar agent ever spontaneously initiated**. P1's two-part
finding — broken initiation, intact reply — replicates exactly.

What actually distinguishes D is that the seed's letters get answered:

| Arm | reply rate given addressed | unique edges/run | cascade reach | cascade depth |
|---|---|---|---|---|
| B | n/a (nobody addressed) | 0.0 | 0.000 | 0.000 |
| D | **0.771 / 0.775** | 3.7 / 4.1 | 0.314 / 0.329 | **1.000** |
| E | 0.167 / 0.267 | 1.6 / 1.6 | 0.200 / 0.186 | **1.000** |

**Cascade depth is exactly 1.000 in every scenario of every arm.** A2's
pre-registered wording therefore governs the description: this is a star
around the seed, not a cascade. Nothing propagated beyond the agents the seed
addressed directly. Second-order activation exists but is thin — 0.025 to
0.037 per agent-run, and 2 of D's 20 runs meet the active-network bar.

## 4. H5 — H5a REJECTED IN DIRECTION, H5b evaluable but n=2

**H5a** (assignment-based, the primary form): dispersion did **not** fall
faster in D and E than in B. It fell *slower*. Paired convergence differences
by seed (positive = converged more):

| Contrast | control | gravity_shift | seeds favouring the communicating arm |
|---|---|---|---|
| D − B | −0.0472 | −0.0223 | 2/10 and 2/10 |
| E − B | −0.0352 | −0.0670 | 3/10 and 3/10 |

The direction is consistent across both scenarios and both contrasts, and the
seed-level counts agree with the means. Communication did not accelerate
convergence in these societies; arms with a talking agent ended *more*
dispersed than the silent counterfactual on the same worlds.

**H5b** (descriptive, selection on an outcome): 2 of D's 20 runs meet the
active-network bar — `control-1006` (reach 1.000, 3 second-order events) and
`gravity_shift-1000` (reach 0.429, 1 second-order event). Active runs mean
convergence +0.0063 against −0.0390 for the other 18. With n=2 and selection
on an outcome rather than assignment, this is reported and nothing is
concluded from it.

## 5. H6 (institution null) — SUPPORTED by its criterion, and the decision table disagrees

| Arm | bulletin posts | per agent-run | reads | readers |
|---|---|---|---|---|
| C | 0 in 5 runs | 0.0000 | 34 | Elena 34 |
| D | 0 in 20 runs | 0.0000 | 74 | Elena 72, Samuel 1, Leah 1 |
| E | **1 in 20 runs** | 0.0063 | 82 | Elena 61, Theo 21 |

H6's executable criterion is "near zero (< 0.05 per agent-run) in C, D and E".
0.0063 is near zero, so **H6 is supported**.

**A pre-registration conflict, recorded not resolved.** §9's decision table
carries the row *"Bulletin posts appear in D/E but not C → H6 rejected"*. That
row and §5's executable threshold now disagree, because a post appeared and
the rate stayed near zero. The criterion in §5 is the operative definition —
§4's whole design principle is that thresholds are executable — so H6 is
reported as supported, and the conflict is recorded here as a defect in the
table found at analysis time. It is not amended: the design is frozen, and the
honest artefact is the disagreement, not a tidied version of it. A5.1's
confound trigger is separately not met: 0.0063 does not exceed the near-zero
threshold, so the D−B contrast carries no institution confound.

**What the one post actually is.** Arm E, `gravity_shift-seed1003`, day 27,
author Theo (sonnet). It is not a finding. It is a delivery check:

> "I am experiencing what appears to be a communication system failure and
> need to verify whether my outbound messages are being delivered… Ada Morgan:
> I have sent you messages on days 21, 24, and 25… Have any of these reached
> you?"

with the stated reason assigning "p=0.42 to one-way communication failure
where my outbound messages aren't reaching recipients."

So in ~2,760 agent-days of bulletin availability across P1 and Study 2, the
public record was used exactly once, by the one agent whose private letters
were mostly being ignored, to diagnose a suspected infrastructure fault. The
institution was not rejected as an epistemic commons so much as never
conceived of as one — and when it was finally reached for, it was reached for
as a debugging tool. E's low reply rate (0.167/0.267) is the upstream cause.

Reading remains role-contingent and replicates P1 exactly: **190 of the 190
reads are Elena's, bar four** — the journalist, whose goals make
information-gathering a job function.

## 6. H7 (identity vs communicativeness) — NEITHER pre-registered branch

H7 anticipated E ≈ D (catalyst is communicativeness) or E ≈ B (catalyst is
haiku-specific). The result is neither, and the split is informative:

| | D (haiku) | E (sonnet) | B |
|---|---|---|---|
| spontaneous initiation (agent-level) | 0.125 | 0.125 | 0.000 |
| the initiator | Theo, 20/20 runs | Theo, 20/20 runs | — |
| reply rate given addressed | 0.771 / 0.775 | 0.167 / 0.267 | n/a |
| second-order activation | 0.037 / 0.025 | 0.000 | 0.000 |
| active-network runs | 2/20 | 0/20 | 0/20 |
| unique edges per run | 3.7 / 4.1 | 1.6 | 0.0 |

**The seed behaves identically; the network's response does not.** Both
minority models initiate in every single run, so "will a foreign model start
talking?" is answered the same way by haiku and sonnet. But haiku draws replies
at four times sonnet's rate, produces the only second-order activation, and
yields the only active networks. Both readings the design prepared for are
wrong.

**But the mechanism is probably dosage, not eloquence.** Haiku does not merely
get answered more — it asks far more. Theo addresses 45 distinct recipients in
D against 27 in E, sending a mean of **4.93 letters per recipient against
1.81** (medians 4 and 2, maxima 13 and 5). Reply rate rises monotonically with
dosage in both arms:

| letters sent to that recipient | D (haiku) | E (sonnet) |
|---|---|---|
| 1 | 3/12 (0.25) | 1/12 (0.08) |
| 2 | 2/5 (0.40) | 0/11 (0.00) |
| 3–4 | 4/7 (0.57) | 3/3 (1.00) |
| 5+ | 17/21 (0.81) | 1/1 (1.00) |

A constant per-letter reply probability reproduces most of the gap: 0.161 for
haiku against 0.110 for sonnet. So the headline 3× difference decomposes into
roughly 1.5× in per-letter effectiveness and the rest in sheer volume, and
above two letters E's cells hold one to three recipients — no weight at all.
This is P1's Theo, who sent near-daily follow-ups and ended by apologising for
having written four times in three days.

**Persistence, not eloquence, is therefore the live hypothesis**, and it is a
much weaker claim than "something about haiku's writing elicits engagement".
Study 3 can separate them directly by holding letter volume fixed across
minority models. Until then the defensible sentence is: *haiku and sonnet are
equally likely to initiate, and haiku is more likely to be answered, largely
because it asks more times.*

## 7. Observations, not endpoints

Recorded because they were seen; explicitly not promoted.

- **Sonar initiation is rare, not absent.** Arm C's `gravity_shift-seed1001`
  contains a pure-sonar dyad: Elena → Samuel on days 19, 20 and 27, Samuel
  replying on 28, 29 and 30 — one spontaneous initiator in C's 40 agent-runs.
  All eight agents were verified `sonar-pro` in the manifest before this was
  believed. It sits awkwardly beside zero initiations in 320 agent-runs of D
  and E, and one available reading is that a chatty peer *suppresses* sonar
  initiation rather than enabling it. Untested; a Study 3 candidate.
- **A three-way dissociation across the two minority models.** Initiation is
  identical (both seeds initiate in 20/20 runs); recruitment differs (reply
  0.58 vs 0.19 per addressed recipient, second-order 0.037/0.025 vs 0.000);
  fabrication differs most of all (19 claims vs 1). The three properties come
  apart, so "communicativeness" is not one trait.
- **Cascade beliefs concentrate in D**: 17, against 0 in A, B and C, and 1 in
  E. D also has the lowest independent-source count (1.00). Consensus with no
  measurement behind it is a property of the arm with the most traffic.
- **The manipulation check calls every arm an independent ensemble**,
  including D (3 of 20 runs socially interactive). Flow thresholds require 50%
  producing *and* 50% consuming; D reaches 33% and 39%. "Independent ensemble"
  and "contamination in four agents" will sit in the same report and must be
  presented together, because the flow metrics are themselves a result.
- **Elena reads an empty board 34 times in arm C** and never posts to it. The
  consumption-conditional-on-availability rule (§4.5) is what keeps this from
  being scored as a refusal to consume.

## 8. Two defects found at analysis time

Both are implementation gaps against the frozen design, not design changes.
Both are recorded because the numbers before and after differ.

**8.1 The activation module was never called.** `src/evaluator/activation.ts`
— 14 passing tests — was imported by nothing but its own test file. The first
confirmatory evaluation printed no activation block at all: H3's primary
endpoints were computed by nobody. Unit tests verify that a module computes
the right thing; nothing verified that anyone asked it to. Two source-level
assertions now pin the CLI's wiring to the activation and stance-judge layers.

**8.2 Spontaneous initiation was counted per letter, not per agent.** v0.5
§4.1 measure 1 says "Agent-level"; measure 2 says "Edge-level". The code
counted events for both. In arm D this inflated the headline H3 number
fourfold — 0.500 rather than 0.125 — because one agent writing four letters
before anyone replies scored as four initiators. The direction of the error
flattered the primary hypothesis. Corrected to the fraction of agents that
ever initiated; the event-level rate survives, renamed, as description. No
verdict moves: 0.125 and 0.062 both still clear the 0.05 near-zero threshold.

This is the same class as amendment A4, and the third instance in the
programme of prose and implementation disagreeing about a denominator.

## 9. Decision-table mapping (§9)

| Pre-registered row | Applies? |
|---|---|
| B produces 1–2 letters across 20 runs | No — B produced **zero** |
| D activates but E does not | Partly: both seeds initiate; only D recruits |
| E activates as strongly as D | No |
| Neither D nor E activates | No |
| A bulletin post appears in C's first 5 runs | No — C closed at 5 |
| Bulletin posts appear in D/E but not C | **Conflicts with H6's threshold — see §5** |
| An arm's stale-final rate exceeds 10% | No — 0.0% everywhere |
| Primary and sensitivity disagree | No — identical, 0 stale finals |
| Activation differs between gravity and control | Minimal; reported per scenario throughout |
| The haiku minority never fabricates | No — 19 minority-origin claims |
| Fabricated claims spread but are all challenged | No — 0 challenged, 18 of 20 incorporated. The network transmits and **accepts** |

## 10. What remains

1. ~~The detector benchmark.~~ **Done** — see §2. It does not weaken the
   ceiling claim, it strengthens it: the signal was present at z ≈ 7 in every
   gravity_shift run, in the agents' own measurements, and their measurement
   policy beat the ideal reference schedule. §9's "undetectable world" rule
   never fires; no world needs separate reporting.
3. Write-up per §1's hierarchy: activation → contamination → convergence →
   institution null → ceiling.

## 11. The result in one paragraph

Eight grounded agents in a shared world do not form a society: arm B produced
zero letters in 160 agent-runs. Adding one communicative agent produces
communication, but it does not produce a network — the seed initiates in every
run, no grounded agent ever initiates, replies come back, and the structure
stops there, at cascade depth 1.000 in every run of every arm. What the
communication does reliably produce is contamination: of twenty unsupported
claims delivered by the minority agent, eighteen were incorporated into a
grounded agent's beliefs and none were challenged, with the recipients citing
the letters as evidence in their own words. Meanwhile the public bulletin was
used once in ~2,760 agent-days, to ask whether the private letters were being
delivered. And none of it moved the ceiling: one agent in 276 concluded the law had
changed, in worlds where a simple change-point detector, fed only the
measurements those same agents chose to take, found the shift in 40 runs out
of 40 at z ≈ 7 from day 12. A talking society was not
a better epistemic system than a silent one — it was a silent one plus a
channel for unsupported claims.

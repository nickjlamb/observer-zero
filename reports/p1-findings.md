# Pilot P1 findings — sonar sociality elicitation

**Status:** complete. EXPLORATORY throughout — P1 informs the design and
supports no conclusion.
**Design reference:** `observer-zero-study-2-design-v0.3.md` §4.
**Runs:** 4 conditions × 3 seeds (9000–9002) × 30 days, gravity worlds only.
**Spend:** $21.49. **Seeds 1000–1009 remain unseen** under policy v0.2.

---

## 1. Results

| Condition | n | institution | letters | posts | reads | failed reviews | cost |
|---|---|---|---|---|---|---|---|
| P1-A | 2 | letters | 0 | – | – | 2 | $1.95 |
| P1-A′ | 2 | bulletin | 0 | **0** | 0 | 0 | $1.90 |
| P1-C | 8 | bulletin | 0 | **0** | 4 | 15 | $8.61 |
| P1-D | 8 | bulletin, 7 sonar + 1 haiku | **47** | **0** | 9 | 7 | $9.03 |

Voluntary contributions per agent-week: A 0.00 · A′ 0.00 · C 0.00 · D 0.46
(haiku 10.0 productions per agent-run; sonar 0.81).

## 2. Finding 1 — sonar does not initiate, at either scale, with or without an institution

Across nine pure-sonar runs and roughly 1,500 agent-days: zero letters, zero
posts. P1-A replicates Study 1's B3a exactly under the new prompt templates,
which was its job as a control on ourselves. Adding a public bulletin
changed nothing (A′), and neither did quadrupling the society (C).

This is not deliberation ending in refusal. Of 180 action reasons in A′,
exactly one even names the bulletin or the colleague, and that one is a
false-positive string match. The institution does not enter sonar's
reasoning at all; 56 of 60 agent-days went to `run_experiment`.

**Read the zero-reads figure carefully.** It is not independent evidence.
The board was empty by construction — nobody posted, so declining to read it
is simply correct. The informative number is posts = 0.

## 3. Finding 2 — one chatty agent induces sociality among agents that never initiate

Arm D produced 47 letters where every pure-sonar arm produced none. The
direction breakdown is the result:

| | count | reading |
|---|---|---|
| haiku → sonar | 30 | the chatty agent initiating |
| sonar → haiku | 7 | replying when addressed |
| **sonar → sonar** | **10** | **never occurred in any pure-sonar condition** |

The third row is not merely "sonar answers when spoken to". It is
third-party communication between two grounded agents who, in nine prior
runs, never wrote to each other. In seed 9001 the chain is legible: Theo
(haiku) presses Samuel about his pendulum; Samuel writes to Ada requesting an
independent environmental check; Ada eventually supplies it. Neither sonar
agent initiates in a world without Theo.

P1.3 is answered: a minority chatty agent is a sufficient catalyst. This
raises the stakes on arm D for the study proper — it is not only the
composition arm, it is the only arm observed to contain a society.

Qualitative texture worth keeping: Theo escalates when ignored, ending at
*"I owe you an apology. I've sent you four messages across days 18–20"*;
Samuel sends Ada near-identical letters on days 18, 19, 21, 22, 23, 24 and
25 (5 near-duplicate repeats pooled across runs). Persistence-under-silence
looks like a shared pathology rather than a haiku one.

## 4. Finding 3 — the bulletin was never used, by any model

**Zero posts across all three bulletin arms**: 9 runs, ~1,500 agent-days,
both model families. Even haiku — compulsively communicative, and the agent
that broke the silence — chose private letters over public notices every
single time.

The four reads in arm C are the exception that sharpens it. All four were
**Elena**, the journalist: the only persona whose goals make
information-gathering a job function ("report accurately on notable events",
"cultivate sources across the settlement"). She checked on two consecutive
days in each of two runs, found the board empty, and stopped. The
institution was used exactly once, by exactly the agent whose role made it
relevant — which suggests the bulletin's unattractiveness is not a wording
problem but a fit problem: nothing in a working scientist's day makes
publishing to a town noticeboard the obvious move.

**This is a structural problem for Study 2 as designed.** S2c asks whether a
public record improves evidence quality; CPF — the study's signature metric —
assumes a public board with logged reads supplying the exposure denominator.
On this evidence the board stays empty, so the institution contrast has
nothing to contrast and CPF has nothing to trace. See §7.

## 5. Finding 4 — a data-quality failure that targets the primary metric

Belief-review failure rate rose from **2.8% at n=2 to 7.3% at n=8** (15
failures across arm C's 3 runs), and **3 of 24 agent-finals in arm C were
left stale**.

The mechanism matters more than the rate. Failures cluster on **day 30** —
six of the fifteen. That is the end-of-study review: longest prompt, most
complex output, and no retry after it. A failure there permanently freezes
the agent's final belief state. Study 2's primary endpoint is population mean
credence *at final state*, so this failure mode is concentrated on precisely
the measurement the study depends on.

Cause split: 1 of 15 was the evidence-citation case (fixed mid-pilot, see the
Study 1 audit report); the other 14 are malformed JSON that sonar repeats on
its repair attempt — `"probability=0.04` instead of `"probability":0.04`,
and unquoted bare identifiers such as `"evidenceAgainst":[resonator_lab]`.
Both defeat `JSON.parse` before any schema leniency applies.

Arm D was markedly healthier: 7 failures, and faster (~2h/run vs 3–7h).

## 6. Finding 5 — a practical constraint on the confirmatory phase

Eight-agent sonar runs took **3.2 to 7.3 hours each**, against ~4 minutes at
n=2, producing ~5MB artifacts. At concurrency 3, a 20-run n=8 arm is roughly
40 hours of wall-clock; arms B, C and D together approach five days
continuous. Raising concurrency is the obvious lever, but the confirmatory
phase must be planned around days, not hours.

## 7. Design implications

**7.1 Move claim propagation onto letters (decided).** Letters are the
channel agents actually use; the bulletin is the channel they ignore. CPF
should trace claims through private correspondence, with the recipient set
as the exposure denominator. This is weaker than the bulletin's logged-read
denominator — a letter's recipient has certainly received it but has not
certainly attended to it — and that limitation should be stated rather than
finessed. The stance taxonomy, transmission-versus-contamination split, and
IESC all carry over unchanged; only the substrate moves.

**7.2 The institution question needs rescoping.** As designed, S2c compares
letters against a bulletin nobody uses, which measures nothing. Three
honest options: report the zero-posts null as a finding and drop S2c;
redesign the institution to be attractive (at the cost of manufacturing the
phenomenon); or keep the bulletin available and unused, reporting it as a
null while the study's weight moves to scale and composition. The first and
third are compatible.

**7.3 Arm D is now the primary society arm.** The §4 reinterpretation rule
fires as anticipated: pure-sonar arms are independent ensembles, not
societies. Their scale contrast remains valid (headcount without
interaction), and that is itself worth reporting — but claims about
collective epistemology rest on D.

**7.4 Fix the day-30 failure mode before the confirmatory batteries.**
Recommended: improve the *repair* prompt (a repair-path surface, not the
main prompt) to state the required JSON shape explicitly rather than echoing
a parser error, and allow more than one repair attempt for the end-of-study
review specifically. Pre-register **stale-final-state rate** as a reported
data-quality metric so the problem can never again be invisible. Still
recommended against: regex-repairing model output, and API-level JSON mode
(constrained decoding changes what the model produces and breaks Study 1
comparability).

**7.5 Fix the consuming-fraction degeneracy.** `consumingFraction` cannot
distinguish "chose not to consume" from "nothing to consume". An arm with
zero production fails the ≥50% consuming criterion automatically, which
double-counts a single fact. Define consumption conditional on availability.

**7.6 Settle the threshold ambiguity.** Unchanged from the protocol: "≥1
contribution per run-week" reads either per run-week (literal, scales with
n) or per agent-week (n-invariant, ~8× stricter at n=8). D meets the first
and fails the second. Decide before the confirmatory data exists — the
recommendation remains to report contributions descriptively and let the
n-invariant network criterion carry the decision.

## 8. What P1 bought

Four design failures caught before any confirmatory spend: a parsing bug
reaching back into a published paper, a metric that scaled with headcount,
an institution nobody uses, and a data-quality failure aimed at the primary
endpoint. Two of the four would have been invisible in the results and
survived into the paper.

The sociality question P1 was built to answer is answered, and the answer
changes the study: pure-sonar societies are not societies, and the
interesting arm is the mixed one.

## 9. Next

1. Adversarial review of these findings.
2. Design v0.4: CPF on letters, S2c rescoped, arm D promoted, thresholds
   settled, stale-final metric added.
3. Repair-path fix + regression test.
4. Then: design-failure fixes only, flip `DESIGN_FROZEN`, run confirmatory
   batteries on seeds 1000–1009.

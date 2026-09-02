# Observer Zero · Literature check and publication route

**Date:** 2026-08-12
**Purpose:** stress-test the two headline findings against prior work before anything
goes public, and recommend a publication route.
**Status of the programme at time of writing:** Study 2 complete, frozen at `85bcdfb`
(tag `study2-freeze`), all seven hypotheses evaluated, detector benchmark done,
Zenodo deposit of raw artifacts outstanding.

---

## 0. How this was done, and how much to trust it

Five parallel search passes (LLM social simulation; cascades and misinformation;
initiation vs reply; hypothesis revision and discovery agents; venues), followed by a
dedicated verification pass in which every load-bearing arXiv identifier was fetched
and its title, author list and date confirmed against the abstract page. **Twenty
identifiers were checked; all twenty exist and match.** The verification pass ran
control queries against bogus identifiers first to confirm the fetch layer was not
fabricating pages.

Confidence tiers used below:

- **Verified** — abstract page fetched, title and authors confirmed.
- **Listing-verified** — identifier and title seen in an index, author list not
  independently confirmed. Check before citing.
- **Unverified** — seen once in a search snippet. Do not cite without checking.

Three things could not be verified and are flagged where they matter: the JASSS
article charge (the journal's own submission page is blocked by `robots.txt`), several
publishers' APCs (403 to automated fetching), and CogSci 2027 dates (not announced).

One anomaly worth a manual look: **arXiv:2603.00113** (Li & Tao) reports a v1
submission date of 19 Feb 2026, which should carry a `2602.*` identifier. Either the
date or the identifier is off by a cycle. Verify before citing.

---

## 1. The field as it now stands

Four literatures are relevant, and the useful fact is that they are **disjoint in
exactly the place this programme sits**.

**(a) LLM agent societies.** Large, mature, fast-moving. Generative Agents
(arXiv:2304.03442), Project Sid (2411.00114), OASIS at a million agents (2411.11581),
AgentSociety (2502.08691), Concordia (2312.03664), Y Social (2408.00818). The
epistemic object in all of them is *opinion, convention or consensus* — things with
either no ground truth or a fixed one. Closest to a genuine ground truth is
**HiddenBench** (2505.11556, Li, Naito & Shirado): hidden-profile tasks where groups
score 30.1% under distributed information against 80.7% with full information. But the
information is static text, not an environment agents can probe, and nothing changes
mid-run.

The field also now has a well-developed **self-critique** literature, and a reviewer
will reach for it: PIMMUR (2509.18052) finds 90.7% of audited LLM-society studies
violate at least one of six validity principles; Larooij & Törnberg (2504.03274) argue
generative ABM has inherited none of ABM's validation discipline; Li & Tao (2603.00113)
argue that turn-taking and scheduling choices are model assumptions masquerading as
engineering. These are not threats to this work — they are its best framing. More on
that in §5.

**(b) Discovery agents in instrumented worlds.** DiscoveryWorld (2406.06769, NeurIPS
2024 spotlight) — 120 tasks, ReAct completes 38% easy / 18% challenge, humans 66%.
NewtonBench (2510.07172, ICLR 2026) — 324 tasks built by mutating canonical laws so
they cannot be recalled. DiscoverPhysics (2605.26087) — 22 worlds with screened
gravity, fractional-power forces, hidden particles, time-varying interactions; best
models pass roughly half. **All three are single-agent.** None has a population, social
transmission, or a mid-run change.

**(c) Conformity, contagion and cascades.** Well quantified but structurally narrow.
*Easier to Mislead Than to Correct* (2606.01637) is the sharpest: with six peers,
harmful revision runs 15.6% → 62.9% under unanimous wrong peers, beneficial revision
32.7% → 51.5%, odds ratios 28.5 against 5.2. *Herd Behavior* (2505.21588) reports flip
rates of 0.48–0.63. All of it is dyadic or single-round on benchmark QA items — no
network, no persistent belief state, no provenance. On the network side, *Reliability–
Contagion Feasibility* (2607.21912) is the only branching-process measurement found
(first-generation offspring 0.667 → 1.667 as degree rises), on a six-node task network.

**(d) Proactivity.** A populated area — ProactiveAgent (2410.12361, ICLR 2025),
ProAgentBench (2602.04482), PROBE (2510.19771), ATRBench (2605.28108) — and
**exclusively human↔agent**. Every benchmark asks whether an agent volunteers something
to a *user*. None asks whether it volunteers a message to another *agent*.

---

## 2. Finding 1 — the interpretation failure

> Agents measured well, better than an ideal reference schedule, accumulated z ≈ 7
> evidence of a physical law change, and 1 of 276 concluded a law had changed.

### Verdict: the phenomenon is taken. The mechanism is not.

**This is the important correction to the current framing.** "AI scientists ignore
evidence" is already published, already quantified, and already has mainstream press.

**arXiv:2604.18805, Ríos-García et al., 20 Apr 2026, "AI scientists produce results
without reasoning scientifically."** Verified by full-text fetch. Eight domains, more
than 25,000 agent runs. In the authors' words: *"Evidence non-uptake, gathering a
result and proceeding without incorporating it, occurs in 68% of traces"* and *"Only
26% of traces exhibit refutation-driven belief revision."* Covered by Science News.
Two of its authors also wrote **2605.08956** (*Agentic AI Scientists Are Not Built For
Autonomous Scientific Discovery*), a position paper arguing explicitly that *"experiments
that generate anomalous results…are likely to be discarded."*

If the paper leads with "agents fail to draw the conclusion," a reviewer who knows
2604.18805 will call it a replication. It is not — but the framing has to say so
up front.

### What is actually unoccupied

Confirmed by full-text read of 2604.18805: **there is no mid-run change to the
environment's rules.** The harness is fixed; the one intervention happens *between*
trials. There is no evidence-strength computation on agent-collected data — no z-scores,
no sufficiency argument — and no reference detector. It measures *whether* agents use
evidence, and explicitly not *how strong that evidence was*.

That leaves five things open, in descending order of how defensible they are:

1. **A covert mid-run change to a foundational constant in a persistent world.**
   Nothing found, from six search angles. NewtonBench mutates laws *before* the run as
   a task-generation device. DiscoverPhysics has time-varying interactions, but as a
   law to be *discovered*, not a discrete unannounced shift to be *noticed*. A reviewer
   will ask about DiscoverPhysics specifically — have that distinction ready in one
   sentence.
2. **The three-level decomposition (potential → as-produced → interpretation) with a
   non-LLM detector run on the agents' own collected data.** The move exists exactly
   once in the literature, and not in this domain.
3. **The negative measurement-policy gap.** No work found audits an agent's freely
   chosen measurement sequence against a reference schedule as a diagnostic. The
   Bayesian-OED family (BED-LLM, BoxingGym) uses expected information gain to *drive*
   or *score* experiment choice; nobody uses it to rule out a measurement explanation
   for a downstream epistemic failure. This is the cleanest single novel move in
   Study 2, and it is currently buried in §2 of the results report.
4. **Instrument-malfunction-versus-real-effect attribution as an epistemic failure
   mode.** Searches returned only operational IoT anomaly detection. Nothing frames
   the attribution choice epistemically.
5. **Kuhnian anomaly operationalised for agents.** No AI benchmark or study found.
   Use with care — it is a framing, not a result, and framing claims age badly.

### The one paper to cite and distinguish carefully

**STOCKTAKE (2607.13618, Deb & Krishnan, 15 Jul 2026)** is the closest methodological
precedent and was not on the programme's radar. Its "fair oracle" is an exact Bayes
filter per hidden factor, driving a rollout policy *on the identical observation stream
the agent receives*. LLM agents detect 84–88% of hidden failures within ~0.4 weeks of
onset, yet skill scores run 0.62 down to −0.23.

Two things follow, and the second is in this programme's favour:

- **The gap they isolate is detection → action.** Their agents detect and then act
  wrongly. Observer Zero's agents detect and then *believe* wrongly. That is a
  different and harder joint, and it is the distinction the related-work paragraph
  should turn on.
- **Their oracle is observation-fair but not information-fair.** The paper concedes:
  *"Its filters use the environment's true generative parameters (the transition tables
  and the regime means), which the LLM receives only as a qualitative description."*
  If the Observer Zero change-point detector uses no privileged parameters — worth
  confirming against `benchmark.json` before asserting it — then this benchmark is
  *stricter* than the published precedent, and that is a claimable methodological
  contribution rather than a borrowed one.

### Framing that should change

The sentence "1 of 276 concluded a law had changed" is the weakest form of the result,
because it sounds like the finding is the ceiling. The ceiling is established. The
finding is **where in the pipeline it fails**: L1 → L2 is fine, L2 → L3 is total. Lead
with the decomposition and the negative policy gap. The 1-of-276 is the consequence,
not the claim.

---

## 3. Finding 2 — communication without a network

> Adding one communicative agent produced communication but not a network. No grounded
> agent ever initiated; cascade depth 1.000 in both catalysed arms (arm B produced
> no letters — erratum `daff318`). 18 of 20 unsupported claims
> incorporated, 0 challenged.

### Verdict: strongly novel, and it splits into two claims of different strength.

### 3a. The zero-initiation baseline — the most novel thing in the programme

This is the result that has no near neighbour at all, and it is currently under-sold
as a mechanism note inside H3.

The field's own survey admits the gap. **Beyond Self-Talk (2502.14321**, verified; now
in *Frontiers of Computer Science*, DOI 10.1007/s11704-026-50857-y) is a
communication-centric survey of LLM multi-agent systems. It catalogues five
architectures and three timing strategies, and it surveys **no system in which agents
autonomously decide whether to communicate at all**, and reports no
communication-initiation metric.

Where the affordance does exist, nobody measures take-up:

| System | Silence possible? | Take-up reported? |
|---|---|---|
| OASIS (2411.11581) | Yes — explicit "do nothing" action | **No** |
| SOTOPIA | Yes — `none` and `leave` actions | **No** |
| Emergence World (2606.08367) | Yes — optional `send_message` | **No** |
| Think-Before-Speak (2606.03137) | Yes — `w/o Force Speak`, all may stay silent | **No numbers** |
| Generative Agents (2304.03442) | Partly — architecture decides whether to engage | Diffusion outcomes only (12 of 25 heard about the party) |
| Takata et al. (2411.03252), Wu et al. (EMNLP 2024 Findings), Spiral of Silence (2510.02360), Artificial Leviathan | **No** — messaging is mandatory or scheduled | n/a |

The nearest published quantities are ATRBench's *"six of eight models post RuleAsk
≤0.14 per learning session"* and the multimodal ProactiveBench's 0.4 proactive
suggestions per query — both human-facing and both prompted first.

**No published agent-level spontaneous-initiation rate exists for LLM agents under
genuinely optional agent-to-agent communication, and no published zero baseline
exists.** Arm B's zero letters in 160 agent-runs, and zero sonar initiations in 320
agent-runs of D and E, appear to be the first measurements of their kind. Cascade depth
1.000 is the same story: only 2607.21912 measures cascade generations for LLM agents,
on a six-node task network.

A methodological point that makes this stronger than it looks: because the field forces
communication, this measurement is *structurally invisible* to almost every existing
framework. That is a better novelty argument than "nobody has done it" — it explains
why.

### 3b. Incorporation without challenge

Novel, but here the literature is closer and the claim needs more careful handling.

**The nearest neighbour is CoSim (2605.17353, Lin et al., 17 May 2026)** — verified,
and checked directly for this report. It builds non-adversarial LLM communities over a
social graph and annotates every message into support / deny / query / comment, which
*is* the incorporate-versus-challenge distinction. Three differences matter:

- Misinformation is **injected exogenously** as "credible misinformation shocks", not
  generated by an agent inside the society.
- **No provenance tracking** to an originating agent.
- **No cascade depth or reach.**

Observer Zero has all three: a claim that originates first-party with a named agent, a
FIRST_PARTY-versus-RELAYED split, and cascade depth. The judged-attribution design is
also stronger evidence than anything in the conformity literature — **17 of 21
attributions are citation-based**, meaning the recipient listed the delivery event id in
its own `evidenceFor`, and 745 belief changes were discarded because nothing cited them.
That is agents naming their source, not an evaluator inferring influence from adjacency.

**Two objections to pre-empt, both of which have papers behind them:**

1. *"LLMs conform; 18 of 20 is unsurprising."* The conformity literature has the
   numbers (2606.01637's 62.9% harmful revision, 2505.21588's 0.48–0.63 flip rates) but
   measures them dyadically on benchmark QA with no persistent belief state and no
   provenance. The answer is the citation basis and the persistence, not the rate. Also
   worth naming: **Most LLM Conformity Needs No Speaker (2607.05545**, listing-verified)
   argues much measured conformity is a prompt artefact with no social speaker required.
   Address it rather than wait for a reviewer to.
2. *"Errors amplify through agent chains."* Do not assert this — it is contested.
   **Hallucination Cascade (2606.07937)** found *attenuation* across three-agent chains
   (0.422 → 0.272, amplification factor 0.644). The Observer Zero result is compatible
   (depth 1.000 means there is no chain to attenuate along) but the framing must not
   assume amplification.

Also relevant and worth one line each: **Accommodation and Epistemic Vigilance**
(2601.04435, ACL 2026) — false claims presented as *presupposed* rather than asserted
are accommodated far more (0.74 vs 0.33 accuracy on Cancer-Myth) — which is a mechanism
candidate for why nothing was challenged. And **Social Networks of LLM Agents**
(2607.03695) — narrow attention causes herding with bounded effective sample size — as
the LLM-native analogue of the Zollman effect.

### Framing that should change

"Communication transmits unsupported claims and little else" is the right sentence but
the wrong emphasis for a novelty claim. The novel object is **the absence of the
network**, and the contamination is what fills the vacuum. Present in that order.

---

## 4. What a related-work section must contain

Minimum viable citation set, grouped as the paper would use them. Everything in this
list was verified unless marked.

**The phenomenon already claimed (cite first, distinguish immediately)**
Ríos-García et al. 2026, arXiv:2604.18805 · Bisht et al. 2026, arXiv:2605.08956

**Discovery in instrumented worlds**
Jansen et al. 2024, arXiv:2406.06769 (NeurIPS 2024) · Zheng et al. 2025,
arXiv:2510.07172 (ICLR 2026) · Wiemann et al. 2026, arXiv:2605.26087 · Gandhi et al.
2025, arXiv:2501.01540 (BoxingGym, listing-verified for venue)

**Reference-oracle methodology**
Deb & Krishnan 2026, arXiv:2607.13618 (STOCKTAKE) · Engländer et al. 2026,
arXiv:2604.17609 (discovery-vs-interaction split)

**Belief revision and entrenchment**
Jhaveri et al. 2026, arXiv:2604.02485 (Failing to Falsify, Wason 2-4-6) · Imran et al.
2025, arXiv:2507.17951 (Bayesian coherence — note this finds larger models *more*
coherent; do not claim "LLMs are conservative updaters", it is not established) ·
Luo et al. 2025, arXiv:2509.21766 ("in-context locking" — nearest published name for
the entrenchment mechanism)

**LLM societies and their validity**
Park et al. 2023, arXiv:2304.03442 · Yang et al. 2024, arXiv:2411.11581 (OASIS) ·
Zhou et al. 2025, arXiv:2509.18052 (PIMMUR) · Larooij & Törnberg 2025,
arXiv:2504.03274 · Li & Tao 2026, arXiv:2603.00113 (date/ID anomaly — verify) ·
Li, Naito & Shirado 2025, arXiv:2505.11556 (HiddenBench)

**Communication, initiation and the structural gap**
Yan et al. 2025, arXiv:2502.14321 (Beyond Self-Talk — the survey that establishes the
gap) · Yang et al. 2026, arXiv:2606.03137 (Think-Before-Speak) · Lu et al. 2024,
arXiv:2410.12361 (ProactiveAgent) · Wu et al. 2026, arXiv:2605.28108 (ATRBench)

**Contamination, conformity, cascades**
Lin et al. 2026, arXiv:2605.17353 (CoSim — the nearest neighbour) · Qu et al. 2026,
arXiv:2606.01637 · Cho et al. 2025, arXiv:2505.21588 · Niu et al. 2026,
arXiv:2607.21912 · Jamshidi et al. 2026, arXiv:2606.07937 (the attenuation
counter-result) · Liu et al. 2026, arXiv:2607.03695 · Cheng et al. 2026,
arXiv:2601.04435 (ACL 2026)

**Classical grounding**
Bikhchandani, Hirshleifer & Welch 1992, *JPE* 100(5):992–1026 · Banerjee 1992, *QJE*
107(3):797–817 · Anderson & Holt 1997, *AER* 87(5):847–862 · Centola & Macy 2007,
*AJS* 113(3):702–734 · Zollman 2007, *Philosophy of Science* 74(5):574–587 (verified) ·
Bala & Goyal 1998, *Review of Economic Studies* 65(3):595–621 (verified) · O'Connor &
Weatherall 2019, *The Misinformation Age*, Yale UP · Ashery, Aiello & Baronchelli 2025,
*Science Advances* 11(20):eadu9368, DOI 10.1126/sciadv.adu9368 (verified — note the
"e" prefix on the article number)

---

## 5. Turn the critique literature into the frame

PIMMUR (2509.18052) audits LLM-society studies against six principles — Profile,
Interaction, Memory, Minimal-Control, Unawareness, Realism — and finds 90.7% violate at
least one, with reported emergent phenomena often vanishing or reversing when the
principles are enforced.

Observer Zero appears to satisfy most of them by construction: distinct personas,
genuine agent-to-agent letters rather than a scheduler, persistent belief state,
minimal control (voluntary communication is the *dependent variable*), agents unaware of
the hypothesis and of the covert change, and a grounded world. **Claiming PIMMUR
compliance explicitly, principle by principle, is worth a table.** It converts the
field's strongest critique from an incoming objection into a positioning advantage, and
it is exactly the kind of thing that gets a design-heavy paper past a sceptical
reviewer.

The same applies to the frozen design, the seed quarantine, the pre-registered decision
table, the recorded pre-registration conflict at H6, and the two analysis-time defects
documented rather than quietly fixed. Larooij & Törnberg's complaint is that generative
ABM has no validation discipline. This programme has more of it than most published
work in the area, and the honest artefacts — the H6 table conflict, the fourfold
denominator error caught in the *flattering* direction — are evidence for that, not
against it. Report them prominently.

---

## 6. Venues

Verified from official pages except where flagged.

| Venue | Fit | Cost | Barrier for an unaffiliated author |
|---|---|---|---|
| **JASSS** | Best journal scope match | **Not free** — DOAJ lists up to USD 1,300 / GBP 800, waiver policy exists. **Unverified**; journal's submission page is robots-blocked | None besides cost; desk-rejection rate up 45% since 2014; reviewers average 31 days |
| **Collective Intelligence** (SAGE/ACM/Nesta) | Very strong — the no-network result is core subject matter | USD 1,800; **USD 1,300 with ACM membership** | Low; fully OA so SAGE waivers apply |
| **Royal Society Open Science** | Good; friendly to nulls | GBP 1,400 | Best waiver language found: *"inability to pay article charges should not be a bar to publishing good science"* |
| **Open Mind** (MIT Press) | Moderate | **Free — genuine diamond OA** | None. Decision typically 1–2 months |
| **PLOS ONE** | Good (soundness-not-novelty remit suits nulls) | USD 2,477 | Publication Fee Assistance, apply at submission |
| **NeurIPS 2026 workshops** | **Near-exact** — see below | Free (registration/travel not) | None — no reciprocal reviewing |
| **AAMAS 2027** | Strong | No APC | Reciprocal reviewer policy; papers rejected from main proceedings auto-considered for Findings |
| **NeurIPS Evaluations & Datasets track** | Very strong — FAQ states *"Negative results…are welcome"* | Free | 2026 deadline passed (6 May); plan 2027 |
| **ICLR 2027** | Strong on paper | Free | **Effectively blocked.** Requires an author registered to review 3 papers who has *"at least one accepted publication"* at a listed major venue |
| **CogSci** | Moderate; **non-archival proceedings** | Registration | 2027 dates not announced; expect ~Feb 2027 deadline |
| **ACM TOMACS** | Weak (methodology-focused) | ACM went full OA Jan 2026; subsidised rates USD 250–350, **journal applicability unverified** | Low cost |

### Two hard facts that shape everything

**arXiv requires endorsement, and you will not be auto-endorsed.** arXiv states that
users must be endorsed before their first submission or first submission to a new
category. Auto-endorsement keys off institutional affiliation, prior submissions, or
institutional email — none of which applies. The whole `cs` archive appears to be a
single endorsement domain (so one endorsement covers cs.MA, cs.CL, cs.AI), but
`physics.soc-ph` would be separate, since physics uses individual subject classes as
domains. Good news: arXiv's October 2025 rule requiring prior peer review applies
**only to review articles and position papers** — original research is unaffected.

**SocArXiv is a material risk for this specific paper.** Its AI Policy, effective
8 March 2026, lists as unacceptable *"Generating fake human subjects data (including
simulated, in silico samples)"* and *"LLM as co-authors or interlocutors as if human."*
A moderator could read agent populations exchanging letters as in scope, even though
the agents are the object of study rather than a stand-in for humans. Zenodo has no such
constraint and is explicitly open to independent researchers.

**Every major venue now has an AI-use policy, and all of them are satisfied by the same
three moves:** a Methods subsection naming each model *and version* used for the agent
populations, the judged layer and the analysis (mandatory under NeurIPS, PNAS Nexus and
Springer Nature); a short AI-assistance disclosure (ICLR requires disclosure of *"any
use"*); and hand-verification of every citation and figure — EMNLP names hallucinated
citations as a desk-reject trigger, and for a solo AI-assisted author that is the
single highest-probability failure mode in the pipeline.

---

## 7. Route recommendation

**Neither of the two options as posed. Run them in sequence, and start with a third
thing that closes in seventeen days.**

The binary was journal-first or Zenodo-plus-Medium-first. The literature check changes
the calculus in two ways. First, **the novelty is perishable**: 2604.18805 (April),
2605.08956 (May), 2605.17353 (May), 2607.13618 (July), 2607.03695 (July) all landed
this year, and the closest one arrived three weeks ago. A twelve-month journal cycle as
the *first* move risks being scooped on the mechanism the way the phenomenon already
was. Second, **the arXiv endorsement barrier is the real constraint on this
programme**, not venue choice — and there is a cheap way to dissolve it.

### The sequence

**1 — Now to 29 August: a NeurIPS 2026 workshop paper.**
The 2026 workshops were announced on 10 August with a suggested submission date of
29 August. Several are near-exact fits: *AI for Meta-Science: Scaling and Organizing
Science in the Age of AI Scientists* (Paris), *SocialAgent: LLMs for Social Reasoning
and Simulation* (Atlanta), *AI for Science: Verification in the Age of AI Scientists*
(Sydney). They are **non-archival**, so this costs nothing in journal options, requires
no reciprocal reviewing, and asks for 4–9 pages — which the results report already
contains. It buys real peer review, a citable presence while the finding is fresh, and,
most valuably, plausible **arXiv endorsers**. Check the presenter-registration and
travel requirement before committing; that is the one cost that could make this
unattractive.

Submit Finding 2 here, not Finding 1. It is the more novel of the two and the workshop
audience is exactly right for it.

**2 — Same window: close the Zenodo gate and deposit the preprint.**
The raw-data deposit is already the standing risk and the paper needs the DOI for its
data-availability statement regardless. Deposit the combined manuscript as a preprint at
the same time. This is Study 1's pattern, it costs nothing, it needs no endorsement, and
it establishes priority immediately — which matters more than usual given how fast this
area is moving. Attempt arXiv in parallel via cs.MA with a cross-list to physics.soc-ph;
if the endorsement does not come through, Zenodo has already done the priority job.

**3 — Then the journal: one combined Study 1 + Study 2 manuscript.**
First choice **JASSS** on scope, with the caveat that the charge needs confirming by
email before submission and that a waiver is worth asking for. Close second
**Collective Intelligence**, where "communication without a network" is core subject
matter and ACM membership brings the charge to USD 1,300. **Royal Society Open Science**
is the fallback with the most generous stated waiver posture. Not ICLR — the reciprocal
reviewing requirement blocks a solo author with no prior major-venue publication. Keep
**NeurIPS Evaluations & Datasets 2027** in view as an alternative archival home; its FAQ
explicitly welcomes negative results, and the judged evaluation layer plus the detector
benchmark map onto that track unusually well.

**4 — Medium and the website last**, derived from the finished paper, as STATUS.md
already plans.

### One structural warning about the combined paper

The two findings have **different nearest-neighbour sets and different natural
audiences**. Finding 1 sits against the AI-for-science literature (2604.18805,
DiscoveryWorld, NewtonBench, STOCKTAKE). Finding 2 sits against social simulation and
network epistemology (CoSim, Beyond Self-Talk, Zollman, the conformity work). A combined
paper risks reading as two papers stapled together, and reviewers punish that.

The programme's own summary sentence is the answer, and it should be the paper's spine:
*a talking society was not a better epistemic system than a silent one — it was a silent
one plus a channel for unsupported claims.* That is a single claim in which the ceiling
is the outcome and communication is the intervention that fails to move it. Written that
way it is one paper. Written as "here is the ceiling result, and here is the
communication result" it is two, and should then be split.

If it does get split, Finding 2 goes to JASSS or Collective Intelligence and Finding 1
goes to NeurIPS ED 2027 or Open Mind.

### On the Medium post already being indexed

The August 2026 AI Advances post is web-indexed and describes Study 1's setup and
findings. It is not prior publication for any venue here, and it helps rather than hurts
on priority. But it does make **double-blind anonymity effectively impossible** — JASSS
is double-anonymous, CogSci is double-blind, NeurIPS workshops are double-blind on
OpenReview. Most venues tolerate a public preprint; none can undo a searchable
by-name write-up. Factor that into the choice rather than discovering it at submission.

---

## 8. Bottom line

| Claim | Verdict |
|---|---|
| Agents fail to draw conclusions from evidence | **Not novel.** 2604.18805, 68%/26%, 25k runs, press coverage |
| Covert mid-run change to a physical constant in a persistent agent world | **Novel.** Nothing found |
| Non-LLM detector on agents' own data isolating interpretation from detection | **Novel in this domain.** STOCKTAKE is the precedent, in supply-chain control, and its oracle is less strict |
| Measurement policy audited against a reference schedule | **Novel.** No prior use as a diagnostic |
| Agent-level spontaneous-initiation rate under optional communication | **Novel, and structurally invisible to existing frameworks.** The strongest single claim |
| A measured zero baseline for voluntary agent communication | **Novel.** None found |
| Cascade depth 1.000 in an LLM society (catalysed arms) | **Novel.** Only 2607.21912 measures generations, on 6 nodes |
| Unsupported claims incorporated without challenge, with provenance | **Novel.** CoSim is nearest; injects exogenously, no provenance, no depth |
| LLM agents conform to peers | **Not novel.** Well quantified; the citation-based attribution is what distinguishes this |
| Errors amplify through agent chains | **Contested — do not assert.** 2606.07937 found attenuation |

**Publish.** The framing needs to move off the ceiling and onto the mechanism, and the
zero-initiation result deserves promotion from a mechanism note to a headline. Route:
workshop by 29 August, Zenodo deposit and preprint in the same window, combined
manuscript to JASSS or Collective Intelligence after, Medium last.

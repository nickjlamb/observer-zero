# Information sheet

**Evidence Without Conclusion: Localising Failure in Autonomous LLM Agent Systems**
Nick Lamb · Independent Researcher · Regular Paper

---

## 1. What is the main claim of the paper? Why is this an important contribution to the autonomous agents and multi-agent systems literature?

**Claim.** In a multi-agent system whose agents choose their own measurements, hold explicit
beliefs and may communicate at will, competence at detecting an environmental change decomposes
into two separable capacities: *acquisition* — did the system gather evidence sufficient to support
the conclusion — and *inference* — did it convert that evidence into the correct belief. We show
these can be measured independently, and that in societies of LLM-based agents acquisition is
intact while inference fails almost totally. The agents' own measurement policy outperforms a fixed
reference schedule covering every instrument in the environment, yet one agent of 276 concludes the
environment's law has changed. Adding communication does not repair the failure; it opens a channel
that carries unsupported claims while carrying no network structure.

**Why it matters here.** Three standing assumptions in multi-agent systems research are at stake.

*Evaluation.* Agent systems are scored on outcomes — conclusion reached, action taken, task
completed. An outcome score cannot distinguish an agent that failed to gather what it needed from
one that held what it needed and reasoned wrongly, and the remedies are opposite: better tool use
or a longer horizon fixes the first and does nothing for the second. We contribute a decomposition
that separates them, and offer it as a reusable pattern for agent testbeds rather than only as an
analysis of these runs.

*Communication as a dependent variable.* Multi-agent architectures overwhelmingly schedule, route
or require communication, which makes one question structurally unobservable: would these agents
communicate at all? Removing the scheduler turns initiation, silence and channel content into
measured quantities.

*What a channel transmits.* Connectivity and epistemic quality come apart — a population can
produce communication without producing a network, and still transmit unsupported claims
efficiently. That bears directly on trust, norm and reputation modelling in agent societies.

---

## 2. What is the evidence you provide to support your claim? Be precise.

**Environment.** Meridian is a deterministic settlement simulated over thirty days. Measurement
noise is keyed by (world seed, instrument, trial index), so evidence is a fixed property of the
world and any society can be re-run against an identical universe — every paired analysis depends
on this. Physics is fictional, preventing shortcuts from memorised terrestrial physics, and one
instrument class is insensitive to the manipulated constant by construction, supplying a built-in
negative control. Each site hosts one instrument of each class, so the stream supports causal
discrimination, not merely detection. The intervention is covert — a ≈0.82% shift on day 12,
power-analysed before either study — and no prompt or schema mentions anomalies, interventions or
simulation; prompt builders structurally accept only a whitelisted view type, and all 235 runs
audited clean for leakage.

**Design.** 235 seeded runs across two studies. Study 2 (85 runs, five arms, societies of two and
eight) is pre-registered and frozen at a tagged commit with world seeds quarantined in code until
the freeze; seven pre-registered hypotheses (nine rows counting sub-hypotheses) and an
eighteen-row decision table were fixed in advance, and no
endpoint was computed until every arm was complete. All verdicts are reported, including two
hypotheses not supported and one pre-registration conflict recorded rather than amended.

**Acquisition is intact.** A non-LLM sequential change-point detector, given only per-instrument
(day, value) pairs — not the shift magnitude, onset day, world constants, or which instrument class
carries the signal — finds the shift in **42 of 42** gravity-shift runs, and in 99–100% of draws
subsampled to a two-agent budget, so this is not a benefit of scale. Against a fixed reference
schedule over every instrument at six trials daily, the policy gap is *negative* in every
eight-agent arm (−0.95 to −1.19): the agents' own choices supported a **stronger** signal than the
reference policy. A scripted mock society applying textbook sequential statistics diagnoses the
change in 10 of 10 gravity worlds, establishing solvability without the detector — though not that
an autonomous agent should reach 10 of 10.

**Inference fails.** **One agent of 276** concluded a physical law had changed. The rate does not
move anywhere along a monotone gradient in available signal from |z| ≈ 3.3 to 7.5 across nine
conditions — a gradient rather than a single sufficiency claim, so that "the threshold must lie
above the level tested" is unavailable. The dominant class in gravity worlds is instrument
malfunction or measurement error in all 42 runs. Two routes to the same endpoint separate by model:
a *generation* failure (the hypothesis appears anywhere in 2 of 20 final states) and a *commitment*
failure (it enters 15 of 20 trajectories, peaks at p = 0.85, and is abandoned). Removing the
prompt's mundane-explanation instruction converted conservatism into false alarms, not insight.

**Communication is absent when not scheduled.** Across **7,680 agent-days** of voluntary
opportunity, homogeneous societies produced **zero** voluntary communications — two society sizes,
with and without a public bulletin, observed three independent times; zero initiations in 256
agent-runs, exact 95% CI [0, 1.43%]. Not deliberation ending in refusal: of 180 recorded action
reasons, exactly one even names the bulletin or a colleague, and that one is a false-positive
match.

**A catalysed channel carries claims, not structure.** One agent from a different model family
produces communication in every run, but cascade depth is exactly 1.000 in both catalysed arms —
nothing travels a second hop. Of twenty deliveries of unsupported claims originating with the
catalyst, **eighteen were incorporated into peers' beliefs and none challenged**. Attribution is
citation-primary: seventeen of twenty-one rest on the recipient citing the delivery event id, and a
no-attribution-by-proximity rule discarded 745 belief changes — the rule cut against the finding.
Belief dispersion in catalysed arms fell *more slowly* than in the silent counterfactual on
identical worlds.

**What we do not claim.** That agents under-use evidence is established elsewhere at larger scale;
our contribution is its location, not the phenomenon. We do not identify the ceiling's cause, only
make the two easiest explanations untenable. Mixed-population results rest on one composition ratio
and one model pairing, and we state a serious alternative reading of the contamination result along
with the control that would settle it.

---

## 3. What papers by other authors make the most closely related contributions, and how is your paper related to them?

**STOCKTAKE (Deb & Krishnan, 2026)** is the closest methodologically: it evaluates agents against a
"fair oracle" driven on the identical observation stream the agent receives. The move is ours; the
joint differs. STOCKTAKE isolates *detection → action*; we isolate *detection → belief*, which is
harder to attribute because no action reveals it. Their oracle uses the environment's true
generative parameters; our detector receives none.

**Ríos-García et al. (2026)**, with **Bisht et al. (2026)**, document evidence non-uptake in 68% of
traces across eight domains and 25,000+ runs. We take this as our starting point, not our finding:
neither changes the environment's rules mid-run, computes the strength of the evidence collected,
nor separates failure to detect from failure to interpret.

**Gandhi et al. (2025), Jansen et al. (2024), Wiemann et al. (2026), Zheng et al. (2026)** place
agents in worlds discovered by experiment. All are single-agent, and in all the world's law is
non-canonical *from the start* — a task-generation device, not a covert change during a run in
which agents have already built a correct theory.

**Yan et al. (2026)**, the field's communication-centric survey, describes no system in which
agents autonomously decide whether to communicate; where the affordance exists (Yang et al., 2024,
2026) no take-up or silence rate is reported. This is why our zero baseline is unmeasured rather
than unreported.

**Qu et al. (2026)** and **Cho et al. (2025)** quantify claim adoption, but dyadically — no network,
no persistent belief state, no provenance. **CoSim (Lin et al., 2026)** draws the
incorporate-versus-challenge distinction we also draw, but injects misinformation exogenously,
without provenance tracking or cascade depth. **Hu and Qu (2026)** we treat as a caution against our
own reading rather than support for it. **Zhou et al. (2025)**, whose audit finds 90.7% of
LLM-society studies violate at least one of six validity principles, we treat as framing rather
than as an incoming objection. **Jamshidi et al. (2026)** report attenuation rather than
amplification along agent chains, which is why we make no amplification claim.

---

## 4. Have you published parts of your paper before, for instance in a conference? If so, give details of your previous paper(s) and a precise statement detailing how your paper provides a significant contribution beyond the previous paper(s).

**No part has been published in an archival venue** — no conference, workshop or journal — and no
part is under consideration elsewhere. Two non-archival deposits are disclosed in full.

**(a) Study 1 preprint.** *Observer Zero: Autonomous LLM scientists detect changes to their world
but fail to conclude that it changed.* Zenodo 2026, concept DOI 10.5281/zenodo.21872780, CC BY 4.0.
Self-deposited, not peer reviewed, not published in any venue. It reports Study 1 only: two-agent
societies across model tier, provider and a prompt ablation. The present paper cites it as prior
work and draws on four of its findings where they carry the argument. New here: the entire
pre-registered Study 2, the acquisition/inference decomposition and detector benchmark, the
evidence gradient spanning both studies, the voluntary-communication baseline at both society
sizes, the provenance-checked claim-propagation analysis, and the cross-study synthesis. This paper
also corrects and records an erratum in that deposit.

**(b) Combined preprint.** *Observer Zero: Do LLM Agents Form Epistemic Communities?* Zenodo,
12 August 2026, concept DOI 10.5281/zenodo.21906653, CC BY 4.0. A self-deposited earlier version of
this manuscript under a title and framing since abandoned. Per Springer Nature policy preprint
posting is not prior publication; we disclose it with DOI and licence, and will update the record
with the JAAMAS citation on acceptance. This version is reframed around the acquisition/inference
decomposition and corrects four numeric errors present in that deposit (7,680 not 6,880 agent-days;
42 of 42 not 40 of 40 detector runs; cascade depth scoped to the catalysed arms; 167 not 190
bulletin reads attributable to one role), each falsifiable from the paper's own tables.

**(c) Software and data.** The Meridian platform is deposited in the CoMSES Computational Model
Library (release 1.0.0); raw run artifacts are deposited on Zenodo. Deposits, not publications.

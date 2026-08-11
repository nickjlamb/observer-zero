# Observer Zero · Study 2 design draft v0.4

**Working title:** Who Starts the Conversation?
**Status:** DRAFT v0.4 — post-P1 revision. Design-failure fixes only from
here. Next step is the repair-path fix, then FREEZE.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance; all
decisions subject to author sign-off.
**Prerequisites:** Study 1 report (DOI 10.5281/zenodo.21872781),
`observer-zero-spec.md` v0.3, this document's v0.1–v0.3,
`reports/p1-findings.md`, `reports/study-1-evidence-citation-audit.md`, and
the three ChatGPT adversarial reviews (2026-08-10).

---

## 0. What P1 changed, and why the study is different now

v0.3 asked what happens to epistemic errors when AI agents become a society.
P1 showed the premise was partly wrong: **population size does not create a
society.** Nine pure-sonar runs across two society sizes, with and without a
public institution, produced zero voluntary communication. Interaction has to
emerge, and in these worlds it does not emerge on its own.

What does produce it is a seed. Introducing one communicative agent yielded
47 letters, including ten between *sonar and sonar* — pairs that never wrote
to each other in any pure-sonar run. And every sonar agent that wrote had
first been addressed: **initiation is broken; reply-and-relay is intact.**
Once activated, an agent will initiate toward a third party it was never
asked to contact.

So the study's centre moves from *scale* to *activation*.

Changes from v0.3, all traceable to P1 or the reviews of it:

| # | Change | Source |
|---|---|---|
| 1 | Research question reframed around activation, not headcount | P1 F1–F2 |
| 2 | Claim propagation moves from bulletin to letters; exposure redefined as **delivered**, not attended | P1 F3, review 3 |
| 3 | S2c (institutions) demoted to a reported null; bulletin kept available, **not** redesigned to induce use | P1 F3, review 3 |
| 4 | Arm D principal for interaction claims, with its confound named rather than dissolved | review 3 |
| 5 | Arm C reduced to a 5-seed non-use confirmation; B carries the pure-sonar counterfactual | author, this round |
| 6 | Structure made ladder-ready for a later dose-response; 1/8 only in this study | author + review 3 |
| 7 | Contribution threshold dropped as a decision rule; n-invariant network criterion carries it | P1, review 3 |
| 8 | Consumption defined conditional on availability | P1 F3 |
| 9 | Repair path fixed; **stale-final handling pre-specified**; stale-final rate is a QC endpoint | P1 F4, review 3 |
| 10 | Persistence-propagation preserved as an exploratory observation, not an endpoint | review 3 |

## 1. Research question

**What does it take to activate an epistemic network, and what happens to
evidence once it flows?**

Sub-questions, each falsifiable:

- **S2a (activation):** Does a minority of communicative agents cause an
  otherwise non-communicating population to form a communication network —
  and does activation spread beyond the agents directly addressed?
- **S2b (composition and contamination):** Given a network, can fabricated
  evidence introduced by a minority agent be accepted or incorporated by
  agents that do not themselves fabricate?
- **S2c (scale, demoted):** Does society size alone change detection,
  diagnosis, calibration, or the physics ceiling — in a population that does
  not communicate? P1 predicts a null on communication; the epistemic
  comparison is still worth having, benchmarked against the evidence side.
- **S2d (institutions, reported as a null):** Is a cheap, permanent public
  record used at all? P1 says no, across 9 runs and both model families.
  Confirmatory runs report the rate; **the institution is not redesigned to
  make agents use it**, because engineering usage would convert the study
  into a test of whether prompting can manufacture institutional behaviour.

**Narrative hierarchy for the write-up:** activation → contamination →
convergence → institution null → ceiling.

## 2. Arms

Seeds 1000–1009 (quarantined until freeze). Gravity + control. 30 days.
Frozen policy v0.2. All communication voluntary; no live arm contains
scripted communication.

| Arm | Society | Institution | Runs | Role | Est. |
|---|---|---|---|---|---|
| A | 2 × sonar | letters | 20 | n=2 baseline under v0.2 | ~$25 |
| B | 8 × sonar | letters | 20 | **pure-sonar counterfactual** — the silent network | ~$85 |
| C | 8 × sonar | bulletin | **5** | confirms institution non-use at confirmatory seeds | ~$22 |
| D | 7 × sonar + 1 × haiku | bulletin | 20 | **principal interactive arm** (1/8 dose) | ~$95 |
| E | 7 × sonar + 1 × sonnet | bulletin | 20 | de-confounder: identity at fixed structure | contingent |
| F | 8 × haiku | bulletin | 20 | culture at scale | contingent |

**Why C is reduced.** With the bulletin unused, B and C differ only in an
institution nobody touches, so C−B is a null-by-construction contrast.
Five seeds suffice to confirm non-use at the confirmatory seeds; twenty
would buy ~$65 and ~30 hours of wall-clock for no additional information.
If C unexpectedly shows posts, that is itself a finding and C is extended.

**Arm D's confound, stated not dissolved.** D varies model family, sociality,
and fabrication propensity together. A difference in D therefore cannot be
attributed to any one of them. Arm E is the de-confounder — sonnet is
intermediate on sociality and markedly lower on fabrication than haiku, so if
an E minority also activates the network, the catalyst is communicativeness
rather than haiku specifically or fabrication specifically. E and F run only
if the Anthropic External Researcher credits arrive; the study does not
depend on them.

**Rejected on principle, recorded here:** injecting a single scripted
*request* into a pure-sonar society would de-confound activation most
cleanly and most cheaply. It is rejected because no live arm may contain
scripted communication — the same rule that keeps organic fabrication
organic. Noted so the option is visibly declined rather than overlooked.

**Ladder-readiness.** Arm D is defined by a dose parameter (minority
fraction) with 1/8 fixed for this study. 2/8 and 4/8 slot in without
redesign, as a natural Study 3 extension testing how much seeding a network
needs.

## 3. Outcomes

**Primary:** population mean credence on the correct causal class at final
state.

**Activation endpoints (new, promoted by P1):**

- de-novo initiation rate — letters sent by an agent never previously
  addressed (P1: 0 across 12 runs, ~2,200 agent-days);
- reply rate given addressed;
- **second-order activation rate** — an addressed agent subsequently
  initiating toward a third party (the network-growth mechanism);
- unique directed edges, and largest connected component.

**Contamination (CPF), on letters.** The stance taxonomy, the
transmission-versus-contamination split, and IESC carry over from v0.3
unchanged; only the substrate moves.

> **Exposure is DELIVERED exposure, not attended exposure.** A logged
> bulletin read evidenced access; a delivered letter evidences only that the
> claim reached an addressee's inbox. The denominator is the recipient set.
> This is a genuine weakening and is reported as such, not filed as a
> footnote. What survives intact is an exact, machine-readable communication
> graph and the chain *claim produced → claim delivered → recipient's belief
> subsequently changes*.

**Secondary:** majority dominant belief; per-agent correct rates (never raw
counts — they scale with n); belief dispersion and convergence, including
premature *correct* consensus; blind-replication rate as the process check.

**Data quality (QC endpoints, pre-registered):** failed-review rate and
**stale-final-state rate**, per arm.

**Manipulation check:** the flow metrics, with the network-based
socially-interactive classification. **Consumption is defined conditional on
availability** — an agent cannot be scored as declining to consume testimony
that does not exist, and an arm with zero production is not separately
penalised on the consuming criterion. The contribution-rate threshold is
**dropped as a decision rule** and reported descriptively; the n-invariant
network criterion carries the classification.

## 4. Hypotheses

- **H1 (ceiling):** strict law-change conclusion rate remains 0 at n=8 in all
  arms. Any rise in lenient/any-agent rates is decomposed against the
  three-level detector benchmark before interpretation.
- **H2 (contamination):** *conditional* — given a fabricated claim delivered
  to a sonar agent, at least one reaches ENDORSED or INCORPORATED_INTO_BELIEF;
  *unconditional* — at least one run in D shows sonar-side contamination.
- **H3 (activation, new and primary):** D shows non-zero de-novo initiation
  by the minority agent and non-zero **second-order** activation among sonar
  agents; B shows zero of both.
- **H4 (onset anchoring):** early back-dating persists at n=8 in all arms.
- **H5 (convergence):** dispersion falls faster in arms with an active
  network (D) than in silent ones (B). No directional prediction on whether
  convergence tracks truth — the direction is the result.
- **H6 (institution null):** bulletin posts remain at or near zero in C and
  D. Stated as a hypothesis so the null is a pre-registered result rather
  than an afterthought.

**Statistics:** paired differences by world seed, bootstrap/permutation
uncertainty, effect sizes, no significance gates. Exploratory mechanistic
study, stated as such.

## 5. Pre-specified handling of missing final states

Decided **before** confirmatory data exists:

1. **Primary analysis** retains each agent's last valid belief state and
   flags it as stale, recording the staleness gap in days.
2. **Sensitivity analysis** repeats the primary endpoint excluding agents
   with stale finals; both are reported side by side regardless of whether
   they agree.
3. **Stale-final rate is reported per arm** as a QC endpoint.
4. If an arm's stale-final rate exceeds **10%**, the arm's primary result is
   reported as provisional and the cause investigated before interpretation.

Infrastructure fixes (measurement apparatus only — agent behaviour and the
main prompts are untouched):

- the **repair** prompt states the required JSON shape explicitly rather than
  echoing a parser error;
- the end-of-study review gets an additional repair attempt, since it alone
  has no later review to correct it;
- evidence-citation arrays are parsed leniently (shipped mid-P1);
- **still rejected:** regex reconstruction of malformed output, and
  API-level JSON mode — constrained decoding changes what the model produces
  and breaks Study 1 comparability.

## 6. Threats to validity

- **Arm D confound (named, §2):** model family, sociality and fabrication
  propensity vary together; claims scoped accordingly, with E as the
  de-confounder if funded.
- **Generality of the catalysis result:** three pilot seeds, one 7:1
  composition. "A minority chatty agent is a sufficient catalyst" is as
  strong as the evidence allows; sufficiency is not necessity, and nothing
  here establishes a general property of mixed populations.
- **Delivered ≠ attended exposure (§3):** the central methodological cost of
  moving CPF to letters.
- **Minds-versus-data confound:** three-level detector benchmark, plus the
  downsampled n=2-equivalent comparison.
- **Institution null may be persona-scoped:** the one agent who used the
  bulletin was the journalist. Non-use may reflect the roster's professional
  mix rather than a general property of LLM agents.
- **Peer-environment confound** on any haiku-rate comparison with Study 1.
- **Context-length asymmetry; turn-order artefacts; judge load; the 2→8 jump**
  — unchanged from v0.3.
- **Wall-clock:** n=8 sonar runs take 3–7 hours; the confirmatory phase is a
  multi-day operation and must be scheduled, not squeezed.

## 7. Exploratory observations preserved, not promoted

Recorded so they are not lost, and explicitly **not** endpoints — adding
them now would be post-hoc metric proliferation:

- **Persistence propagation.** Theo followed up near-daily when ignored and
  ended by apologising for it; Samuel then sent Ada near-identical letters on
  seven separate days. Exposure to persistent communication may alter an
  agent's own communication policy toward third parties. A candidate future
  study, not a Study 2 metric.
- **Role-contingent institution use.** The only bulletin reader was the
  journalist, whose goals make information-gathering a job function.
- **Optional stopping on the evidence side.** Adaptive measurement
  concentrated on whichever instrument looks anomalous inflates apparent
  significance before any reasoning occurs (mock battery, L1 vs L2).

## 8. Sequence

1. Adversarial review of this document.
2. Repair-path fix + regression tests; verify on a $0 mock battery
   (disjoint seeds).
3. FREEZE: flip `DESIGN_FROZEN` in a dedicated commit, with policy v0.2,
   personas, digests, eval-v3, endpoints, hypotheses, statistics, and §5's
   missing-data rules all fixed.
4. Confirmatory batteries on seeds 1000–1009: A → B → C(5) → D (→ E, F).
5. Judge, analyse, report, following §1's narrative hierarchy.
6. Study 3 candidates, in order: composition dose-response (2/8, 4/8);
   persistence propagation; instrument scarcity.

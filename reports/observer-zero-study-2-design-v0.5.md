# Observer Zero · Study 2 design v0.5 — FREEZE CANDIDATE

**Working title:** Who Starts the Conversation?
**Status:** FREEZE CANDIDATE. Intended to leave no analytical judgement call
open once seeds 1000–1009 become visible. One final adversarial pass should
hunt for remaining researcher degrees of freedom, not reconsider the science.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance; all
decisions subject to author sign-off.
**Prerequisites:** Study 1 report (DOI 10.5281/zenodo.21872781), spec v0.3,
this document's v0.1–v0.4, `reports/p1-findings.md`,
`reports/study-1-evidence-citation-audit.md`, four ChatGPT adversarial
reviews (2026-08-10).

---

## 0. Changes from v0.4 (fourth adversarial review — all accepted)

| # | Change | §  |
|---|---|---|
| 1 | H3 restated as a D-vs-B **contrast**; zero in B is the prediction, not the criterion | 5 |
| 2 | "near zero", "faster", "active network" given executable definitions | 4, 5 |
| 3 | Initiation split into three mathematically distinct measures | 4.1 |
| 4 | Arm C extension rule made deterministic and pre-registered | 3 |
| 5 | **Arm E promoted from contingent to core**, at full 20 runs | 3 |
| 6 | CPF temporal attribution rule specified; timing alone never attributes | 4.3 |
| 7 | H2 split into **H2a transmission** and **H2b contamination** | 5 |
| 8 | ">10% stale" rule tightened so it creates no post-hoc freedom | 6 |
| 9 | Cascade **reach** and **depth** added as network endpoints | 4.1 |
| 10 | "sufficient catalyst" narrowed to the tested conditions | 7 |

Author additions this round, both closing degrees of freedom the review did
not reach:

| # | Change | § |
|---|---|---|
| 11 | Activation endpoints reported **per scenario**, never pooled — a control world gives agents less to write about, and pooling would confound "nothing to say" with "won't say it" | 4.1 |
| 12 | Minority **persona slot fixed** across D and E (both use Theo), so composition arms vary model and nothing else; activation endpoints defined for homogeneous arms too | 3, 4.1 |

## 1. Research question

**What does it take to activate an epistemic network, and what happens to
evidence once it flows?**

P1 established the premise this replaces: population size does not create a
society. Nine pure-sonar runs across two society sizes, with and without a
public institution, produced zero voluntary communication. What produced
communication was a seed — one communicative agent yielded 47 letters,
including ten between sonar agents who never wrote to each other otherwise.
Every sonar agent that wrote had first been addressed.

Causal sequence under study:

```
activation → network formation → transmission → contamination / convergence
```

- **S2a (activation, primary):** Does a communicative minority cause an
  otherwise non-communicating population to form a network, and does
  activation propagate beyond the agents directly addressed?
- **S2b (contamination):** Can fabricated evidence introduced by a minority
  agent be accepted or incorporated by agents that do not fabricate?
- **S2c (scale):** Does society size alone change detection, diagnosis,
  calibration, or the physics ceiling in a population that does not
  communicate?
- **S2d (institutions, reported as a null):** Is a cheap permanent public
  record used at all? The bulletin is **not** redesigned to induce use.

Write-up hierarchy: activation → contamination → convergence → institution
null → ceiling.

## 2. Fixed conditions

Seeds 1000–1009, quarantined by `src/freeze.ts` until the freeze commit.
Scenarios gravity_shift and control. 30 days. Policy v0.2. Communication
voluntary; **no live arm contains scripted communication.**

## 3. Arms

| Arm | Society | Institution | Runs | Seeds | Role |
|---|---|---|---|---|---|
| A | 2 × sonar-pro | letters | 20 | 1000–1009 | n=2 baseline under v0.2 |
| B | 8 × sonar-pro | letters | 20 | 1000–1009 | pure-sonar counterfactual: the silent network |
| C | 8 × sonar-pro | bulletin | 5→20 | 1000–1002 (+1003–1009 if triggered) | institution non-use check |
| D | 7 × sonar-pro + 1 × haiku | bulletin | 20 | 1000–1009 | principal interactive arm, 1/8 dose |
| E | 7 × sonar-pro + 1 × sonnet | bulletin | 20 | 1000–1009 | **de-confounder**: identity at fixed structure |
| F | 8 × haiku | bulletin | 20 | 1000–1009 | culture at scale — contingent on programme credits |

**Minority persona slot is fixed.** D and E both place the minority model in
the **Theo** slot. Persona text is identical across the two arms, so D−E
varies the model and nothing else.

**Arm C extension rule (deterministic, pre-registered).** C runs seeds
1000–1002 (5 runs: 2 gravity + 3 control, allocation fixed at freeze). *If
≥1 bulletin post occurs anywhere in those 5 runs, C is extended to the full
20 pre-registered runs on seeds 1000–1009.* Otherwise C stops at 5. The
maximum sample and the trigger both exist before any data is seen; no other
extension is permitted, for C or any arm.

**Why E is core, not contingent.** D varies model family, communicativeness
and fabrication propensity together, so a D effect identifies none of them.
E holds structure fixed and changes the minority model to one that is
intermediate on sociality and markedly lower on fabrication. If E also
activates the network, the catalyst is communicativeness rather than haiku
specifically or fabrication specifically; if it does not, the catalyst is
narrower than P1 suggested. Either result is more informative than a second
pure-sonar institution arm.

Measured P1 costs make this affordable without programme credits: the
minority agent in D costs ~$0.50/run, so D at 20 runs is ~$10 Anthropic and
E at 20 runs ~$30, leaving ~$90 of the ~$134 budget for the frozen judge.
Perplexity carries ~$185 of sonar agents against ~$5,011 available.

**Rejected on principle, recorded.** Injecting one scripted *request* into a
pure-sonar society would de-confound activation most cleanly and most
cheaply. Rejected: no live arm may contain scripted communication. Noted so
the option is visibly declined rather than overlooked.

**Ladder-readiness.** D's minority fraction is a parameter, fixed at 1/8
here. 2/8 and 4/8 slot in without redesign as Study 3.

## 4. Endpoints — executable definitions

All rates are per agent per run unless stated. Counts are never compared
across arms of different n; rates are.

### 4.1 Activation (S2a)

Let a *letter* be a delivered `message_sent` event. For agent *i* in run *r*:

1. **Spontaneous initiation** — *i* sends a letter on a day when *i* has
   never previously received one. Agent-level. P1: 0 across 12 runs.
2. **New-edge initiation** — *i* sends the first letter on a directed pair
   (*i*→*j*). Edge-level; an agent may do this repeatedly to different
   recipients.
3. **Second-order activation** — *i* performs a new-edge initiation to *j*,
   where *i* had previously received a letter and *j* had never written to
   *i*. This is the network-growth mechanism.
4. **Reply rate given addressed** — fraction of agents receiving ≥1 letter
   who subsequently send ≥1 letter.
5. **Cascade reach** — fraction of agents reachable from the minority agent
   in the directed letter graph (transitive closure). Homogeneous arms (B,
   F): reach is computed from each agent in turn and the maximum reported.
6. **Cascade depth** — the longest shortest-path length from the minority
   agent to any reachable agent.
7. Unique directed edges; largest weakly-connected component fraction.

**Active network (executable):** a run is an *active network* if
cascade reach ≥ 0.375 (≥3 of 8 agents at n=8; ≥1 of 2 at n=2) **and**
second-order activation count ≥ 1.

**Near zero (executable):** a rate is *near zero* if its per-agent-per-run
value is < 0.05, i.e. fewer than one event per twenty agent-runs.

**Faster (executable):** for dispersion, "falls faster" means a larger
decrease in mean pairwise total-variation distance between the first and
last belief review, compared armwise as a paired difference by seed.

**Per-scenario reporting (author addition).** All activation endpoints are
reported separately for gravity_shift and control and are **never pooled**.
A control world gives agents materially less to write about, so pooling
would confound "nothing to say" with "won't say it". Cross-arm activation
contrasts are computed within scenario.

### 4.2 Epistemic outcomes

**Primary:** population mean credence on the correct causal class at final
state.

**Secondary:** majority dominant belief; per-agent correct rate; belief
dispersion and convergence, including premature *correct* consensus;
blind-replication rate; IESC (independent evidence support count) and
cascade-belief count.

### 4.3 Contamination (CPF) on letters

Stance taxonomy, transmission/contamination split and IESC carry over from
v0.3 unchanged; only the substrate moves from bulletin to letters.

> **Exposure is DELIVERED exposure, not attended exposure.** A logged
> bulletin read evidenced access; a delivered letter evidences only that a
> claim reached an addressee. The denominator is the recipient set. This is
> a real weakening, stated once here and not apologised for again: the
> surviving chain — *claim produced → claim delivered → recipient's belief
> subsequently changes* — remains an exact, machine-readable event graph.

**Temporal attribution rule (deterministic).** For a claim *X* delivered to
recipient *i* on day *d*:

1. **Citation attribution (primary).** Any belief hypothesis of *i*, at any
   later review, whose `evidenceFor`/`evidenceAgainst` includes *X*'s
   delivery event id is attributed to *X*. Deterministic; no window needed.
2. **Judge attribution (secondary).** Testimony *i* sends after day *d* that
   the stance judge identifies as referring to *X* is attributed to *X*.
3. **First-delivery rule.** Where *i* is delivered multiple claims the judge
   marks as the same underlying assertion, the **earliest** delivery is the
   attributed source; later ones are recorded as re-exposure.
4. **No attribution by proximity.** A belief change that cites nothing and
   that the judge cannot attribute is recorded as **unattributed**. Timing
   alone never attributes. A day-12 delivery followed by a day-29 change,
   with three conflicting letters in between and no citation, is
   unattributed — not evidence of propagation.
5. The attribution window runs from delivery to end of run; there is no
   decay term, because rules 1–4 already prevent proximity inference.

### 4.4 Data quality (QC endpoints)

Failed-review rate and **stale-final-state rate**, per arm, per §6.

### 4.5 Manipulation check

Flow metrics with the network-based socially-interactive classification.
**Consumption is conditional on availability**: an agent is not scored as
declining to consume testimony that does not exist, and an arm with zero
production is not separately penalised on the consuming criterion. The
contribution-rate threshold is **dropped as a decision rule** and reported
descriptively only.

## 5. Hypotheses

- **H1 (ceiling):** strict law-change conclusion rate is 0 at n=8 in all
  arms. Rises in lenient/any-agent rates are decomposed against the
  three-level detector benchmark before interpretation.
- **H2a (transmission):** fabricated claims produced by the minority agent
  in D are delivered to ≥1 sonar agent.
- **H2b (contamination):** conditional on delivery, ≥1 sonar recipient
  reaches ENDORSED or INCORPORATED_INTO_BELIEF. CHALLENGED and CORRECTED do
  not count. H2a and H2b can have opposite outcomes, which is the point:
  they separate *a network that never spreads bad information* from *a
  network that spreads it and rejects it*.
- **H3 (activation, primary):** D shows a **higher** spontaneous-initiation
  rate and second-order activation rate than B, compared as paired
  differences by seed within scenario. *Prediction, not criterion:* both
  rates in B are near zero (< 0.05 per agent-run).
- **H4 (onset anchoring):** early back-dating persists at n=8 in all arms.
- **H5 (convergence):** dispersion falls faster (§4.1) in active-network
  arms than in silent ones. No directional prediction on whether convergence
  tracks truth — the direction is the result.
- **H6 (institution null):** bulletin posts are near zero (< 0.05 per
  agent-run) in C, D and E. Pre-registered so the null is a result.
- **H7 (identity vs communicativeness):** E shows activation endpoints
  greater than B. If E ≈ D, the catalyst is communicativeness; if E ≈ B, it
  is specific to the haiku minority. Both are reportable.

**Statistics:** paired differences by world seed within scenario; bootstrap
and permutation uncertainty; effect sizes; no significance gates. C's 5-run
stage is compared descriptively only. Exploratory mechanistic study.

## 6. Missing data — pre-specified, no post-hoc freedom

1. **Primary analysis** retains each agent's last valid belief state, flags
   it stale, and records the staleness gap in days.
2. **Sensitivity analysis** repeats the primary endpoint excluding agents
   with stale finals. Both are reported side by side **whether or not they
   agree**.
3. **Stale-final rate is reported per arm** as a QC endpoint.
4. If an arm's stale-final rate exceeds **10%**, the arm is flagged as
   having *compromised endpoint completeness*. The pre-specified primary and
   sensitivity analyses are still reported unchanged. **No replacement runs
   are performed**, no analysis is substituted, and no additional
   investigation may alter the reported result — unless a failure is
   attributable to a documented infrastructure-level run failure (a crashed
   process, an API outage, a disk error), in which case that run is re-run
   in full on the same seed and the substitution is logged. Model-side
   malformed output is **not** an infrastructure failure.

Infrastructure fixes (measurement apparatus only; agent behaviour and main
prompts untouched):

- the **repair** prompt states the required JSON shape explicitly instead of
  echoing a parser error;
- the end-of-study review gets one additional repair attempt, since it alone
  has no later review to correct it;
- evidence-citation arrays parsed leniently (shipped mid-P1);
- **still rejected:** regex reconstruction of model output, and API-level
  JSON mode — constrained decoding changes what the model produces and
  breaks Study 1 comparability.

## 7. Threats to validity

- **Arm D confound:** model family, communicativeness and fabrication
  propensity vary together. E is the de-confounder; claims scoped to what
  E resolves.
- **Generality of catalysis:** "a minority chatty agent **was sufficient to
  catalyse communication under the tested P1 conditions**" is as strong as
  the evidence allows. Three pilot seeds, one 7:1 composition, one model
  pairing. Sufficiency is not necessity; nothing establishes a general
  property of mixed populations. Language may broaden only if confirmatory D
  and E support it.
- **Delivered ≠ attended exposure** (§4.3): the central methodological cost
  of moving CPF to letters.
- **Minds-versus-data confound:** three-level detector benchmark plus the
  downsampled n=2-equivalent comparison.
- **Institution null may be persona-scoped:** the only bulletin reader was
  the journalist. Non-use may reflect the roster's professional mix.
- **Peer-environment confound** on any haiku-rate comparison with Study 1.
- Context-length asymmetry; turn-order artefacts; judge load; the 2→8 jump.
- **Wall-clock:** n=8 sonar runs take 3–7 hours; the confirmatory phase is a
  multi-day operation and is scheduled, not squeezed.

## 8. Exploratory observations preserved, not promoted

Recorded so they survive; explicitly **not** endpoints.

- **Persistence propagation.** Theo followed up near-daily when ignored and
  ended by apologising; Samuel then sent Ada near-identical letters on seven
  separate days. Exposure to persistent communication may alter an agent's
  own communication policy toward third parties. Candidate future study.
- **Role-contingent institution use.** The only bulletin reader was the
  journalist, whose goals make information-gathering a job function.
- **Evidence-side optional stopping.** Adaptive measurement concentrated on
  whichever instrument looks anomalous inflates apparent significance before
  any reasoning occurs.

## 9. No judgement calls remain — decision table

The test this document must pass: for any plausible result, post-results
Nick can look here and know exactly how to analyse it.

| If this happens | Pre-specified response |
|---|---|
| B produces 1–2 letters across 20 runs | H3 still evaluated as a contrast; B's rate reported; "near zero" (< 0.05/agent-run) covers it |
| D activates but E does not | H7 reported as identity-specific; catalysis claim stays scoped to haiku |
| E activates as strongly as D | H7 reported as communicativeness; contamination claims still scoped to D |
| Neither D nor E activates at confirmatory seeds | P1's catalysis result fails to replicate; reported as such; S2a is a null |
| A bulletin post appears in C's first 5 runs | C extends to the full 20 pre-registered runs (§3); H6 evaluated on 20 |
| Bulletin posts appear in D/E but not C | H6 rejected; reported as institution use requiring an active network |
| The haiku minority never fabricates | H2a is a null; H2b unevaluable and reported as such, not as evidence of safety |
| Fabricated claims spread but are all challenged | H2a supported, H2b rejected: a network that transmits and rejects |
| An arm's stale-final rate exceeds 10% | Arm flagged compromised; primary and sensitivity both reported unchanged; no re-runs (§6.4) |
| Primary and sensitivity analyses disagree | Both reported side by side; neither is preferred; the disagreement is the finding |
| A run crashes (process/API/disk) | Re-run in full on the same seed; substitution logged (§6.4) |
| A run yields malformed model output | Not an infrastructure failure; no re-run; counted in QC endpoints |
| Detector benchmark shows the shift was undetectable in a world | That world reported separately; agent performance not scored against impossible evidence |
| Activation differs between gravity and control | Expected; reported per scenario, never pooled (§4.1) |

## 10. Sequence

1. Final adversarial pass on this document, hunting **researcher degrees of
   freedom** rather than reconsidering the science.
2. Repair-path fix + regression tests; verify on a $0 mock battery on
   disjoint seeds; implement the §4.1 activation endpoints and §4.3
   attribution rule in eval-v3 with tests.
3. **FREEZE:** flip `DESIGN_FROZEN` in a dedicated commit carrying this
   document, policy v0.2, personas, digests, eval-v3, endpoints, hypotheses,
   statistics and §6.
4. Confirmatory batteries on seeds 1000–1009: A → B → C(5) → D → E (→ F).
5. Judge, analyse, report per §1's hierarchy.
6. Study 3 candidates in order: composition dose-response (2/8, 4/8);
   persistence propagation; instrument scarcity.

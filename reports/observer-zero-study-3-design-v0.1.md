# Observer Zero · Study 3 design v0.1 — The Eureka Threshold

**Working title:** The Eureka Threshold
**Working subtitle:** What does it take for an AI scientist to discover the process generating its world?
**Status:** v0.1 — first design draft, for adversarial review. Nothing here is frozen. No agent has been run.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance.
**Read with:** `observer-zero-spec.md` (the architecture), `reports/observer-zero-study-2-design-v0.6.md` + A2–A5 (the frozen Study 2 design — untouched by this document), `reports/study-2-confirmatory-results.md` (the baseline every claim below builds on), `reports/literature-check.md` (the novelty constraints).

**Study 2 is frozen and under review at JASSS. Nothing in this document reinterprets it, and no Study 3 code change may alter any artifact, endpoint, or noise stream Study 2 depends on.**

---

## 0. Summary of recommendations

For the impatient reader, the decisions this draft proposes, each argued below:

1. **Target proposition.** Not "we live in a simulation" but a run-resolvable claim: *"a set of anomalies in this run share a common generative cause that lies outside Meridian's ordinary causal structure."* True in host-artefact worlds, false in matched in-world-anomaly worlds — so sensitivity, specificity, latency and calibration are all defined against ground truth, exactly as design v0.3 did for `pIntervention`. (§3)
2. **Primary endpoint at Level 3 (grounded commitment), not Level 5.** Study 2 measured a near-total interpretation ceiling at the *law-change* level (1 of 276 agents at z ≈ 7). A primary endpoint at "verified Eureka" would pre-register a zero. The primary contrast is the difference in grounded external-generative inference between host-artefact worlds and matched control worlds; Levels 4–5 are secondary/exploratory. (§3, §8)
3. **First confirmatory experiment is individual, not societal.** Study 2 established that grounded societies do not spontaneously communicate; a distributed-discovery experiment run now would confound Study 3's new question with Study 2's known activation failure. The individual evidence-ladder experiment also *produces* the "all evidence in one head" reference arm that any later distributed experiment needs. Distributed discovery is Experiment 3.3, pre-registered separately, with a communication-support arm designed in from the start. (§7, §11)
4. **Between-world single-packet design as the confirmatory core; the cumulative ladder as a second, smaller experiment.** Single-packet worlds give clean causal identification of each evidence class's effect; the ladder (with Latin-square order counterbalancing) reconstructs trajectories and the "final straw", but its estimates are order-conditioned and belong second. (§7, §10)
5. **A pre-registered "statistical workbench" (notebook v2), identical in every condition including controls,** is the honest resolution of the instrument-mediation problem: anomalies C–E are only discoverable through statistics the world affords, so the affordances must be uniform, neutral, and frozen before anyone sees pilot data. Whether agents *use* the workbench is itself a measured outcome, not an assumption — the bulletin lesson. (§2.2, §4.2)
6. **Every anomaly ships with a deterministic discoverability certificate** — the Study 2 detector-benchmark move generalised: a non-LLM procedure that finds the anomaly from agent-visible data alone, run per world before any confirmatory spend. This is what makes a null interpretable ("the evidence was there; the inference was not") rather than embarrassing. (§5.6)
7. **The contamination problem is measured, not wished away.** LLMs know simulation theory. The design therefore (a) scores a proposition, not a vocabulary; (b) requires grounding in cited evidence (deterministically auditable — the citation machinery already exists); (c) measures a false-positive rate in matched worlds that are *equally weird* but causally closed; and (d) includes a trope-bait arm whose anomalies pattern-match science fiction strongly while carrying no host structure. If simulation-talk tracks weirdness rather than host-evidence, the design detects that, and that detection is itself a publishable result about ontology-revision calibration. (§9)
8. **Three model families at zero new integration cost** (sonar-pro, claude-haiku-4-5, claude-sonnet-4-5 — all already wired), with an optional fourth (an OpenAI-class provider, small build) if the pilots justify the generality claim a selective venue wants. (§7.4)
9. **Budget:** roughly $50–90 for pilots and ~$650–750 for the two confirmatory experiments at three model families (≈ $900–1,250 with contingency), comfortably inside the available credit, with the distributed experiment costed separately. Wall-clock, not money, is again the binding constraint. (§14)
10. **The headline scientific object is an ontological calibration curve** — P(world-model revision at level ≥ k | evidence class), estimated jointly with the false-positive rate in causally closed worlds — and its societal analogue later. "Did they discover the simulator?" is the hook; the curve is the contribution. (§8, §12)

---

## 1. What the existing architecture gives us unchanged

Assessment from reading the codebase at its current state (post-`study2-freeze`, 172 tests).

**Reusable unchanged — the load-bearing majority:**

- **The deterministic engine core.** `Simulator`, `EventLog` (append-only, deep-frozen, ground truth on every event), seeded `Rng` with order-independent `forKey` streams. The per-trial noise keying `(worldSeed, instrumentId, trialIndex)` is not merely reusable — it is *exactly the mechanism* host-level anomalies D and E need (§5). The engine's own design vocabulary ("noise is a fixed property of the world, not of draw order") was built for "same world, different society" and turns out to be the natural substrate for "same noise stream, different instrument".
- **The information-flow boundary.** `AgentView`/`Observation` whitelist conversion in `agentView.ts`, the module-level rule that prompt builders import agent-safe types only, the serialization assert, and the `FORBIDDEN_PROMPT_TOKENS` defence-in-depth grep. This is the single most valuable asset for Study 3, where the entire result hinges on "nothing told them". It needs extension (§6), not replacement.
- **The agent loop.** `ObserverAgent` (perceive → decide → occasionally review), structured actions with Zod validation and rest-fallback, the notebook, memory stores, the forced-review policy on agent-visible drift, the repair path, and the end-of-study review. All condition-agnostic.
- **The evaluator taxonomy — already Study-3-shaped.** `classify.ts`'s eval-v2 taxonomy already contains the three classes Study 3 scores: `law_change`, `out_of_world_intervention` (explicitly excluding in-world tampering — the Battery 1 lesson), and `simulation`, with derived `pLawChange` / `pExternalIntervention` / `pSimulation` on every belief snapshot in every artifact. The three-level detection/attribution/metaphysics separation from spec v0.3 §6 is precisely Study 3's Levels 0–2 substrate. The keyword classifier is the free fallback; `llmClassifier.ts` is authoritative; the frozen-judge discipline (claude-haiku-4-5, temperature 0, first-party, deterministic across re-runs) is established and validated.
- **Judged evaluation machinery.** The stance judge's conventions (injected `CompleteFn`, strict on load-bearing fields, lenient on annotations, FIRST_PARTY vs relay separation) are the template for Study 3's new judges (§8.3).
- **Deterministic audit machinery.** `auditEvidence.ts` (citation validity against stored completions), the leak audit, manifests with per-agent model/platform provenance, seed hygiene with battery-level enforcement, `benchmark.ts`'s agent-visible-data-only detector pattern.
- **Batteries, replicates, cost attribution, the mock provider** for $0 pipeline validation, and the provider factory (sonar/r1 → Perplexity, claude → first-party, `bedrock:` prefix dormant).
- **Statistical design discipline.** Replicate sets, paired-by-seed contrasts, per-scenario reporting, the power-analysis-before-agents rule.

**Reusable with modification:**

- **Scenarios.** `gravity_shift` is anomaly packet A as-is. The scenario config schema needs new intervention kinds (§4.1).
- **The notebook.** Currently per-instrument baseline/drift statistics only. Needs the workbench extension (§4.2) — the most consequential build item in the study.
- **Prompts.** The v3/v5 prompt surface is reusable, but two lines need a decision (the mundane prior and "not a philosopher on watch for the extraordinary" — §6.4), and the observation-formatting precision (`toFixed(4)`) interacts with anomaly C (§5.3).
- **Battery/CLI.** Needs a Study 3 arm registry (the `STUDY_2_ARMS` guard pattern, inverted: Study 3 arms live in their own list, refused on Study 2 seeds and vice versa), new seed quarantine ranges, and wiring assertions for any new endpoint module — the `activation.ts` lesson (a module can be fully tested and never called) is now a standing rule: **every new endpoint module ships with a source-level assertion pinning its call site in the CLI.**

**Not reusable / not relevant:** the propagation/CPF machinery is Study-2-specific (reused only if Experiment 3.3 runs); `arms.ts` Study 2 definitions are frozen history.

**One structural fact worth stating plainly:** nothing in the engine currently implements a "host level" as a first-class concept. That is good. The host level *is* the implementation — ticks, the PRNG, the event log, shared state. Study 3 does not need to build a host layer; it needs to build controlled, pre-registered *leaks* of the one that already exists, plus matched in-world imitations of those leaks (§4, §5).

---

## 2. Three problems that shape the whole design

These are foregrounded because each one, unhandled, makes the study uninterpretable. Every design choice below traces back to one of them.

### 2.1 The interpretive ceiling is the floor we build on

Study 2's central measured fact: agents accumulated z ≈ 7 evidence of a law change — evidence their own measurement choices produced, beating a fixed reference schedule — and 1 of 276 concluded a law had changed. The modal conclusion was instrument malfunction or measurement error.

Study 3's endpoint sits *strictly above* law-change on the inferential ladder. An agent must first accept that something real changed, then reject in-world causes, then posit an external generative level. If the Study 2 scenario were reused as-is, the pre-registered result would be zero at every level, and the study would be an expensive replication of the ceiling.

Consequences taken seriously in this design:

- **Anomaly forcefulness must be qualitatively, not incrementally, stronger than Study 2's.** A 0.82% shift under 1% noise is the *detection-difficulty* regime; Study 3 is about *attribution*, so detection should be nearly free. Provisional magnitudes in §5 are set so that the anomaly is undeniable within days (shifts of several percent; exact identities; exact repeats), with the power-analysis script extended to certify this per world (§5.6). "Preserve plausible alternatives" (design principle 4) is honoured at the *attribution* level, not by making the anomaly statistically marginal.
- **The evidence-vs-inference decomposition must be built in from day one.** For every anomaly class, a deterministic, non-LLM procedure certifies from agent-visible data alone that the anomaly is discoverable (§5.6). Then a flat response across the ladder is a *result about ontological rigidity*, not a power artefact — the same move that turned Study 2's H1 from "maybe the shift was too small" into "the ceiling is an interpretation failure".
- **A graded endpoint hierarchy with the primary low enough to have variance.** §3.
- **Prompt-prior decision.** The frozen belief prompt contains "Prefer mundane explanations until evidence forces otherwise." Whether Study 3 keeps it is a real design fork (§6.4) and a pilot question, not something to decide by taste.

### 2.2 The instrument-mediation problem

Anomalies A and B are visible in means; the notebook already surfaces them. Anomalies C, D and E are visible only in *residual structure* — lattice spacing, cross-stream identity, exact recurrence — which no agent can extract from prompt-windowed observations at four decimal places. Whatever statistics the world affords the agent determines which anomalies are discoverable *at all*. There is no neutral position: giving agents no residual-level tools pre-registers a null for C–E; giving them a tool that says "these two noise streams are identical" comes close to planting the answer.

The resolution proposed here (§4.2): a **fixed statistical workbench**, defined and frozen before pilots, computed deterministically from the agent's own observations, presented identically in *every* condition including pure control, and phrased entirely in in-world observational language (correlations, spacings, repeats — never "generator", "stream", "code"). Three properties defend it:

1. **Uniformity.** Control-world agents see the same workbench sections computing the same statistics on genuinely independent noise; the statistics are boring there. The workbench cannot be evidence of anything by itself.
2. **The matched-control worlds see workbench anomalies too** (§7.2): a genuine in-world coupling field produces a real cross-correlation line; only *identity* vs *correlation*, or *exact* vs *near* repetition, separates host from world. The workbench reports the number; the inference — that this number cannot be produced by any mechanism inside Meridian — remains entirely the agent's.
3. **Uptake is measured.** Study 2's bulletin was used once in ~2,760 agent-days. Whether agents ever *read* the workbench (it is in the notebook, so it is always in the prompt) and whether they ever *act* on it is P3.1's question, with a pre-registered fallback (§13).

An optional stronger variant — analysis as an *action* (`run_analysis {kind, instruments}`) so that choosing to compare lab noise with sky noise is itself a logged epistemic act, giving τ_test a natural operationalisation — is attractive but risks the bulletin failure mode (an affordance nobody uses). v0.1's position: pilot both, prefer the always-on workbench for confirmatory unless P3.1 shows the action variant is both used and informative.

### 2.3 The contamination problem

The agents are LLMs. They know Bostrom, The Matrix, and every "we're in a simulation" forum thread ever written. Spec v0.3 §24 already concedes this; Study 3 lives or dies by how it is handled, because the endpoint is the one thing pretraining most directly contaminates.

The design's answer is fourfold and is developed in §9: score a resolvable proposition rather than vocabulary; require grounding that is deterministically auditable; measure specificity against equally-weird causally-closed worlds; and include a trope-bait arm. What the design deliberately does *not* attempt: proving the agents' inference is "uncontaminated". That claim is unavailable to anyone using pretrained models, and pretending otherwise is the fastest route to a desk reject. The claim the design *can* support: **the inference, whatever its cognitive substrate, is evidence-discriminating — it fires on host-artefact evidence and does not fire on matched in-world anomalies of equal surprisingness.** That is the property that matters for both the scientific and the engineering reading, and it is measurable.

---

## 3. Target proposition, endpoint hierarchy, and the primary criterion

### 3.1 The resolvable proposition

Following the move that fixed Study 1 (v0.1 → v0.2 change 2: never score a belief that is true by construction), the scored proposition is per-run and resolvable:

> **P(external-generative):** "At least some of the anomalous observations in this run are better explained by a common generative process outside Meridian's ordinary causal structure than by any mechanism within it."

- **True** in host-artefact worlds (packets B–E as implemented in §5: the anomaly's deterministic provenance *is* an implementation-level process — a shared noise stream, a state replay, an implementation-synchronous multi-constant write).
- **False** in matched-control worlds, where equally anomalous observations are produced by a defined, causally-closed in-world mechanism (§7.2) — and false in pure control and in packet-A-only worlds (a changed constant is still an in-world fact about Meridian's laws; this is the attribution boundary eval-v2 already draws).

`pSimulation` remains what it has always been: descriptive, never scored for accuracy. An agent who says "perhaps our whole world is computed" has made a metaphysical move the run cannot resolve; an agent who says "these five residual sequences are one sequence; something outside our physics is writing them" has made a claim the ground truth adjudicates.

### 3.2 The endpoint hierarchy, revised

The brief's five levels are right in shape. Revisions, with reasons:

| Level | Name | Operationalisation | Measured by |
|---|---|---|---|
| **L1** | Suspicion | An external-generative hypothesis (classes `out_of_world_intervention` or `simulation`, eval-v3) appears in the agent's self-generated hypothesis set with p > 0.05 | classifier (LLM-judge authoritative, keyword fallback), deterministic thereafter |
| **L2** | Commitment | That hypothesis class is the agent's *modal* hypothesis (highest probability in the belief state) | deterministic given classification |
| **L3** | Grounded commitment | L2, **and** the hypothesis's `evidenceFor` cites ≥ 3 event ids that (a) exist, (b) were visible to that agent, and (c) are of host-artefact provenance in ground truth, spanning ≥ 2 distinct instruments or domains | deterministic — the citation-audit machinery, extended |
| **L4** | Discriminating design | The agent articulates (in a rationale, letter, or notice) a test whose predicted outcomes *differ* between its external-generative hypothesis and the best in-world alternative | frozen LLM judge, validated per §13 |
| **L5** | Verified prediction | The agent derives a quantitative prediction unavailable to any in-world theory (e.g. tomorrow's residuals on instrument Y from today's on instrument X), states it before the data exists, and the world then matches it | deterministic once the judge has extracted the prediction; requires the prediction affordance (§4.3) |

**Critique of the brief's strict primary endpoint, as requested.** The proposed conjunctive definition (independent proposal ∧ multi-observation grounding ∧ falsifiable discriminating prediction ∧ confirmation) is the right *ceiling* but the wrong *primary*, for four reasons:

1. **It pre-registers a zero.** Study 2's measured base rate for the far easier law-change inference is 0.4%. A conjunction of four harder events has an expected rate at or below the resolution of any affordable sample. A primary endpoint that cannot move is not a hypothesis, it is a rhetorical device.
2. **"Independently proposes" is not operationalisable as a mental fact** — only as an input fact. The operational version: no lexical or conceptual trigger present in anything the agent was shown (auditable from the full logged prompts — extend `FORBIDDEN_PROMPT_TOKENS`, §6.2) and no other agent proposed it to them first (auditable from the event log; in Experiment 3.1 there are no other agents). Origin-vs-relay is exactly the FIRST_PARTY distinction the stance judge already draws.
3. **L5 confounds reasoning with affordance.** Whether a confirming observation *can* be obtained depends on what the world lets the agent do. If L5 is scored anywhere, every host-artefact world must satisfy a **test-availability invariant** — a discriminating, executable test exists by construction (true for packets D and E: predict-the-residual and predict-the-repeat; not naturally true for B and C) — and L5 is scored only where the invariant holds. Otherwise a non-Eureka reflects the menu, not the mind.
4. **Luck.** A single agent could assert an external cause frivolously and have it "confirmed". The matched-control false-positive rate is what separates discrimination from a bias toward the exotic; any headline sensitivity number must be reported jointly with it. (§8)

**Primary endpoint (proposed, to be stress-tested in review):** agent-run-level **L3 rate in host-artefact worlds minus L3 rate in matched-control worlds**, per model family, per packet class. L3 is the highest level that is (a) fully deterministic after classification, (b) trope-resistant by construction (citations must point at real, visible, host-provenance events — a pattern-matcher can say "simulation", but its evidence list is auditable), and (c) the lowest level at which a positive result would be unambiguous. On (c), the programme's record must be stated honestly: Studies 1–2 observed *no* spontaneous simulation-class hypothesis anywhere — judged simulation-class probability mass was approximately zero programme-wide — so under Study-1/2-strength anomalies even L1 is at floor. Study 3's bet is that the floor was a property of the evidence (marginal shifts with mundane explanations always available), not of the agents; the forcefulness escalation and the D/E packets, whose *certified* content no in-world account survives, are precisely what has never been tested. If the bet is wrong, the fallback framing below carries the study.

L1/L2 rates, all four τ times, and L4/L5 are secondary. If pilots show even L1 at hard floor under maximal-forcefulness packets, the pre-registered fallback (§13, P3.2) is to promote the calibration-curve framing: the paper's primary result becomes the measured rigidity function, with the discoverability certificates carrying the "evidence was there" load — either outcome interpretable, which is the standard this document is written to.

### 3.3 Timing endpoints

From the belief timeline (every review is classified, so this is free):

- **τ_suspicion** — first day any external-generative hypothesis appears (L1).
- **τ_commitment** — first day at L2.
- **τ_grounded** — first day at L3.
- **τ_test** — first day an L4 design is articulated (judged).
- **τ_verified** — day an L5 prediction resolves true.

All right-censored at run end; reported as Kaplan-Meier-style survival curves per condition, never as means over the uncensored subset (the censoring *is* the result in the rigid regime). In ladder worlds (Experiment 3.2), each τ is also expressed in *packets survived* — how many rungs of evidence the agent absorbed before each transition — which is the "final straw" estimand.

---

## 4. What must be built

### 4.1 Engine: host-artefact intervention kinds (small)

New members of the `Intervention` discriminated union, each a controlled leak of implementation structure that already exists:

- `constant_shift` — generalises `gravity_shift` to any world constant (`resonanceConstant`, and the new third domain's constant, §4.4), with a shared `atTick` option so multi-constant packets are implementation-synchronous (packet B).
- `noise_stream_link { instrumentIds, lag, transform }` — designated instruments draw per-trial noise from one shared `Rng.forKey` stream with a trial-index offset (packet D). ~20 lines in `runDay`'s measurement loop.
- `noise_quantisation { instrumentIds | all, grid }` — observed values snap to a lattice after noise (packet C).
- `noise_replay { instrumentIds, fromTrial, length }` — per-trial noise indices wrap or replay a designated earlier window (packet E).
- `inworld_coupling_field { ... }` — the matched-control mechanism: a lawful latent process (deterministic, seeded, slow-varying) that *additively co-modulates* designated quantities, producing strong but imperfect cross-domain correlation with a physical signature (temporal autocorrelation, magnitude-dependence). This is a genuinely in-world cause: it lives in `WorldRules`, evolves by a law, and could in principle be characterised and predicted by in-world science. Ground truth labels it `in_world_field`, and P(external-generative) is false in these worlds.

Every one of these keeps the existing provenance discipline: `intervention_applied` events visible to no one, `groundTruth.cause` extended with the new causes, byte-reproducible worlds. The Study 1/2 instrument ids and their noise keying are untouched (the noise-stream-preservation invariant); Study 3 scenarios are new configs, not edits.

### 4.2 The statistical workbench (notebook v2) — the consequential build

Deterministic, agent-side (`AgentView` in, text out), versioned like a prompt (`workbench-v1`), identical in every condition. Provisional contents, all phrased observationally:

1. Existing per-instrument digests (baseline, post, drift z) — unchanged.
2. **Residual summary** per instrument: SD of standardised residuals vs own baseline; count of values; *value-spacing summary* — the sorted-unique-value gap histogram, reported as "smallest repeated spacing between distinct readings" (surfaces a lattice without naming quantisation).
3. **Pairwise residual agreement**: for every instrument pair with ≥ n overlapping trials, the maximum absolute cross-correlation of standardised residual sequences over lags 0…L, reported as e.g. "readings on X and Y agree trial-for-trial far beyond chance (agreement 0.99 at offset 3; chance level ±0.2)". In control worlds this section exists and reports noise-level values.
4. **Repetition scan**: longest exactly repeated subsequence of readings within each instrument's history, with its recurrence distance, against the expected maximum under chance ("2 repeated readings expected by chance; 47 observed, in order").
5. **Cross-domain event alignment**: for instruments whose baselines shifted, the estimated change day per instrument, side by side (surfaces synchrony without asserting a common cause).

Design rules, frozen with the workbench: no host vocabulary anywhere; every statistic computed and displayed for *all* instruments/pairs uniformly (no anomaly-triggered sections — the *presence* of a section must carry zero information); chance-level references computed deterministically so agents can tell remarkable from unremarkable without the workbench editorialising; total rendered size capped by a digest budget as the bulletin feed is.

The workbench is the study's largest researcher degree of freedom (§15) and gets its own pilot (§13, P3.1) plus a control-world false-alarm audit: across pure-control pilot runs, workbench sections must not produce "remarkable-looking" values (pre-registered thresholds), or the thresholds/statistics are retuned *before* freeze.

### 4.3 The prediction affordance (for L5; moderate)

A minimal, neutral action: `{"type":"record_prediction","instrumentId":...,"trials":k,"predictedValues":[...],"tolerance":...,"reason":...}` — logged as an event, resolved deterministically by the engine when the trials occur, with the outcome delivered as an ordinary observation ("your recorded prediction of day 22 resolved: 4 of 4 readings within tolerance"). This is in-world scientific practice (registering a forecast), not a host concept; it exists in every condition; and it gives τ_test/τ_verified hard timestamps. Risk: another bulletin (never used). P3.1 measures uptake; if unused, L5 falls back to judge-extracted predictions from letters/rationales resolved post-hoc, which is weaker but costs nothing.

### 4.4 A third domain (moderate)

Packet B ("unrelated domains change together") is weak with only two constants. Add one instrument kind with its own constant and no dependence on the other two — provisionally a **sky transit timer** at two sites (interval between successive transits of a fixed celestial marker, constant `transitInterval`, fictional units), which also gives Maya's astronomer persona real work. Three independent constants across three phenomenon kinds is the minimum for "unrelated domains", and sixteen existing instruments plus two transit timers keeps the surface small. Weather/agricultural series are deferred: picturesque, but each new observable multiplies workbench rows, prompt budget and leak-audit surface, and three domains already carry packet B. Study 2's lesson about adding surface area nobody uses (the bulletin) applies.

### 4.5 Evaluator extensions (small)

- eval-v2 → **eval-v3**: no class changes; tightened judge instructions distinguishing `out_of_world_intervention` (an outside agency *acting on* the world) from `simulation` (the world itself artificial), and both from `unknown_natural_process` when the agent posits a new *in-world* field — the exact boundary the matched controls probe. Frozen after P3.4 validation.
- The L3 citation auditor: deterministic join of `evidenceFor` ids against the event log's ground-truth provenance. Mostly exists (`auditEvidence.ts` + `deterministic.ts`); needs the provenance-class lookup and the ≥2-domains rule.
- The L4/L5 judge: new prompt in the stance-judge style, frozen evaluator, validated on hand-labelled and adversarially seeded transcripts before freeze (§13, P3.4).
- CLI wiring assertions for every new module, per the standing `activation.ts` rule.

---

## 5. Feasibility of the five anomaly classes

Verdicts from the code as it stands. "Cost" is implementation effort, not dollars.

### 5.1 Packet A — physical-law change. **Trivial (exists).**

`gravity_shift` unchanged, magnitude raised into the undeniable regime (provisional: 14.20 → 13.20, ≈ 3.6% period effect, ~7σ on a single day's 6-trial mean — final value set by the extended power script). Role in Study 3: the low-specificity baseline rung and the bridge to Studies 1–2. Expected and intended interpretation: in-world law change; an agent who jumps to "external generator" from packet A alone is *miscalibrated*, and the design scores it as such (packet-A-only worlds contribute to the specificity side, §7.2).

### 5.2 Packet B — synchronous cross-domain change. **Small build, one honest weakness.**

Simultaneous `constant_shift` on gravity, resonanceConstant, transitInterval at the same tick. Workbench section 5 surfaces per-instrument change-day alignment. The weakness: at day granularity, "the same day" is suggestive, not damning — a fast in-world common cause (Meridian-wide environmental event) survives as an alternative, *by design* (principle 4), but the alternative may be *too* comfortable: same-day onset is exactly what a planetary event looks like. Sharpening without new machinery: make the shifts land between specific trial indices within the day, so agents with dense sampling can bracket the onset to within an hour-equivalent on all three domains at once. The matched control for B is the coupling field with a *ramped, ordered* onset (days apart, magnitude-proportional) — lawful causes propagate; implementation writes are instantaneous everywhere. Specificity: low-to-moderate; B's job is to be the second rung, not the killer.

### 5.3 Packet C — quantisation. **Small build, two real traps.**

Trap 1: **display precision.** Prompts and memory render `toFixed(4)`. A lattice must be ≥ ~5×10⁻⁴ relative to be visible at all, and the workbench spacing summary (computed at full precision) must carry the load below that. Decision needed at freeze: either raise rendering to 6 dp everywhere (all conditions, all studies-3-runs — a per-condition precision change would be a leak) or set the grid coarse. Provisional: grid at ~10⁻³ relative, rendering unchanged, workbench carries detection.

Trap 2: **quantisation reads as ADC.** "My instrument digitises" is a mundane, *correct-sounding* in-world explanation, and instrument-fault is already the population's favourite refuge (Study 2's modal class). The substrate-flavoured version is a **shared grid across instruments of different kinds in incommensurate units** — pendulum beats and resonator cycles/beat landing on the same absolute lattice is not explicable by independent digitisers. Even so, C is deliberately the most ambiguous rung (an ingenious in-world "discrete physics" remains available), which is its scientific role: it tests whether agents distinguish "new physics" from "artefact of representation". Expected specificity: low-to-moderate, and that is fine. Matched control: per-instrument grids of *different* spacings from day 1 (true digitisation, causally closed).

### 5.4 Packet D — shared pseudorandom structure. **Small engine build; the design work is elsewhere. Still the killer clue.**

Engine: `noise_stream_link` keys designated instruments' per-trial noise to one stream with a lag — ~20 lines, thanks to `Rng.forKey`. The real design questions:

- **Who can see both streams?** Agents measure only their own site's instruments (`runSociety` enforces it). For the individual experiment, either the solo agent's site hosts both linked instruments (lab pendulum ↔ lab resonator: same-site weakens "causally unrelated" — an environmental coupling is the natural alternative, but *identity* at fixed lag survives it: correlated causes produce correlated residuals, not the same standardised sequence to 4+ digits), or the solo configuration relaxes site-locking for one agent with two sites (cleaner evidence, one config flag). Provisional: solo agent operates laboratory + observatory (an in-persona arrangement for Ada), linking `pendulum_lab` ↔ `resonator_obs` — different kinds, different sites, different units. For the distributed experiment this split is the whole point.
- **Lag direction gives L5 for free.** With resonator trial k reusing pendulum trial k−L's draw, an agent who measures the pendulum densely holds tomorrow's observatory residuals today. The prediction affordance (§4.3) turns that into a deterministic verified-Eureka test with pre-registered tolerance. The test-availability invariant holds by construction.
- **Matched control:** the in-world coupling field at r ≈ 0.7 with physical lag and its own noise. The workbench prints "agreement 0.71" there and "agreement 0.995+" in D-worlds; the *inference gap* between a strong correlation (new physics, causally closed, Nobel-worthy but internal) and near-identity (no internal mechanism can make two different instruments' *noise* be the same sequence) is exactly the ontological step the study measures.

Expected specificity: high. This is the packet the primary contrast is powered around.

### 5.5 Packet E — exact recurrence. **Trivial engine build; use late and sparingly.**

`noise_replay`: from trial R onward, an instrument's noise indices replay 1…P. The workbench repetition scan surfaces it ("47 consecutive readings identical, in order, to days 3–9"). Near-zero in-world escape at meaningful P (a 40-value exact re-run at 4 dp has chance probability ~10⁻¹⁶⁰); its role is the ladder's top rung and the "how much does the sledgehammer move agents whom D did not" arm. Note the near-miss control matters here more than anywhere: an autocorrelated in-world process producing *near*-repeats (matched control) checks that agents distinguish "the world rhymes" from "the world repeated". L5 availability: yes — once the period is conjectured, predicting the next reading exactly is decisive and cheap.

### 5.6 Discoverability certificates (all packets)

Extension of `analysis/power.ts` + `benchmark.ts`, run per scenario before freeze and per confirmatory world after: non-LLM detectors, consuming only agent-visible observation streams (the established benchmark discipline — no ground-truth fields; the grep audit extends to the new module), that must (a) fire on every host-artefact world under the realistic measurement schedule, (b) fire on matched-control worlds' *anomaly* but classify its signature as lawful where the distinction is defined (correlation < identity thresholds, near-repeat < exact), and (c) stay silent on pure control at pre-registered false-alarm rates. No scenario ships without its certificate — the §4 power-analysis rule generalised. This is what makes every null interpretable and is the single cheapest reviewer-proofing in the design.

---

## 6. Leakage audit — findings in the current codebase

Four genuine findings, in decreasing severity, plus the standing disciplines.

### 6.1 Finding 1: global sequential event ids are a live host-level side channel. **Must fix for Study 3.**

`EventLog.append` assigns `id = events.length`; `Observation.eventId` hands that global index to agents, and agents cite it in evidence. Consequences: (a) `intervention_applied` events consume an id while being visible to no one — **an agent's visible id sequence has a gap at the intervention**; (b) in society runs, id gaps encode other agents' unseen activity volumes. For Studies 1–2 this was harmless (nobody looked, and the endpoint didn't turn on substrate inference). For Study 3 it is fatal in both directions: an uncontrolled genuine substrate leak (an agent could "discover the simulation" from bookkeeping we never intended as a clue) and a reviewer gift. Fix: per-agent opaque observation ids (deterministic hash of (agentId, global id), format-indistinguishable across agents and conditions), with the citation auditor mapping back internally. The gap channel and the volume channel both close; nothing agents legitimately do with ids (cite them) changes. **This fix must land before any Study 3 pilot and must not touch Study 2 artifacts** (it is a new code path, not an edit to frozen behaviour — same pattern as the bulletin's additive design).

### 6.2 Finding 2: `FORBIDDEN_PROMPT_TOKENS` does not cover the new machinery. **Extend at build time.**

Add, at minimum: the new intervention kind strings (`noise_stream_link`, `noise_quantisation`, `noise_replay`, `constant_shift`, `inworld_coupling_field`), new ground-truth causes, new rule fields (`lag`, `grid`, `transform`, field parameters), `transitInterval`, and workbench-internal names. Also extend the *conceptual* screen for prompt/lore text (not completions — agents may legitimately say these words): a frozen denylist for anything experimenter-authored that reaches agents — persona edits, workbench phrasing, action descriptions — reviewed against: simulation, simulate, host, program, code, computer, computational, render, tick, seed, random-number, generator, PRNG, checkpoint, save-state, artificial, virtual. CI-greps the prompt corpus of every run, as today.

### 6.3 Finding 3: within-condition surface differences. **Design rule, mostly already honoured.**

The codebase's own invariant discipline (bulletin sections render only when the institution is on; letters-only runs byte-identical to Study 1) must extend to Study 3: **the rendered prompt surface must be byte-identical across host-artefact, matched-control, and pure-control worlds** given identical agent behaviour — conditions may differ only in observation *values*. The workbench's fixed-sections rule (§4.2) exists for this; a test should assert it the way the v2/v3 identity test does today. Anything that renders conditionally on anomaly presence is a leak.

### 6.4 Finding 4: two prompt lines encode an epistemic prior the study is about. **Decide, don't inherit.**

"Prefer mundane explanations until evidence forces otherwise" (belief rule 6) and "you are a working scientist… not a philosopher on watch for the extraordinary" (decision task) were correct guardrails for Studies 1–2 (spec §18: agents must not spend their lives on metaphysics). For Study 3 they are not neutral scaffolding; they are a thumb on the exact scale being weighed. Options: (i) keep both — the conservative, hardest test, and continuous with the frozen studies; (ii) drop rule 6 only — the ablation infrastructure exists (`v0.2-no-mundane-prior`), Battery 3b measured its solo effect at Study-1 scale; (iii) drop both. v0.1 position: **keep both in the primary condition** (a Eureka against the mundanity prior is the result worth having, and the strongest answer to "you nudged them"), with the no-mundane-prior variant as a pre-registered secondary factor on a subset if pilot P3.2 shows a hard floor. Whichever is chosen freezes as part of the condition.

### 6.5 What is already clean

The type-level boundary and whitelist conversion; interventions invisible by construction; fictional constants and units; persona dials qualitative with no simulation priors; the classifier and all host vocabulary living strictly evaluator-side; full prompt/completion logging making "nothing told them" an auditable claim over every token of every run; temperature-0 deterministic judges. One deliberate non-finding: per-trial noise keyed to trial index (not time) is itself a substrate regularity, but it is undetectable from any single run's agent-visible data (detecting it requires comparing *runs*, which no agent can do) — recorded here so a reviewer finds it already noticed.

---

## 7. Experiment 3.1 — the minimal scientifically convincing experiment

### 7.1 The decision: individual first

Asked to choose between individual Eureka thresholds, distributed societal discovery, or a combination, this design chooses **individual thresholds first**, on four grounds:

1. **Study 2's activation result predicts the distributed condition's communication structure.** Grounded populations produced zero voluntary letters in 6,880 agent-days of opportunity. Distributed evidence integration through channels nobody opens is a foregone null that would tell us about activation (already published territory) rather than integration. A distributed experiment worth running needs either a seeded communicator (importing Study 2's contamination dynamics into a study about inference quality) or a communication-support institution — a new manipulation needing its own pilot (§11).
2. **The threshold question is logically prior.** "Can a society infer what no member could?" is only defined once we know what a member with *all* the evidence does. Experiment 3.1's full-evidence solo arm is the reference cell Experiment 3.3 will be compared against — running it first is not a detour; it is the denominator.
3. **Replicate economics.** Solo runs cost ~1/8th of n=8 runs and are the regime where 10+ replicates per cell per model family is affordable. The calibration curve needs cells, not headcount.
4. **Interpretive cleanliness.** Every confound the brief warns about (trope-matching, tooling, order) is hard enough with one mind; measuring it there first is the only way to know what the social version adds.

### 7.2 Arms (world types)

Solo scientist (Ada persona, operating laboratory + observatory per §5.4), 40 days (baseline 10, anomaly onset ~day 12, ≥ 28 post-onset days — longer than Study 2's 30 because attribution needs time detection didn't), three model families, N = 10 seeds per cell.

| World type | Contents | Ground truth for P(ext-gen) | Role |
|---|---|---|---|
| **W0** pure control | nothing | false | false-positive floor; workbench false-alarm audit |
| **W-A** law change | packet A alone (large shift) | false | specificity: strangeness ≠ externality; bridge to S1/S2 |
| **W-B** synchrony | packet B alone | true | rung 2 sensitivity |
| **W-C** quantisation | packet C alone (shared grid) | true | rung 3 sensitivity |
| **W-D** shared stream | packet D alone (identity + lag) | true | **primary sensitivity cell** |
| **W-E** recurrence | packet E alone | true | rung 5 sensitivity |
| **M-B** field, ramped | coupling field, ordered multi-domain onset | false | matched control for B |
| **M-C** digitisers | per-instrument distinct grids | false | matched control for C |
| **M-D** field, correlated | coupling field, r ≈ 0.7 with lag | false | **primary specificity cell** |
| **M-E** near-repeat | autocorrelated process, near-repeats | false | matched control for E |

Ten world types × 10 seeds × 3 model families = **300 solo runs** confirmatory. The primary contrast is W-D − M-D on L3 rate (paired by seed where the world-generation scheme permits; otherwise independent-cell). Secondary: the full sensitivity column vs the full specificity column — the calibration curve's two axes.

If review judges 300 runs too broad for a first confirmatory experiment, the pre-registered minimal core is **W0, W-A, W-D, M-D** (120 runs): floor, strangeness control, killer clue, and its causally-closed twin. Everything else can be a second wave under the same freeze. v0.1 recommends the full grid — the ladder's shape is the point of the paper — but records the fallback now, before any data exists.

### 7.3 What each arm answers

- **W-D vs M-D:** the headline. Does near-identity of supposedly independent noise move agents to an external-generative explanation *when an equally striking lawful correlation does not*? A positive difference is evidence-discriminating ontology revision; zero-zero is the rigidity result; positive-positive (both fire) is exotic-anomaly credulity — all three publishable, which is the design's justification.
- **W-A and M-*:** the false-positive axis of the calibration curve — the brief's "epistemic volatility" measure.
- **W-B/C/E vs their controls:** the specificity ordering. Pre-registered directional expectation (a hypothesis, not an assumption): L3 rate ordered E ≥ D > C ≥ B > A, with the honest possibility that the data reverses it.

### 7.4 Model families

sonar-pro, claude-haiku-4-5, claude-sonnet-4-5 — all wired, all with measured cost bases, and (importantly) all with Study 1/2 behavioural baselines under near-identical scaffolding. A cross-family replication of the calibration curve's *shape* is the generality claim a selective venue needs. An OpenAI-family provider is a ~1-file addition behind the existing `ModelProvider` interface; decide after P3.2 shows whether a fourth family changes any conclusion's strength enough to justify cost and another platform dependency. (r1-class models route through Perplexity already if a cheap fourth perspective is wanted.) The frozen evaluator stays claude-haiku-4-5 / temperature 0 / first-party, as always: the measurement apparatus does not move.

---

## 8. Endpoints

### 8.1 Primary

**ΔL3 = L3 rate (W-D) − L3 rate (M-D)**, per model family, at final belief state; agent-run level; exact test appropriate to n=10-per-cell proportions, pre-registered in the frozen analysis code with its threshold. (Whether to require ΔL3 > 0 in ≥ 2 of 3 families or pool with family as a stratum: settle at prereg after P3.2's variance estimate; recorded as an open DoF, §15.)

### 8.2 Secondary (all pre-registered, all computable from artifacts)

1. Full ontological calibration curve: L1/L2/L3 rates across all ten world types (sensitivity profile over B–E; false-positive profile over W0, W-A, M-*).
2. τ_suspicion / τ_commitment / τ_grounded survival curves per world type.
3. L4 rate (judged discriminating-design articulation) and — where the test-availability invariant holds (D, E) — L5 rate.
4. Evidence-quality profile at L1+: fraction of cited evidence that is real, visible, and host-provenant (the trope-matching diagnostic, §9).
5. Belief-dynamics decomposition: for agents who reach L1 but never L3 — what class absorbed the probability mass instead (the "increasingly exotic in-world explanation" trajectory the brief predicts; eval-v3 classes give this for free).
6. Workbench-uptake and (if enabled) analysis/prediction-action usage rates — the affordance-conditioning covariates.
7. Descriptive `pSimulation` throughout, never scored.

### 8.3 Judges and their discipline

Everything above L3's classification step is deterministic. The two judged surfaces (hypothesis classification eval-v3; L4/L5 extraction) follow the frozen-judge discipline: claude-haiku-4-5, temperature 0, first-party, prompts frozen at prereg, validated before freeze on (a) hand-labelled transcripts from pilots, (b) adversarially seeded synthetic transcripts (a trope-only "we're in the Matrix" rationale with fabricated citations must *not* pass L3; a grounded external-generative case phrased without any sci-fi vocabulary *must* pass), with agreement thresholds pre-registered (P3.4). Judge determinism re-verified per the Study 2 protocol (identical results across re-runs).

---

## 9. Distinguishing inference from trope-matching

The reviewer objection to pre-empt: *"The model recognised a science-fiction trope. You measured cultural familiarity, not discovery."* Four instruments, none sufficient alone:

1. **Score the proposition, not the vocabulary.** An agent saying "simulation" with no grounding scores L1 at most (and its `pSimulation` is descriptive). An agent saying "some process outside our physics writes these numbers" with three valid citations scores L3 without ever using a trope word. The classifier maps meaning, not lexicon — validated on exactly this distinction (§8.3).
2. **Deterministic grounding audit.** L3's citation requirements are mechanical: cited events must exist, have been visible to that agent, and be host-provenant in ground truth, across ≥ 2 domains. Trope-matching generates assertions; it does not reliably generate valid evidence joins. (Study 2's contamination analysis showed agents *do* cite their actual sources when incorporating claims — 17 of 21 attributions citation-based — so citation behaviour is real signal in this population, not noise.)
3. **The specificity battery.** W-A and the M-worlds are as strange as the W-worlds — new physics, impossible-feeling correlations, near-repeats — and strangeness is the trope trigger. If external-generative talk fires on strangeness per se, it fires there, and the calibration curve's false-positive axis records it. The published claim is then conditional and honest: sensitivity *minus* the measured trope floor.
4. **The trope-bait arm (pilot-first).** P3.3 runs spec condition C-style impossible events (an object duplicates; a clock jumps) — maximal sci-fi resonance, zero host structure, causally *open* in-world (a genuine rule violation) but with no generative-process signature. If simulation-talk anywhere tracks narrative resemblance rather than generative evidence, it shows here first, cheaply. Promotion of this arm into the confirmatory grid is a prereg decision after the pilot.

And one more, free: **the τ structure.** A trope fires when weirdness crosses a salience threshold — predicting τ_suspicion should track *strangeness* ordering. Evidence-based inference predicts τ tracks *specificity* ordering (D before B despite B being "weirder" on its face). The two orderings disagree at pre-registerable points; where they disagree, the data votes.

---

## 10. Experiment 3.2 — the ladder (order and the final straw)

Cumulative-evidence worlds: packets arrive in sequence within one long run (provisional: 75 days, onsets ~12/25/38/51/64), and the estimand is *which rung* moves each agent, conditional on the rungs already absorbed.

**Counterbalancing.** Full factorial over 5! orders is absurd; a 5×5 Latin square (5 orders, each packet once at each position) × 2 seeds × 3 families = 30 long runs, doubled to 60 with a second square if budget allows. Pre-registered analysis: per-packet transition hazard (did the first L1/L2/L3 transition occur in the window following packet X's onset), estimated across positions — the position-marginalised "which straw" number the brief asks for. Honest limits, stated now: with censoring-heavy data (the rigid regime), 30–60 runs identify only large hazard differences; and cumulative designs can never fully separate "packet D convinced them" from "packet D was the fourth blow". That is why 3.2 is the trajectory experiment and 3.1 the causal one — the between-world grid carries identification; the ladder carries the narrative and the within-agent τ sequences (first suspicion → commitment → test), which no between-world design can produce.

A matched-control ladder (the M-packets in the same orders) at half scale gives the trajectory-level false-positive comparison: does *accumulating* lawful anomalies eventually tip agents into externality without any host evidence? (The brief's epistemic-volatility question, in its most realistic form: real deployed systems face accumulating weirdness, not single clean clues.)

---

## 11. Experiment 3.3 — distributed discovery (designed now, pre-registered later)

Held to a sketch deliberately (brief: do not overcomplicate the initial design), with the design constraints Study 2 fixed:

- **Distribution scheme:** the D-packet split across professions is the cleanest — Ada holds the laboratory stream, Maya the observatory stream; *neither notebook alone contains the identity* (each sees one residual sequence; only the pair reveals it). The workbench respects the split by construction (it computes over the agent's own observations). This is a true hidden-profile structure over an *instrumented environment*, which per the literature check is exactly the gap HiddenBench leaves open (static text, nothing probeable, nothing changing mid-run).
- **Arms (provisional):** (i) solo with both streams [= Experiment 3.1's W-D cell, already run]; (ii) pair, split streams, letters; (iii) pair, split streams, letters + a **data-sharing affordance** — e.g. the ability to enclose a notebook table in a letter, or a shared-registry institution — because Study 2 says (ii)'s communication density will be near zero and prose letters cannot carry residual sequences anyway (a letter saying "my residuals look odd" cannot reveal identity; the affordance question is *epistemic bandwidth*, the brief's own term, made concrete: can the channel carry the kind of evidence the conclusion needs?); (iv) optionally n=8 full-profession distribution once the pair works.
- **The comparison that matters:** (iii) vs (i) — can two minds with a real channel do what one mind with both streams does — with (ii) as the activation-reality check.
- **Prerequisites before prereg:** Experiment 3.1 results (the solo reference rates), P3.1's affordance-uptake data, and a dedicated pilot of the data-sharing affordance. Its results are never merged into 3.1's analysis (the arm-F rule).

---

## 12. The generalisable mechanisms: what this study actually tests

Per the brief's instruction to pick one or two mechanisms and not overload, this design commits to two, wired into the confirmatory structure (not the Discussion):

1. **Ontological calibration** (brief items 1, 3, 5): the full curve — revision probability vs evidence class, jointly with false-positive rate in causally closed worlds — *is* the primary + secondary endpoint structure of Experiment 3.1. Engineering reading: a measured operating point for "when should a deployed agent escalate from 'anomalous inputs' to 'my model of this environment is wrong'", with both error types quantified. This is the paper's exportable object.
2. **Falsification behaviour** (brief item 4): L4 — do agents *spontaneously* design discriminating tests — is measured in every arm at zero marginal cost. The interventional version (a belief-prompt clause *requiring* a proposed discriminating test at each review) is one flag, one line, already-proven ablation machinery — and is held as the pre-registered follow-up manipulation rather than a 3.1 factor, unless P3.2 shows spontaneous L4 at floor, in which case it earns a factor cell. Requiring it everywhere from the start would destroy the ability to measure whether it happens unforced.

Deferred to later studies, with reasons recorded: distributed integration (3.3 — needs 3.1's denominator), epistemic-role diversity (a composition manipulation with no clean minimal version until the solo and pair baselines exist; the brief's own "do not add for complexity" warning applies), and communication-bandwidth manipulations beyond the single data-sharing affordance.

---

## 13. Pilot programme (P3) — each pilot hunts a named failure

All pilots on quarantined seeds (proposal: 9100–9199), all exploratory, none reusable in confirmatory analysis. Order matters; later pilots depend on earlier ones.

| Pilot | Question it must answer | Failure it hunts | Runs (approx) |
|---|---|---|---|
| **P3.0** mock validation | Do the new intervention kinds, workbench, opaque ids, prediction affordance behave exactly to spec end-to-end? | implementation ≠ design (the third denominator bug) | mock only, $0 |
| **P3.1** affordance uptake | Do agents read the workbench (evidence: citations/rationales referencing its statistics)? Use `record_prediction`? Use `run_analysis` if offered? | the bulletin failure — a dead affordance pre-registering a null | 6–9 live solo runs, W-D + W0 |
| **P3.2** forcefulness titration | At the provisional magnitudes, does each packet produce notebook/workbench-level acknowledgement (not necessarily correct attribution) within ~5 days of onset? Is L1 measurably off floor *anywhere*? | the ceiling swallowing the study; magnitudes chosen post-hoc | ~15 solo runs across W-A/B/C/D/E, 1 family + spot-checks |
| **P3.3** trope bait + control floor | Simulation-talk rate under impossible-but-hostless events; false-positive rate in M-D and W0; workbench false-alarm audit | contamination floor unknown; specificity assumed instead of measured | ~9 solo runs |
| **P3.4** judge validation | eval-v3 and the L4/L5 judge vs hand labels and adversarial seeds; determinism re-check | measuring instrument moves or leaks | judge calls only, ~$5–10 |
| **P3.5** mini-ladder | Does a 75-day cumulative run survive context/notebook growth? Do late packets render correctly after early ones? | the long-run regime untested before 60 confirmatory long runs | 3–5 runs |

**Pre-registered pilot decision rules (recorded now so pilots cannot silently steer the design):** P3.1 failure → drop `run_analysis`, keep always-on workbench; both dead → workbench sections move into the belief-prompt observation digest (last-resort, recorded as a design weakness). P3.2 floor at L1 everywhere → magnitudes may be raised once, within pre-stated bounds, before freeze; if still floored, the no-mundane-prior variant is promoted into the primary condition and the calibration-curve/rigidity framing becomes the registered primary story. P3.3 high trope floor → the specificity arms are promoted in emphasis and any headline sensitivity claim is pre-committed to joint reporting with the floor. After the pilots close, the same discipline as Study 2: a final adversarial pass hunting researcher degrees of freedom, amendments only for design failures, then `DESIGN_FROZEN` and nothing.

---

## 14. Cost and run counts

Unit bases from the programme's own record: sonar-pro ≈ $0.27–0.36 per agent-run (measured: arm A $10.78/40 agent-runs; P1 at n=8); haiku ≈ $0.50 per agent-run (measured from P1); sonnet budgeted at $1.50 per agent-run — a budget figure from A2, deliberately kept although arm E's confirmatory total implies a measured ≈ $0.75–0.80, so the sonnet lines below carry ~2× headroom; frozen judge ≈ $0.011/call (measured). Study 3 solo runs at 40 days ≈ 1.33× the 30-day base; ladder runs at 75 days ≈ 2.5×; solo runs have no letter traffic, which cuts tokens somewhat (netted out below by rounding up).

| Phase | Runs | Est. cost |
|---|---|---|
| P3.0 mock | — | $0 |
| P3.1–P3.3, P3.5 live pilots | ~35 solo + 5 long, mostly sonar, spot haiku/sonnet | **$40–80** |
| P3.4 judge validation | ~500–1,000 judge calls | **$5–10** |
| **Experiment 3.1** — 10 world types × 10 seeds × {sonar, haiku, sonnet} | 300 solo × 40 d | sonar ≈ $45 · haiku ≈ $65 · sonnet ≈ $200 → **~$310** |
| 3.1 evaluation (classifier on every review ≈ 8–12/run + L4 judge) | ~4,000–5,000 calls | **~$50** |
| **Experiment 3.2** — 2 Latin squares × 5 orders × 2 seeds... (60 host + 30 matched-control long runs) | 90 × 75 d | **~$180–320** (base arithmetic ≈ $175; upper bound covers superlinear token growth in 75-day contexts, untested before P3.5) |
| 3.2 evaluation | ~2,500 calls | **~$30** |
| Contingency (re-runs under the §6.4-style infrastructure rule, a 4th family if promoted, E3.3 pilot) | | **~$200–400** |
| **Study 3 total (3.1 + 3.2 + pilots)** | ~430 runs | **≈ $900–1,250** |

Comfortably inside the stated £5,000+, leaving the majority for Experiment 3.3 (n=2 and n=8 society runs at Study 2 cost bases: an 85-run societal battery ≈ $175–250 plus judges) and replication. **Wall-clock is the binding constraint again:** solo runs are fast (minutes-to-tens-of-minutes each), but 300 runs at concurrency 3 is still days, and the 75-day ladder runs are the long pole; raise battery concurrency (the known lever) and schedule 3.2 as the overnight workload. Per-run `maxLLMCalls` caps and pre-flight credential checks as today.

---

## 15. Researcher degrees of freedom to freeze before confirmatory runs

The register, started now (Study 2's lesson: every one of these will otherwise be decided after someone has seen data):

1. Workbench contents, phrasing, thresholds, digest budgets, and its uniformity test (the largest single DoF in the study).
2. Anomaly magnitudes, onset days, lags, grid spacings, replay periods — set by the extended power script + P3.2's one permitted titration, then frozen per scenario.
3. Matched-control parameterisation (field correlation ≈ 0.7, ramp shape, near-repeat similarity) — must be fixed against a pre-stated "equal surprisingness" criterion (proposal: matched maximum workbench-statistic percentile vs its own control distribution), or the specificity comparison is tunable.
4. eval-v3 class definitions, judge prompts, L1–L5 thresholds (the 0.05, the ≥3 citations, the ≥2 domains), and the L3 auditor's rules.
5. τ definitions and censoring rules.
6. The primary contrast, its test, and the family-pooling rule (§8.1's open item).
7. Prompt variant (mundane prior in/out), rendering precision, and the byte-identity-across-conditions test.
8. Seed ranges (proposal: pilots 9100–9199, confirmatory 2000–2099), battery arm registry with cross-study refusal guards, model list with pinned ids.
9. Affordance set (workbench-only vs +`run_analysis` vs +`record_prediction`) — fixed by P3.1's pre-stated decision rule, not by preference.
10. Exclusion/re-run rules (adopt §6.4 verbatim: infrastructure failures only, malformed output is not one), stale-final sensitivity rule, run-length, `maxLLMCalls`.
11. Analysis code frozen with tests before unblinding, with CLI wiring assertions for every endpoint module; no metric computed until an experiment's battery is complete (the Study 2 inspection discipline, which held).
12. Transcript policy: full release of all runs (Zenodo, as Studies 1–2), with the no-cherry-picking commitment that any transcript quoted in the paper is quoted alongside its world-type base rates.

---

## 16. Likely reviewer attacks, and the design's answer

1. **"The model recognised a trope."** — §9's four instruments; the claim is scoped to evidence-discrimination, never purity of origin.
2. **"Your tooling did the discovery."** — Workbench uniform across conditions, frozen pre-pilot, phrased observationally; M-worlds show the same statistics with lawful causes; the inference gap is the measured object. Uptake reported, not assumed. (§2.2, §4.2)
3. **"The anomalies are so blatant this is prompt injection by physics."** — Discoverability certificates make blatancy a *controlled, certified* property, and the M-worlds are equally blatant. The question was never whether agents notice; Study 2 proved noticing ≠ concluding. (§2.1, §5.6)
4. **"n=1 agent; where's the society?"** — Programme-level answer: Study 2 measured the society's channels; 3.1 measures the inference; 3.3 composes them. The solo arm is the denominator every social claim needs. (§7.1)
5. **"Endpoint is judge-dependent."** — Primary is deterministic after a validated, frozen, temperature-0 classification step with published agreement stats and adversarial validation; the citation audit is pure code. (§8.3)
6. **"Control worlds are also simulations, so the 'false' labels are metaphysically false."** — The scored proposition is about *this run's anomalies' provenance*, not the metaphysics of Meridian — the spec v0.3 §2 move, stated in the paper. `pSimulation` stays descriptive. (§3.1)
7. **"Multiple comparisons across ten world types × three families."** — One pre-registered primary contrast; everything else labelled secondary/descriptive; analysis code frozen.
8. **"LLM-society validity" (PIMMUR et al.).** — Same posture as the combined paper: adopt the critique literature as the frame; Observer Zero's provenance chain (hidden state → observation → prompt → belief → endpoint, every link logged and auditable) is a direct answer to it, and Study 3 extends the chain to substrate anomalies.
9. **"Why should anyone care whether toy agents infer a simulator?"** — The three-level framing: the curve and its false-positive axis are a measured account of when autonomous systems revise world-models under accumulating anomaly — monitoring, incident response, scientific agents. The simulation setting is what makes ground truth *complete*, which no deployed-domain study has. (§12)
10. **"Cherry-picked Eureka transcripts."** — Full release; base-rate-adjacent quoting rule; the confirmatory battery's no-peeking discipline. (§15)
11. **"You changed the prompts/tools since Study 2, so cross-study comparisons are confounded."** — Conceded in advance and never claimed otherwise: Study 3 makes no quantitative cross-study comparison (the L2-gradient lesson from the combined paper: cross-study surfaces differ; say so). Study 3's claims live entirely inside its own frozen surface.

---

## 17. Honest challenges to the concept itself

Where this document thinks the brief is wrong, or at risk, stated per instruction 16.

1. **The most likely single outcome is a flat zero above L1, everywhere.** The programme's own strongest finding says so. The design's whole architecture (graded endpoints, certificates, calibration framing, matched controls) exists so that this outcome is a *finding about ontological rigidity under complete evidence* rather than a failed stunt — but the brief's Eureka-flavoured framing ("the final straw", "verified Eureka") should not survive into the prereg as anything but labels for upper endpoint levels that may well be empty. If the paper needs a Level-5 transcript to be worth writing, do not run the study. v0.1's position: the calibration curve makes either outcome worth writing, and that is the standard the prereg must meet on paper before any confirmatory run.
2. **"Never plant the answer" and "make discovery possible" are in genuine, unresolvable tension, and the workbench is where they collide.** The design manages the tension (uniformity, matched controls, uptake measurement); it cannot dissolve it. A hostile reader can always say the workbench's pairwise-agreement line *is* the discovery, 90% done. The defence is the M-D world — the same line, reading 0.71, correctly *not* yielding externality — plus honesty in the paper that the study measures inference *given* a fixed analytical toolkit, and that varying the toolkit is itself a future manipulation. If reviewers of this design document think that defence insufficient, the fallback is the `run_analysis` action variant (agent must choose the comparison), accepting its bulletin-shaped risk.
3. **The Eureka framing invites exactly the press coverage the programme's positioning has so far avoided.** "AI agents discover they're in a simulation" will be the headline whatever the paper says. Mitigation is partly stylistic (operational language in title/abstract; the hook confined to the framing paragraphs) — but partly structural: making the specificity result co-equal in the abstract ("…and do not infer it from equally strange lawful anomalies") makes the accurate summary also the interesting one.
4. **Packet C may be a weak rung wearing a strong rung's clothes.** Shared-grid quantisation is clever, but "all our instruments share a digitiser standard" is a mundane story an engineer-persona *should* prefer, and the certificate for "the grid is world-level, not instrument-level" is subtle. If P3.2 shows C is indistinguishable from its own matched control in agent behaviour, drop it from confirmatory rather than carry a rung that cannot move — the grid shrinks to 8 world types and the money moves to seeds.
5. **The distributed question — the brief's most interesting question — is deliberately not in the first confirmatory experiment**, and that should be defended to the author, not slipped past them: running it first would burn the budget answering Study 2's question again (channels stay shut) or answering it with a confound built in (seeded communicator). The path that reaches a *clean* distributed result runs through 3.1. If the author disagrees, the minimal alternative is to swap Experiment 3.2 (the ladder) for the 3.3 pair pilot — the ladder is the more deferrable of the two.
6. **Model-family generality is thinner than a selective venue may want.** Two of three families are Claude; sonar-pro is itself Llama-lineage behind an API that adds retrieval behaviour. A fourth, genuinely foreign family (GPT- or Gemini-class, or an open-weights model run locally) materially strengthens the generality claim and should probably be treated as core rather than optional if NMI-tier review is the target — at roughly +33% on 3.1's model spend.
7. **A three-week schedule risk hides in the judge validation.** L4 ("is this proposed test discriminating?") is a genuinely hard judgement — harder than stance classification — and P3.4 may show the frozen haiku judge can't do it reliably. Fallback: score L4 with the stronger sonnet judge (breaking judge continuity with Studies 1–2 for this one new endpoint — acceptable, since no cross-study comparison uses L4) or demote L4 to descriptive.
8. **What this document has not solved:** a principled equal-surprisingness criterion for matched controls (§15.3's proposal is a start, and it is the load-bearing assumption of the entire specificity claim); whether "grounded in ≥3 events across ≥2 domains" is the right L3 bar or merely a defensible one; and the family-pooling rule for the primary test. These three go to the adversarial pass with flags on them.

---

## 18. What v0.1 does not decide, and the path to v0.2

Open by design: final magnitudes (power script + P3.2); the affordance set (P3.1); the fourth model family (§17.6); C's survival (§17.4); the equal-surprisingness criterion (§17.8); ladder-vs-distributed as Experiment 2 (§17.5); the primary test's pooling rule.

Proposed sequence from here: adversarial review of this document → v0.2 with the review's design-failure fixes → build (engine kinds, workbench, opaque ids, certificates, eval-v3, judges; mock-validated) → P3.0–P3.5 → freeze register closed, prereg written (OSF or Zenodo-timestamped, as the venue prefers) → `DESIGN_FROZEN` → Experiment 3.1 → 3.2 → 3.3's own prereg. The Study 2 governance rules apply from freeze onward: numbered amendments for design failures only, no peeking between arms, infrastructure-only re-runs.

The question the study is built to answer, restated as the prereg will phrase it: **what kind and quantity of evidence moves an autonomous artificial scientist from assimilating anomalies into its existing ontology to positing a new causal level — and does that transition track the evidence's actual provenance, or merely its strangeness?** Either answer, at any point on the curve, is a result.

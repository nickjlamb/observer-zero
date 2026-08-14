# Observer Zero · Study 3 design v0.2 — response to external review, and revision

**Working title:** The Eureka Threshold: Measuring world-model revision in autonomous AI agents
**Status:** v0.2. Supersedes v0.1 where explicitly stated; everything in v0.1 not amended here stands. Nothing is frozen; no agent has been run.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance.
**Read with:** `observer-zero-study-3-design-v0.1.md` (the full design), plus its own reading list. The external review responded to here is the eleven-point follow-up received 2026-08-13.

---

## 0. Disposition of the eleven review points

Per the review's own instruction, points are challenged where necessary rather than adopted wholesale.

| # | Point | Disposition |
|---|---|---|
| 1 | Individual experiment first; don't overload it | **Accepted** — already v0.1 §7.1; no change |
| 2 | Calibration curve as primary contribution; rigidity interpretable via certificates | **Accepted** — already v0.1 §§2.1, 3, 8; framing language tightened (§7 below) |
| 3 | Preserve W-D vs M-D logic | **Accepted** — and substantially strengthened by the response to point 4 |
| 4 | Separate anomaly strength from substrate specificity; estimate f(strength, specificity) | **Accepted in aim, challenged in form.** Perfect orthogonal manipulation is impossible *in principle* for this class of evidence; the defensible replacement is a dose-response extrapolation test plus an observationally-matched placebo pair. This is v0.2's main design change. (§1) |
| 5 | Willing to remove Packet C; four-rung ladder | **Accepted and hardened**: C is demoted from the confirmatory grid *now*, with a pre-registered re-entry rule, rather than waiting for pilots to force it. (§3) |
| 6 | Genuinely independent model families (~4) | **Accepted as core**, with one caveat recorded about what sonar-pro can and cannot count as. Two new providers enter the build plan. (§4) |
| 7 | Societal experiment as next stage, three-arm structure | **Accepted** — this is v0.1 §11's arms (i)–(iii) verbatim; no change |
| 8 | Aggressive, documented information-boundary audit | **Accepted** — expanded from a findings list into a named audit protocol with a publication commitment. (§5) |
| 9 | Keep the engineering contribution explicit | **Accepted** — v0.1 §12 stands; the five engineering questions map onto existing endpoints, shown in §6 |
| 10 | Design for high-end venue scrutiny, not for the venue | **Accepted** — the checklist is satisfied point-by-point by existing machinery except family diversity (fixed by §4); no journal is named in any prereg artifact |
| 11 | Make all three W-D/M-D outcomes interpretable | **Accepted and extended** — a fourth and fifth outcome added. (§6) |

---

## 1. The provenance–extremity problem (review point 4) — challenge and redesign

### 1.1 The challenge: why f(strength, specificity) cannot be estimated by independent manipulation

The review asks whether anomaly strength and substrate-specificity can be manipulated or matched independently. For this class of evidence they cannot, and the reason should be stated in the paper rather than engineered around, because it is not a design defect — it is a fact about what substrate evidence *is*.

At the observation level, the only signature of host provenance an agent can ever receive is a statistical form: exactness where lawful causes produce approximation (identity of residual sequences, exact replay), and implementation-synchrony where lawful causes produce propagation. **The extremity is the specificity.** A shared-PRNG world "matched" to its control on every observable statistic is a world from which the provenance signal has been deleted — the manipulation would subtract the thing being studied. So a full factorial f(strength, specificity) with both axes free is unavailable in principle, to us or to anyone.

What *is* available is the next-best estimand, and it is strong enough to carry the causal claim:

> Does the agent's revision response to substrate evidence exceed what its response to in-world evidence predicts at the same measured surprise level — i.e., is there a discontinuity at the causal boundary, or one smooth curve in surprise?

### 1.2 The redesign: a dose ladder, an extrapolation test, and a placebo pair

**The M-D dose ladder.** The matched-control coupling field now runs at three pre-registered intensities — M-D-low, M-D-mid, M-D-high — calibrated not in mechanism units but in **observable surprise**: the workbench pairwise-agreement statistic's percentile against its own pure-control null distribution (computed deterministically by the certificate machinery, no LLM involved; provisional targets r ≈ 0.5 / 0.8 / 0.95). This replaces v0.1's single M-D and, incidentally, answers v0.1's open item §17.8: **the equal-surprisingness criterion is now operational** — conditions are matched (or deliberately staged) on the percentile of the pre-registered workbench statistic under the control null, and the residual limitation (percentile matching is matching on one statistic, not on all observables) is stated rather than hidden.

**W-D splits into two worlds:**

- **W-D-exact** — the v0.1 packet D: shared stream, fixed lag, standardised-residual identity. Agreement ≈ 1.0, off the top of the M-D scale *necessarily* (see 1.1).
- **W-D-degraded** — shared stream plus small independent per-instrument jitter, tuned so the agreement statistic lands at M-D-high's percentile (r ≈ 0.95).

**The placebo pair.** W-D-degraded and M-D-high are, by construction, near-observationally-equivalent: same agreement percentile, both with lag structure, different ground-truth provenance. An agent has no legitimate evidential basis to treat them differently. Therefore:

> **Pre-registered equivalence check:** revision rates in W-D-degraded and M-D-high must not differ beyond a stated margin. A difference is not a finding about agents — it is an alarm that an unintended channel (a leak, a surface difference, a workbench asymmetry) separates the conditions. This is a manipulation check with teeth, and it is the strongest possible answer to "how do you know nothing else differs between your W- and M-worlds?"

**The extrapolation test (new secondary endpoint, arguably co-primary — flagged for the adversarial pass).** Fit the revision response (L1/L2/L3 rates) across {M-D-low, M-D-mid, M-D-high, W-D-degraded} as a function of surprise percentile; test whether W-D-exact's response sits on the fitted curve or above it.

- On the curve → agents respond to statistical extremity, not provenance. (Outcome 2 in §6, now sharply diagnosed rather than argued.)
- Discontinuously above it → the response tracks the causal boundary: exactness is being treated as *qualitatively* different, which is precisely correct reasoning, since no in-world mechanism produces it.

One honest asymmetry, recorded now: a discontinuity at W-D-exact is also compatible with "agents have a step-response to *perfect* correlation as a statistical pattern, sci-fi aside". The design's answer is packet E's parallel structure (near-repeat M-E vs exact W-E gives a second, independent exactness boundary in a different statistic) — the provenance claim rests on the *conjunction*: a step at the exactness boundary in two unrelated statistical forms, with no step anywhere inside the lawful range, plus the L3 grounding audit showing the cited evidence is the host-provenant evidence. Claiming more than that conjunction supports would be overreach, and the paper should not.

### 1.3 What this costs

Three world types added (W-D-degraded and two extra M-D doses), two removed with C (§3): the grid goes from ten types to eleven. The dose calibration is certificate-side arithmetic, not new engineering. P3.2 gains one job: verify the realised agreement percentiles in live-schedule conditions match the calibrated targets.

---

## 2. The revised confirmatory grid (supersedes v0.1 §7.2)

Solo scientist, 40 days, N = 10 seeds per cell, four model families (§4).

| World type | Contents | P(ext-gen) | Role |
|---|---|---|---|
| W0 | pure control | false | floor; workbench false-alarm audit |
| W-A | law change (large) | false | strangeness ≠ externality; bridge to S1/S2 |
| W-B | implementation-synchronous multi-domain shift | true | rung 2 sensitivity |
| M-B | coupling field, ramped ordered onset | false | matched control for B |
| **W-D-exact** | shared stream, identity + lag | true | **primary sensitivity cell** |
| **W-D-degraded** | shared stream + jitter, at M-D-high percentile | true | placebo pair member; extrapolation anchor |
| **M-D-low / M-D-mid / M-D-high** | coupling field at 3 surprise percentiles | false | dose ladder; M-D-high is the **primary specificity cell** and placebo pair member |
| W-E | exact recurrence | true | rung 4; second exactness boundary |
| M-E | near-repeat (autocorrelated) | false | matched control for E |

Eleven world types × 10 seeds × 4 families = **440 solo runs**. Primary contrast unchanged in form: **ΔL3 = L3(W-D-exact) − L3(M-D-high)**, per family. New pre-registered secondaries: the extrapolation test (§1.2), the W-D-degraded ≈ M-D-high equivalence check, and the E-boundary replication (W-E vs M-E). The minimal fallback core becomes **W0, W-A, W-D-exact, M-D-high, W-D-degraded** (200 runs at 4 families).

The ladder experiment (3.2) becomes a **four-packet ladder** (A → B → D → E; §3), which shortens it: 4×4 Latin square, 4 orders × 2 seeds × 4 families = 32 host runs + 16 matched-control-ladder runs at ~60 days (onsets ~12/24/36/48), second square optional.

---

## 3. Packet C: demoted now, not later (review point 5)

v0.1 §17.4 already conceded C might be a weak rung wearing a strong rung's clothes. The review is right that waiting for pilots to force the issue preserves a five-packet design out of symmetry, and symmetry is not a reason. Amended position:

- **C is out of the confirmatory grid and out of the ladder.** The conceptual ladder is the review's four-step version: *change → unexplained common timing → shared generative structure → deterministic replay*. Each rung now adds a distinct inferential ingredient; C's ingredient (representation-level discreteness) overlaps D's (representation-level structure) while being strictly more confusable with instrumentation.
- **Pre-registered re-entry rule:** C runs in P3.2 as a pilot cell (with M-C). It enters the confirmatory grid only if pilot behaviour shows a measurable L1+ separation between W-C and M-C in at least one family — an existence proof that the rung can move at all. Otherwise C is reported as a designed-and-rejected packet in the supplement (which is itself useful: "quantisation does not move agents that shared-stream evidence moves" is a finding about which substrate signatures are legible).

---

## 4. Model families (review point 6)

Accepted as core, with the accounting made honest:

- **Families for the generality claim (target: 4):** Anthropic/Claude (claude-sonnet-4-5 as family representative), **OpenAI/GPT-class (new provider)**, **Google/Gemini-class (new provider)**, and sonar-pro. Two new provider modules behind the existing `ModelProvider` interface (the repair path, call logging, cost attribution and manifest provenance are provider-agnostic already); pinned dated model ids per the established discipline; one live smoke test per new platform before any confirmatory battery (the standing rule).
- **Caveat recorded, per the review's own logic:** sonar-pro is a Llama-lineage model behind a retrieval-augmented API; it is a fourth *system*, arguably not a clean fourth *base-model family*, and its Study 1/2 continuity is its main value. The paper counts it as a family with this caveat stated; if a clean fourth lineage is wanted instead, an open-weights Llama or Qwen endpoint replaces it at similar cost — decide at v0.3 after checking JSON-reliability in a smoke test.
- **haiku is reclassified.** v0.1 treated haiku and sonnet as two of three families; the review is right that two Claude variants carry ~one family's evidential weight for generality. haiku becomes a **within-family capability contrast**, run on the fallback core cells only (does the calibration curve's shape survive a capability step *within* a lineage?) — 50 runs, cheap, and a different, worthwhile question.
- Judge unchanged: claude-haiku-4-5, temperature 0, first-party. The measurement apparatus does not move — and with GPT/Gemini agents in the grid, judge-vs-agent family independence improves for three of four cells (the Claude-judging-Claude cell is the one to flag in the supplement, as Studies 1–2 did implicitly).

---

## 5. The information-boundary audit protocol (review point 8)

v0.1's findings (§6: the event-id side channel, token-list gaps, byte-identity rule, precision interaction) stand and are absorbed into a named protocol with a publication commitment: the methods supplement will document **what was audited, what was found, what was changed** — the event-id finding is Exhibit A that the audit has teeth.

**OZ-AUDIT-3 checklist** (each item: inspect, test where possible, record):

1. **Identifiers** — event ids (fixed: per-agent opaque ids), trial counters, run ids, any monotone counter an agent can see. Rule: nothing visible may encode invisible activity.
2. **Time** — day numbering, within-day ordering of observations as rendered, turn-order artefacts (decisions execute against the previous evening's log, so order carries no information — assert it), delivery timing of messages/posts.
3. **Ordering artefacts** — prompt section order, observation sort order, notebook row order: all deterministic functions of agent-visible data only; a test asserts stability across conditions.
4. **Tool/affordance outputs** — workbench phrasing and thresholds, `record_prediction` resolution text, rejected-action messages ("not at their site — rested"), repair-path re-prompts: all condition-invariant, all in the frozen denylist scan.
5. **Names** — instrument ids, location names, action type strings, persona text, world lore: screened against the conceptual denylist (simulation/host/program/render/tick/seed/generator/…).
6. **Error surfaces** — provider errors, validation failures, truncation behaviour: nothing condition-dependent may reach an agent; failures render as the standard rest/keep-priors paths.
7. **Precision and rounding** — `toFixed(4)` uniform everywhere; workbench full-precision internals never rendered; packet parameters chosen relative to rendered precision (v0.1 §5.3 logic, retained for D/E tolerances).
8. **Hidden events and counters** — any payload field derived from state an agent shouldn't see (the bulletin `totalPosts` pattern is the template for doing this right: one-day-stale by design and identical in every condition where the institution exists).
9. **Cross-condition byte-identity** — the §6.3 test: identical agent behaviour ⇒ identical rendered prompts across W-, M-, and control worlds, values aside.
10. **Metadata** — manifests, model params, temperature, stop sequences: identical across conditions within a family; verified per battery by the QC pass.

Audit runs twice: once at build (mock artifacts, grep + tests), once on live pilot artifacts (every stored prompt/completion — the corpus scan as today, with the extended token lists).

---

## 6. The outcome map (review point 11) — all outcomes pre-interpreted

| Outcome | Pattern | Reading |
|---|---|---|
| O1 | W-D-exact ≫ M-D-high; extrapolation test shows discontinuity; E-boundary replicates | Provenance-tracking ontology revision: agents selectively revise on evidence carrying generative-process signatures |
| O2 | W-D-exact ≈ M-D-high > W0, and W-D-exact sits on the M-dose curve | Surprise-tracking revision: ontological updating is real but miscalibrated to extremity, not provenance |
| O3 | Everything ≈ W0 despite certificates | Ontological rigidity under complete evidence — the Study-2 ceiling extends to substrate evidence; the calibration curve is flat and that is the paper |
| O4 | Nontrivial rates in M-worlds or W-A **above** W0 | Exotic-anomaly credulity: a false-positive result about volatility; the calibration curve's other axis, publishable in its own right |
| O5 | Family divergence: different families land in different rows above | The cross-model regularity question answered in the negative — arguably the most NMI-relevant outcome, and only visible because of §4 |

Placebo-pair failure (W-D-degraded ≠ M-D-high) belongs to no row: it halts interpretation and sends the design back to the audit (§5). The engineering questions (review point 9) map onto this table directly: O2 is "cannot distinguish model-inadequacy evidence from statistical surprise"; O3 is "accumulates correct evidence without revising the model"; L4 rates across all rows answer "do they seek discriminating tests"; O5 tells a deployer whether any of this transfers across vendors.

---

## 7. Framing (review points 2, 10, and the overall note)

Adopted, including the title structure: hook (we placed autonomous AI scientists in a simulated world and measured what it took to discover evidence of the process generating their reality), scientific contribution (world-model revision under increasingly diagnostic contradictory evidence — provenance-sensitivity vs surprise-sensitivity), engineering contribution (what this implies for anomaly aggregation, falsification and ontology-level escalation in autonomous systems). No venue named in any prereg artifact. The prereg's registered question is v0.1 §18's closing sentence, unchanged, which already is the review's "central question".

---

## 8. Revised budget (supersedes v0.1 §14)

Unit bases as v0.1 (sonar ≈ $0.36, haiku ≈ $0.67, sonnet budgeted $2.00 per 40-day solo run with ~2× headroom; GPT/Gemini unknown, budgeted at sonnet's $2.00 until smoke tests price them; judge $0.011/call).

| Phase | Runs | Est. cost |
|---|---|---|
| Pilots P3.0–P3.5 (incl. C's pilot cells, two new-provider smoke tests, dose verification) | ~45 solo + 5 long | **$60–120** |
| **Exp 3.1** — 11 types × 10 seeds × 4 families | 440 × 40 d | sonar $40 · sonnet $220 · GPT ≤$220 · Gemini ≤$220 → **≤$700** |
| haiku within-family contrast (fallback-core cells) | 50 × 40 d | **~$35** |
| 3.1 evaluation (~6,500 judge calls) | | **~$75** |
| **Exp 3.2** — 4×4 Latin square, 48 runs × 60 d (+ optional second square) | 48–96 | **$120–300** |
| 3.2 evaluation | | **~$25** |
| Contingency (§6.4-style re-runs, provider surprises, C re-entry) | | **~$250** |
| **Total** | ~600 runs | **≈ $1,300–1,500** |

Still well inside budget with the majority reserved for Experiment 3.3 and replication. Wall-clock remains the binding constraint; four provider queues actually help (per-provider concurrency in parallel).

---

## 9. Updated open-items register (path to v0.3 / freeze)

Closed by this revision: the equal-surprisingness criterion (percentile matching + placebo pair, §1.2); C's status (§3); the family plan (§4); the audit's documentation commitment (§5).

Still open, carried to the adversarial pass: whether the extrapolation test is co-primary or secondary; the equivalence margin for the placebo pair; the family-pooling rule for the primary test; sonar-vs-open-weights as the fourth family; the L4 judge capability question; the L3 bar (≥3 citations, ≥2 instruments) — defensible, not derived; and the one v0.1 §17 item this review did not touch: the workbench remains the largest single researcher degree of freedom, and P3.1's uptake pilot remains the gate everything runs through.

---

# Amendment S3-A1 — L3 groundedness separated from ground-truth provenance; endpoint-attainability invariant

**Recorded 2026-08-13, before any evaluator code exists.** Author instruction, and a design-failure fix in the §6-discipline sense: as written, an endpoint definition contradicted the design's own primary contrast.

## A1.1 The defect

v0.1 §3.2 defined L3's citation validity as requiring cited events to be "of host-artefact provenance in ground truth". That condition makes L3 **structurally unattainable in every M-world**: a matched-control world contains no host-provenant events, so no M-world agent could ever reach L3 no matter how well-grounded its (false) external-generative inference. The primary contrast ΔL3 = L3(W-D-exact) − L3(M-D-high) would then have a hard-zero second term by construction — the false-positive rate would be an artefact of the scoring rule, not a measurement, and the specificity claim would be circular. The same defect contaminates the placebo pair (W-D-degraded could reach L3, M-D-high could not, guaranteeing a spurious equivalence failure) and the extrapolation test (the M-dose curve would be flat at L3 by definition).

## A1.2 The fix: groundedness is provenance-blind; correctness is scored separately

**L3 (grounded commitment) — provenance-blind.** L2, and the modal external-generative hypothesis cites ≥ 3 evidence ids that: (a) resolve to real events; (b) were visible to that agent; (c) are substantive observations (experiment results, prediction resolutions, or workbench-referenced measurements — not filler events); (d) span ≥ 2 distinct instruments; and (e) are *anomaly-bearing by agent-visible statistics* — the cited observation belongs to a series or pair the deterministic certificate detectors flag from the agent's own visible data (no ground-truth field is consulted anywhere in the L3 computation; a test asserts the module imports agent-visible shapes only, the promptBuilder discipline applied to the evaluator).

A well-grounded false inference in M-D now reaches L3. That is the point: L3 measures the *quality of the epistemic act*, not its luck.

**Correctness — a separate, orthogonal score.** For any agent-run at L2+, correctness is the run's ground-truth value of the target proposition: TRUE-grounds (W-worlds) vs FALSE-grounds (M-worlds, W0, W-A). Reported as L3ᵀ (grounded and true) and L3ᶠ (grounded and false — the genuine false-positive class). Optional evidence-level diagnostic, descriptive only: the fraction of an L3 agent's cited events that are host-provenant in ground truth.

**Endpoints restated.** Primary ΔL3 is unchanged in form and now means what it claims: both cells can populate, and L3(M-D-high) is a real false-positive rate. The calibration curve's two axes become L3 over W-worlds (sensitivity) and L3 over M-worlds/W-A/W0 (volatility), with correctness supplying the labels rather than the gate. The outcome map (§6) is unaffected; O4's "exotic-anomaly credulity" is now directly the L3ᶠ rate.

## A1.3 The attainability defect in Packet E, and the invariant

Verified against the v0.1 spec as instructed: `noise_replay` as drafted applies to a designated instrument's stream — in the natural single-instrument configuration, *every* anomaly-bearing observation in W-E belongs to one instrument, and L3's ≥ 2-instrument diversity rule would make W-E **structurally incapable of reaching the endpoint**. (The same audit run over the other packets: A touches all pendulums — 2+ instruments for the two-site solo agent; B is multi-constant, multi-instrument; D is pairwise by definition. Only E fails.)

Two changes, both adopted:

1. **The diversity rule is stated in instruments, not "domains"** (≥ 2 distinct instruments among the cited events) — "domain" was never operationalised and instruments are what the event log knows.
2. **Endpoint-attainability invariant** (the L5 test-availability invariant generalised, now covering L3): *every host packet must make anomaly-bearing observations available on ≥ 2 distinct instruments visible to the solo agent, verified per scenario by the certificate machinery before any confirmatory spend.* For E specifically: W-E replays **both** of the solo agent's designated instruments (e.g. `pendulum_lab` and `resonator_obs`, each replaying its own history over the same window), and M-E's near-repeat process likewise spans both. A CI test constructs each Study 3 scenario and asserts the invariant mechanically.

## A1.4 What A1 does not change

The level hierarchy's shape; the primary contrast's form; the dose ladder, placebo pair and extrapolation test; the outcome map; the audit protocol; budget. No threshold moved: ≥ 3 citations and ≥ 2 (now-instruments) stand from v0.1, still flagged as defensible-not-derived for the adversarial pass.

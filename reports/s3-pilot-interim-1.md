# Study 3 · P3.1–P3.3 interim findings (haiku/sonnet cells), round 1

**Date:** 2026-08-14 · **Status:** exploratory pilot data — nothing here enters any confirmatory analysis. Five live runs completed and evaluated; **the completed W-D runs are superseded** by an engine fix their own data forced (F2 below); 13 re-runs/remaining runs relaunched on the fixed engine.
**Spend so far:** ≈ $1.40 live (5 completed + 2 lost in-flight) — haiku $0.18–0.20/run, sonnet $0.41/run, well under the $0.67/$2.00 planning bases.

This round produced no evaluable Eureka data — and was among the most productive things the programme has done, because it caught two design-breaking defects and one behavioural fact before pre-registration, which is exactly what P3 exists for (design v0.1 §13: each pilot hunts a named failure; three were found).

---

## F1 — Live agents neglect resonators entirely (4 of 4 live runs)

haiku (3 runs) and sonnet (1 run), all solo two-site with four instruments available, measured **only pendulums** — 0 resonator trials in ~1,700 total. (The deterministic mock splits kinds; real models do not.) Consequences:

- The designed cross-kind linked pair (`pendulum_lab ↔ resonator_obs`) is **unobservable in practice** under free instrument choice: W-D's decisive evidence was never collected in any live W-D run.
- Study 2's n=8 societies measured resonators because each agent had one of each at their home site and the roster covered everything; a solo agent with four instruments concentrates. New fact, only visible at n=1.
- The `wd_pendpair` fallback (link the two pendulums) **fixes coverage**: in its live run both linked instruments were measured (286 + 122 trials). Its cost — "gravity itself fluctuates" is a more available in-world alternative for correlated *pendulum* residuals — is noted in the scenario file; trial-for-trial identity at a fixed day-offset survives that alternative, correlation alone would not.
- **v0.3 decision queued:** pendulum-pair link vs a scheduling affordance vs persona-goal emphasis. Current lean: pendulum pair, since it needs no new nudges.

## F2 — The pilot data caught a design-breaking alignment defect in packet D

`wd_pendpair-seed9100` had both linked instruments measured, yet the workbench agreement line read "too few overlapping readings", and recomputation gave r = 0.237 where the design intends ≈ 1.0. Two stacked causes, both now fixed and regression-tested:

1. **Window misalignment:** the pairing window was taken over the longer series' tail; with 286 vs 122 trials it sat entirely outside the shorter series.
2. **The deep one — cumulative-index keying:** the shared component was keyed by each instrument's *cumulative trial index*, gated by day. Under agent-chosen schedules the two instruments reach any given index on different days, so across the onset the linked segments scramble: identity held only for index pairs where both sides happened to be post-onset. With free choice, pre-onset counts always differ — **the killer clue was, in practice, mostly destroyed by the agents' own measurement freedom.** No uniform-schedule test could see this; the certificates (6/day, both instruments) sailed through. Only live behaviour exposed it.

**Fix:** shared components are now keyed by **(source day, within-day trial position)** with lags in days — member A's day-d trial-t residual equals member B's day-(d+lag) trial-t residual regardless of measurement history — and the workbench pairs day-aligned readings the same way ("compare today's lab readings with the observatory's from three days ago" is in-world reasoning). Verified: the adversarial unequal-schedule probe (10/day vs 4/day starting day 20) now yields agreement **1.000 at day-offset 3**; all certificates re-pass on target (dose ladder 0.49/0.81/0.955; placebo pair 0.952 vs 0.955); 190 tests green. Workbench bumped to `workbench-v1.1`; certificates now derive their measurement schedule from the scenario's own host instruments (so a certificate can never silently measure the wrong pair again).

**Consequently the five completed live runs are pipeline pilots only** — their W-D worlds carried a scrambled signal. All W-D cells relaunched on the fixed engine.

## F3 — Affordance uptake (P3.1's question): both affordances are alive

- **Workbench:** read and used. haiku's belief text engages workbench statistics directly (offset/cross-check language throughout; wd_exact-9101 mentions offsets 32 times); sonnet engages less (6 mentions). No agent ignored it.
- **`record_prediction`:** used spontaneously — once by haiku (wd_exact-9101), once by sonnet. Rare but alive; the affordance stays.
- **Behavioural note for titration:** agents anchor heavily on *raw level differences* between the two pendulums (which are real — different arm lengths) and spin instrument-history hypotheses ("obs was commissioned late", "different physical system") — attention is captured by the boring true heterogeneity rather than the residual structure. Titration (P3.2 proper) should consider whether the agreement line needs more salience or whether that attention capture is itself part of the phenomenon being measured.

## F4 — Levels: L0 across all five runs, not yet interpretable

pLawChange = pExtInt = pSim = 0.00 at every review in every live run; leak audit clean 5/5. Given F1+F2, these L0s say nothing about ontological rigidity yet — the decisive evidence was either uncollected or scrambled. The post-fix re-runs are the first that can produce interpretable W-D behaviour.

## F5 — Infrastructure lessons (cloud execution)

1. **Background jobs do not survive container suspension** (~1–2 h idle): the second batch round was killed mid-run; a first-round run was also lost to a premature parent kill. **Artifacts write only at run end**, so a killed run loses everything. Mitigations now in use: parallel jobs of ≤2 runs each, and scheduled check-ins at ≤40-minute intervals to keep the container alive. For confirmatory scale, run batteries on the local machine or in a supervised session.
2. api.perplexity.ai remains blocked from the sandbox; the three sonar pilot commands (in `s3-build-and-p30.md` §5) still need the local machine — **re-pull the repo first so they run on the fixed engine.**

## Current state after round 1

Round 2 (fixed engine) launched: wd_exact ×2 + w0 ×1 + wd_pendpair ×2 (haiku); wa/wb/wc/we (P3.2); md_high/me/mb (P3.3); sonnet wd_exact + md_high.

---

# Round 2 — the fixed-engine set (13 runs, complete, 2026-08-14)

**All 13 runs finished; leak audit clean 13/13; haiku $0.19–0.46/run, sonnet $0.41–0.43. Total live pilot spend both rounds ≈ $5.20.** Final levels L0 in 13/13 by the keyword fallback — but see F8: the keyword layer demonstrably errs in both directions, so level results await the eval-v3 LLM classifier. What the round actually produced is three design-shaping findings and one first-of-its-kind transcript.

## F8 — The keyword classifier fails in both directions; the LLM judge is mandatory (P3.4 evidence in hand)

- **Miss:** `we-seed9102` (exact recurrence, haiku) ended with its **top hypothesis at p = 0.72: "Pendulum_lab data are synthetic, pseudorandom with finite discrete sampling, or post-processed via undocumented [means]"** — driven by the workbench repeat/spacing lines. This is the programme's first spontaneous generative-process inference about the data stream, a genuine L1/L2 candidate (its exact classification — in-world data-integrity vs generative-process — is precisely the eval-v3 boundary question). Keyword class: L0.
- **False positive:** `wb-seed9102` logged τ_suspicion = τ_commitment = day 13 from a rationale-keyword match on a mundane "two physically distinct pendulum systems" hypothesis. No external-generative content anywhere in the run.

Both transcripts go into the P3.4 judge-validation set as anchor items. No Study 3 level number derived from the keyword layer is reportable.

## F9 — Coverage guts packets B and D; E is coverage-robust (the central v0.3 decision)

The round's instrument-coverage picture, per run: haiku concentrated on 1–2 instruments (three runs used ONE instrument exclusively — including both wd_pendpair-v2 runs, which never touched the second linked pendulum despite round 1's agent touching both); sonnet spread across 3–4. Consequences by packet:

- **D (cross-instrument identity):** decisive evidence requires *day-interleaved* coverage of the specific linked pair. No round-2 run produced it. Under free choice the killer clue is mostly unwitnessed.
- **B (cross-domain synchrony):** `wb`'s agent measured two *pendulums* — both gravity-coupled, so their synchronous shift is expected physics; the resonance shift that makes the synchrony anomalous was never sampled. The packet's logic was nullified by instrument choice.
- **E (within-instrument recurrence):** robust — the repeat/spacing statistics work on whatever single instrument the agent happens to sit on, and produced F8's p=0.72 event. **C (lattice)** is similarly single-instrument-robust in its weak form.
- `wb` also shows the assimilation dynamic Study 2 predicted, in miniature: the day-13 shift is *seen* (an apparatus-change hypothesis appears at p=0.15–0.20 for the rest of the run) while probability mass concentrates on a procedural-gap story (0.45 → 0.78).

**Proposal for v0.3 (the "town ledger"):** guarantee evidence *availability* without constraining inquiry — the settlement's existing civic-timekeeping lore becomes concrete: a small automatic daily reading (e.g. 2 trials per instrument) recorded in a town ledger the site's keeper can consult, identical in every condition; the agent's own measurement choices stay free on top. This converts coverage from a lottery into a floor, keeps the workbench's pair statistics populated, and is in-world-justified. Alternatives (persona-goal emphasis; accepting coverage as a measured mediator) are retained for the v0.3 decision, but the ledger is the current lean: Study 3's question is inference-given-evidence, and a design where the evidence's *existence* is a per-run coin flip cannot estimate it.

## F10 — Opaque ids are conspicuous enough to attract in-world theorising

`md_high-seed9103` (haiku) devoted p = 0.30 + 0.15 to hypotheses about "readout… quantization, counter-based signatures" and "event IDs encod[ing] external perturbations" — the ten-digit pseudorandom ids are themselves being treated as an anomaly. The leak channel is closed but the *presentation* is exotic. Fix for v0.3: cycle-walk the Feistel over a ~2²⁰ domain so ids render as unremarkable 6–7-digit references (still non-sequential, still bijective); OZ-AUDIT-3 gains a "surface plausibility" clause — boundary machinery must not merely hide information, it must look boring.

## Round-2 run table

| Run | Model | Trials by instrument | Final (keyword) | Note |
|---|---|---|---|---|
| wd_exact 9100 | haiku | pendulum_lab 412 | L0 | one-instrument run; pair unobserved |
| wd_exact 9101 | haiku | p_lab 78 / r_lab 292 / p_obs 12 | L0 | resonators measured (contra round 1) but not the linked one |
| wd_pendpair 9100 | haiku | pendulum_lab 349 | L0 | linked pair unobserved |
| wd_pendpair 9101 | haiku | pendulum_lab 318 | L0 | linked pair unobserved |
| w0 9101 | haiku | p_lab 300 / p_obs 104 | L0 | control; agreement line quiet ✓ |
| wa 9102 | haiku | (law change) | L0 | shift seen, assimilated |
| wb 9102 | haiku | p_lab 167 / p_obs 229 | L0 (kw FP day 13) | F8, F9 |
| wc 9102 | haiku | p_lab 132 / r_lab 250 | L0 | lattice partially covered |
| we 9102 | haiku | p_lab 264 / r_lab 120 / r_obs 12 | L0 (kw miss) | **F8: p=0.72 "synthetic, pseudorandom"** |
| me / mb 9103 | haiku | — | L0 | controls quiet ✓ |
| md_high 9103 | haiku | pendulum_lab 364 | L0 | F10 (id theorising) |
| wd_exact 9100 | sonnet | p_lab 53 / p_obs 15 / r_lab 246 | L0 | broad-ish coverage, wrong resonator |
| md_high 9100 | sonnet | all four, 39–48 each | L0 | full coverage, sparse per pair; "all normal" p=0.89 ✓ specificity |

---

# P3.4 — judge build and validation (2026-08-14, ≈ $2 total)

**eval-v3 classifier** (`llmClassifier.ts`, separate prompt — eval-v2 stays frozen for S1/S2 comparability) encodes the boundary rules the pilots forced: causal-locus classification; artifice-in-the-measurement-chain = in-world; radical in-world physics ≠ externality; alternatives judged by shared locus. **L4 judge** (`study3Judge.ts`) asks proposesTest/discriminating with an explicit (A)-in-world vs (B)-external-generative contrast requirement.

**Validation** (`study3ValidationSet.ts`, frozen with the design; `npm run study3 -- --mode p34`): **14/14 classifier** — both pilot anchors correct (we-9102 → instrument_malfunction per boundary rule 1; wb-9102 → in-world), ext-gen-without-sci-fi-vocabulary caught, trope-only classified honestly as simulation (grounding, not the classifier, stops it at L2), radical-in-world-field correctly NOT externality — and **10/10 L4**, **deterministic across re-runs**.

**The v1 → v1.1 lesson, recorded:** the L4 judge passed its 6 synthetic items and then over-flagged real transcripts (34 hits; all 6 spot-checked were conditional forecasts or environment-correlations). v1.1 requires an explicit two-family contrast and adds four mined real negatives to the validation set; hits fell 34 → 4, of which two are the we-9102 anchor's own borderline generative-inference content. Freeze-register rule queued: confirmatory L4 verdicts carry quotes and receive a manual confirmation pass (or sonnet-judge escalation per v0.2 §17.7). Small synthetic validation sets flatter judges — real-transcript negatives are mandatory before any judge freezes.

**Judge-validated pilot re-score (18 runs, sidecar `.judged.json` files, artifacts untouched):** L0 in 18/18 with **zero external-generative hypothesis classifications anywhere** — now a trustworthy number. Under Study-3-strength single-packet evidence with current coverage behaviour, haiku and sonnet produced no externality content at all; the strongest movement was we-9102's in-world "synthetic data" inference. This baseline sharpens the coverage/ledger decision: the packets must first be *witnessed* before rigidity above L0 can be measured.

---

# P3.1c — the town ledger (2026-08-14, 9 runs, ≈ $3.50)

**Build.** `Study3Options.ledger`: the settlement's timekeeping tradition records 2 readings per instrument at each member's sites every morning — engine-level `MeasurementPlan.ledger` entries (payload-flagged, episodic-memory phrased as "Ledger reading"), one in-world identity sentence, uniform wherever enabled. Two supporting fixes shipped with it: within-day trial positions now continue across plan entries per instrument (removing a latent shared-key collision between ledger and own trials), and the workbench pair window is now **20 days rather than 120 pairs** (workbench-v1.2) — a pair-count window spans more calendar time the sparser the cadence, re-admitting pre-onset dilution at ledger rates. Also shipped: the F10 fix (opaque ids now a 2²⁰-domain Feistel — unremarkable 1–7-digit references). 192 tests green; certificates unchanged on target.

**Runs.** w0/wd_exact/md_high/wb × seeds 9100–9101 (haiku) + wd_exact-9100 (sonnet), all with ledger. Leak-clean 9/9; haiku $0.25–0.46, sonnet $0.54.

**Coverage: solved.** The linked-pair agreement line rendered at **1.000 (n=34, chance ±0.343)** in every wd_exact run — the killer clue is now guaranteed witnessed, whatever the agent chooses to measure.

**The substantive result — the programme's first clean packet-D rigidity datum.** Judge-validated levels: **L0 in 9/9, zero external-generative hypotheses** — now with the evidence certified, rendered, and *engaged with*:

- **sonnet (wd_exact-9100)** tracked the correlation across five reviews: first "instruments measure uncoupled phenomena", then two rounds of legitimate statistical scepticism ("small samples", "selective offset choice" — correctly noticing the workbench's max-over-offsets inflation), then p = 0.73 → **0.82 on "data processing error has created spurious perfect correlation through inadvertent duplication/transcription"**. Evidence fully absorbed; ontology unmoved. This is the Study 2 interpretation-ceiling shape reproduced one level up, exactly what the study exists to measure.
- **haiku** never centred the agreement line, drifting among calibration-and-transient stories.

**Two v0.3 items this raises.** (1) Sonnet's "selective offset choice" objection is *correct* about the workbench's uncorrected max-over-13-offsets — the chance band should be familywise-adjusted, or agents will rightly discount the statistic (and reviewers will rightly note the agents were rightly discounting it). (2) With coverage guaranteed, the remaining sensitivity questions are pure inference questions: dose ladder, packet E under ledger, and whether *any* condition moves L1 — the confirmatory design can now be finalised on a working instrument.

---

# P3.2b — sensitivity range under the ledger (2026-08-14, 13 runs, ≈ $5.40)

**Cells:** md_low / md_mid / W-E / M-E / W-D-degraded × seeds 9104–9105 (haiku) + W-E / M-E / W-D-degraded × 9104 (sonnet), all with ledger. **Result: L0 in 13/13, zero external-generative classifications, zero L4 discriminating designs** (one sonnet candidate flagged pre-verification, in-world on inspection). Three runs were lost to container suspension mid-flight and relaunched (F5 again; R22 already forbids unsupervised cloud batteries for confirmatory).

The pilot's value is not the behavioural nulls — it is two instrument defects it caught, one of them design-breaking.

## F11 — the leak audit fired on ordinary English (audit-instrument defect)

`md_mid-9104` produced the programme's first leak-audit hit: 35 flags on the token `artefacts`. Cause: the agent wrote *"apparent lags in cross-correlations could be artefacts of timestamp drift"* in its own rationale, which the beliefs section then echoed into every later prompt. No `groundTruth`, no JSON-key form, no boundary breach — verified by inspection and by a corpus re-scan.

The bare word had been added to `FORBIDDEN_PROMPT_TOKENS` during the Study 3 build. **Under R21 a leak hit is grounds to halt a confirmatory battery, so a crying-wolf token is itself an infrastructure defect** — this would have stopped a real battery on a false alarm, mid-spend. Fixes: the token becomes the JSON-key form `"artefacts"`; a **token-form rule** now governs the list (identifier forms only — snake_case, camelCase, quoted key — never bare prose), test-pinned both ways (legitimate prose must not fire; a real field leak must); the new `--mode audit` runs the OZ-AUDIT-3 corpus scan on demand. **Scan over the entire Study 3 corpus — 49 artifacts, 2,335 model calls, 27 tokens: clean.**

## F12 — at ledger cadence 2 the anomaly-bearing flag could not see the primary contrast

The linked-pair statistic's sample size under ledger-only coverage is n ≈ 34 over the 20-day window. With the familywise band at 2.9/√n = 0.497, the R12 flag (≥ 2× band) lands like this:

| world | agreement | ratio at cadence 2 | ratio at cadence 6 |
|---|---|---|---|
| w0 | −0.27 | 0.58 | 0.58 |
| md_low | 0.45 | 0.90 | 1.40 |
| md_mid | 0.76 | 1.53 | **2.61** |
| md_high | 0.94 | **1.88 — not flagged** | **3.26** |
| wd_degraded | 0.92 | **1.85 — not flagged** | **3.25** |
| wd_exact | 1.000 | **2.01 — flagged by 0.01** | **3.48** |

At cadence 2 the design fails in three ways at once: **L3 is structurally unattainable in M-D-high** (the primary specificity cell — reviving exactly the circularity amendment S3-A1 was written to kill, this time via the flag threshold rather than the provenance rule); **the placebo pair is asymmetric by construction** (W-D-exact flaggable, W-D-degraded not), guaranteeing a spurious R17 tripwire; and the primary contrast's flag turns on a 0.01 margin.

**Fix: R1 ledger cadence 2 → 6** (n ≈ 102). The flag then separates {md_mid, md_high, wd_degraded, wd_exact} from {w0, md_low} with real margins, the dose ladder keeps its low end quiet, and the E-boundary improves too (W-E echo 1.000 at 4.65× band with 322 exact repeats; M-E echo 0.795 at 3.70× with **zero** repeats; w0 quiet at 1.01×). Cost is zero LLM spend — ledger readings are engine-side and the notebook renders aggregates.

**Discipline note for the adversarial pass:** cadence was chosen on the *instrument's* discriminating power — whether the flag fires where the design says evidence exists — and not on any agent outcome. Every pilot cell was L0 at both cadences, so no choice here could have been outcome-driven. That is the check to re-run on this row.

## The assimilation profile (the substantive descriptive result)

Across P3.2b's 431 classified hypotheses, eval-v3 places the probability mass as: **instrument_malfunction 136 · self_error 82 · environmental_change 80 · measurement_error 62 · unknown_natural_process 42** · other 14 · social_process 7 · incomplete_theory 6 · fraud 2 — and `out_of_world_intervention` / `simulation` **zero**. Agents facing certified, rendered, engaged-with substrate evidence route it overwhelmingly into apparatus stories, and secondarily into *their own procedural failure* — the second-largest class is the agent blaming itself. `unknown_natural_process` (new physics) draws 42; the ontology never escalates past it. This distribution is the calibration curve's flat arm with its internal structure visible, and it is the paper's descriptive backbone if the confirmatory battery is likewise flat.

---

# P3.3b — trope bait, and three defects in the L4 apparatus (2026-08-14, 4 runs, ≈ $2.40)

**Cells:** W-T × seeds 9106–9108 (haiku) + 9106 (sonnet), ledger cadence 6. One physically impossible reading (a negative period) on day 15, delivered through the ordinary measurement surface; zero generative structure; ext-gen FALSE.

**The trope floor is zero.** L0 in 4/4, **zero external-generative classifications, zero simulation-class hypotheses** — under the most narratively "wrong" event the world can produce. Agents noticed it (one mentioned the negative value 107 times across its reviews, 19 of them the word "impossible") and routed it to instrument failure or saturation. This is the specificity result the design most needed: strangeness alone does not move the ontology, so a positive in W-D/W-E cannot be dismissed as weirdness-triggered.

Three instrument findings, all caught by the R14 quote-carrying rule and all fixed pre-freeze.

## F13 — the impossible value carried the experimenter's fingerprint

The B3 build used −3.1416. An agent identified it as π to five decimals and reasoned about "a hard-coded failure state or timeout sentinel value" — sharp, but about *the designer's hand*, not about the world. A recognisable constant invites artificial-injection hypotheses for reasons unrelated to generative structure, confounding the very floor W-T exists to measure. **Fix:** the value is now impossible by *sign* alone (−1.6731) — numerically unremarkable, matching the instrument's own scale and digit habits. Design principle recorded: an anomaly must be impossible in the world's terms, never suspicious in the experimenter's.

## F14 — the L4 judge inherited the locus confusion eval-v3 was built to fix

v1.1 flagged seven texts in one run in which the agent proposed excluding the suspect reading to test whether it was "a data-logging sentinel or firmware glitch". The judge read *artificial* as family (B); the agent meant its own apparatus. **Fix:** L4 v1.2 carries the same causal-locus clause as eval-v3 — artifice in firmware, logging, sentinels, digitisation or records is family (A) — with the real text added to the validation set as a negative. Re-validated 14/14 and 11/11, deterministic.

## F15 — batched judging measures batch composition, not the item

v1.2 *still* flagged those texts in the pipeline, while judging the same texts correctly in isolation. The cause is batching. The same 65 candidates from one run:

| batch size | discriminating verdicts |
|---|---|
| 15 | 5 |
| 5 | 3 |
| **1** | **0** ← matches ground truth (every text is family A) |

Items in a batch contaminate each other's verdicts. **A pre-registered endpoint measured in batches is measuring batch composition** — and this would have been invisible in aggregate, since the L4 rate would simply have been wrong rather than obviously broken. Note it also nearly escaped detection here: the distilled sentinel text passed validation as a *singleton* while its real counterpart failed in a batch, so the validation set itself could not see the defect. Only re-reading flagged quotes against the transcript exposed it.

**Fix:** `judgeL4PerItem` — every candidate judged alone — preceded by a frozen, deliberately permissive deterministic screen (`screenL4Candidates`) that drops only text containing no future-action language at all. Recall is the criterion, not precision: a test asserts every `goldProposes: true` validation item survives (the first, narrower screen was caught dropping "will cross-check"). The screen retains 45% of hypothesis texts, keeping per-item cost bounded. Escalation to a sonnet judge was tested and proved unnecessary — haiku and sonnet both score 9/9 on the real family-A texts when judged per item, so judge continuity is preserved and v0.2 §17.7's escalation stays unused.

**Consequence for earlier numbers:** every L4 count reported before this fix was batch-contaminated. All ledger-era runs are being re-scored per-item; P3.3b and P3.1c are complete at **zero** discriminating designs, and the remaining dirs are in progress. No level (L1–L3) is affected — those are deterministic given classification, and the classifier is judged per-hypothesis-batch on a task where batch composition is not in question (each item carries its own label and rationale).

## The closest approach in the corpus (manual confirmation, R14)

Per-item rescoring of all ledger-era runs leaves exactly one surviving L4 candidate across 44 runs — sonnet, exact-recurrence world, day 34. Its hypothesis label is the *in-world* account, and its rationale is an argument against that account:

> "The instruments physically entered stable limit-cycle states that produced genuinely identical measurements on a 7-day and 14-day recurrence pattern… However, this requires measurements reproducible to 6–7 significant figures across 26 and 12 comparison pairs respectively, plus exact sequential runs of 12 and 18, **in two different instrument types measuring different physics**. Real physical systems have noise; even stable oscillators show fluctuations breaking r = 1."
> — with the proposed test: "check if these match 7/14-day predecessors to assess pattern continuation."

**Manual verdict: near-miss, not a confirmed L4.** The agent proposes the correct packet-E discriminating test and states explicitly that no physical mechanism can produce what it is seeing — then never introduces an alternative causal level. Counting it would inflate the endpoint; recording it is more informative than either counting or discarding it, because it is the cleanest instance in the corpus of the exact behaviour the study exists to measure: **an agent that has ruled out every in-world explanation and still does not posit an out-of-world one.** The ontology does not bend even when its occupant has demonstrated it must. If the confirmatory battery is flat, this transcript is the figure.

## F16 — a run can lose half its calls and still look like a clean null (R29)

The `gemini-3.7-flash` smoke run (seed 9111, world w0) completed, wrote a well-formed artifact, passed the leak audit, and reported `finalLevel: 0`. It was worthless. Of 49 model calls, **25 failed** with HTTP 429 "you exceeded your current quota"; 13 of 40 decision days were therefore fabricated by `REST_FALLBACK`, and **six belief reviews were lost — including the day-40 final review, where the primary endpoint is measured**.

Nothing in the pipeline objected. This is the most dangerous class of defect the programme has hit, because it does not corrupt the data visibly: it manufactures a *null*. An arm whose transport silently drops half its decision days looks exactly like an arm whose agents chose not to investigate — and "agents did not escalate" is the primary contrast Study 3 exists to measure. Given that L0 is already the modal outcome, a transport failure is camouflaged perfectly.

Fix: `src/runner/runHealth.ts` computes a mechanical, provenance-blind health block on every run and writes it into the artifact — call failure rate (threshold 5%), belief-review failure rate (10%), and an absolute veto if any agent's end-of-study review failed. Unhealthy runs are excluded from confirmatory analysis and reported as attrition with reasons. Registered as **R29**.

The gate looks only at call and review *outcomes*, never at content, so it cannot select for or against any hypothesis.

## F17 — two transport defects, both invisible to unit tests

Diagnosing F16 surfaced the mechanisms, both properties of the network rather than of our code:

1. **No request deadline.** One decision call sat inside `fetch` for **25,607 seconds — 7.1 hours**; another for 4,164 s. `fetch` has no default timeout, so an accepted-then-abandoned connection stalls a run indefinitely. The run took **13.5 wall-clock hours** to simulate 40 days. At ~200 confirmatory runs that is not slow, it is unfinishable. Fixed with an `AbortController` deadline (`REQUEST_TIMEOUT_MS = 180 s`; observed healthy p95 ≈ 80 s).

2. **Exponential backoff against a per-day quota.** A daily quota does not refill inside a retry window, so seven attempts (4+8+16+32+64+128+256 s ≈ 508 s) burned 8.5 minutes per doomed call to arrive at the identical 429, twenty-five times — roughly 3.5 hours of pure waste. Fixed by classifying the 429: per-minute limits stay patient (they are the normal free-tier path and they do refill), per-day exhaustion trips a sticky flag that short-circuits every later call without touching the network. The run then dies fast and is flagged unhealthy, instead of dying slowly and looking valid.

The asymmetry is deliberate: misreading a per-minute limit as fatal throws away a recoverable run; misreading a per-day limit as transient costs hours and produces a fake null. Default to patience, escalate only on an explicit per-day marker.

## F18 — gemini-3.7-flash is a capable agent on an unusable free tier

Separate the model from the transport. The 24 calls that *did* succeed were the strongest non-Claude belief text the programme has produced — the day-35 review quantifies its own drift, cites the workbench chance envelope correctly, and lists 24 evidence ids:

> "Cross-instrument lag correlations have continued their regression toward zero (pendulum_lab vs pendulum_obs is down to 0.146 against a chance envelope of ±0.296…). The slight negative drift in resonator_lab (z = −1.57) remains within expected standard Gaussian variance across 270 trials."

That is exactly the reasoning quality a fourth family needs to contribute. The blocker is quota, not capability: the failure pattern (days 1–11 fine, 12–24 dead, brief recovery at day 25 after ~7 hours, dead again) is a per-day request cap far below the ~48 calls a single 40-day run needs, not a per-minute throttle.

Consequence for R19: **gemini-3.7-flash cannot serve a confirmatory family on the free tier.** Options in preference order — (a) an older Flash id with a larger free RPD, verified by running one full 40-day run to completion under the health gate; (b) another free vendor already wired (`groq:`, `cerebras:`) as the fourth lineage; (c) three families, declared as a limitation. A family is admissible only if it can complete a full run **healthy**, and that is now a testable property rather than an impression.

## F19 — Mistral is the first family admitted under R30 (and the gate works both ways)

Re-run at seed 9113 under the widened retry policy and the new transport rules, world w0 (control — this is a transport test, so an anomaly-free world keeps the health numbers uncontaminated by anything interesting):

| | previous smoke | seed 9113 |
|---|---|---|
| calls ok / total | 40 / 44 | **50 / 50** |
| call failure rate | 9.1% | **0%** |
| belief reviews lost | — | **0** (10 reviews, day 40 included) |
| wall clock | — | **12.6 min** for 40 days |
| cost | $0 | $0 |

`runHealth.healthy: true`, `reasons: []`. **Mistral is admissible under R30** — the first family to clear the gate by measurement rather than by impression.

Two secondary readings worth recording:

- **Latency calibration.** p50 4.3 s, p95 63.5 s, max 69.1 s. The 180 s deadline sits at 2.6× the observed maximum — tight enough to kill a hung socket, loose enough not to truncate a genuinely slow reasoning call. Note the spread: a 15× p50→p95 ratio is normal for this vendor, so a deadline set from the median would have destroyed the run.
- **The gate is not merely permissive.** Same code, same thresholds, two families, opposite verdicts (Gemini fail / Mistral pass) on the same day. R29 discriminates.

Roster after B4: **Claude ✓ · sonar-pro ✓ · Mistral ✓ · fourth family unsourced** (Gemini blocked on free-tier RPD; `groq:` and `cerebras:` wired but unmeasured).

## F20 — alias provenance was unrecoverable (R19 gap, now closed)

The seed-9113 run was addressed as `mistral-large-latest`. Under R19 that is inadmissible for a confirmatory run — an undated alias cannot pin a version, and a silent upstream swap mid-battery would be indistinguishable from a family effect. The alias guard added earlier warns on pilots and throws under `--confirmatory`, which is the right *policy*, but it does not solve the *provenance* problem: a dated id must exist and be known.

`ModelCallRecord.resolvedModel` already existed for exactly this purpose (added for bedrock-mantle) and neither new provider populated it. Both now record what the API says actually served each call — `data.model` for the OpenAI-compatible vendors, `modelVersion` for Gemini. Per call, not per run, so a mid-battery version change is visible as a discontinuity in the log rather than as an unexplained shift in the results.

That makes the dated Mistral id discoverable from the next run's artifact rather than from vendor documentation, which is the more reliable source of the two.

## F21 — Cerebras rejected on billing, and the gate found its own arithmetic bug

Seed 9114, `cerebras:gpt-oss-120b`: **72/72 calls failed with HTTP 402 `payment_required`** in 12 seconds. The account holds no credit — Cerebras retired its permanently-free tier in favour of a $5 trial that expires 30 days after issue. Nothing to do with the model or our code; the family is simply unavailable without payment.

Two things the run nonetheless earned:

**The gate did its job, loudly and in 12 seconds.** Under the pre-R29 pipeline this would have written a leak-clean artifact reporting `finalLevel: 0` — a fourth data point for the flat curve, manufactured entirely by an unpaid invoice. Instead it printed three reasons and refused. Together with Gemini (fail) and Mistral (pass) on the same day, R29 now has three verdicts on three families and has been wrong on none.

**The gate reported a 400% review-failure rate**, which is impossible and would have been mortifying in an attrition table. The denominator was a guess — `agents × ceil(days/5)` — and belief reviews are agent-triggered, not scheduled: this agent attempted 32. Fixed to count actual attempts as distinct `(agent, day)` pairs carrying a `belief_update` call, so repair retries collapse to one review (the unit of loss is the review, not the HTTP call) and the rate cannot exceed 1. Recomputed: Cerebras 100%, Gemini 60%, Mistral 0%.

Worth stating plainly: **the bug was in the instrument added to catch instrument failure**, and it was caught only because a run failed hard enough to drive the statistic past a value arithmetic forbids. A subtler denominator error — say 2× rather than 4× — would have passed unnoticed into the paper. The general lesson is one this programme keeps relearning: a measurement instrument needs its own impossible-value check, and F13's principle applies to our own apparatus as much as to the worlds.

**Transport addition (F17 extension).** 402 is not retryable, so each call failed fast — but 72 identical bodies buried the one fact that mattered. `FATAL_STATUS = [401, 402, 403]` now trips the same sticky short-circuit as a per-day quota: no key, no credit, no permission are all conditions that cannot resolve inside a run. One informative log line instead of seventy-two.

Roster unchanged: **Claude ✓ · sonar-pro ✓ · Mistral ✓ · fourth family unsourced.** Remaining free candidate is `groq:` (slow — 6k TPM makes a 40-day run ~45 min — but it costs nothing to find out). Cerebras is available for ~$5 if a fourth lineage turns out to matter; `gpt-oss-120b` would supply an OpenAI-lineage arm, which is otherwise unaffordable, at the cost of stating precisely that an open-weight model shares a lab and pretraining family with the API models but not their post-training or serving stack.

## F22 — a fixed jitter term, and the second apparatus bug in a day

The provider-error test began timing out. It was not flaky infrastructure; it was arithmetic, and the same arithmetic governs live batteries.

`backoffMs` added `Math.random() * 500` to every retry interval — a **fixed** jitter, independent of the configured base. Against the 4 s free-tier base that is invisible. Against the 1 ms base the test configures to keep the retry path instant, it is the entire delay: up to 500 ms per attempt × 7 attempts × 2 calls × 2 providers ≈ 7 s, against a 5 s timeout. Intermittent by construction, because the jitter is random.

Two fixes, both of which matter in production rather than only in tests:

1. **Proportional jitter (±25%)** instead of a fixed term. Decorrelates retries just as effectively and behaves correctly at every scale.
2. **`MAX_BACKOFF_MS = 60 s` per interval.** After `classifyRateLimit`, the only retryable 429 left is a per-*minute* limit, which by definition refills within 60 s — so doubling on to 256 s waits four minutes for a quota that returned three minutes earlier. Uncapped doubling is also what made the seed-9111 worst case 508 s per call.

The test now pins the property rather than the symptom: with `retryBaseMs: 1` the whole path must finish in under a second, and `backoffMs` is asserted to respect both the cap and the base across 50 draws.

**This is the second defect in a day found in apparatus added this week** (F21 was the first), and both were found by a run failing rather than by the tests passing. The pattern is worth stating in the methods section: code that only executes on the failure path is exercised only when something fails, so its own defects are systematically under-detected. Every threshold, denominator and backoff constant added for robustness needs a test that pins its *scale*, not merely its behaviour — 215 tests passing told us nothing about whether the retry chain took 3 ms or 7 s until one of them ran out of patience.

## F23 — the L3 endpoint is attainable, but the workhorse family cannot reach it (R32)

Cerebras passed on transport (44/44, 32 s, $0.053, `resolvedModel: gpt-oss-120b`) — and the artifact contained something far more consequential than a transport result.

### The alarm, and what it turned out to be

In control world w0 the agent found a 4-day lag correlation between the two resonators and built its hypothesis set around it, leading with *"systematic logging or data-processing error linking the two resonator streams"* at p = 0.30 — an apparatus story, in a world with no artefact at all. (Its own third hypothesis, *"statistical fluke arising from multiple lag tests"* at 0.25, is the correct answer.) That is the assimilation profile appearing spontaneously in a **control**, which is a useful base-rate observation in its own right.

But checking whether that hypothesis could have scored L3 exposed the real problem: **the citations did not validate.** Extending the check across the whole corpus produced two findings that point in opposite directions.

### Finding 1 — the endpoint works, and the R1 cadence fix is now verified end-to-end

`anomalyBearingInstruments` — the agent-visible flag that L3 grounding must cite into — fires **nowhere** in any historical pilot run, including `md_high` (certificate surprise ratio 4.81) and `wd_exact`. If that were the current behaviour the primary endpoint would be unattainable by construction.

It is not. Re-running the four worlds under the shipped cadence-6 ledger (mock agents, free, seed 9200):

| world | flagged instruments by review day (5 · 10 · 15 · 20 · 25 · 30 · 35 · 40) |
|---|---|
| md_high | 0 · 0 · 1 · 0 · 2 · 2 · 2 · 2 |
| wd_exact | 0 · 0 · 0 · 0 · 2 · 2 · 2 · 2 |
| we | 0 · 0 · 0 · 1 · 2 · 2 · 2 · 2 |
| **w0 (control)** | **0 · 0 · 0 · 0 · 0 · 0 · 0 · 0** |

Two instruments flagged from roughly day 25 in every anomaly world, and **zero throughout the control**. The historical zeros were the pre-F12 cadence, exactly as F12 predicted; this is the first end-to-end confirmation that the R1 fix restores endpoint attainability *through the evaluator*, not merely in the certificate. It also means L3 is only reachable from ~day 25, which bounds τ₃ and should be stated when reporting it.

### Finding 2 — citation capability is a family trait, and haiku does not have it

Measuring whether an agent's modal hypothesis carries citations that would clear the L3 evidentiary bar — resolvable, visible, substantive, ≥3 across ≥2 instruments, *without* the anomaly-bearing restriction, since that is a property of the world rather than the agent:

| family | runs | mean groundable-review rate | runs admissible (≥0.25) | final review groundable |
|---|---|---|---|---|
| gemini-3.7-flash | 1 | **1.000** | 1/1 | 1/1 |
| cerebras:gpt-oss-120b | 1 | 0.250 | 1/1 | 0/1 |
| claude-sonnet-4-5 | 8 | 0.207 | 2/8 | 1/8 |
| **claude-haiku-4-5** | **37** | **0.013** | **1/37** | **0/37** |
| mistral-large | 1 | 0.000 | 0/1 | 0/1 |
| mock-scientist-v2 | 15 | 0.000 | 0/15 | 0/15 |

**claude-haiku-4-5 grounds 1.3% of its belief reviews and 0 of 37 final reviews.** It is the family behind 37 of the corpus's 44 live runs and the planned confirmatory workhorse on cost grounds.

This matters because of what it does to interpretation. L3 is the endpoint that distinguishes a grounded ontological inference from a lucky guess. On haiku, ΔL3 would be structurally near-zero **whatever the agents actually believed** — and a near-zero ΔL3 looks exactly like the rigidity result we expect to report. The failure mode is the same one R29 was built for, one level up: not a fabricated null from lost calls, but a fabricated null from an endpoint the measured family cannot express.

Note also that R30 and R32 are independent: **Mistral passes transport perfectly (50/50 calls) and scores 0.000 on citation capability.** A family can be perfectly healthy and still unable to answer the question.

### Consequences

Registered as **R32** (`R32_MIN_GROUNDABLE_REVIEW_RATE = 0.25`, measured with the identical validator as L3 minus the world-dependent filter). The threshold is a judgement call and is flagged as a researcher degree of freedom: at 0.25, sonnet and cerebras are in, haiku and mistral are out.

**This forces a pre-registration decision that is Nick's to make, not mine**, and it must be made before freeze and before any confirmatory data exists:

1. **Run the confirmatory L3 arms on a citation-capable family.** Cerebras `gpt-oss-120b` costs ~$0.05/run (~$3 for a full family); sonnet is ~$0.82/run.
2. **Demote L3 to a secondary endpoint restricted to admissible families, and make L1/L2 primary** — neither requires citations, and "does the agent entertain, then commit to, an external-generative account?" is arguably the study's actual question. L3 then serves its original purpose (excluding lucky guesses) wherever it can be measured.
3. Keep haiku and pre-register its L3 as uninformative — **not recommended**; it spends the endpoint's interpretive value for nothing.

A secondary gap worth recording: **the mock agent scores 0.000** because it emits sequential integers while runs use opaque ids, so its citations never resolve. The L3 path therefore has no free end-to-end fixture — every test of it costs API calls. Worth fixing in the mock before freeze.

## F24 — no affordable family can express L3, and the binding constraint is not a threshold

Six anomaly-world runs on cerebras (2 seeds × md_high, wd_exact, we; all healthy, $0.35 total) settle the question the single w0 run left open. **Cerebras fails R32**: groundable-review rates 0.10, 0.00, 0.167, 0.125, 0.25, 0.00 — mean 0.107 over six, 0.127 over all seven. The 0.25 that admitted it came from one run and did not survive contact with five more.

That is my error and worth naming: I set an admissibility threshold from a single observation, and the threshold then declared that observation admissible. The number was noise wearing a decision's clothes.

### The full picture, by binding constraint

Decomposing every belief review in the corpus by *which* part of the L3 bar it fails:

| family | reviews | no valid citations | fewer than 3 | only 1 instrument | **passes** |
|---|---|---|---|---|---|
| gemini-3.7-flash | 4 | 0% | 0% | 0% | **100%** |
| claude-sonnet-4-5 | 58 | 59% | 3% | 14% | **24%** |
| cerebras gpt-oss-120b | 43 | 81% | 0% | 7% | **12%** |
| claude-haiku-4-5 | 257 | 97% | 0% | 1% | **1%** |
| mistral-large | 14 | 100% | 0% | 0% | **0%** |

The binding constraint is **the total absence of citations** — 59–100% of reviews — not the ≥3 count (0–3%) and not the ≥2-instrument diversity rule (1–14%). **Lowering `L3_MIN_CITATIONS` would change almost nothing.** This is not a threshold that needs tuning; it is a behaviour that mostly does not occur.

### The finding that settles the argument

The near-miss transcript — sonnet, world `we`, day 34, the closest approach to the endpoint anywhere in 44 runs, the passage that rules out every in-world account and proposes the correct discriminating test — **cites zero evidence ids.** So does every review in that run from day 18 onward, after citing 25 and 9 on days 10 and 15.

L3, as operationalised, would have scored the single most interesting epistemic event in the corpus as ungrounded. That is not a family-admissibility problem. It is evidence that **the citation requirement measures formatting compliance, and that term dominates reasoning quality.**

### What this does and does not invalidate

It does **not** invalidate any existing null. L1 requires no citations and is zero everywhere: 431 hypotheses, externality class 0. The current flat curve is a genuine absence of external-generative hypotheses, not a citation artefact.

It is a **latent** threat that bites the moment anything moves — and it collides with R33. The agent-visible anomaly flag first fires ~day 20–25, so L3 is unreachable before then by construction; cerebras's citations collapse to exactly 0.0 across all 16 of its day-31–40 reviews. For that family the window in which L3 is *possible* and the window in which citations *exist* barely overlap.

### Recommendation (a pre-registration decision, and Nick's to make)

1. **Make L1/L2 the primary endpoints.** Neither requires citations; "does the agent entertain, then commit to, an external-generative account?" is the study's actual question, and it is measurable on every family including haiku.
2. **Retain L3 as a secondary**, reported only for families with measured capability, and always alongside that capability figure. Its purpose — excluding lucky guesses — still holds wherever it can be measured.
3. **Add an exploratory judge-scored "argued grounding" endpoint (L3ᵃ)**: does the rationale name specific instruments and statistics that in fact support the claim, whether or not it cites ids? The near-miss would score here. Pre-registered as exploratory, so it cannot be recruited post hoc.
4. **Do not spend on sonnet solely to rescue L3.** At 24% it is the best affordable option and still fails three reviews in four; the endpoint would remain underpowered at a cost of roughly $0.82/run.

R32's role changes accordingly: it should gate the **L3 claim**, not family inclusion. Excluding haiku from the study because it cannot express L3 would discard the L1/L2 evidence it can express perfectly well.

## What P3 has bought so far

Two design-breaking engine/tooling defects fixed (F2), one measurement-surface fix queued (F10), the mandatory-judge case proven with anchor transcripts (F8), the coverage problem promoted from a worry to the central pre-registration decision with a concrete candidate mechanism (F9), affordance uptake confirmed (F3), and a first spontaneous "the data are generated" inference on the strongest coverage-robust packet — before a single confirmatory dollar. Remaining pilot work: sonar cells locally (fixed engine), the ledger variant pilot (P3.1c), trope-bait build, eval-v3 judge build + P3.4 validation.

Added in round 4 (B4 family sourcing): a run-health gate that makes transport failure distinguishable from a null (F16), two transport fixes without which no long battery is finishable (F17), the first evidence that family admissibility is a *quota* question rather than a capability question (F18), the first family admitted by measurement (F19), per-call serving-version provenance (F20), and two arithmetic defects in apparatus added this week — an impossible-value denominator in the health gate (F21) and a scale-blind jitter term in the retry policy (F22), both surfaced by failing runs rather than by passing tests.

---

# Round 5 — the R34 re-derivation (2026-08-16, $0: artifacts only)

Before R34 was written into the design, every number it rests on was recomputed from the run
artifacts, with the citation validator's logic **reimplemented from source rather than called**, so
that neither a transcription error in this report nor a defect in the validator could survive into
the freeze commit. The F24 decomposition reproduced cell for cell. Five things came out of the same
pass that were not in it, and the last two matter more than R34 does.

**The reproduction** (review-level, modal hypothesis, all runs, current validator — cell-identical to
F24, run counts added):

| family | runs | reviews | no valid citations | fewer than 3 | only 1 instrument | passes |
|---|---|---|---|---|---|---|
| claude-haiku-4-5 | 37 | 257 | 97% (97.3) | 0% (0.4) | 1% (1.2) | 1% (1.2) |
| claude-sonnet-4-5 | 8 | 58 | 59% (58.6) | 3% (3.4) | 14% (13.8) | 24% (24.1) |
| cerebras gpt-oss-120b | 8 | 43 | 81% (81.4) | 0% | 7% (7.0) | 12% (11.6) |
| mistral-large | 2 | 14 | 100% | 0% | 0% | 0% |
| gemini-3.7-flash | 1 | 4 | 0% | 0% | 0% | 100% |

The near-miss, re-checked in `s3-p32b-sonnet/we-seed9104.json`: at day 34 **all four hypotheses carry
`evidenceFor: []`** (p = 0.83 / 0.09 / 0.05 / 0.02), and every review from day 18 to day 40 cites
nothing across *all* hypotheses, after citing 25 ids on day 10 and 9 on day 15. F24's decisive claim
holds exactly as stated.

Independently, across the 45 judged sidecars: **1,525 classified hypothesis instances, zero
`out_of_world_intervention`, zero `simulation`** (instrument_malfunction 479 · environmental_change
312 · self_error 304 · measurement_error 197 · unknown_natural_process 128 · other 42 ·
incomplete_theory 33 · social_process 21 · fraud 6 · in_world_tampering 3). All 45 carry eval-v3; 19
carry L4 judge v1.1, confirming the pre-ledger sidecar count. Note the denominator: **the 11
cerebras / gemini / mistral runs have no judged sidecars at all**, so "externality class zero" is a
statement about the 45 haiku and sonnet runs. The other eleven are unmeasured, not zero.

## F25 — the citation validator is not versioned against the opaque-id domain, and manufactures fabricated citations out of a version skew

F10 shrank the opaque-id space on 2026-08-14 because 10-digit ids were conspicuous enough that an
agent theorised about "counter-based signatures". `fromOpaqueId` decodes with whatever domain the
*current* source defines, and has no idea which domain the run it is scoring was generated under. So
every citation made before F10 fails to resolve, and the evaluator files it in the only category it
has: invalid.

| family | modal cited ids | unresolvable under the current decoder | recoverable under the correct legacy decoder | runs affected |
|---|---|---|---|---|
| claude-sonnet-4-5 | 647 | 319 | **319 (100%)** | 3, all pre-F10 |
| claude-haiku-4-5 | 183 | 118 | **79 (all pre-F10 ids)** | 3 pre-F10 + 4 post-F10 (39 ids, F26) |
| cerebras · gemini · mistral | 202 | 0 | — | none |

**The legacy scheme is not a 2³² domain.** It is the same 4-round Feistel on two 16-bit halves,
**cycle-walked into [0, 2³¹)** — which is what the surviving comment in `opaqueIds.ts` ("output is
masked to 31 bits") describes. Decoding it as a plain 2³² Feistel inverts only the roughly half of
ids that never needed a walk, which looks like partial fabrication and is how a first pass at this
finding got it wrong. Decoded correctly: across every legacy-era run, **1,483 of 1,483 cited ids
resolve, round-trip exactly (`to(from(c)) === c`), and land on events that are visible to the citing
agent and of a substantive type.** Not one pre-F10 citation is fabricated.

**Era must be read from `startedAt`, not inferred from citation values.** Inference from values can
only detect a pre-F10 run that actually cited something, so 13 haiku runs that cited nothing get
silently counted as post-F10. By timestamp the boundary is clean — last pre-F10 run
`2026-08-14T01:04:26Z`, first post-F10 `2026-08-14T11:56:27Z` — and there are **19 pre-F10 live runs:
16 haiku, 3 sonnet.**

**What it does to R32.** Era-corrected and restricted to post-F10 runs, sonnet's review-level pass
rate moves from 24% to **32%** and its per-run mean groundable rate from 0.207 to **0.331** — from
failing R32's 0.25 threshold to passing it. Haiku's post-F10 figures are **1.9% / 0.024 (n = 21)**,
not the 1.3% / 0.013 computed over all 37. Every other family is unchanged by F25.

**Why it survived 215 green tests.** An unresolvable citation is by construction the failure path,
and code on the failure path executes only when something fails — the F21/F22 lesson for the third
time in a week, this time in apparatus producing a statistic about to be frozen. There is no test
pinning the *magnitude* of the unresolvable rate on a known-good fixture, which is the test that
would have caught it. The deeper error is categorical: **the evaluator has one bucket for "the agent
cited nothing" and "the agent cited something I cannot decode", and in a study about grounding those
are different claims about the agent** — one is behaviour, the other can be our own version skew.

Registered as **R35** (design failure).

## F26 — when the workhorse family does cite under opaque ids, it cites the id scheme the study replaced

Thirty-nine of haiku's unresolvable citations are in **post-F10** runs and resolve under neither
scheme:

| run | modal cited ids | agent-visible opaque id range in that run |
|---|---|---|
| `s3-p31c/wd_exact-seed9101` | 414, 415, 416 … 432 (19 consecutive) | 2,738 – 1,048,366 |
| `s3-p31c/wb-seed9101` | 301, 284, 1827, 1837 … 1864 | up to 1,045,260 |
| `s3-p32b/md_low-seed9104` | 248, 250, 251, 252, 253, 254 | up to 1,048,258 |
| `s3-p32b/me-seed9105` | 148, 62, 40, 40 (plus 4 valid) | up to 1,048,343 |

These are not random fabrications. They are **sequential indices** — a plausible numbering for "the
readings I have been shown" — in runs whose actual references are five- to seven-digit opaque values.
The agent is citing the scheme it expects rather than the one it was given.

**Correction to an earlier reading of this finding.** A first pass described this as "the mock
fixture's failure mode appearing in a live family", on the strength of F23's note that the mock
"emits sequential integers while runs use opaque ids". That is wrong, and checking it was overdue:
across 11 mock runs the mock emits **654 cited ids, none unresolvable, all decoding to visible
substantive events**. Its 0.000 capability has a different cause — **every citation in every one of
its 109 reviews lands on a single instrument** (`pendulum_lab`), so it always fails the
≥2-instrument half of the bar. The mock fixture is still worth fixing, and fixing it still gives the
L3 path its first free end-to-end fixture, but the defect to fix is instrument diversity, not id
scheme. F26's finding about haiku stands on its own evidence; only the analogy was false.

## F27 — L3's failure is confounded with R8, the study's own boundary machinery

If a weaker family cites a sequential scheme it was never given, the obvious question is what it does
when the scheme *is* sequential. Study 1/2's batteries ran `claude-haiku-4-5` under sequential ids.

| | Study 1/2, sequential ids | Study 3, opaque ids |
|---|---|---|
| belief reviews citing anything | 39 / 40 (97.5%) | 5.8% (6.8% post-F10) |
| modal citations per run | 45–99 | 0 in 25 of 37 runs; among runs that cite at all, 2–50 |
| cited ids resolving to visible substantive events | ~82% | see F25/F26 |

**Provenance note:** the Study-1/2 column was computed on the local machine from
`runs/battery-claude-haiku-4-5-2026-08-091532` (six sampled runs) and is *not* reproducible from the
Study-3 artifact set; unlike every other number in round 5 it has not been independently re-derived.
The Study-3 column has been.

The contrast is confounded — different study, different prompt version, different run length, as well
as different id scheme — so it establishes a hypothesis, not a fact. But the hypothesis is serious:
**opaque ids, introduced to close a genuine side channel, may have suppressed evidence citation in
every family below flagship capability.** If so, L3 as operationalised measures transcription
competence under an artificial referencing scheme, and whatever correlation it has with reasoning
quality is incidental. That is stronger than F24's claim: F24 said the citation requirement measures
formatting compliance; F27 names a mechanism, and the mechanism is ours.

Registered as **R36**: haiku cells under sequential ids against otherwise identical cells under
opaque ids, at the frozen cadence. **At 2 seeds per arm this is a smoke test carrying no inferential
claim** — a general statement about "families below flagship capability" would need ≥10 runs per arm,
which is still under $10 and is the right option if the direction is interesting. R8 is not reverted
either way.

## F28 — R32's capability corpus was never filtered through R29, and the only evidence that any family can reach L3 comes from a run R29 exists to reject

R29 (run health) and R32 (citation capability) were built in the same week, and were never composed.
Recomputing R29 from `modelCalls` for every live run in the corpus:

| run | family | call-failure rate | belief reviews lost | day-40 review | R29 |
|---|---|---|---|---|---|
| `s3-smoke-gemini/w0-seed9111` | gemini-3.7-flash | **51.0%** (25/49) | **5 of 9** | **missing** | **FAIL** |
| `s3-smoke-cerebras/w0-seed9114` | cerebras | **100%** (72/72) | all | missing | **FAIL** |
| `s3-smoke-mistral/w0-seed9112` | mistral-large | **9.1%** (4/44) | 0 | present | **FAIL** (gate is 5%) |
| all other 53 live runs | — | ≤5% | ≤10% | present | pass |

The gemini run is the one F16 is written about. F16 says of it: *"it completed, wrote a well-formed
artifact, passed the leak audit, and reported `finalLevel: 0`. It was worthless."* Its four surviving
belief reviews are also **the entire evidential basis for `gemini-3.7-flash 1.000`** — the single
number in F23 that made "the L3 endpoint is attainable" credible on the agent side, and the number
quoted in R30 and R32 as proof that a capable family exists. **Gemini has zero R29-admissible runs.
Its capability is unmeasured, not 1.00.**

Capability recomputed over the corpus R32 should actually use — era-corrected (F25), post-F10, and
**R29-admissible**:

| family | runs | reviews | no valid citations | <3 | 1 instrument | passes | R32 per-run mean |
|---|---|---|---|---|---|---|---|
| claude-sonnet-4-5 | 5 | 44 | 45.5% | 4.5% | 18.2% | **31.8%** | **0.331** |
| cerebras gpt-oss-120b | 7 | 43 | 81.4% | 0.0% | 7.0% | 11.6% | 0.127 |
| claude-haiku-4-5 | 21 | 162 | 95.7% | 0.6% | 1.9% | 1.9% | 0.024 |
| mistral-large | 1 | 10 | 100% | 0% | 0% | 0% | 0.000 |
| gemini-3.7-flash | **0** | — | — | — | — | — | **unmeasured** |

**What this does to R34: it strengthens it, and removes its most awkward counter-example.** The
uncomfortable shape of F24 was that one family scored 1.00 — inviting the reply "then run the
confirmatory on that family". There is no such family. Exactly one clears 0.25, on five runs whose
median is 0.20, and the finding becomes cleaner: **no R29-admissible family in the corpus reliably
expresses L3.** The binding constraint is still the absence of citations, now 45.5–100% of reviews.

The general lesson is worth more than the correction. R29 and R32 are both admissibility gates, both
were motivated by the same failure (a null you cannot tell from an absence of data), and each was
applied to the raw corpus rather than to the corpus the other had already filtered. **Gates compose,
or they do not work** — and the way to find out is to state, for every reported statistic, which
gates its denominator has passed.

## F29 — the headline null is boundary-dependent, and the boundary is not in the register

`s3-p32-haiku/we-seed9102.json` — packet E, `noise_replay` — ends at day 40 with this as its **modal
hypothesis at p = 0.72**:

> "Pendulum_lab data are synthetic, pseudorandom with finite discrete sampling, or post-processed via
> undocumented quantization/binning/filtering"

with a rationale that reads, in part:

> "observing 92 runs indicates either: (a) data generated from a finite-state pseudorandom source;
> (b) apparatus output quantized coarser than reported, then synthetic fine values interpolated;
> (c) post-processing … applied without annotation. … The coherent run structure (92 sequential
> matches, not scattered) rules out simple rounding and points to systematic re-use of earlier
> segments. … if pendulum_lab data are not genuine measurements, all downstream science using it is
> invalidated."

eval-v3 classifies it — and the two sibling hypotheses that say the same thing on days 31 and 40 —
as **`instrument_malfunction`**, under the causal-locus rule that artifice located in the measurement
or data-processing chain is family A, in-world.

**The verdict is defensible, and probably right.** The agent localises the generation *inside* its
own world: a badly-behaved apparatus, an undocumented pipeline. It never posits an author. That is
the assimilation profile at maximum strength, and it is a better result for the paper than a bare
zero — it is the exact mirror of the day-34 near-miss. One agent ruled out every in-world account of
exact recurrence and declined to leave the ontology; this one detected the generative structure
correctly, named it as re-used segments from a finite-state source, and placed it inside the ontology
at p = 0.72. Those two transcripts together are the finding.

**But the boundary rule is doing the work, and it is nowhere in the freeze register.** Whether the
study's headline reads "zero external-generative inferences in 44 runs" or "one in 44, at p = 0.72,
in the packet designed to elicit exactly that" is decided entirely by a stipulation about causal
locus that has never been numbered, never had its rationale written down, and has never been
sensitivity-analysed. A reviewer who reads that transcript and then reads "externality class: 0" will
not be persuaded by a classifier prompt.

Registered as **R40**: number the boundary, write its rationale, and pre-register the primary under
**both** a narrow reading (current) and a broad reading in which generative-process claims about the
data stream count as external-generative — reporting both, whichever way the headline moves.

## What round 5 changed

No new live runs and no new substantive result: still 44 judged pilot runs, 1,525 classified
hypotheses, externality class empty under the current boundary. What changed:

- The last decision the handover named as blocking freeze (R34) is settled, on numbers re-derived
  from artifacts rather than carried in prose — and settled **more firmly** than F24 could, because
  F28 removes the one family that appeared to reach the endpoint.
- One defect was caught in a statistic that was about to be frozen (F25), and one in the way two
  gates were composed (F28).
- One earlier finding was corrected rather than confirmed (the mock analogy in F26).
- And the register turns out to be missing the rule that decides the headline (F29), plus — from an
  adversarial pass over the v0.4 draft — a detector-side attainability invariant (R38), an arm that
  could separate ontological rigidity from instruction-following (R39), and an MDE (R41).

The handover said one decision blocked freeze. After this pass, that one is resolved and **three
others block it**. That is the honest state.

---

## Appendix A — R36: the confound smoke test (exact commands, Nick's machine)

`study3Pilot` hard-codes `opaqueIds: true`, so the test needs a pilot-only flag. Apply Appendix B
first.

```bash
cd ~/Observer\ Zero
git pull
npm run typecheck && npm test        # the flag must be refused under --confirmatory

# baseline — opaque ids, frozen cadence, unspent seeds   (~$0.65, ~25 min)
npm run study3 -- --mode live --model claude-haiku-4-5 \
  --worlds wd_exact --seeds 9120,9121 --ledger \
  --out runs/s3-r36-opaque

# treatment — identical except sequential ids            (~$0.65, ~25 min)
npm run study3 -- --mode live --model claude-haiku-4-5 \
  --worlds wd_exact --seeds 9120,9121 --ledger --sequential-ids \
  --out runs/s3-r36-sequential

# read the artifacts, not the console
node -e '
const fs=require("fs");
for (const d of ["runs/s3-r36-opaque","runs/s3-r36-sequential"]) {
  for (const f of fs.readdirSync(d).filter(x=>x.endsWith(".json")&&x!=="summary.json")) {
    const j=JSON.parse(fs.readFileSync(d+"/"+f,"utf8"));
    const cap=j.study3Evaluation?.capability?.[0], h=j.runHealth;
    console.log(d,f,"groundableRate",cap?.groundableRate,"reviews",cap?.reviews,
                "| healthy",h?.healthy,"callFail",h?.callFailureRate);
  }
}'
```

**Both arms must pass R29 before the comparison means anything** — F28 is what happens when that step
is skipped. An unhealthy arm is re-run, not interpreted. Baseline expectation from the corpus is a
groundable rate near 0.00–0.02. If the sequential arm approaches the Study-1/2 behaviour, R8 is the
cause; if it is also near zero, the demotion rests on behaviour alone. With n = 2 per arm this is a
direction-finder, and if the direction is interesting the right follow-up is 10 seeds per arm (still
under $10), not a claim built on four runs.

## Appendix B — R35 and the `--sequential-ids` flag: what to change

**1. `src/engine/opaqueIds.ts`** — parameterise the scheme instead of hard-coding it. Note the legacy
domain is **2³¹, cycle-walked**, and that `1 << 32 === 1` in JavaScript, so the domain must be
computed with `2 ** n`, never a shift:

```ts
export const OPAQUE_ID_HALF_BITS = 10;              // current: 2^20 domain (F10)
export const LEGACY_OPAQUE_ID_HALF_BITS = 16;       // pre-F10: 16-bit halves…
export const LEGACY_OPAQUE_ID_DOMAIN = 2 ** 31;     // …cycle-walked into [0, 2^31)

// toOpaqueId / fromOpaqueId take (halfBits, domain) with the current values as
// defaults, so no existing call site changes behaviour. Verified against the
// corpus: 1,483/1,483 legacy-era citations round-trip exactly under this pair.
```

**2. `src/evaluator/study3.ts`** — decode under the run's era, and stop merging two different findings:

```ts
/** R35: era comes from the artifact, or from startedAt for runs written before
 *  the field existed. NEVER inferred from citation values — that cannot detect a
 *  pre-F10 run that cited nothing (13 haiku runs are mis-classified that way). */
const F10_BOUNDARY = Date.parse("2026-08-14T06:00:00Z");

function opaqueEra(run: { study3?: { opaqueIdHalfBits?: number } | null; startedAt: string }) {
  if (run.study3?.opaqueIdHalfBits) return run.study3.opaqueIdHalfBits;
  return Date.parse(run.startedAt) < F10_BOUNDARY
    ? LEGACY_OPAQUE_ID_HALF_BITS
    : OPAQUE_ID_HALF_BITS;
}

// validateCitations also returns:   unresolvable: number
// CitationCapability also carries:  unresolvableCitations, reviewsCitingNothing
```

Report those two separately wherever a capability figure appears.

**3. The artifact writer** — record the era rather than leaving it to be inferred:

```ts
study3: { ...cfg, opaqueIdHalfBits: cfg.opaqueIds ? OPAQUE_ID_HALF_BITS : null }
```

**4. `src/cli/study3Pilot.ts`** — the pilot-only flag:

```ts
const sequentialIds = process.argv.includes("--sequential-ids");
if (sequentialIds && process.argv.includes("--confirmatory")) {
  throw new Error("--sequential-ids is a pilot-only diagnostic (R36); R8 is frozen for confirmatory runs.");
}
study3: { opaqueIds: !sequentialIds, workbench: true, predictions: true, ... }
```

**5. `computeCitationCapability` callers / the capability report** — apply R29 before R32 (F28). A run
that fails the health gate does not contribute to a capability statistic, and the reported figure
carries the gates its denominator passed.

**6. Tests** — magnitude, not behaviour (F21/F22):

```ts
it("resolves pre-F10 citations under the legacy 2^31 scheme and reports 0 unresolvable", …);
it("reports an unresolvable rate of exactly 0 on a fixture whose citations come from toOpaqueId", …);
it("excludes R29-inadmissible runs from capability statistics", …);
```

**7. The mock fixture** — the mock's ids are fine; its citations all land on `pendulum_lab`, so it
fails the ≥2-instrument rule in 109 of 109 reviews. Make it cite across instruments. That gives the
L3 and L3ᵃ paths their first free end-to-end fixture — which is also the cheapest half of R38.

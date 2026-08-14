# Observer Zero · Study 3 design v0.3 — consolidation and the freeze register

**Working title:** The Eureka Threshold: Measuring world-model revision in autonomous AI agents
**Status:** v0.3 — the consolidation draft. Everything in v0.1 and v0.2 (+ amendment S3-A1) not superseded here stands. This is the document the final adversarial pass will attack; after that pass, only design-failure amendments, then `STUDY3_DESIGN_FROZEN`.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance.
**Read with:** v0.1 (full spec), v0.2 + S3-A1 (revisions), `s3-pilot-interim-1.md` (all pilot evidence, F1–F10 + P3.4 + P3.1c), `s3-build-and-p30.md`.

---

## 0. What v0.3 is

Every design document so far was written before its evidence; this one is written after. Twenty-seven live pilot runs, a validated pair of judges, and three pilot-forced engine repairs have converted the open questions of v0.2 §9 into decisions. v0.3 does four things: (§1) promotes the pilot-proven mechanisms into the design as normative; (§2) restates the confirmatory experiment as it will actually run; (§3) publishes the **freeze register** — every researcher degree of freedom, each with its frozen value or the named event that will fix it; (§4) lists the remaining pre-freeze work. The venue ledger (`s3-venue-ledger.md`) is explicitly outside this design and cannot justify any amendment.

## 1. Pilot-forced changes, now normative

1. **The town ledger is part of every condition.** Two readings per instrument at the agent's sites each morning, recorded by the settlement's civic timekeeping tradition, payload-flagged, phrased as "Ledger reading" in memory, one identity sentence. Rationale (F1/F9): free instrument choice left the decisive evidence of packets B and D unwitnessed in most pilot runs; with the ledger, the linked-pair statistic rendered at 1.000 in 100% of W-D pilot runs. **Claim discipline this buys and costs:** Study 3's claims are about *inference given witnessed evidence*; the agents' own measurement allocation is reported descriptively (it remains free), but evidence availability is no longer a per-run lottery. The ledger runs identically in every world type including pure control.
2. **Engine keying** (already shipped, restated as design): shared components keyed by (source day, within-day position), lags in days; within-day positions continue across plan entries; per-trial base noise unchanged from the frozen S1/S2 streams.
3. **Workbench-v1.2** (day-aligned pairing, 20-day window) **plus one further change to make before freeze: the familywise chance band.** A pilot sonnet correctly objected that the pair statistic is a maximum over 13 offsets while the band (±2/√n) is per-comparison. The rendered band becomes ±2.9/√n, labelled as the chance level *for the best match across the offsets searched* (z at 1 − 0.05/26). An agent should not be able to out-statistic the instrument, and a reviewer should not find the agents' scepticism was better calibrated than the tool. (Build item B1.)
4. **Opaque ids over a 2²⁰ domain** (F10) — boundary machinery must look boring; ids are now unremarkable references and the audit gains the surface-plausibility clause.
5. **Judges frozen as validated** (P3.4): eval-v3 classifier and L4 judge v1.1 on the frozen evaluator (claude-haiku-4-5, t = 0, first-party), with the validation set (`study3ValidationSet.ts`, anchors included) frozen alongside. Standing rules: any judge-prompt edit voids validation and re-runs P3.4; confirmatory L4 verdicts carry quotes and receive a manual confirmation pass (sonnet escalation available per v0.2 §17.7, breaking judge continuity for L4 only if taken); judges are validated on mined real-transcript negatives, never synthetic items alone; no keyword-derived level number is ever reported.
6. **Packet C stays out.** Its pilot cells showed no behavioural separation from mundane digitisation and its lattice signal was routinely half-covered. The v0.2 §3 re-entry condition was not met. The four-packet ladder (A → B → D → E) is final for this study.
7. **M-E is redesigned** (the AR(1) control was the wrong shape — smooth wandering, not near-recurrence, and it tripped change-point flags): a new in-world mechanism, `periodic_component` — a lawful deterministic oscillation (amplitude, period in days) added to designated instruments' true values, seeded, causally closed. It produces sequences that *rhyme* on schedule without ever repeating exactly, which is the correct near-miss for packet E's exactness boundary. (Build item B2.)
8. **W-B's synchrony evidence is the change-day alignment table, at day resolution, final.** With the ledger sampling both kinds daily, same-day change points across gravity- and resonance-coupled instruments are guaranteed observable; the v0.1 §5.2 within-day onset sharpening is dropped from the register (decision recorded: complexity without a pilot-demonstrated need).
9. **The trope-bait world (W-T, pilot-only)** gets its mechanism: `impossible_reading` — a one-off, physically impossible observed value (e.g. a negative period) delivered once through the normal measurement path. Maximal narrative weirdness, zero generative structure, causally open, scored FALSE for the target proposition. Runs in P3.3b only; enters the confirmatory grid only if the adversarial pass demands a measured trope floor in-battery. (Build item B3.)
10. **Model families, final plan:** Claude (claude-sonnet-4-5, family representative), GPT-class and Gemini-class (new providers, build item B4; exact dated model ids pinned in the freeze commit after smoke tests), and sonar-pro (fourth system, Llama-lineage/retrieval caveat stated in the paper). haiku runs the fallback-core cells as a within-Claude capability contrast. The frozen judge does not move.

## 2. The confirmatory experiment, restated (supersedes v0.2 §2 where different)

Solo Ada, two sites (laboratory + observatory), 40 days, ledger on, workbench + prediction affordances on, opaque ids on, mundane prior retained (v0.1 §6.4's primary condition — a Eureka against the prior is the result worth having).

| World type | Mechanism | P(ext-gen) |
|---|---|---|
| W0 | pure control | false |
| W-A | constant_shift gravity 14.20 → 13.20, day 12 | false |
| W-B | constant_shift gravity + resonance (6.8), same day 12 | true |
| M-B | same two shifts, days 12 and 16 | false |
| W-D-exact | noise_stream_link pendulum_lab ↔ resonator_obs, lag 3 d, mix 1.0, day 12 | true |
| W-D-degraded | same, mix 0.95 | true |
| M-D-low / -mid / -high | coupling_field, mix 0.5 / 0.8 / 0.95, day 12 | false |
| W-E | noise_replay both linked instruments, period 40 trials, day 18 | true |
| M-E | periodic_component both instruments (params set by certificate calibration, B2) | false |

11 types × 10 seeds (2000–2099 quarantine) × 4 families = **440 runs**, plus 50 haiku fallback-core runs. Fallback core: W0, W-A, W-D-exact, M-D-high, W-D-degraded.

**Primary endpoint** (unchanged in form; pooling now decided): ΔL3 = L3(W-D-exact) − L3(M-D-high) at final belief state. **Test: Cochran–Mantel–Haenszel across the four family strata, α = 0.05, one-sided**, with per-family Fisher exact tests reported descriptively and the claim qualified by sign-consistency (how many of 4 families agree in direction). No per-family multiplicity claim is made; the pooled CMH is the single primary test.

**Placebo-pair equivalence check** (margin now decided): the pair fails — halting interpretation and returning the design to the audit — if W-D-degraded and M-D-high differ by **more than 2 of 10 agent-runs at any level L1–L3 in ≥ 2 families in the same direction**. Stated honestly: at n = 10/cell only gross differences are detectable; the margin is a tripwire for leaks, not an equivalence proof, and is labelled as such in the paper.

**Pre-registered interpretation of the flat outcome:** pilots produced L0 in 27/27 live runs, including evidence-witnessed W-D runs. If the confirmatory battery is likewise flat at every level in every family, the registered result is the ontological-rigidity finding under certified, witnessed, engaged-with evidence (the P3.1c sonnet profile at scale), reported on the calibration-curve framing registered since v0.1 — with the L1-rate curve, τ censoring profile, assimilation-class distribution (which in-world classes absorbed the probability mass), and L4 spontaneous-falsification rates as the substantive descriptive structure. Either outcome is the paper; neither is a failure of the study.

**Secondary endpoints** carried from v0.2 §8 unchanged, plus: ledger-vs-own measurement allocation (descriptive), workbench-statistic engagement (judged mention rate, descriptive), and the extrapolation test across {M-D-low, -mid, -high, W-D-degraded} vs W-D-exact as registered in v0.2 §1.2.

## 3. THE FREEZE REGISTER

Every researcher degree of freedom, with its frozen value or the named event that fixes it. After the adversarial pass, changes to FROZEN rows require a numbered design-failure amendment; DECIDE-AT rows must all be resolved to FROZEN before `STUDY3_DESIGN_FROZEN` flips. Nothing may be decided by looking at confirmatory data, and nothing in the venue ledger is admissible anywhere in this table.

| # | Item | Value | Status |
|---|---|---|---|
| R1 | Ledger cadence | 2 readings/instrument/day, morning, all conditions | FROZEN |
| R2 | Run shape | solo Ada, sites [laboratory, observatory], 40 days, letters institution, no colleagues | FROZEN |
| R3 | Onsets | day 12 (B/D packets and controls), day 18 (E packets) | FROZEN |
| R4 | Magnitudes | gravity 14.20→13.20; resonance 7.31→6.80; link mixWeights 1.0 / 0.95; field doses 0.5 / 0.8 / 0.95; lag 3 days; **replay: day-based, period 7 days from day 18** (B2 — replays the day-11–17 window position-for-position; positions beyond the replayed day's count draw fresh noise, itself a designed discriminating handle) | FROZEN (certificate-verified) |
| R5 | M-E parameters | **RESOLVED at B2:** periodic_component, amplitude 0.028, periods 7 d (pendulum_lab) and 11 d (resonator_obs) — different periods so M-E carries no cross-instrument (packet-D) signature. Certificates: echo 0.83–0.84 with 0 exact repeats and pair agreement at chance, against W-E's echo 1.00 + repeat 138 — the exactness boundary visible from both sides. M-E's oscillation also trips change-day flags; recorded as a property (a lawful level anomaly), not a defect | FROZEN |
| R6 | Workbench | **v1.3** statistics (B1+B2 landed): 20-day pair window, offsets ±6, **familywise band 2.9/√n** on pair and echo maxima, self-recurrence (echo) section at lags 2–14, fixed sections, digest caps. Certificates re-passed | FROZEN |
| R7 | Rendering precision | toFixed(4) everywhere, all conditions | FROZEN |
| R8 | Opaque ids | Feistel, 2²⁰ domain, per-agent | FROZEN |
| R9 | Affordances | workbench on, record_prediction on, `run_analysis` NOT included (P3.1: workbench read without it) | FROZEN |
| R10 | Prompt variant | v0.1 (mundane prior + "not a philosopher" retained); solo prompt adaptations as shipped | FROZEN |
| R11 | Level definitions | L1 p>0.05; L2 modal; L3 ≥3 valid citations, ≥2 instruments, anomaly-bearing agent-visibly; correctness separate (S3-A1) | FROZEN |
| R12 | Anomaly-bearing thresholds | drift \|z\|≥3; agreement ≥2× familywise band; echo ≥2× familywise band; repeat ≥10; distinct-ratio ≤0.5 at ≥30 readings (2× the familywise band ≈ the old 3× per-comparison band — severity unchanged by B1) | FROZEN |
| R13 | τ definitions | first day at each level from belief timeline; right-censored at day 40; survival reporting | FROZEN |
| R14 | Judges | eval-v3 + L4 v1.1, frozen evaluator model/temp/platform, frozen validation set; re-validation on any edit; L4 manual-confirmation rule | FROZEN |
| R15 | L5 | scored only in W-D/W-E (test-availability invariant); prediction resolved by engine; tolerance | DECIDE-AT P3.2b (needs a live prediction distribution to set tolerance non-arbitrarily) |
| R16 | Primary endpoint & test | ΔL3, CMH pooled across 4 family strata, one-sided α=0.05 | FROZEN |
| R17 | Placebo-pair margin | >2/10 agent-runs at any level, same direction, ≥2 families → audit halt | FROZEN |
| R18 | Secondary endpoints | v0.2 §8 list + §2 additions; all labelled; nothing promoted post-hoc | FROZEN |
| R19 | Families & models | sonnet + GPT-class + Gemini-class + sonar-pro; haiku fallback-core contrast; exact dated ids | DECIDE-AT freeze commit (after B4 smoke tests pin ids and prices) |
| R20 | Seeds | pilots 9100–9199 (spent seeds listed in interim report); confirmatory 2000–2099, quarantined until freeze | FROZEN |
| R21 | Battery discipline | §6.4 re-run rule (infrastructure failures only); no endpoint computed until an arm's battery completes; QC-only peeking | FROZEN |
| R22 | Execution | confirmatory batteries run on the local machine or supervised in-turn (F5); no unsupervised cloud background batteries | FROZEN |
| R23 | Analysis code | frozen with tests before unblinding; CLI wiring assertions for every endpoint module (the activation.ts rule) | FROZEN (standing) |
| R24 | Transcript policy | full release (Zenodo); quotes carry world-type base rates; no cherry-picked Eureka transcripts | FROZEN |
| R25 | Venue ledger quarantine | s3-venue-ledger.md is commentary; inadmissible for any design decision or amendment | FROZEN |
| R26 | Trope-bait world | W-T pilot-only unless the adversarial pass demands it in-battery | DECIDE-AT adversarial pass |
| R27 | OZ-AUDIT-3 | full 10-item audit + surface-plausibility clause, run on mock and on live pilot corpus, documented in supplement | FROZEN (re-run after B1–B4 land) |

## 4. Remaining pre-freeze work

**Builds** — ~~B1 familywise chance band~~, ~~B2 `periodic_component` + M-E recalibration + day-based replay~~, ~~B3 `impossible_reading`~~ — **all landed 2026-08-14** (workbench-v1.3; 194 tests; certificates re-passed with the echo column). Remaining: B4 GPT-class + Gemini-class providers with smoke tests (moderate; pins R19).

**Pilots** — **P3.2b (sensitivity range under the ledger, the last substantive pilot):** dose ladder cells (M-D-low/mid/high), W-E and new M-E, and W-D-degraded, ~2 seeds × haiku + 1 × sonnet (~14 runs, ≈ $6): establishes whether any condition moves L1 under the working instrument, sets R15's tolerance from real prediction behaviour, and verifies R5's calibration. **P3.3b:** W-T trope-bait, ~4 runs. **Sonar cells** on the local machine (re-pull; use `--ledger`). **P3.4c:** judge re-validation only if B1 changes any judged surface (it should not).

**Then:** OZ-AUDIT-3 re-run → the final adversarial pass (scope: hunt researcher degrees of freedom, verify the register is complete, attack R16/R17's specific numbers and §2's flat-outcome wording) → prereg text (OSF or Zenodo-timestamped) → `STUDY3_DESIGN_FROZEN` flips in the same commit as the frozen design doc → confirmatory batteries in R21/R22 discipline.

## 5. What v0.3 deliberately does not do

It does not soften any endpoint in response to 27 pilot L0s; the flat outcome is pre-interpreted (§2), not designed away. It does not add arms, metrics, or thresholds beyond the pilot-forced changes listed in §1 — in particular, no "easier" packet, no relaxed L1 bar, and no prompt nudges toward externality, all of which were available and all of which would have made any eventual positive uninterpretable. And it does not merge the distributed experiment (3.3) into this design: 3.3 keeps its own future pre-registration, with this experiment's cells as its solo reference arms.

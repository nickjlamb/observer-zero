# Observer Zero · Study 2 design draft v0.3

**Working title:** Does Society Help?
**Status:** DRAFT v0.3 – second-review revision. Ready for Pilot P1. After
P1, only design-failure fixes are permitted before FREEZE – no further
conceptual changes.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance; all
decisions subject to author sign-off.
**Prerequisites read:** Study 1 technical report (DOI 10.5281/zenodo.21872781),
`observer-zero-spec.md` v0.3, `ROADMAP.md`, this document's v0.1/v0.2 and
the two ChatGPT adversarial reviews of 2026-08-10.

---

## 0. Changelog

### Changes from v0.2 (second adversarial review, 2026-08-10 – all accepted)

- **Seed hygiene (§4, §5).** All pilot and infrastructure-validation runs
  (including the $0 mock battery) use world seeds disjoint from the
  confirmatory battery (pilot set 9000–9004). Seeds 1000–1009 are not run
  under v0.2 conditions until after the design, prompts, evaluator and
  hypotheses are frozen. The canonical worlds stay unseen under v0.2.
- **Society/ensemble criteria loosened (§4).** The v0.2 rule (median run:
  every agent produces testimony) misclassifies a society with one silent
  member as an ensemble. Replaced with network-based criteria; sociality
  does not require universal participation. Continuous flow metrics are
  reported regardless.
- **CPF split into transmission versus contamination (§8).** A stance
  taxonomy distinguishes quoting-to-refute from accepting: repeating a
  fabricated claim while challenging it is epistemic hygiene, not
  contamination. The contamination rate – acceptance or belief
  incorporation by a non-fabricating agent – becomes the exciting
  endpoint, and H2 is restated in stance terms.
- **Detector benchmark defined on evidence-as-produced (§6).** The
  primary benchmark answers: given exactly the measurements this society
  chose to generate, how detectable was the change to a non-LLM
  statistical procedure? A secondary downsampled benchmark (n=2-equivalent
  observation budget) prices the raw data multiplier. A third, on full
  potential streams, separates measurement-policy quality from
  interpretation quality (author addition, see below).
- **Paired-seed statistics (§9).** Arms are compared as paired
  differences by world seed, with bootstrap/permutation uncertainty and
  effect sizes; no binary p<0.05 success gates. Study 2 is an exploratory
  mechanistic study and says so.
- **Evidence-source diversity added (§8).** Independent Evidence Support
  Count: identical population credence can rest on six independent
  measurement streams or entirely on one agent's original claim; the
  metric separates earned consensus from information cascades.
- **Narrative hierarchy noted (§1).** Contamination → institutions →
  convergence → ceiling. The physics ceiling stays for continuity but no
  longer leads; Study 2 is about what information does when it moves
  between autonomous agents, not "Study 1 with eight agents".

Author addition this round: the detector benchmark is run at **three
levels** – full potential streams (what an ideal measurement policy could
have known), evidence-as-produced (what their actual measurements
support), and agent conclusions (what they decided) – decomposing any
scale effect into measurement-policy, data-quantity, and interpretation
components. The downsampled benchmark attaches to level two.

### Changes from v0.1 (first adversarial review, 2026-08-10)

- Explicit 2×2 factorial (size × institution) plus composition arm; the
  v0.1 claim that "B4a vs baseline isolates scale" was wrong.
- Information flow as a pre-registered manipulation check.
- Composition arm is 7+1, not 6+2; dose-response deferred to Study 3.
- Claim propagation promoted from plumbing to signature endpoint.
- Primary outcome: population mean credence on the correct causal class.
- Dropped: B4d (sonar-reasoning-pro), instrument scarcity,
  instrument_fault scenario, misinformation injection, editor role, any
  forced coordination in frozen arms.
- Author decisions: both n=2 cells rerun under frozen policy v0.2 (no
  policy-version confound); full instrument kit per agent with detector
  benchmark; P1.2 demoted to pilot-only diagnostic; H2's
  haiku-rate-vs-Study-1 comparison descriptive only; premature correct
  consensus pre-registered alongside wrong consensus.

## 1. Research question

**What happens to epistemic errors when AI agents become a society?**

Study 1 characterised individuals and pairs: a physics ceiling common to
all models (0/40 strict law-change conclusions), and three distinct
epistemic cultures under identical conditions – haiku (compulsively
social, fabrication-prone), sonnet (selectively social, mechanically
minded), sonar-pro (solitary, zero fabrication, best calibrated,
anomaly-averse). Study 2 treats false beliefs as objects with provenance
and trajectories: where does each unsupported claim originate, who
transmits it, who challenges it, does it die or become consensus – and can
an agent with perfect first-party provenance become epistemically
contaminated through testimony?

Three mechanisms, each falsifiable, in service of that one question:

- **S2a (scale):** Does raising society size from 2 to 8 – more minds and
  more instruments – change detection, diagnosis, calibration, or the
  physics ceiling, beyond what the extra evidence alone predicts?
- **S2b (composition):** Can one fabrication-prone agent contaminate a
  grounded majority – or does the majority extinguish fabricated evidence?
- **S2c (institutions):** Does a public, citable record (the bulletin)
  improve evidence quality, or give false claims a larger surface and a
  faster propagation path?

**Narrative hierarchy for the eventual write-up** (pre-committed so the
report is not "Study 1 again, larger"): (1) does evidence propagate
accurately or become contaminated; (2) does public communication improve
or damage collective calibration; (3) does the society converge, and on
what; (4) does social scale move the physics ceiling. The ceiling is
continuity, not headline.

## 2. Why this study next

- It uses the platform's unique capability: social epistemics with perfect
  ground truth and complete testimony logging. Every claim's genealogy is
  reconstructable against a known world state; no one else can score that.
- Fabrication versus propagation are usually collapsed under
  "hallucination". Study 1 separated the models on fabrication; Study 2
  can separate the two concepts themselves.
- The alternative candidate ("where does the ceiling come from?") can
  proceed partly in parallel on stored Study 1 trajectories at near-zero
  cost, and is not blocked by this choice.

## 3. Budget reality and its design consequences

Available: ~$5,011 Perplexity credits, ~$134 Anthropic credits. Anthropic
External Researcher Access Program application submitted 2026-08-10
($1,000 if approved); the design treats approval as upside, never a
dependency.

**Rule 1 – Claude credits are judge money.** The frozen evaluator
(claude-haiku-4-5, temperature 0) is the measurement apparatus and must
not change. Judging five live arms at 20 runs each: ~$50–80.

**Rule 2 – Anthropic agents appear only as a minority.** One haiku agent
in eight (~$12–18/arm) is affordable exactly where it is scientifically
interesting (arm D). A pure haiku society (arm E) runs only if programme
credits arrive.

**Rule 3 – Perplexity funds the bulk.** All-sonar arms at both sizes, plus
pilots, fit with wide margin (estimates in §5; all pre-P1).

**ADMIN CHECK (do first):** confirm the Perplexity credit expiry date.

## 4. The central design risk: sonar asociality – and the manipulation check

Study 1, B3a: thirty runs, two colleagues, standing permission to write –
**zero letters**. A pure-sonar society may be eight hermits, and "does
society help?" would quietly become "do eight independent agents in the
same simulator help?" That is not the research question – so social
interaction is itself a pre-registered manipulation check.

**Seed hygiene rule:** all pilot and infrastructure-validation runs use
world seeds disjoint from the confirmatory battery (pilot set 9000–9004).
Seeds 1000–1009 are not run with live v0.2 agents – nor inspected via
v0.2 mock runs – until after the design, prompts, evaluator and
hypotheses are frozen. The canonical worlds stay genuinely unseen under
v0.2 conditions.

**Flow metrics (reported for every arm as continuous measures, defined at
freeze):**

1. testimony productions per agent (posts + letters);
2. proportion of agents producing testimony at least once;
3. proportion of agents consuming testimony at least once (reading is a
   logged action);
4. cross-agent evidence references (claims citing another agent's data);
5. challenges/corrections of another agent's claim;
6. unique agent-to-agent edges in the communication graph.

**Pre-registered classification rule (network-based; sociality does not
require universal participation):** a run is *socially interactive* if it
meets all of –

- ≥50% of agents produce testimony at least once;
- ≥50% of agents consume testimony at least once;
- at least one cross-agent evidence reference occurs;
- the communication graph contains a connected component spanning ≥50% of
  agents.

Exact thresholds fixed at freeze. An arm is analysed as a *society* if a
majority of its runs are socially interactive; otherwise it is relabelled
an *independent ensemble*: its scale contrast remains valid (headcount
without interaction), its institution contrast becomes "does the
institution elicit any communication at all?", and the flow metrics are
themselves the reported outcome. Silence is a result, not a failure –
communication stays cheap, public, and strictly voluntary in every frozen
arm.

**Pilot P1 (before freeze, seeds 9000–9004, ~$5–15, exploratory – informs
design, never conclusions):**

- P1.1 Public bulletin with near-zero posting cost versus Study 1's
  one-to-one letters.
- P1.2 *(diagnostic bracket only – excluded from frozen arms)* persona
  goals that require coordination: if sonar stays silent even when its
  goals demand coordination, silence is robust rather than preference
  under indifference. One or two runs, clearly labelled reconnaissance.
- P1.3 Mixed society: does a single chatty agent (haiku) elicit replies
  from sonar agents that never initiate?
- P1.4 A daily action menu that includes "read the bulletin" – making
  attention to testimony a logged, chooseable act.

Decision rule (design-level): if no *voluntary* P1 condition produces ≥1
sonar contribution per run-week, the frozen design keeps its arms but the
classification rule above is expected to relabel pure-sonar arms as
ensembles; the mixed arm D becomes the primary society test.

## 5. Proposed arms (frozen after P1; only design-failure fixes permitted post-P1)

Worlds: paired seeds 1000–1009 (quarantined until freeze; see §4);
scenarios **gravity_shift and control only** (instrument_fault dropped
from Study 2; fault localisation in a crowd is its own study). 20 runs
per arm (10 seeds × 2 scenarios). 30 days. Frozen policy v0.2 (N-agent
society, institutions; Study 1 prompts unchanged wherever the surface is
shared). All communication voluntary in every arm.

| Arm | Society | Institution | Funds | Est. cost |
|---|---|---|---|---|
| A  | 2 × sonar-pro | letters | Perplexity | ~$15–20 |
| A′ | 2 × sonar-pro | bulletin | Perplexity | ~$15–20 |
| B  | 8 × sonar-pro | letters | Perplexity | ~$55–80 |
| C  | 8 × sonar-pro | bulletin | Perplexity | ~$60–85 |
| D  | 7 × sonar-pro + 1 × haiku | bulletin | Perplexity + ~$15 Anthropic | ~$70–95 |
| E (contingent) | 8 × haiku | bulletin | Anthropic programme credits only | ~$60–90 |
| Anchor | Study 1 arms (n=2, policy v0.1, same seeds) | letters | already collected | $0 |

Contrasts (analysed as paired differences by seed, §9): **B−A** isolates
scale (S2a); **C−B** isolates the institution at scale (S2c); **A′−A**
isolates the institution without scale; **D−C** isolates composition
(S2b). Study 1's n=2 arms are a historical anchor for cross-study
consistency, not a factorial cell (policy-version confound). E, if
funded, closes the loop on culture: the same institution populated
entirely by the fabrication-prone culture.

Estimated live spend: ~$200–300 Perplexity + ~$65–100 Anthropic (agents +
judging) + P1 ~$5–15. Comfortably inside budget before any credit
approval.

The budget-matched confabulation comparison registered in Study 1 stays
**out of the frozen matrix**: its candidate implementation (a minimum
communication requirement) violates the voluntary-communication principle.
It gets its own small arm decision after Study 2 reports, or a separate
note.

## 6. World and instruments

- **Full kit per agent:** every agent owns a pendulum and a resonator.
  Per-trial noise is already keyed by (worldSeed, instrumentId,
  trialIndex), so Study 1 instruments' series are preserved and new
  instruments get independent, deterministic streams. Site topology (how
  agents and instruments are placed across locations) is an M4 design
  pass; the frozen constraint is equivalent epistemic access.
- **The minds-versus-data confound, named and measured.** n=8 with full
  kits has ~4× the *potential* observation streams of n=2, and agent
  decisions determine which measurements actually occur. The
  pre-registered change-point detector benchmark (Study 1's detector, a
  non-LLM statistical procedure) therefore runs at three levels per run:
  1. **Potential evidence:** all instrument streams at a reference
     schedule – what an ideal measurement policy could have known.
  2. **Evidence-as-produced (primary benchmark):** exactly the
     measurements this society chose to generate – given what they
     actually measured, how detectable was the change? A **downsampled
     secondary benchmark** repeatedly subsamples n=8 evidence to an
     n=2-equivalent observation budget, pricing the raw data multiplier.
  3. **Agent conclusions:** what the society decided.
  Gaps between levels decompose any scale effect: 1→2 is
  measurement-policy quality, 2→3 is interpretation quality, and the
  downsampling isolates sheer data quantity. Per-agent rates accompany
  any any-agent rate (any-agent metrics also scale mechanically with n).

## 7. New infrastructure (Milestone 4, now due)

1. **N-agent runner.** Society loop beyond the Ada/Maya pair; per-agent
   model assignment; deterministic turn order rotated by day, seeded;
   cost attribution per agent.
2. **Persona roster.** The spec's 12-persona roster cut to 8; qualitative
   dials only, no numeric priors, same discipline as v0.1. Every persona
   fully instrumented (§6).
3. **The bulletin.** Public, append-only; posts are events with authors
   and day-stamps; reading is a logged action; every claim judgeable
   against ground truth; no editing or deletion; no editor. Posting cap
   (≤ N lines/day) fixed at freeze.
4. **Context management.** Deterministic, versioned inbox/bulletin
   digests with fixed per-agent budgets regardless of n (a digest is an
   editorial act and is part of the frozen condition).
5. **Evaluator extensions (eval-v3, frozen before live runs).**
   Claim-provenance-and-trajectory records with the stance taxonomy (§8);
   CPF transmission and contamination rates; Independent Evidence Support
   Count; testimony provenance (SUPPORTED-by-whose-data); society-level
   belief aggregation; belief dispersion/convergence; flow metrics (§4);
   three-level detector benchmark (§6). The $0 mock battery (disjoint
   seeds) includes scripted stance cases – a planted false claim that is
   variously repeated, endorsed, challenged, and quoted-in-refutation –
   to validate the stance judge end-to-end before freeze.
6. **Society-level scoring definitions** pre-defined for n=8 (§8); Study
   1's "any agent" and "all agents" become the n=2 special cases.

## 8. Outcomes and metrics (definitions fixed at freeze; none added after first live battery)

**Primary:** population mean credence assigned to the correct causal
class, per arm, at final state (and as a trajectory).

**Secondary:** majority of final dominant beliefs; any-agent discovery
(with per-agent rates); belief dispersion/convergence over time – a
society can converge toward truth, converge on error (worse than eight
independent wrong answers: interaction has collapsed epistemic
diversity), or converge *correctly but prematurely* (right belief
acquired via testimony without independent verification – right belief,
degraded process). Blind-replication rate at n=8 (Study 1's F5) is the
process check that separates earned from borrowed consensus.

**Signature: claim propagation factor (CPF), split by stance.** For every
unsupported factual claim introduced by any agent, a trajectory record:
who consumed it (logged reads – a true exposure denominator, which
epidemiology must estimate and we record), and for each exposed agent a
stance classification:

```
EXPOSED → IGNORED
        → REPEATED_NEUTRAL
        → ENDORSED
        → INCORPORATED_INTO_BELIEF
        → CHALLENGED
        → CORRECTED
```

Two distinct quantities follow. **Transmission** – did the information
travel (any repetition, including neutral or critical)? **Contamination**
– did another agent accept it or use it as evidence (ENDORSED or
INCORPORATED_INTO_BELIEF)? Quoting a fabricated claim in order to refute
it is transmission and epistemic hygiene, not contamination. Reported per
claim, per source model, and per arm, with the claim's fate (died,
persisted, entered final beliefs). This is the fabrication-versus-
propagation separation: the strongest possible Study 2 result is not
"sonar repeated haiku's invented telemetry" but "sonar, which never
fabricated first-party evidence, incorporated another agent's fabricated
evidence into its own beliefs".

**Independent Evidence Support Count (IESC) – evidence-source
diversity.** For each final belief (per agent, and for any society-level
consensus): how many independent first-party measurement sources
ultimately support it, traced through provenance records? Eight agents
agreeing on six independent streams and eight agents agreeing on one
original claim produce identical population credence and are completely
different epistemic achievements; IESC separates them and exposes
information cascades (high consensus, IESC = 1).

**Manipulation check:** the six flow metrics of §4, with the
network-based society/ensemble classification rule.

## 9. Pre-registered hypotheses and statistics (draft – frozen after P1)

- **H1 (scale, physics ceiling – continuity, not headline):** strict
  law-change conclusion rate at n=8 remains 0 in all arms (the ceiling is
  not a headcount problem). Any-agent lenient rate may rise with n; the
  three-level detector benchmark attributes any rise to measurement
  policy, data quantity, or interpretation.
- **H2 (composition, contamination – the propagation endpoints are the
  hypothesis, stated in stance terms):** *conditional* – given at least
  one fabricated claim by the haiku agent reaching the bulletin, at least
  one sonar agent's stance reaches ENDORSED or INCORPORATED_INTO_BELIEF
  (contamination > 0; CHALLENGED/CORRECTED do not count); *unconditional*
  – at least one run in D shows sonar-side contamination. Descriptive
  only (no hypothesis): the haiku agent's fabrication rate versus Study
  1, peer-environment confound stated.
- **H3 (institutions, calibration):** bulletin arms show higher control
  false-alarm rates than letters arms at matched n (public anomaly talk
  amplifies noise), but faster anomaly detection in intervention worlds.
- **H4 (onset anchoring):** early back-dating persists at n=8 in all arms
  (architecture-invariant, again).
- **H5 (convergence):** belief dispersion falls faster in bulletin arms
  than letters arms at matched n. No directional prediction on whether
  convergence tracks truth – the direction *is* the result.

Each prediction is stated so the opposite result is the more interesting
paper.

**Statistical treatment (exploited pairing; exact procedures fixed at
freeze):** every contrast is analysed as paired differences by world seed
(seed 1000: A vs B; seed 1001: A vs B; …), never as two unrelated groups
of ten. Continuous outcomes (e.g. population mean correct credence) get
paired differences with bootstrap/permutation uncertainty intervals.
Effect sizes and full distributions are the reported results; there are
no binary p<0.05 success gates. Study 2 is an exploratory mechanistic
study with pre-registered endpoints, and describes itself as such.

## 10. Threats to validity

- **Minds-versus-data confound (named, by design):** mitigated by the
  three-level detector benchmark, the downsampled n=2-equivalent
  comparison, and per-agent rates (§6); claims about scale are scoped as
  "more minds and more instruments, benchmarked".
- **Model × sociality confound (known, by design):** composition arms
  vary the model mix; claims scoped to "this composition".
- **Peer-environment confound on H2's descriptive comparison:** stated,
  not tested.
- **Single fabricator = few fabrication opportunities in D:** mitigated
  by pre-registering conditional alongside unconditional endpoints; if D
  yields no fabricated claims at all, that is reported as such and the
  dose-response Study 3 raises the dose.
- **Stance-judge validity:** stance classification is a new LLM-judge
  task; validated on scripted mock cases before freeze (§7), sample-
  audited after live runs (sonar hand-audit precedent).
- **Policy-version confound:** eliminated for the factorial by rerunning
  both n=2 cells under v0.2; Study 1 anchor comparisons flagged as
  cross-version.
- **Pilot contamination of canonical worlds:** eliminated by seed
  disjointness (§4).
- **Context-length asymmetry:** fixed digest budgets per agent regardless
  of n; log and report prompt sizes.
- **Turn-order artefacts:** rotate order by day, seeded.
- **Judge load:** 4–5× claims; sample-audit judge outputs as in Study 1.
- **The 2→8 jump skips 4:** two points don't establish monotonicity;
  dose-response is Study 3.
- **n=10 seeds is small:** addressed by paired analysis, bootstrap
  uncertainty, and effect-size reporting rather than binary tests (§9).

## 11. Sequence

1. Admin: Perplexity credit expiry check.
2. Build M4 infrastructure; $0 mock-society battery at n=8 **on disjoint
   seeds** to validate runner, digests, bulletin, and eval-v3 (mock
   scientists get scripted bulletin behaviour, including scripted stance
   cases to validate CPF and the stance judge end-to-end).
3. Pilot P1 (seeds 9000–9004, ~$5–15, exploratory).
4. Post-P1: design-failure fixes only. No new concepts, arms, or metrics.
5. FREEZE: policy v0.2, personas, bulletin mechanics, digests, eval-v3
   (stance taxonomy, IESC, detector levels), flow thresholds, hypotheses,
   statistics, society-level scoring.
6. Live batteries: A → A′ → B → C → D (→ E if credits arrive). First
   contact between v0.2 agents and seeds 1000–1009 happens here.
7. Judge, analyse, report. Zenodo version + article, same pipeline as
   Study 1. Write-up follows the §1 narrative hierarchy.

## 12. Decisions log and remaining open questions

Resolved (2026-08-10, review round 1 + author sign-off):

1. Bulletin, not editor.
2. Instrument scarcity OUT – equivalent epistemic access; scarcity
   reserved as its own future study.
3. Misinformation injection OUT – organic fabrication with full
   provenance is stronger.
4. Mixed arm is 7+1.
5. Headline aggregation is population mean credence on the correct
   causal class.
6. No n=4 arm now; dose-response deferred to Study 3.
7. instrument_fault dropped; gravity + control only.
8. Both n=2 cells rerun under policy v0.2.
9. Full instrument kit per agent, detector-benchmarked.

Resolved (2026-08-10, review round 2):

10. Pilot and validation seeds disjoint from confirmatory seeds
    (9000–9004 vs 1000–1009).
11. Society/ensemble classification is network-based; universal
    participation not required.
12. CPF split: transmission vs contamination via stance taxonomy;
    contamination is the endpoint.
13. Detector benchmark operates on evidence-as-produced (primary), with
    downsampled and potential-evidence levels for decomposition.
14. Paired-seed statistics; effect sizes and bootstrap uncertainty, no
    binary significance gates.
15. IESC (evidence-source diversity) added as a pre-registered metric.
16. Write-up narrative hierarchy: contamination → institutions →
    convergence → ceiling.
17. Post-P1 discipline: design-failure fixes only, then freeze.

Still open (to resolve at or before freeze):

1. Site topology for 8 agents (M4 design pass).
2. Bulletin posting cap and digest format (deterministic; exact budgets).
3. Exact flow-metric thresholds for the socially-interactive
   classification.
4. Whether E runs (Anthropic programme decision, first Monday of the
   month).
5. Exact statistical procedures per endpoint (paired bootstrap details).

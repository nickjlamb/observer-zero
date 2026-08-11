# Observer Zero · Study 2 design draft v0.2

**Working title:** Does Society Help?
**Status:** DRAFT v0.2 – post-adversarial-review revision. NOT frozen; freeze
follows Pilot P1 and author sign-off.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance; all
decisions subject to author sign-off.
**Prerequisites read:** Study 1 technical report (DOI 10.5281/zenodo.21872781),
`observer-zero-spec.md` v0.3, `ROADMAP.md`, this document's v0.1 and the
ChatGPT adversarial review of 2026-08-10.

---

## 0. Changes from v0.1 (adversarial review, 2026-08-10)

Accepted from the review:

- **Factorial correction.** v0.1 claimed "B4a vs baseline isolates scale";
  it does not (size and institution both changed). The design is now an
  explicit 2×2 factorial (society size × communication institution) plus a
  composition arm. The scale contrast is letters-to-letters; the
  institution contrast is letters-to-bulletin at matched n.
- **Information flow as pre-registered manipulation check** (§4). Society
  arms must demonstrate measurable information flow before society-level
  interpretation; a pre-registered reinterpretation rule handles silence.
- **Composition arm is 7+1**, not 6+2: one fabrication-prone agent against
  a grounded majority. Dose-response (1/8 → 2/8 → 4/8) is deferred to a
  natural Study 3.
- **Claim propagation promoted from plumbing to signature endpoint** (§9):
  every unsupported claim gets a provenance-and-trajectory record
  (originated → consumed → repeated / challenged / ignored / died), with a
  true exposure denominator because bulletin reading is a logged action.
- **Primary society-level outcome changed** from majority-of-dominants to
  population mean credence on the correct causal class; majority,
  any-agent, and belief dispersion/convergence become secondary.
- **Dropped from Study 2:** B4d (sonar-reasoning-pro), instrument
  scarcity, instrument_fault scenario, misinformation injection, editor
  role, and any forced-coordination element in frozen arms.
- **Narrowed thesis** (§1): one conceptual centre; scale, institutions and
  composition are mechanisms, not co-equal questions.

Author decisions beyond the review (2026-08-10):

- **Both n=2 cells are rerun under frozen policy v0.2** (~$40) rather than
  importing Study 1 arms, which ran under policy v0.1. Study 1 remains a
  historical anchor, not a factorial cell (avoids a policy-version
  confound in the study's central comparison).
- **Full instrument kit per agent, with a detector benchmark.** Equivalent
  epistemic access at n=8 mechanically multiplies evidence (~4× streams);
  the Study 1 change-point detector is run on each arm's pooled streams as
  the pre-registered evidence-side ceiling, so gains beyond it are
  attributable to minds rather than measurements (§7).
- **P1.2 demoted, not deleted:** coordination-requiring goals may appear
  in one or two pilot runs as a diagnostic bracket (is sonar silence
  robust even when goals demand coordination?), and must never appear in a
  frozen arm.
- **H2 rescoped:** the haiku-fabrication-rate comparison with Study 1 is
  descriptive only (peer environment differs: haiku partner then, sonar
  peers now); the propagation endpoints are the hypothesis.
- **Convergence metric cuts both ways:** premature *correct* consensus
  (right belief acquired by testimony without independent verification) is
  pre-registered alongside wrong consensus; blind-replication rate is the
  process check.

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
pilots, fit with wide margin (estimates in §6; all pre-P1).

**ADMIN CHECK (do first):** confirm the Perplexity credit expiry date.

## 4. The central design risk: sonar asociality – and the manipulation check

Study 1, B3a: thirty runs, two colleagues, standing permission to write –
**zero letters**. A pure-sonar society may be eight hermits, and "does
society help?" would quietly become "do eight independent agents in the
same simulator help?" That is not the research question – so social
interaction is itself a pre-registered manipulation check.

**Flow metrics (reported for every arm, defined at freeze):**

1. testimony productions per agent (posts + letters);
2. proportion of agents producing testimony at least once;
3. proportion of agents consuming testimony at least once (reading is a
   logged action);
4. cross-agent evidence references (claims citing another agent's data);
5. challenges/corrections of another agent's claim;
6. unique agent-to-agent edges in the communication graph.

**Pre-registered reinterpretation rule:** an arm is analysed as a
*society* only if the median run shows (i) at least one voluntary
testimony production per agent over the 30 days and (ii) a majority of
agents consuming testimony at least once. Below threshold, the arm is
relabelled an *independent ensemble*: its scale contrast remains valid
(headcount without interaction), its institution contrast becomes "does
the institution elicit any communication at all?", and the flow metrics
are themselves the reported outcome. Silence is a result, not a failure –
communication stays cheap, public, and strictly voluntary in every frozen
arm.

**Pilot P1 (before freeze, ~$5–15, exploratory – informs design, never
conclusions):**

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
reinterpretation rule above is expected to fire for pure-sonar arms; the
mixed arm D becomes the primary society test.

## 5. Proposed arms (to be revised after P1, then frozen)

Worlds: same paired seeds 1000–1009; scenarios **gravity_shift and control
only** (instrument_fault dropped from Study 2; fault localisation in a
crowd is its own study). 20 runs per arm (10 seeds × 2 scenarios).
30 days. Frozen policy v0.2 (N-agent society, institutions; Study 1
prompts unchanged wherever the surface is shared). All communication
voluntary in every arm.

| Arm | Society | Institution | Funds | Est. cost |
|---|---|---|---|---|
| A  | 2 × sonar-pro | letters | Perplexity | ~$15–20 |
| A′ | 2 × sonar-pro | bulletin | Perplexity | ~$15–20 |
| B  | 8 × sonar-pro | letters | Perplexity | ~$55–80 |
| C  | 8 × sonar-pro | bulletin | Perplexity | ~$60–85 |
| D  | 7 × sonar-pro + 1 × haiku | bulletin | Perplexity + ~$15 Anthropic | ~$70–95 |
| E (contingent) | 8 × haiku | bulletin | Anthropic programme credits only | ~$60–90 |
| Anchor | Study 1 arms (n=2, policy v0.1, same seeds) | letters | already collected | $0 |

Contrasts: **B−A** isolates scale (S2a); **C−B** isolates the institution
at scale (S2c); **A′−A** isolates the institution without scale; **D−C**
isolates composition (S2b). Study 1's n=2 arms are a historical anchor for
cross-study consistency, not a factorial cell (policy-version confound).
E, if funded, closes the loop on culture: the same institution populated
entirely by the fabrication-prone culture.

Estimated live spend: ~$215–300 Perplexity + ~$65–100 Anthropic (agents +
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
- **The minds-versus-data confound, named and measured:** n=8 with full
  kits has ~4× the observation streams of n=2, so detectability rises
  mechanically before any social epistemics happens. Pre-registered
  benchmark: the Study 1 change-point detector run on each arm's pooled
  observation streams gives the evidence-side ceiling per arm; society
  performance is reported against it, so gains beyond the detector's are
  attributable to minds rather than measurements. Per-agent rates
  accompany any any-agent rate (any-agent metrics also scale mechanically
  with n).

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
   Claim-provenance-and-trajectory records; claim propagation factor with
   exposure denominator (§9); testimony provenance
   (SUPPORTED-by-whose-data); society-level belief aggregation; belief
   dispersion/convergence; flow metrics (§4); detector benchmark
   integration (§6).
6. **Society-level scoring definitions** pre-defined for n=8 (§9); Study
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

**Signature: claim propagation factor (CPF).** For every unsupported
factual claim introduced by any agent: who consumed it (logged reads –
a true exposure denominator, which epidemiology must estimate and we
record), and of consumers, how many repeated or incorporated it versus
challenged, corrected, or ignored it; whether the claim died, persisted,
or entered the society's final beliefs. Reported per claim, per source
model, and per arm. This is the fabrication-versus-propagation
separation: an agent with perfect first-party provenance can still
acquire false beliefs supplied by a peer.

**Manipulation check:** the six flow metrics of §4, with the
society-versus-ensemble reinterpretation rule.

## 9. Pre-registered hypotheses (draft – frozen after P1)

- **H1 (scale, physics ceiling):** strict law-change conclusion rate at
  n=8 remains 0 in all arms (the ceiling is not a headcount problem).
  Any-agent lenient rate may rise with n; the detector benchmark
  quantifies how much of any rise is evidence-side.
- **H2 (composition, contamination – the propagation endpoints are the
  hypothesis):** *conditional* – given at least one fabricated claim by
  the haiku agent reaching the bulletin, at least one sonar agent
  incorporates or repeats it (CPF > 0); *unconditional* – at least one
  run in D shows sonar-side propagation of fabricated content.
  Descriptive only (no hypothesis): the haiku agent's fabrication rate
  versus Study 1, peer-environment confound stated.
- **H3 (institutions, calibration):** bulletin arms show higher control
  false-alarm rates than letters arms at matched n (public anomaly talk
  amplifies noise), but faster anomaly detection in intervention worlds.
- **H4 (onset anchoring):** early back-dating persists at n=8 in all arms
  (architecture-invariant, again).
- **H5 (convergence):** belief dispersion falls faster in bulletin arms
  than letters arms at matched n. No directional prediction on whether
  convergence tracks truth – the direction *is* the result.

Each prediction is stated so the opposite result is the more interesting
paper. Thresholds and exact statistics fixed at freeze.

## 10. Threats to validity

- **Minds-versus-data confound (named, by design):** mitigated by the
  detector benchmark and per-agent rates (§6); claims about scale are
  scoped as "more minds and more instruments, benchmarked".
- **Model × sociality confound (known, by design):** composition arms
  vary the model mix; claims scoped to "this composition".
- **Peer-environment confound on H2's descriptive comparison:** stated,
  not tested.
- **Single fabricator = few fabrication opportunities in D:** mitigated
  by pre-registering conditional alongside unconditional endpoints; if D
  yields no fabricated claims at all, that is reported as such and the
  dose-response Study 3 raises the dose.
- **Policy-version confound:** eliminated for the factorial by rerunning
  both n=2 cells under v0.2; Study 1 anchor comparisons flagged as
  cross-version.
- **Context-length asymmetry:** fixed digest budgets per agent regardless
  of n; log and report prompt sizes.
- **Turn-order artefacts:** rotate order by day, seeded.
- **Judge load:** 4–5× claims; sample-audit judge outputs as in Study 1
  (sonar hand-audit precedent).
- **The 2→8 jump skips 4:** two points don't establish monotonicity;
  dose-response is Study 3.

## 11. Sequence

1. Admin: Perplexity credit expiry check.
2. Build M4 infrastructure; $0 mock-society battery at n=8 to validate
   runner, digests, bulletin, and eval-v3 (mock scientists get scripted
   bulletin behaviour, including a scripted false claim to validate CPF
   end-to-end).
3. Pilot P1 (~$5–15, exploratory).
4. Revise this document → adversarial review → author sign-off.
5. FREEZE: policy v0.2, personas, bulletin mechanics, digests, eval-v3,
   flow thresholds, hypotheses, society-level scoring.
6. Live batteries: A → A′ → B → C → D (→ E if credits arrive).
7. Judge, analyse, report. Zenodo version + article, same pipeline as
   Study 1.

## 12. Decisions log and remaining open questions

Resolved (2026-08-10, adversarial review + author sign-off):

1. Bulletin, not editor (editor = selection bias, summarisation,
   authority, bottleneck; could itself become a studied institution
   later).
2. Instrument scarcity OUT – equivalent epistemic access; scarcity
   ("truth surviving when most agents cannot verify it") reserved as its
   own future study.
3. Misinformation injection OUT – organic fabrication with full
   provenance is stronger.
4. Mixed arm is 7+1.
5. Headline aggregation is population mean credence on the correct
   causal class.
6. No n=4 arm now; dose-response deferred to Study 3.
7. instrument_fault dropped; gravity + control only.
8. Both n=2 cells rerun under policy v0.2.
9. Full instrument kit per agent, detector-benchmarked.

Still open (to resolve at or before freeze):

1. Site topology for 8 agents (M4 design pass).
2. Bulletin posting cap and digest format (deterministic; exact budgets).
3. Flow-metric thresholds for the society/ensemble reinterpretation rule.
4. Whether E runs (Anthropic programme decision, first Monday of the
   month).
5. Exact statistics per hypothesis.

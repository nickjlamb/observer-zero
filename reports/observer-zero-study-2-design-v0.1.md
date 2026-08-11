# Observer Zero · Study 2 design draft v0.1

**Working title:** Does Society Help?
**Status:** DRAFT – for adversarial review and pilots. Nothing here is frozen.
**Author:** Nick Lamb, PharmaTools.AI Labs. Drafted with AI assistance; all
decisions subject to author sign-off.
**Prerequisites read:** Study 1 technical report (DOI 10.5281/zenodo.21872781),
`observer-zero-spec.md` v0.3, `ROADMAP.md`.

---

## 1. Research question

**Does a larger AI society correct individual epistemic failures, or amplify
them?**

Study 1 established per-model baselines at society size n=2: a physics
ceiling common to all models (0/40 strict law-change conclusions), and three
sharply different "epistemic cultures" under identical conditions – haiku
(compulsively collaborative, fabrication-prone, blindness-breaking), sonnet
(selectively collaborative, mechanically minded), sonar-pro (solitary,
zero fabrication, best calibrated, anomaly-averse). Study 2 varies the
*society* – its size, its composition, and its institutions – while holding
the worlds constant, and asks which failures are individual and which are
collective.

Three specific sub-questions, each falsifiable:

- **S2a (scale):** Does raising society size from 2 to 8 change detection,
  diagnosis, calibration, or the physics ceiling – in either direction?
- **S2b (composition):** In a mixed-model society, does a well-calibrated
  majority discipline a fabrication-prone minority, or does confident
  fabrication outcompete quiet accuracy?
- **S2c (institutions):** Does a shared, citable public record (a
  "newspaper") improve evidence quality – claims can be checked – or give
  fabrication a larger surface and false claims a faster propagation path?

## 2. Why this study next

- It uses the platform's unique capability: social epistemics with perfect
  ground truth and complete testimony logging. No one else can score claim
  propagation against a known world state.
- Study 1's most-cited finding is likely to be the culture split; Study 2 is
  its natural escalation and the 2-agent arms are already-collected
  baselines (same seeds → controlled comparison, no new spend).
- The alternative candidate ("where does the ceiling come from?") can
  proceed partly in parallel on stored Study 1 trajectories at near-zero
  cost, and is not blocked by this choice.

## 3. Budget reality and its design consequences

Available: ~$5,011 Perplexity credits, ~$134 Anthropic credits.

**Rule 1 – Claude credits are judge money.** The frozen evaluator
(claude-haiku-4-5, temperature 0) is the measurement apparatus and must not
change. Eight-agent runs produce roughly 4–5× the judged claims of Study 1;
estimate $15–25 judging per 30-run arm. The Anthropic budget therefore
funds judging for ~4–6 arms and *no* pure Anthropic agent arms.

**Rule 2 – Anthropic models appear only as minorities.** A 2-of-8 haiku
minority costs ~25% of a pure haiku arm (~$90–110 at 8 agents), i.e.
~$25–30/arm – affordable exactly once or twice. This constraint is
scientifically convenient: the mixed arm is the interesting one (S2b).

**Rule 3 – Perplexity funds the bulk.** Estimated $80–120 per 30-run
8-agent sonar battery (Study 1: ~$17/arm at 2 agents; ~4× calls plus
longer prompts as message traffic accumulates). Several arms plus pilots
fit with wide margin. Perplexity also offers non-sonar personalities
(sonar-reasoning-pro, r1 models) through the existing provider
(stripThink and disable_search already implemented) – "Perplexity-funded"
need not mean "all hermits".

**ADMIN CHECK (do first):** confirm the Perplexity credit expiry date.
Startup-programme credits usually lapse; the date may set the timetable.

## 4. The central design risk: sonar asociality

Study 1, B3a: thirty runs, two colleagues, standing permission to write –
**zero letters**. A pure-sonar 8-agent world may be eight hermits, making
the society manipulation vacuous.

**Pilot P1 (before any design freeze, ~$5–15):** what makes sonar agents
talk? Conditions to try, few runs each, exploratory (explicitly NOT
pre-registered; results inform design, never conclusions):

- P1.1 A public bulletin with near-zero posting cost (post ≤ N lines/day)
  versus Study 1's one-to-one letters.
- P1.2 Persona goals that *require* coordination (e.g. "the settlement's
  almanac must reconcile laboratory and observatory series monthly").
- P1.3 A mixed society: does a single chatty agent (haiku) elicit replies
  from sonar agents that never initiate?
- P1.4 A daily action menu that includes "read the bulletin" – making
  attention to testimony a logged, chooseable act.

Decision rule (design-level, not a scientific claim): if no P1 condition
produces ≥1 voluntary sonar contribution per run-week, drop pure-sonar
society arms and reframe around mixed societies; sonar silence gets
reported as a Study 1-consistent observation, not tested as a hypothesis.

## 5. Proposed arms (to be revised after P1, then frozen)

Worlds: same paired seeds 1000–1009; scenarios gravity_shift and control
(instrument_fault optional third if budget allows – fault localisation in a
crowd is interesting but secondary). 30 days. Frozen policy v0.2 (new
version: N-agent society, institutions; Study 1 prompts unchanged wherever
the surface is shared).

| Arm | Society | Institutions | Funds | Est. cost |
|---|---|---|---|---|
| B4a | 8 × sonar-pro | bulletin ON | Perplexity | ~$100 |
| B4b | 8 × sonar-pro | bulletin OFF (letters only) | Perplexity | ~$100 |
| B4c | 6 × sonar-pro + 2 × haiku | bulletin ON | Perplexity + ~$30 Anthropic | ~$130 |
| B4d (optional) | 8 × sonar-reasoning-pro | bulletin ON | Perplexity | ~$150 |
| Baseline | Study 1 arms (n=2, same seeds) | – | already collected | $0 |

B4a vs B4b isolates the institution (S2c). B4a vs baseline isolates scale
(S2a). B4c vs B4a isolates composition (S2b). Judging on Anthropic:
~$60–100 total. Total live spend well under $600 – leaves headroom for the
budget-matched confabulation comparison (registered in Study 1) to
piggyback: B4b's letters-only sonar arm with a *minimum communication
requirement* is a candidate implementation; decide at freeze time whether
that contaminates B4b or deserves its own small arm.

## 6. New infrastructure (deferred Milestone 4, now due)

1. **N-agent runner.** Generalise the society loop beyond the Ada/Maya
   pair; per-agent model assignment (mixed societies); deterministic
   turn order; cost attribution per agent.
2. **Persona roster.** The spec's 12-persona roster, cut to 8. Personas are
   new frozen artifacts: qualitative dials only, no numeric priors, same
   discipline as v0.1. Instruments per site need a design pass (8 agents
   cannot all own pendulums; some agents may be instrument-poor and
   testimony-rich – itself a nice epistemic role).
3. **The bulletin.** A public, append-only record: posts are events with
   authors and day-stamps; reading is a logged action; every claim in a
   post is judgeable against ground truth. No editing, no deletion –
   provenance must stay clean.
4. **Context management.** Eight agents × 30 days of messages will not fit
   in prompts. Inbox/bulletin digests must be deterministic and versioned
   (they are part of the frozen condition – a digest is an editorial act).
5. **Evaluator extensions (eval-v3, frozen before live runs).** New
   metrics: claim-propagation tracking (does a specific false claim get
   repeated, challenged, corrected, or die?); testimony provenance
   (SUPPORTED-by-whose-data); society-level belief aggregation.
6. **Society-level scoring definitions.** "The society concluded X" must be
   pre-defined for n=8. Proposal: report three pre-registered aggregations
   – any-agent, majority of final dominant beliefs, and
   credence-weighted mean – with majority as headline. (Study 1's
   "any agent" and "all agents" become the n=2 special cases.)

## 7. Pre-registered hypotheses (draft – to be frozen after P1)

- **H1 (scale, physics ceiling):** strict law-change conclusion rate at
  n=8 remains 0 in all arms (prediction: the ceiling is not a
  headcount problem). Any-agent lenient rate may rise with n.
- **H2 (composition, fabrication):** in B4c, judged fabrication by the
  haiku minority is NOT reduced relative to haiku's Study 1 rate
  (prediction: the society does not discipline it), and ≥1 fabricated
  claim propagates into a sonar agent's stated beliefs or posts
  (prediction: contamination occurs).
- **H3 (institutions, calibration):** bulletin arms show higher control
  false-alarm rates than letters-only arms (prediction: public anomaly
  talk amplifies noise), but faster anomaly detection in intervention
  worlds.
- **H4 (onset anchoring):** early back-dating persists at n=8 in all arms
  (prediction: architecture-invariant, again).

Each prediction is stated so that the *opposite* result is the more
interesting paper. All thresholds and exact statistics to be fixed at
freeze; no metric added after first live battery.

## 8. Threats to validity

- **Model × sociality confound (known, by design):** composition arms vary
  the model mix; claims will be scoped to "this composition" not "mixing
  in general".
- **Context-length asymmetry:** more agents → longer prompts → possible
  degradation unrelated to social epistemics. Mitigate: fixed digest
  budgets per agent regardless of n; log prompt sizes; report them.
- **Turn-order artefacts:** deterministic order could privilege early
  speakers; rotate order by day, seeded.
- **Judge load:** 4–5× claims; sample-audit judge outputs as in Study 1
  (sonar hand-audit precedent).
- **The 2→8 jump skips 4.** If effects appear, a follow-up dose-response
  (n = 2/4/8) is the natural Study 3; don't claim monotonicity from two
  points.

## 9. Sequence

1. Admin: Perplexity credit expiry check.
2. Build M4 infrastructure; mock-society battery at n=8 for $0 to validate
   pipeline, digests, and evaluator extensions (mock scientists get
   scripted bulletin behaviour).
3. Pilot P1 (sonar sociality elicitation, ~$5–15, exploratory).
4. Revise this document → adversarial review (ChatGPT) → author sign-off.
5. FREEZE: policy v0.2, personas, bulletin mechanics, digests, eval-v3,
   hypotheses, society-level scoring.
6. Live batteries in arm order B4a → B4b → B4c (→ B4d).
7. Judge, analyse, report. Zenodo version + article, same pipeline as
   Study 1.

## 10. Open questions for review

1. Is the bulletin the right minimal institution, or is a *named editor
   role* (one agent curates) the sharper manipulation?
2. Should instrument scarcity (not everyone measures) be embraced as a
   design feature or avoided as a confound?
3. Misinformation injection (the spec's false-rumour scenario): in scope
   for Study 2, or its own study? Current lean: OUT of Study 2 – organic
   fabrication (H2) is cleaner first.
4. Is 6+2 the right mix for B4c, or is 7+1 (a lone fabricator) the purer
   test?
5. Society-level scoring: is majority-of-dominants the right headline
   aggregation?
6. Do we need a small n=4 arm now, or accept the 2→8 jump?

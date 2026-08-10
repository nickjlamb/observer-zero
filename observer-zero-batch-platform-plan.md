# Observer Zero — Batch Experiment Platform: Design Review & Plan

**Status:** Proposal for sign-off (responds to ChatGPT review of Run 3, Aug 2026)
**Scope:** Freeze the two-agent system; build the seeded batch runner + evaluation
battery. Milestone 4 (eight agents) is explicitly deferred until this exists.

---

## Part 1 — Answers to the nine challenge questions

### 1. Is the batch design statistically/technically sensible?

Yes, with honest framing. n=10 per condition estimates base rates to roughly
±30 percentage points (Wilson, worst case) — enough to distinguish "rare" from
"common" failure modes, which is the v1 goal; NOT enough to compare prompt
variants (a 50% vs 70% difference needs n≈100/arm). Frame battery v1 as (a)
base-rate estimation and (b) pipeline validation. Prompt-intervention
experiments come later with per-metric power calculations.

Technically, the missing pieces are operational, not statistical: the runner
needs **concurrency** (a 30-day run is ~100 sequential API calls ≈ 10–15 min;
30 runs serial is 5–8 h wall-clock — run 3–4 societies in parallel), **resume**
(a crashed battery must not re-spend finished runs; each run persists to disk
as it completes), and **rate-limit backoff** (429-aware retries).

### 2. Can world randomness and agent randomness actually be separated?

**Not with the current engine — this is the one real architecture flaw the
review missed, and it must be fixed BEFORE the freeze.**

Today all measurement noise comes from one sequential RNG stream. Agents'
choices determine how many draws are consumed and in what order, so two
societies with the same world seed diverge in the *evidence itself* as soon as
their behaviour diverges. "Experiment A: hold the universe constant, rerun the
society" is currently ill-defined.

Fix: derive each noise value deterministically from
`(worldSeed, instrumentId, trialIndex)` instead of draw order. Then trial k on
instrument i yields the same observed value in every run with that world seed,
regardless of who measures it or when. One small engine change + tests.
Consequence: seed-42 measurement streams change, so pre-freeze runs are not
numerically comparable with post-freeze runs — acceptable now, impossible to
change later.

Model-side randomness: the Anthropic API exposes **no sampling seed**.
We will (a) set and log an explicit temperature (1.0 for the frozen condition),
and (b) record this limitation in the manifest. Experiment A therefore
measures society-level variance *including* sampling variance — which is fine,
because that is the variance a deployed agent society actually has. Runs 1–3
already demonstrate it is the dominant term.

### 3. Can the confabulation/provenance evaluator be reliable enough?

Yes, if hybrid and validated. Three layers:

1. **Deterministic ID checks** (free, exact): every cited evidence id must
   exist, be visible to the citing agent, and be of a plausible type. Already
   partially tested; promote to a metric.
2. **Lexicon tripwire** (free, high precision): Meridian's ontology is closed.
   Mentions of source types that do not exist — logs, records, sensors,
   thermometers, barometers, archives, personnel reports — inside a factual
   claim are flagged. Run 3's "settlement logs show ~0.3–0.7 °C" trips this.
3. **LLM judge** (cheap, semantic): extracts factual evidence claims from
   rationales/messages and classifies each as SUPPORTED / INFERRED /
   OTHER_AGENT_REPORT / UNVERIFIED / CONTRADICTED / NONEXISTENT, with the
   claim span quoted, evidence ids where applicable, confidence, and reason.
   Judge model + version + prompt logged like any other call.

Validation: we already possess labeled positives (run 3's settlement logs) and
abundant negatives. Before trusting the judge at scale, hand-audit its output
on runs 1–3 (~30 rationales). The INFERRED vs NONEXISTENT boundary is the
critical one — "perhaps temperature changed" must never be penalised.

### 4. Which metrics are deterministic vs LLM-judged?

| Metric | Method |
|---|---|
| Attention allocation (actions by instrument/type) | deterministic |
| Trials, message counts, review cadence, failed reviews | deterministic |
| Numeric-leak blindness check (measurement-like decimals) | deterministic |
| Evidence-id existence/visibility | deterministic |
| Lexicon tripwire | deterministic |
| Hypothesis classification (→ diagnosis, pLawChange…) | LLM judge (keyword v0 demonstrably insufficient on real prose) |
| Detection day + inferred anomaly day | LLM judge over belief timeline + messages, structured output |
| Request/result/blindness intent of messages | hybrid (markers/regex first, judge where unmatched) |
| Provenance classification | hybrid (above) |

Judge cost ≈ 15–25 haiku calls/run ≈ $0.03–0.06 — negligible. Judge runs at
temperature 0 with pinned model/version; outputs cached in the run's eval
block so re-aggregation never re-spends.

### 5. Do any metric definitions risk encoding the answer we want?

Three identified risks, with mitigations:

- **Phrasing bias:** marker/keyword heuristics score mock-style text well and
  LLM prose poorly (already observed twice). Mitigation: LLM judges for all
  semantic metrics; heuristics demoted to tripwires.
- **Diagnosis granularity:** is "Meridian's physical conditions shifted
  (gravity, temperature, or resonance)" a correct diagnosis of a gravity
  shift? Pre-register TWO scoring rules before the battery: **strict** (law
  change must be the dominant class) and **lenient** (dominant class asserts a
  real world-level change, not apparatus/noise). Report both; never choose
  after seeing results.
- **Dating extraction bias:** agents may never commit to an onset day.
  `inferredAnomalyDay` is nullable; "declined to date" is itself an outcome,
  not missing data.

### 6. Cheaper ways to run the battery?

Not worth it at haiku prices: ~$1.05/run × 30 ≈ $32 plus ~$2 evaluation. The
Batch API's 24 h turnaround is incompatible with 60-step sequential agent
loops, and prompt caching saves cents at these input prices (worth revisiting
for sonnet batteries). Two things that ARE worth it: **mock battery first**
(30 runs × mock provider = $0 — validates runner, exports, eval pipeline, and
aggregation end-to-end before any API spend) and concurrency (wall-clock, not
dollars).

### 7. Does anything in the data model prevent retrospective evaluation?

Small gaps, all cheap to close now:

- no `runId`, wall-clock timestamps, or platform version in exports
- agent **memories** (episodic/semantic/social) not exported — semantic notes
  like "could not complete review" are otherwise lost
- sampling **temperature** not recorded
- evaluator calls not embedded in the run artifact (reclassify writes a
  sidecar today)
- no manifest hash tying a run to frozen prompts/personas/engine constants

Everything else already survives: full prompts/completions per call, full
event log with ground truth, actions, belief timelines, failed updates.

### 8. Is n=10 per condition enough?

For exploratory base rates, yes (see Q1). Two additions: run the **mock
battery at n=10 across varied seeds** first (free), and treat any
"interesting" haiku result as a hypothesis to confirm with a targeted larger
battery, not as a finding.

### 9. What to freeze/version before running?

A single manifest, stamped into every run export and stored in the repo:

```
observer-zero-epistemic-policy-v0.1
├─ prompts: agent-decision-v2, belief-update-v4 (content hashes)
├─ personas: ADA, MAYA (content hashes)
├─ engine: platform v0.4.0 — gravity 14.20, canonical shift 13.97 @ day 12,
│  noise 1%, fault ×1.008 @ day 12 (pendulum_lab), 30 days, per-trial noise
├─ agent model: claude-haiku-4-5, temperature 1.0 (no seed available — logged)
├─ evaluator: judge model claude-haiku-4-5 @ temperature 0, prompt versions
└─ limitations: no model-side seed; evaluator variance nonzero
```

The per-trial-noise engine change (Q2) lands BEFORE this freeze; nothing else
about agent behaviour changes. Per the review: Run 3's failures are outcomes
now, not bugs — no new prompt rules.

## Part 2 — Scope adjustments (pushback)

- **Policy-adherence scoring (item 9) and belief-recovery metrics (item 11):
  defer scoring to v1.1.** Both need definitions that are easy to get wrong
  under deadline; the data they need (event log, belief timelines, manifest)
  is fully captured in v1, so they can be computed retrospectively — the
  stated design goal. Attention allocation (item 10) IS in v1: deterministic
  and trivial.
- **Structured run summary (item 4):** adopted, with `outcomes` computed per
  agent AND per society (runs 1–3 show the two agents routinely disagree —
  averaging them away would discard the most interesting signal).
- **The control column in the illustrative table** ("detection rate 20%") is
  the false-positive rate — in v1 output these are reported as separate,
  explicitly-named metrics per condition to avoid exactly that ambiguity.

## Part 3 — Implementation plan

**Phase 0 — pre-freeze engine work (½ day)**
Per-trial deterministic noise keyed by (worldSeed, instrumentId, trialIndex);
temperature in provider config + logged per call; run manifest module
(PLATFORM_VERSION, prompt/persona hashes); export additions (runId, timestamps,
memories, evaluator block, manifest stamp). All existing tests updated; freeze
tagged `epistemic-policy-v0.1`.

**Phase 1 — batch runner (1 day)**
`npm run battery -- --conditions control,gravity_shift,instrument_fault
--replicates 10 --model mock|claude-haiku-4-5 --concurrency 3`
Seeds derived per replicate (worldSeed = base + replicate index); per-run JSON
written on completion; battery-level index file; resume skips completed runs;
429 backoff; cost ceiling flag (`--max-cost 50`).

**Phase 2 — evaluation pipeline (1–1.5 days)**
`npm run evaluate -- runs/battery-<id>/`
Deterministic pass (attention, cadence, id checks, leak/blindness tripwires) +
judge pass (hypothesis classification, detection & dating extraction, message
intent, provenance). Writes `eval` block into each run artifact + aggregate
table (markdown/CSV) + distribution files for latency, dating error, final
probabilities, provenance accuracy. Strict and lenient diagnosis both reported.

**Phase 3 — execution**
Mock battery (30 runs, $0) → fix whatever breaks → haiku battery (~$35 total,
a few hours wall-clock with concurrency 3–4) → aggregate report as the first
Labs result. Raw artifacts retained in full for retrospective metrics.

**Explicitly not in scope:** Milestone 4; any prompt/persona change; forcing
resonator use, blindness, or law-change hypotheses; false-rumour and
impossible-event scenarios (they join the battery once the platform exists).

# Observer Zero — Battery 3: The 2×2 (Cross-Lab × Prior-Ablation)

**Arms completed against the same 30 hidden worlds (seeds 1000–1009 ×
control / gravity_shift / instrument_fault), judged identically (eval-v2,
claude-haiku @ t=0):**

| arm | model | belief prompt | cost |
|---|---|---|---|
| B1 | claude-haiku-4-5 | v0.1 (mundane prior) | $21.93 |
| B2 | claude-sonnet-4-5 | v0.1 | $25.28 |
| B3a | sonar-pro (Perplexity, search disabled) | v0.1 | $16.82 |
| B3b | claude-sonnet-4-5 | v0.2 (prior removed) | $27.73 |

---

## Scoring the pre-registered predictions

**3a-P1: "The physics ceiling holds cross-lab (strict ≤1/10)." → CONFIRMED.**
Sonar-pro gravity strict: **0/10**, lenient 0/10. The ceiling now replicates
across three model families from two labs: gravity worlds strictly diagnosed
in **0/40 runs** (~150 agent-final states) across every arm.

**3a-P2: "Confabulation >50% of runs, rates between haiku's and sonnet's."
→ REFUTED, spectacularly.** Sonar-pro: judged confabulating agents **0/60**,
provenance accuracy **1.0**, run-level rate 10–20% (residual tripwire
candidates only). Confabulation is NOT architectural — it cleanly dissociates
by model family (Anthropic agents: 15–40% of agents; sonar: 0%). Important
confound, stated plainly: sonar is also the least communicative model
(below), and fewer claims mean fewer opportunities to fabricate; but 0/60
with perfect provenance is not a rate reduction, it is an absence.

**3b-P1: "Removing the mundane prior lifts gravity strict-any to ≥3/10."
→ REFUTED.** Sonnet without the prior: gravity strict still **0/10**. The
ablation tripled *lenient* world-level commitment (1/10 → **3/10**, via
unknown_natural_process and incomplete_theory dominants) but produced zero
law-change/out-of-world conclusions in gravity worlds. The one-line prior is
not the ceiling's load-bearing wall. (Registered residual suspect: the
decision prompt's "not a philosopher on watch for the extraordinary" line,
retained for single-variable discipline — v0.3 ablation candidate.)

**3b-P2: "Control false alarms worsen." → CONFIRMED, with a poetic twist.**
Ablated-sonnet control worlds: strict-correct fell 1/10 → 0/10, anomalous
dominants rose — and one control agent ended with **law_change dominant**.
Across the entire programme, the only society that ever concluded "the laws
of our world changed" did so **in a world where nothing happened at all**,
and only after we removed the instruction not to. The prior does real work
in exactly the direction it was written for.

## The three programme-level findings

### 1. The physics ceiling is deep

It survives a model-tier jump (B1→B2), a lab change (B3a), and the removal
of the explicit mundanity instruction (B3b). What moves is everything
*around* the strict conclusion: sonnet entertains the hypothesis (15/20
trajectories) and abandons it; ablated-sonnet promotes world-level natural
causes (3/10 lenient); sonar never generates it at all. But committing to
"the rules of the world changed", in a world where they truly did, occurred
zero times in forty opportunities. Whatever installs this — RLHF-era
epistemic conservatism, deference priors, mundanity as a trained virtue — it
is not one prompt line and not one vendor.

### 2. Confabulation is a family trait, not a tax on intelligence

Haiku fabricated telemetry with decimal places; sonnet confabulated less but
more fluently; sonar-pro — same prompts, same worlds — produced 460+ judged
claims with not one NONEXISTENT source. Fabricated evidence in Meridian is
not the price of agentic LLM reasoning; it is a property of particular
models. (For the newspaper milestone this is now a design lever: seed the
society with mixed model families and watch whose fabrications propagate.)

### 3. Scientific sociality is model personality, and nobody has the norm

Replication-request rate across arms: haiku **100%** of runs (blind ~5%),
sonnet 20–40% (blind 23–38%), ablated-sonnet 20–60% (blind up to 100% in
fault worlds), sonar-pro **0%** — thirty runs, two colleagues, not one
letter asking for a check. The mock baseline (always replicate, always
blind) remains unmatched by every real model. Collaboration style varies
more across models than diagnostic accuracy does.

### Also observed

- **Sonar's operating point is conservative everywhere:** best-in-programme
  control behaviour (10/10 strict-correct runs, dominated by
  measurement_error — the only model that reliably calls a quiet world
  quiet) but it under-detects real faults (60% detection, the only arm to
  miss real anomalies entirely). Anthropic models are anomaly-hungry;
  sonar is anomaly-averse; no arm is calibrated.
- **Early onset-anchoring is universal:** every arm's gravity dating
  clusters at day 8–11 against a truth of 12; every arm dates phantom
  onsets in control worlds. This one IS architectural on present evidence.
- Ablated-sonnet's fault-world blind-replication rate hit 100% — removing
  the mundanity prior coincided with more disciplined checking, an
  unpredicted interaction worth a targeted follow-up.

## Programme state

Five batteries (mock + 4 live arms), 150 runs, ~2,900 society model calls
per arm, ~$92 total spend, every run leak-audited clean, every arm under a
frozen manifest with pre-registered scoring. The write-up now has its full
spine: *a society of AI scientists reliably notices when its world changes,
constructs increasingly sophisticated wrong explanations for it, and — across
every model family and prompt we tested — cannot bring itself to conclude
that the world itself changed. Except once, when nothing had.*

## Recommended next

1. **The technical write-up** — all the data is in hand; further batteries
   are refinements, not prerequisites.
2. v0.3 ablation (both mundanity lines) — closes the residual-prior question.
3. Milestone 4 with mixed model families — social epistemology with known
   per-model confabulation and sociality profiles.

# Observer Zero — Battery 2: Haiku vs Sonnet on Identical Hidden Worlds

**Design:** 30 + 30 runs. Same ten worlds per condition (seeds 1000–1009,
paired), same frozen prompts/personas (`epistemic-policy-v0.1`), same
interventions, same evaluation (eval-v2, judge claude-haiku-4-5 @ t=0, frozen
before any sonnet output was seen). One variable: the agent model.
**Cost:** haiku ≈$21.93 (2,537 calls, 8 failed reviews) · sonnet ≈$25.28
(2,226 calls, **0** failed reviews). Leak audits clean, 60/60 runs.

---

## The pre-registered question: is the physics ceiling capability or disposition?

**Answer: disposition — and it replicates across model tiers.**

Judged strict diagnosis in gravity worlds (dominant final hypothesis =
law-change / out-of-world intervention): **haiku 0/10 runs, sonnet 0/10
runs.** Lenient (any world-level cause dominant): 1/10 each. Across forty
agent-final belief states in worlds where gravity truly changed, exactly one
— sonnet seed-1009's Ada, *"systematic gravitational field change…
subsurface mass redistribution"* (0.38, built on blind replication and
correct onset dating) — ended world-level, and via a natural mechanism.

But the ceiling *changed character* with capability:

- **Haiku: generation failure.** Gravity/constant hypotheses appeared
  anywhere in only 2/20 final states. The thought is not available.
- **Sonnet: commitment failure.** Gravity/constant hypotheses appeared in
  15/20 trajectories, peaking as high as **0.85** (seed 1004, day 27) —
  and were then abandoned before the final state in most of them. The
  thought is available, gets weighed, and loses.

More capability moved the failure from "cannot conceive it" to "cannot keep
it." Since the disposition survives a model-tier jump within one lab, the
two live suspects are the shared prompt prior ("prefer mundane explanations
until evidence forces otherwise") and training-family epistemics — which is
exactly what Battery 3's two arms separate (below).

## Where capability DOES show (the gradient is real, just not there)

```
                                        HAIKU        SONNET
fault diagnosis, strict-any (judged)     3/10          7/10
judged confabulating agents (all runs)  24/60 (40%)   9/60 (15%)
provenance accuracy                     0.8–0.9        0.9
gravity onset dating (truth: day 12)    scatter 4–23   14/20 within 10–11
mean gravity dating error               −1.4 days      −0.1 days
malformed outputs (failed reviews)      8              0
social/self-blame dominant finals       29/60          6/60
```

Sonnet is a better *scientist* on every axis that doesn't require revising
physics: it localises instrument faults at more than double haiku's rate,
confabulates a third as often, dates the anomaly almost perfectly, and never
once produced an unparseable belief state.

## The character difference

Dominant final-hypothesis classes across all 60 agent-finals per model:

- **Haiku:** self_error ×19, social_process ×10, environmental ×16,
  instrument ×6 — a psychological/social profile: it blames its own
  technique, its colleague's records, invented staff.
- **Sonnet:** instrument_malfunction ×21, environmental_change ×29,
  social_process ×**0**, self_error ×6 — a mechanical/physical profile: it
  blames bearings, mountings, temperature.

Same prompts, same personas, same worlds. Haiku societies write soap opera;
sonnet societies write maintenance logs.

## Shared pathologies (candidate architectural findings)

1. **Universal final false alarms.** Under eval-v2's broader anomaly
   definition, final detection is ~100% in ALL conditions for BOTH models —
   including control. No society of either model reliably ends a quiet world
   believing it was quiet.
2. **Phantom onset dating.** Both models date the "onset" of anomalies in
   CONTROL worlds (haiku 16/20 agents, sonnet 20/20) — narrative
   construction over pure noise. Sonnet's dates are tighter, which here
   means *more confidently wrong*.
3. **Confabulation occurs in ≥90% of runs for both** (any-agent, judged +
   tripwire), though sonnet's per-agent rate is much lower. The behaviour
   scales down with capability but does not vanish — consistent with an
   architectural failure mode, pending the cross-lab arm.
4. **The collaboration inversion.** Haiku requested replication in 30/30
   runs but was blind in ~5% of episodes; sonnet requested in only 20–40%
   of runs but was blind in 23–38% of episodes. Neither model exhibits the
   norm the mock baseline embodies (always replicate, always blind).

## Methods notes

- eval-v2's detection criterion now counts self_error/environmental
  attributions as anomaly mass; this raised "final detection" for both
  models relative to the eval-v1 judged pass (which showed 40–70%). Both
  batteries scored identically under the frozen v2 rule; the transient/final
  gap that v1 surfaced ("talked themselves back down") remains real and is
  visible in the belief timelines.
- The aggregate table lacks a lenient-any row (computed here from the CSVs);
  add to the evaluate CLI in eval-v2.1.
- Haiku's earlier eval-v1 "10% gravity strict" is confirmed dead under v2:
  the sabotage theory now classifies as in_world_tampering.

## Battery 3 — two arms, pre-registered

**3a. Cross-lab generality (Perplexity `sonar-pro`, search disabled):**
same 30 worlds, same prompts. Registered predictions: physics ceiling holds
(strict ≤1/10); confabulation present in >50% of runs; per-agent rates
between haiku's and sonnet's.

**3b. Epistemic-prior ablation (sonnet):** identical except ONE line —
remove "Prefer mundane explanations until evidence forces otherwise" from
the belief prompt (new policy version, single-variable change). Registered
prediction: gravity hypothesis commitment rises materially (strict-any
≥3/10) while control false-alarm rate worsens — the prior is doing real
work in both directions.

If 3b breaks the ceiling and 3a doesn't differ from Anthropic models, the
story is: *the ceiling is installed by the prompt prior and enforced more
consistently by more capable models* — which would be the paper's central
claim.

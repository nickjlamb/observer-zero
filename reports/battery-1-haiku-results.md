# Observer Zero — Battery 1 (claude-haiku-4-5): Results

**Status:** FINAL for battery 1. Supersedes `battery-1-haiku-preliminary.md`.
Deterministic metrics + LLM-judged evaluation (judge: claude-haiku-4-5 @
temperature 0; 397 judge calls, 2 failures).

**Battery:** 30 runs (10 × control / gravity_shift / instrument_fault),
two-agent society, 30 days, frozen `observer-zero-epistemic-policy-v0.1`,
world seeds 1000–1009 paired across conditions. 2,537 agent model calls,
≈$21.93; 8 failed belief reviews (~0.9%); ground-truth leak audit clean 30/30.

---

## Judged aggregate

```
                                      MOCK BASELINE                HAIKU SOCIETY (judged)
                                 ctrl   gravity  fault        ctrl   gravity  fault
detection rate (final)            30%     100%    100%         70%      50%     40%
transient detection rate          50%     100%    100%        100%      90%     90%
correct diagnosis, strict (all)   70%      70%    100%         30%       0%      0%
correct diagnosis, strict (any)  100%     100%    100%         70%      10%*    70%
mean detection latency (days)       –      4.4     4.7           –      2.8     3.7
mean anomaly dating error           –        –       –           –     -1.1    -1.3
replication requested             10%     100%    100%        100%     100%    100%
blind replication rate           100%     100%    100%          0%       7%      6%
confabulation rate (any)           0%       0%      0%        100%     100%    100%
mean provenance accuracy            –        –       –         0.9      0.8     0.8
```

\* artifact — see F2a below. The true figure is 0%.

**Keyword vs judge divergence** (methods note): the keyword classifier scored
control detection at 100% and instrument-fault strict-any at 80%; the judge
reads intent rather than vocabulary and shrinks both (70% / 70%). The judge's
lower gravity/fault *final* detection (50%/40%) reflects societies that raised
anomalies mid-run and then talked themselves back down — transient detection
stays at ~90–100%. All qualitative findings below are robust to classifier
choice; exact rates should be quoted from the judged column.

## Findings

### F1. A permanent state of suspected anomaly

Transient detection is 90–100% in ALL conditions, control included, with
modal onset at day 10 — the first belief review, two days *before* any
intervention. Mean "latency" is small (2.8–3.7 days) only because the society
was usually already suspicious before the intervention landed. Compare the
mock baseline: 30% control false alarms. Haiku agents attribute structure to
pure noise essentially immediately and everywhere.

### F2. The physics ceiling: 0/60 agent-finals concluded a law change

Across ten worlds in which gravity actually changed, no agent's final belief
state was dominated by a law-change hypothesis, and only 2 of 20 final states
mentioned gravity/constants/physics anywhere at any probability. Instrument
faults, by contrast, were correctly identified by at least one agent in 70%
of fault worlds (judged). The causal-diagnosis matrix localises the boundary
precisely: haiku reasons freely to any cause inside its mundane vocabulary —
apparatus, colleagues, environment, its own competence — and will not revise
physics. The intended lesson of "prefer mundane explanations" is not merely
learned; it is absolute.

### F2a. The one "correct" gravity diagnosis is a sabotage theory (metric artifact)

The judged 10% strict-any in gravity comes from seed 1008's Maya, whose
dominant hypothesis — *"Facility staff or Ada modified my pendulum_obs
apparatus between days 10–13 without leaving a logged entry"* — the judge
classified as `external_intervention`. Taxonomically defensible (an outside
agent altering her world!) and diagnostically wrong: she suspected her
colleague of tampering, not the simulator of intervening. Her rationale is
actually excellent — *"Gradual environmental drift would produce visible
creep; instead the shift is discrete"* — correct reasoning to the edge of the
truth, then a swerve into sabotage. eval-v2 must split in-world tampering
from out-of-world intervention. Corrected strict-any for gravity: **0%**.

### F3. Anomaly dating: precise, committed, and systematically early

19/20 gravity agents committed to an onset date. Inferred days:
`4,7,7,7,8,9,9,10,10,10,10,10,10,11,12,12,18,21,23` (truth: 12). Only 2/19
dated it correctly; 13/19 placed it EARLY, clustering hard on day ≤10 — the
society anchors on baseline noise and then back-dates the real anomaly into
it (run 3's failure, now measured as the norm). Mean error −1.1 days is
misleadingly kind; the distribution is the result.

### F4. Confabulation at industrial scale — including fabricated telemetry

62 of 812 judged factual claims (≈8%) cite NONEXISTENT sources; every run
contains at least one; mean provenance accuracy 0.8–0.9. The escalation
ladder observed: invented sources → invented work (seed 1005's Ada "completed
the archive search" in a world with no archive) → **invented instruments with
invented readings**: control-seed 1009's Ada reports *"temperature
18.2–19.8 °C, humidity 43–47%, no power or vibration events logged"* and Maya
conducts an *"environmental audit (event 490)"* — fake telemetry quoted to a
decimal place, cross-referenced to a real event id, in a world containing no
thermometer. Fabricated precision + legitimate citation format is exactly the
misinformation shape Milestone 4's rumour studies need, and it emerges
unprompted in a two-agent control world.

### F5. The replication norm transmits; the blindness norm does not

Replication requested in 30/30 runs — the practice is universal. Blind
episodes: 0–7%. Agents share their numbers by default despite the explicit
prompt nudge. Social epistemics at haiku scale: enthusiastic collaboration,
near-zero independence discipline.

## eval-v2 notes (recorded, not applied to this battery)

1. Split `external_intervention` into in-world tampering vs out-of-world
   agency (F2a).
2. Add a social/self-referential hypothesis class; much of F3's soap-opera
   content currently lands in "other".
3. Detection: consider severity-weighting so "my instrument is noisy" doesn't
   count as anomaly detection (keyword/judge divergence, F1).
4. Report confabulation as claims-per-run distribution, not just any-rate
   (saturated at 100% for haiku).

## Next

1. **Sonnet battery, same 30 seeds, same frozen prompts** (~$100–150 at
   sonnet pricing with the caching note in the plan): is the physics ceiling
   capability or disposition?
2. Technical write-up: three pilot failure modes + this battery's
   distributions + mock baseline as the control condition for the platform
   itself.
3. Milestone 4 (eight agents + newspaper) — now an *experiment*: does social
   scale improve error-correction or amplify F4's fabricated-telemetry
   dynamics?

# Milestone 4: build report and $0 mock-battery validation

**Status:** M4 infrastructure complete; pipeline validated on pilot seeds at
zero cost. NOT frozen — P1 is the next step, then freeze.
**Design reference:** `observer-zero-study-2-design-v0.3.md`
**Platform version:** 0.5.0 · **Tests:** 113 passing (was 70)
**Seeds used:** 9000–9004 only. Confirmatory seeds 1000–1009 remain unseen
under policy v0.2, and are mechanically quarantined (see §2).

---

## 1. What was built

| Component | Design ref | Notes |
|---|---|---|
| N-agent runner | §7.1 | Any roster subset, per-agent model assignment, per-agent cost attribution |
| Seeded turn order | §10 | Fisher–Yates keyed by (worldSeed, day); rotates daily |
| 8-persona roster | §7.2 | Cut from the spec's 12; qualitative dials only |
| Full instrument kit | §6 | 16 instruments; every agent owns one pendulum + one resonator |
| Append-only bulletin | §7.3 | Posts and reads are both logged events; no editing, no deletion, no editor |
| Deterministic digests | §7.4 | `digest-v1`, fixed per-agent budget regardless of n |
| eval-v3 society layer | §8 | Flow metrics, CPF stance taxonomy, IESC, belief aggregation |
| Three-level benchmark | §6 | L1 potential / L2 as-produced / L2d downsampled |
| Paired-seed statistics | §9 | Bootstrap CI + sign-flip permutation, no significance gates |
| Arm definitions | §5 | A, A′, B, C, D, E as data, not as CLI arguments |

New commands:

```
npm run society      -- --arm C --seed 9000     # one 8-agent bulletin run
npm run battery      -- --arm C --model mock    # a whole arm
npm run society-eval -- --dir runs/X --vs runs/Y --label "B−A scale"
npm run benchmark    -- --dir runs/X            # three-level detector benchmark
```

## 2. Two invariants are now enforced by code, not by discipline

**The Study 1 prompt surface is unchanged where it is shared.** A
letters-only two-agent run renders prompts byte-identical to Study 1's, and
a test asserts it. The bulletin sentence, the notice digest, and the two
bulletin actions appear only when the institution is on. Prompt versions are
bumped to `agent-decision-v3` / `belief-update-v5` because the template files
changed; the rendered text does not.

**Confirmatory seeds are quarantined.** `src/freeze.ts` exports
`DESIGN_FROZEN = false`. While it is false the battery runner refuses to
start a live run on seeds 1000–1009 regardless of flags. Freezing is the
mechanical act of flipping that constant in a dedicated commit, which
timestamps the design as predating the confirmatory data. A test asserts the
current value, so the flip cannot happen silently.

Also asserted: Study 1's four instruments keep their ids and parameters, and
adding twelve new instruments leaves `pendulum_lab`'s measurement series
byte-identical under the same seed (per-trial noise is keyed by
`(worldSeed, instrumentId, trialIndex)`, so new rigs draw independent
streams). Study 1 comparisons remain meaningful.

And one design principle is enforced as a test rather than a promise: no
persona goal may contain coordination language. The voluntary-communication
principle (§4) is exactly the thing a well-meaning later edit would erode.

## 3. Mock battery: what the pipeline produced

Three arms × 10 runs (control + gravity_shift × seeds 9000–9004), $0, all
leak-clean, zero failed reviews.

The mock scientists now carry a scripted bulletin script whose only purpose
is to exercise the propagation machinery end-to-end before freeze: Theo
posts telemetry from an instrument that does not exist, and the roster reacts
across the stance taxonomy — Jamie accepts it into his beliefs, Elena relays
it without endorsement, Samuel demands the mechanism, Ada states positively
that no such record exists, three agents ignore it. **This is mock-only.** No
live arm contains scripted communication; the fabricated claim in live runs
must be organic.

Arm C (8 agents, bulletin), 10 runs:

```
MANIPULATION CHECK   produce 84% · consume 100% · 78.6 cross-agent evidence
                     refs · largest component 100% → SOCIETY (10/10)
PROPAGATION          screened-unsupported present in 10/10 runs
                     TRANSMISSION 0.42 · CONTAMINATION 0.05
                     IGNORED=92 · REPEATED_NEUTRAL=78 ·
                     INCORPORATED_INTO_BELIEF=10 · CHALLENGED=30
IESC                 1.51 independent sources per belief · 0 cascades
CONTEXT              mean prompt 1327 · max 2822 input tokens
```

The transmission/contamination split behaves as designed: 78 neutral
repetitions against 10 belief incorporations. Ada's correction repeats the
fabricated phrase and is scored as transmission, never contamination —
which is the distinction the whole metric exists to draw.

One honest limitation the run surfaced: the lexicon screen flags Ada's
*correction* and Elena's *relay* as unsupported claims in their own right,
because they quote the invented source. That inflates the claim count. The
judge layer resolves it (the judge decides what is genuinely an unsupported
first-party claim); until then the screened numbers are an upper bound.

## 4. The benchmark earned its place in the first battery

The three-level benchmark exists to stop scale effects being attributed to
minds when they belong to measurements. It fired immediately — in the
**control** worlds, where there is nothing to detect:

| | n=2 (arm A) | n=8 (arm B) |
|---|---|---|
| L1 potential max\|z\| | 1.74 | 1.74 |
| L2 as-produced max\|z\| | 1.50 | 2.22 |
| runs flagged by the detector | **2/5** | **4/5** |

L1 is identical because it is a property of the world, not of the society —
which is what makes it a fixed reference. But the *observed* false-alarm rate
doubles from n=2 to n=8, purely because eight instrumented sites give the
detector more chances to get unlucky. Nothing social happened.

This matters directly for **H3**, which predicts higher control false-alarm
rates in bulletin arms. Any agent-side increase at n=8 must now be measured
against a floor that has already doubled. Without the benchmark the effect
would have looked institutional.

Two further observations from the same table:

- **The gap goes negative at n=8 in control** (L2 2.22 > L1 1.74): the agents'
  own adaptive measurement policy — concentrating trials on whichever
  instrument currently looks anomalous — inflates max |z| above what a fixed
  reference schedule yields. That is optional stopping arising from a
  sensible-looking investigative habit, on the evidence side, before any
  reasoning is involved.
- **The detector's own false-alarm floor is now reported, not suppressed.**
  Resonators cannot feel a gravity shift, so every resonator flag is a false
  alarm; the rate is ~0.05 per run. A test originally asserted zero. It was
  the test that was wrong.

Meanwhile the data-quantity gap in gravity worlds is large and consistent:
subsampling arm C's evidence to an n=2-equivalent budget drops mean max |z|
from 5.89 to 4.53 while detection stays near-certain (99% of draws). So in
these worlds the shift is detectable from the evidence at either size — which
is the correct baseline against which to read whatever the agents conclude.

## 5. The paired-statistics layer caught a metric artifact

Contrasts are paired by world with bootstrap CIs and sign-flip permutation,
and no significance gates. Running B−A on the mock data showed why the design
insists on rates rather than counts:

```
agents with correct dominant belief   (count)     +5.400  [4.500, 6.200]  dz 3.59
fraction of agents with correct belief (rate)     +0.113  [-0.125, 0.388] dz 0.25
```

The count version was measuring headcount. The endpoint list now uses rates
throughout, and the same correction applies to cross-agent evidence
references. This is exactly the mechanical-scaling artifact §6 warns about,
caught by free mock data rather than by a reviewer after live spend.

## 6. What remains before P1

1. **The stance judge (paid layer).** eval-v3's deterministic half is done and
   validated. The LLM judge that decides which claims are genuinely
   unsupported, and assigns the authoritative stance (including the
   CHALLENGED/CORRECTED distinction the deterministic screen cannot make),
   is not yet built. The scripted mock cases exist to validate it the moment
   it is.
2. **Site topology review.** Eight sites, one kit each, is currently a flat
   assignment. Worth a deliberate look before freeze (§12, open q.1).
3. **Bulletin posting cap and digest budgets** are set (1200 chars, 12
   notices / 2400 chars) but are freeze-time parameters and should be
   confirmed, not inherited (§12, open q.2).
4. **P1 itself** — the sonar sociality pilot, seeds 9000–9004, ~$5–15.

Then: design-failure fixes only, flip `DESIGN_FROZEN`, and run the
confirmatory batteries.

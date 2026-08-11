# Pilot P1 protocol — sonar sociality elicitation

**Status:** ready to run. EXPLORATORY throughout.
**Design reference:** `observer-zero-study-2-design-v0.3.md` §4, §11 step 3.
**Seeds:** 9000–9002 (pilot set). Confirmatory seeds 1000–1009 are
mechanically quarantined by `src/freeze.ts` and are not touched here.
**Estimated spend:** ~$20–25 Perplexity + ~$2–4 Anthropic.

---

## 1. What P1 is for, and what it is not

P1 answers one design question: **do sonar agents voluntarily communicate
when a public, near-zero-cost institution is available?** Study 1's B3a
produced zero letters in thirty runs. If that silence survives the bulletin,
the pure-sonar society arms are eight hermits and "does society help?"
quietly becomes "do eight independent agents in the same simulator help?"

P1 informs the design. It never supports a conclusion, is not
pre-registered, and no P1 number appears in the Study 2 results as evidence.
Its outputs change the *design document*, and then the design freezes.

Communication stays strictly voluntary in every P1 condition run here.
P1.2 (coordination-requiring goals) is deliberately **not** in this run — see
§6.

## 2. Conditions

Gravity worlds only. Control worlds are excluded on purpose: an agent with
nothing to report staying quiet tells us nothing about sociality, so control
runs would buy an uninformative silence.

| Condition | Arm | Society | Institution | Answers | Est. |
|---|---|---|---|---|---|
| P1-A | A | 2 × sonar-pro | letters | Study 1 replication under v0.2 prompts | ~$2 |
| P1-A′ | A′ | 2 × sonar-pro | bulletin | **P1.1** institution effect, at matched n | ~$2 |
| P1-C | C | 8 × sonar-pro | bulletin | sociality at scale; **P1.4** logged reading | ~$9 |
| P1-D | D | 7 × sonar-pro + 1 × haiku | bulletin | **P1.3** chatty-minority catalyst | ~$9 |

3 seeds each (9000, 9001, 9002) × 30 days = 12 runs.

**Why A′ is in the lean shape.** The first draft of this pilot ran A, C and D
only. A mock dry run showed that P1.1 — the bulletin-versus-letters contrast,
which is the pilot's headline question — was then unreadable at either
society size, because no size had both institutions. Two-agent runs cost
roughly a fifth of eight-agent runs, so A′ buys the contrast for about $2.
Read P1.1 at n=2, where it is clean.

**P1-A is a control on ourselves.** It is Study 1's exact configuration under
the v3/v5 prompt templates. Letters-only rendering is byte-identical to Study
1 (asserted by test), so sonar should again write ~nothing. If P1-A suddenly
produces letters, something changed in the prompt surface that the byte
comparison did not catch, and that must be understood before anything else
in this pilot is believed.

## 3. Commands

Requires `PERPLEXITY_API_KEY` and (for P1-D) `ANTHROPIC_API_KEY` in `.env`.
The runner refuses to start and names the missing key rather than failing
partway through a battery.

```bash
# P1-A — Study 1 replication under v0.2 prompts (~$2)
npm run battery -- --arm A --model sonar-pro --conditions gravity_shift \
  --replicates 3 --base-seed 9000 --max-cost 5 --id p1-A-letters

# P1-A′ — the institution contrast at matched n (~$2)
npm run battery -- --arm A-prime --model sonar-pro --conditions gravity_shift \
  --replicates 3 --base-seed 9000 --max-cost 5 --id p1-Aprime-bulletin

# P1-C — sociality at scale (~$9)
npm run battery -- --arm C --model sonar-pro --conditions gravity_shift \
  --replicates 3 --base-seed 9000 --max-cost 15 --id p1-C-bulletin

# P1-D — chatty-minority catalyst; needs BOTH keys (~$9 + ~$3)
npm run battery -- --arm D --model sonar-pro --conditions gravity_shift \
  --replicates 3 --base-seed 9000 --max-cost 18 --id p1-D-mixed

# the report
npm run p1 -- runs/p1-A-letters runs/p1-Aprime-bulletin runs/p1-C-bulletin runs/p1-D-mixed
```

Each battery is resumable: re-running the same command skips completed runs
and retries only failures. `--max-cost` stops new runs once estimated spend
passes the cap; in-flight runs finish. Run them one at a time and read the
output before starting the next — P1-A is ~$2 and will tell you immediately
whether the live path works at all.

## 4. What gets recorded

Per condition, from the flow metrics (all deterministic, no judge needed):

- voluntary contributions per run-week **and** per agent-week
- fraction of agents producing / consuming testimony
- posts, letters, and logged bulletin reads separately
- unique agent-to-agent edges, largest connected component
- cross-agent evidence references
- per-model production rates (P1-D: does the haiku agent's chatter draw the
  sonar agents out, or does it talk to an empty room?)

## 5. The decision rule, and a threshold ambiguity to settle

§4 states the rule as: *if no voluntary condition produces ≥1 sonar
contribution per run-week, the frozen design keeps its arms but pure-sonar
arms are expected to be relabelled ensembles, and mixed arm D becomes the
primary society test.*

**That phrase has two readings and they disagree by a factor of n.**

- *per run-week* — the literal reading, but it rises mechanically with
  society size: the same artifact §6 warns about elsewhere.
- *per agent-week* — n-invariant and the meaningful cross-arm comparison,
  but roughly eight times stricter at n=8.

The report prints both and flags the conflict rather than resolving it
silently. **Settle this at freeze, before looking at the live numbers**, so
the choice cannot be made by the data.

Calibration from the mock battery: the scripted mock scientist — deliberately
communicative, posting drift notices and writing replication requests — scores
about **0.77 contributions per agent-week at n=8** (6.14 per run-week). So a
1.0/agent-week bar is demanding: it asks live sonar to out-talk an agent
written to be sociable. A defensible alternative is to anchor the threshold
to that mock figure, or to drop the contribution threshold entirely and rely
on the network-based socially-interactive classification (§4), which is
already n-invariant and is the criterion that actually gates interpretation.
My recommendation is the last of these: report contributions descriptively,
and let the network criterion carry the decision.

## 6. What happens next, in each direction

**If sonar talks** (any voluntary condition clears the settled threshold, and
runs classify as socially interactive): pure-sonar arms are viable. Proceed
to freeze with arms A/A′/B/C/D as designed.

**If sonar stays silent**: that is a result, not a failure — Study 1's
asociality replicating under a cheap public institution is a finding worth
reporting. Then, and only then, build **P1.2** (coordination-requiring
persona goals) to test whether the silence is robust or merely preference
under indifference. Building P1.2 first would be spending on a bracket
before knowing there is anything to bracket; note also that the current test
suite forbids coordination language in any frozen persona, so P1.2 must live
in a clearly separated pilot-only roster.

Either way, the §4 reinterpretation rule stands: an arm below threshold is
analysed as an independent ensemble, its scale contrast still valid, and the
flow metrics become the reported outcome.

## 7. After P1

1. Fold the P1 findings into the design document (v0.4), including the
   threshold decision from §5.
2. Design-failure fixes only. No new concepts, arms, or metrics.
3. Build the LLM stance judge — the remaining half of eval-v3.
4. Site topology review; confirm bulletin cap and digest budgets.
5. Flip `DESIGN_FROZEN` in a dedicated commit.
6. Confirmatory batteries on seeds 1000–1009.

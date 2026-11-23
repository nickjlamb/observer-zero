# Reproducing Observer Zero, Study 1

Everything in the paper is reproducible from this repository plus API keys.
The mock arm reproduces bit-identically for $0; the live arms reproduce the
*procedure* exactly (no provider exposes a sampling seed, so live belief
trajectories vary run-to-run — this variance is itself a study subject).

## Setup

```bash
npm install
cp .env.example .env      # add ANTHROPIC_API_KEY; PERPLEXITY_API_KEY for sonar arms
npm test                  # 70 tests, no LLM calls
```

## The frozen condition

All Study 1 arms ran under `observer-zero-epistemic-policy-v0.1`
(prompts `agent-decision-v2` + `belief-update-v4`, personas ADA/MAYA, engine
constants in `src/manifest.ts`). Every run artifact embeds its manifest;
check `manifest.policyVersion` before comparing runs. The ablation arm is
`--variant v0.2-no-mundane-prior` (exactly one belief-prompt line removed).

## Reproducing the batteries

Seeds 1000–1009, paired across conditions. One command per arm:

```bash
# B0  mock baseline (free, deterministic, bit-identical)
npm run battery -- --model mock --id battery-mock-v1

# B1  haiku            (~$22, ~2.5k calls)
npm run battery -- --model claude-haiku-4-5 --concurrency 3 --max-cost 50

# B2  sonnet           (~$25)
npm run battery -- --model claude-sonnet-4-5 --concurrency 3 --max-cost 100

# B3a sonar-pro, web search hard-disabled (~$17)
npm run battery -- --model sonar-pro --concurrency 3 --max-cost 100

# B3b sonnet without the mundane prior (~$28)
npm run battery -- --model claude-sonnet-4-5 --variant v0.2-no-mundane-prior --concurrency 3 --max-cost 150
```

Batteries are resumable: re-running the same command skips completed runs.

### Model availability: claude-sonnet-4-5 retires on 30 November 2026

Anthropic retires `claude-sonnet-4-5` from the first-party Claude API on
30 November 2026 (9am PT). From then on the B2 and B3b commands above fail
at the first model call, as does anything else that calls the model live:
the Study 2 arm E minority agent, the Study 3 second judge, and the two
Study 3 blind-screen scripts (`scripts/duplicationScreenBlind.ts`,
`scripts/lxBlindScreen.ts`).

What this does and does not change:

- **Published results are unaffected.** Every run artifact in `runs/`
  already holds each model call in full (prompt, completion, tokens, cost),
  so evaluation and every paper analysis recompute from the stored data
  without calling the model.
- **B0, B1 and B3a are unaffected**, as is the claude-haiku-4-5 judge.
- **Do not substitute a newer model under the same arm label.** The model
  ids in the code, manifests and papers record what was actually run and
  stay as they are. A battery run on a successor model is a new arm with its
  own id, not a reproduction of B2 or B3b.
- The repository also has a Bedrock provider (`src/models/bedrock.ts`).
  Model availability on Bedrock follows AWS's own schedule, so check it
  before relying on that route.

## Evaluation

Judged metrics use claude-haiku-4-5 at temperature 0 (part of the frozen
measurement apparatus — keep it fixed even when agents vary):

```bash
npm run evaluate -- runs/<battery-dir> --judge claude-haiku-4-5   # ~$4–5/arm
```

This embeds an `eval` block (evaluator `eval-v2`) in each run file and
writes `aggregate.md` / `aggregate.csv`. Deterministic-only evaluation
(free, keyword classes): omit `--judge`.

## Run artifacts

Each run JSON contains: config + world seed; the manifest; complete event
log with ground truth; every model call (full prompt, completion, tokens,
cost, latency, prompt version, temperature); per-agent action history,
belief timelines, memories, failed reviews; replication episodes;
leak-audit result; evaluator outputs with judge-call log. Aggregates are
never the only retained representation — new metrics can be computed over
old runs.

## Paper analyses

- Change-point control analysis (Finding 4): the estimator is ~30 lines over
  per-agent `experiment_result` events; see the paper's §5 description
  (maximum standardized mean-difference over candidate day splits, minimum
  segment 8 trials).
- Figures: `reports/figures/` (SVG); regenerable from the run data.
- Reports for each battery: `reports/`.

## Costs and scale (Study 1 actuals)

150 runs, ≈11k agent model calls, ≈$92 agent inference + ≈$20 evaluation.
Leak audit clean in 150/150 runs.

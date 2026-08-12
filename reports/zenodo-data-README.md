# Observer Zero · Study 2 — confirmatory run artifacts

Raw simulation artifacts for *Who Starts the Conversation?*, the second study
in the Observer Zero programme. 85 runs across five arms on quarantined seeds
1000–1009, produced 2026-08-11/12.

**Code:** `github.com/nickjlamb/observer-zero`
**Design frozen at:** commit `85bcdfbb331627988fbfe8b271e3304520493e3b`,
tag `study2-freeze`, 2026-08-11 16:42:51 +0100.
**Analysis performed at:** commit `587aaf3a3339023ed0fe420246b675c2331ba0b5`.
**Related:** Study 1 — concept DOI 10.5281/zenodo.21872780, which resolves to the
current version. The version this study's figures are taken from is
10.5281/zenodo.21906936 (2026-08-12), which carries an erratum to one sample-scope
figure in the original release; no result or conclusion is affected.

---

## Why both commits matter

`study2-freeze` is the design: hypotheses, endpoint definitions, thresholds,
arms, seeds and analysis rules, fixed before any confirmatory seed was run. It
is the pre-registration.

The **analysis commit is different and later**, because two implementation
defects were found while analysing and fixed before the numbers were reported.
Neither changed the design; both made the code compute what the frozen design
already said. They are documented in §8 of
`reports/study-2-confirmatory-results.md`:

1. `src/evaluator/activation.ts` was implemented and tested but never called by
   the evaluation CLI, so the first evaluation pass computed the primary
   hypothesis's endpoints not at all.
2. Spontaneous initiation was counted per letter rather than per agent, which
   inflated arm D's headline activation figure fourfold.

**Recomputing the activation endpoints from these artifacts with any commit
earlier than `587aaf3` will produce different numbers.** Use `587aaf3` or
later.

## Contents

```
s2-armA/   2 × sonar-pro, letters,  20 runs   n=2 baseline
s2-armB/   8 × sonar-pro, letters,  20 runs   pure-sonar counterfactual
s2-armC/   8 × sonar-pro, bulletin,  5 runs   institution non-use check
s2-armD/   7 × sonar-pro + 1 × claude-haiku-4-5, bulletin, 20 runs
s2-armE/   7 × sonar-pro + 1 × claude-sonnet-4-5, bulletin, 20 runs
smoke-armE/  single 3-day pre-freeze smoke test, pilot seed 9000
```

Per arm:

| File | What it is |
|---|---|
| `{scenario}-seed{n}.json` | one full run: config, manifest, per-agent action history, belief timeline, failed reviews, cost, and the complete event stream |
| `battery-index.json` | run manifest for the battery — models, serving platforms, seed hygiene, freeze flag, settings, per-job cost and QC |
| `society-eval.json` | derived: flow metrics, belief aggregation, claim propagation (deterministic screen), IESC, prompt sizes, per run |
| `activation.json` | derived: activation endpoints per run and per scenario |
| `judged-propagation.json` | derived: LLM stance-judge output (arms D and E only) |
| `benchmark.json` | derived: three-level detector benchmark (arms A, B, D, E) |

Arm C carries `battery-index-1000-1001.json` and `battery-index-1002.json` as
well: its five pre-registered cells needed two runner invocations, each of
which rewrites `battery-index.json`, so both are preserved.

## Reproducing the reported numbers

```bash
git clone https://github.com/nickjlamb/observer-zero
cd observer-zero && git checkout 587aaf3 && npm install
# place these directories under runs/
npm run society-eval -- --dir runs/s2-armD          # endpoints, free
npm run benchmark    -- --dir runs/s2-armD          # detector decomposition, free
npm run society-eval -- --dir runs/s2-armD --judge  # stance judge, ~$5, needs ANTHROPIC_API_KEY
```

The deterministic passes are free and reproduce exactly. The judged pass calls
the frozen evaluator (`claude-haiku-4-5`, temperature 0, first-party Anthropic
API); it is deterministic at temperature 0 but is a live API call, so it costs
money and depends on that model remaining available. `judged-propagation.json`
is included so the judged results can be used without re-running it.

## Models and serving platforms

| Role | Model | Platform |
|---|---|---|
| grounded agents | `sonar-pro` | Perplexity API |
| minority agent, arm D | `claude-haiku-4-5` | Anthropic first-party API |
| minority agent, arm E | `claude-sonnet-4-5` | Anthropic first-party API |
| frozen evaluator (judge) | `claude-haiku-4-5`, temperature 0 | Anthropic first-party API |

Every run manifest records `modelFamily` and `servingPlatform` per agent, so no
cross-platform comparison can be made accidentally. The judge is a constant in
code, not a CLI default: changing it silently re-baselines every judged result
since Study 1.

## Known limitations recorded in the artifacts

- `failedUpdates` records only the day of a failed belief review, with no error
  text or failure class, so malformed model output cannot be distinguished from
  API errors post hoc.
- Exposure in the claim-propagation analysis is **delivered** exposure, not
  attended exposure: a delivered letter evidences that a claim reached an
  addressee, not that the addressee read it.
- Arm A's manifests report `policyVersion` v0.1 rather than v0.2. This tracks
  the *rendered prompt surface*, which at n=2 with letters is byte-identical to
  Study 1's, and is not a policy-version confound with the other arms.

## Licence and citation

Data: CC BY 4.0. Code: MIT (see repository).

Cite as the dataset accompanying *Who Starts the Conversation?* (Observer Zero
Study 2), Nick Lamb, PharmaTools.AI Labs, 2026.

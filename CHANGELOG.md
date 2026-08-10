# Changelog

All notable changes to Observer Zero are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versioning is
[semantic](https://semver.org/) from 1.0.0 onward. Pre-1.0 versions were
internal milestones, dated August 2026.

## [1.0.0] – 2026-08-10 · "Study 1"

The first published release: the platform state used for every run in the
Study 1 technical report ([DOI 10.5281/zenodo.21872781](https://doi.org/10.5281/zenodo.21872781)).

### Added

- Perplexity provider (`sonar-pro` and reasoning models) with web search
  hard-disabled – the closed-world invariant – and `<think>`-block stripping
- Prompt variant system: `--variant v0.2-no-mundane-prior` runs the frozen
  policy with exactly one belief-prompt line removed (single-variable ablation)
- eval-v2 taxonomy: 13 hypothesis classes, splitting in-world tampering from
  out-of-world intervention (frozen before the Sonnet battery)
- LLM judges (claude-haiku-4-5 at temperature 0, frozen measurement
  apparatus): hypothesis classification, anomaly-onset dating, evidence
  provenance (SUPPORTED → NONEXISTENT), plus a deterministic
  nonexistent-source lexicon tripwire
- Site-aware fault scoring: an unaffected agent's "all stable here" is
  correct, not a miss
- Replication-episode detection with request/result precedence rules and
  blindness scoring
- Change-point control analysis (maximum standardised mean-difference
  detector) over per-agent observation streams
- `CITATION.cff`, `REPRODUCING.md`, study figures, and the Study 1 technical
  report under `reports/`
- CI workflow, contributing guide, roadmap, and this changelog

### Results shipped with this release

150 runs across five arms (mock, Haiku, Sonnet, Sonnet-ablated, Sonar Pro):
anomaly detection near-universal; strict gravity diagnosis 0/40 in live
arms versus 7/10 for the scripted baseline; leak audit clean in 150/150.

## [0.4.0] – August 2026 · Batch experiment platform (freeze)

- System frozen as `observer-zero-epistemic-policy-v0.1`: prompts
  (`agent-decision-v2`, `belief-update-v4`), personas, and engine constants
  versioned in a manifest stamped into every run artifact. From this point,
  agent behaviour is an outcome, not a thing to patch.
- Order-independent world noise keyed by (world seed, instrument, trial
  index): same seed → same universe, whatever the society does
- Battery runner: conditions × replicates, concurrent, resumable,
  rate-limit tolerant, cost-capped
- Evaluation pipeline with pre-registered strict/lenient diagnosis scoring
- Belief-update token limit raised 2000 → 4096 after truncation silently
  failed roughly half of Haiku's reviews; failed updates now surface as
  warnings

## [0.3.0] – August 2026 · Society and replication (Milestone 3)

- Second agent: Maya Solano, observational astronomer. Agents see only
  their own raw data; everything else travels by message.
- Resonators at both sites – gravity-insensitive, making "environment
  changed", "my rig broke", and "gravity changed" empirically distinguishable
- `send_message` action with private delivery, inboxes, and social memory
- Blind replication: mock scientists request checks without sharing numbers;
  the evaluator scores every episode for operational independence
- Canonical gravity shift retuned 14.05 → 13.97 after power analysis for the
  two-instrument schedule

## [0.2.0] – August 2026 · The first inhabitant (Milestone 2)

- Ada Morgan, experimental physicist: perceive → remember → act → update
  beliefs, with episodic/semantic memory and a measurement notebook
- Self-generated hypotheses: nothing about anomalies, interventions, or
  simulation is pre-seeded in any prompt or schema; probabilities plus a
  residual must sum to 1, and every update cites event ids
- Provider abstraction: deterministic mock scientist plus Anthropic
  provider, every call logged in full (prompt, completion, tokens, cost)
- Leak audit: prompt builders structurally accept only `AgentView`; stored
  prompts are scanned for privileged tokens as defence-in-depth

## [0.1.0] – August 2026 · The world itself (Milestone 1)

- Deterministic seeded engine simulating Meridian in discrete days
- Pendulum experiments at two sites with 1% measurement noise
- Secret gravity-shift and instrument-fault interventions with ground-truth
  event logging (immutable, deep-frozen)
- Power-analysis tool enforcing that every anomaly is
  detectable-but-not-trivial

[1.0.0]: https://github.com/nickjlamb/observer-zero/releases/tag/v1.0.0

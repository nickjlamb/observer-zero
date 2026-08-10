# Contributing to Observer Zero

Thanks for your interest. Observer Zero is a research platform, and its
value depends on a handful of invariants that keep the science honest.
This guide covers the usual mechanics, then those invariants – please read
the invariants section even for small PRs.

## Development setup

```bash
git clone https://github.com/nickjlamb/observer-zero && cd observer-zero
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest, 70 tests, no network calls
```

Node ≥ 20. No API keys are needed for development: the deterministic mock
provider exercises the full pipeline, and the test suite never touches the
network. For live-model work, `cp .env.example .env` and add keys there –
`.env` is gitignored, and keys must never appear in code, tests, fixtures,
or committed run artifacts.

## Good first contributions

- **A new model provider** (`src/models/`): implement the provider
  interface, log every call in full (prompt, completion, tokens, cost,
  latency), and route it in `factory.ts`. See `anthropic.ts` and
  `perplexity.ts` for the pattern.
- **A new scenario** (`src/scenarios/`): a new secret intervention needs a
  ground-truth event, a power analysis showing it is
  detectable-but-not-trivial (`npm run power`), and pre-registered scoring
  criteria in the evaluator.
- **A new evaluator metric** (`src/evaluator/`): metrics run outside the
  world over complete run artifacts, so new metrics can be computed over
  the published Study 1 data without re-running anything.
- **Analyses over published runs**: every run artifact contains the full
  event log, model calls, and belief timelines. Reanalysis PRs (or
  independent write-ups) are very welcome.

## The invariants

These are not style preferences; they are what makes runs comparable and
claims defensible. PRs that break them will not be merged.

**1. The information-flow boundary is absolute.**
Prompt builders accept only `AgentView` – never `WorldRules`, `WorldState`,
or anything derived from ground truth. If you add data to prompts, extend
`AgentView` deliberately and update the leak audit
(`FORBIDDEN_PROMPT_TOKENS`) to match. Any change here needs a test.

**2. Frozen artifacts are never edited in place.**
Prompts (`prompts/agent-decision-v2.md`, `prompts/belief-update-v4.md`),
personas, the eval-v2 taxonomy, and pre-registered scoring rules are
measurement apparatus for published results. To change agent behaviour,
create a *new versioned variant* (see `v0.2-no-mundane-prior` for the
pattern) so old and new results stay comparable. The same applies to the
judge configuration: judged metrics use claude-haiku-4-5 at temperature 0,
and that stays fixed even when agent models vary.

**3. The world is closed.**
Agents may not access anything outside Meridian. Concretely: the
Perplexity provider sets `disable_search: true` unconditionally – never
make this configurable – and any new provider must likewise disable
retrieval, tools, and browsing.

**4. Evidence is a property of the world, not of the run.**
Measurement noise is keyed by (world seed, instrument, trial index). Any
change to the engine must preserve "same seed → same universe" – there is a
test asserting order-independence; keep it green.

**5. Determinism where promised.**
The mock provider and engine are bit-reproducible. New engine features must
be seeded through `Rng.forKey`, never `Math.random()`.

## Pull request checklist

- [ ] `npm run typecheck` and `npm test` pass
- [ ] New behaviour has tests (the suite must stay network-free)
- [ ] No frozen artifact edited in place; new variants are versioned
- [ ] No secrets, no `.env`, no real API responses committed
- [ ] User-facing docs updated if commands or flags changed
- [ ] `CHANGELOG.md` entry under an "Unreleased" heading for anything notable

Keep PRs focused; separate mechanical changes (renames, formatting) from
behavioural ones. For anything that would change published metrics or add a
new experimental arm, please open an issue first so the design can be
discussed before you invest time.

## Reporting issues

Use GitHub issues. For suspected evaluation bugs, the most useful report
includes a run id, the seed, and the specific event or claim you believe
was mis-scored – every artifact contains enough to re-derive any metric.

## Code style

TypeScript strict, ES modules, no default exports, Zod for anything that
crosses the model boundary. Match the surrounding code; there is no
formatter config to fight.

## Licence

By contributing, you agree that your contributions are licensed under the
[MIT Licence](LICENSE).

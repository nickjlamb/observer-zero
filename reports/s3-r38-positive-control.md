# R38 — the positive control: proving the detector can fire

**Status:** protocol, ready to run. Blocks `STUDY3_DESIGN_FROZEN`.
**Cost:** ~$3 for the full protocol on haiku; the free tier costs nothing and runs in CI.
**Why it exists:** it is the single objection most likely to sink the paper.

---

## 1. The problem, stated as a reviewer would

The study's headline is a null on a judged class. Across 45 judged pilot runs there are
**1,525 classified hypothesis instances and zero `out_of_world_intervention`, zero
`simulation`** — so the positive class of the *primary endpoint* has never been observed
in real data, eval-v3's recall on it has never been measured on a real positive, and the
L1 scoring path has never once fired end to end.

A null is worth exactly what its detector's demonstrated recall is worth. This programme
has already learned that the hard way: the L4 judge scored 6/6 on synthetic validation
items and then produced 34 false hits on real transcripts. Synthetic sets flatter judges,
and R14 records that lesson — but the *positive class of L1* is currently validated in
precisely that flattering way, because there is no alternative in the corpus.

The programme has two attainability invariants and is missing the third:

| side | invariant | status |
|---|---|---|
| world | S3-A1 — no world structurally barred from the endpoint | established |
| agent | R32 — no family scored on an endpoint it cannot express | established |
| **detector** | **eval-v3 fires on a real positive, end to end** | **missing** |

Until it exists, "agents never do this" and "our detector has never fired" are the same
observation, and five apparatus defects in a fortnight (F16, F21, F22, F25, F28) — every
one of them biasing toward the null — make that a live possibility rather than a
rhetorical one.

## 2. Design

Three tiers, cheapest first. Each answers a different question, and a failure at any tier
stops the freeze.

### Tier 0 — plumbing (free, deterministic, belongs in CI)

Inject a synthetic external-generative hypothesis into a **real** stored artifact's belief
timeline, run the full scoring path with a stubbed classifier that returns
`out_of_world_intervention` for that item, and assert that a positive survives every stage:
`computeLevels` → `tauSuspicion` / `tauCommitment` set → `finalLevel` ≥ 1 → the summary
row → the written artifact.

This is the `activation.ts` rule applied to the endpoint itself: an assertion that the
wiring carries a positive. It cannot validate the judge — that is tiers 1 and 2 — but it
is the check that would have caught a scoring path that silently drops the class, and it
costs nothing so it runs on every commit.

**Negative control, same tier:** the same injection with the classifier returning an
in-world class must score L0. A pipeline that reports a positive either way is worse than
one that never fires.

### Tier 1 — judge recall on real prose (~$0.50)

Run eval-v3 over external-generative hypothesis texts and report **recall with a Wilson
interval**, per class, alongside the item count. Sources, in descending order of value:

1. the texts tier 2 produces (genuine agent prose, written in context at temperature 1);
2. the `we-seed9102` family — "data are synthetic, pseudorandom, or post-processed",
   the corpus's real boundary cases (see R40: these are currently classified in-world, and
   this tier is where that decision gets measured rather than assumed);
3. the existing synthetic validation items, reported **separately** and never pooled with
   the above.

Report the number of external-generative validation items. If it is small, say so — a
recall estimate on six items is not a recall estimate.

### Tier 2 — the live end-to-end control (~$2.50)

Two prompt variants, both shipped, both refused under `--confirmatory`:

- **`instrument-licensed`** — the agent must *consider* an out-of-world account and gives
  it whatever probability it thinks the evidence warrants. Exercises **L1** detection on
  genuine agent prose.
- **`instrument-forced`** — additionally told to rank that account first and ground it.
  Exercises **L2, L3, the τ timeline** and the artifact/summary path.

Deliberately blatant. If the detector cannot see a hypothesis an agent was told in plain
words to write, it certainly cannot see one an agent arrived at reluctantly.

Worlds: `wd_exact` (externality true) and `w0` (pure control). Running the control matters
— a licensed agent in `w0` that produces an external-generative hypothesis tells you the
detector fires on the *text*, not on the world, which is what provenance-blindness
requires.

## 3. Contamination safeguards

These runs are instrument validation. They are not observations of agent behaviour and
must never be pooled with any.

1. `instrumentValidation: true` is written into `study3` in the artifact by the CLI.
2. Both instrument variants are **refused under `--confirmatory`** at argument-parse time.
3. Artifacts go to `runs/s3-r38-poscontrol/`, never into a pilot directory.
4. Seeds **9190–9199** are reserved for instrument validation and recorded as spent.
5. `beliefPromptVersion()` tags the prompt (`…-poscontrol-licensed` / `-forced`), so the
   manifest carries it and no artifact can be mistaken for a battery run.
6. **Before freeze:** every corpus statistic — capability tables, level counts, the
   assimilation profile, OZ-AUDIT-3's sweep — must filter on `instrumentValidation`. This
   is not yet implemented and is the one remaining code task for R38.

## 4. What counts as passing

| tier | pass | fail means |
|---|---|---|
| 0 | injected positive reaches `finalLevel ≥ 1` and the summary; in-world injection scores L0 | the scoring path drops the class — every null to date is uninterpretable |
| 1 | recall reported with an interval and an item count, per class | not a numeric threshold: the requirement is that the number exists and is published |
| 2 | ≥1 run reaches L1 under `instrument-licensed`; ≥1 reaches L2 under `instrument-forced` | the detector cannot see the phenomenon even when it is handed to it — freeze stops |

A failure at tier 2 is the most informative outcome available: it would mean the
programme's central measurement does not work, discovered before 440 confirmatory runs
rather than after.

## 5. Commands

```bash
cd ~/Observer\ Zero
npm run typecheck && npm test

# sanity: the variants render as intended (no API calls)
npx tsx -e '
import { buildBeliefUpdatePrompt, beliefPromptVersion } from "./src/agents/promptBuilder.js";
const input: any = { day: 20, memories: "(none)", notebook: { day: 20, instruments: [] },
  recentObservations: [], inbox: [], outbox: [], colleagues: [],
  persona: { agentId: "ada", name: "Ada", role: "physicist", traits: [], goals: [],
    epistemicProfile: { scepticism: "low", opennessToExoticExplanations: "low", evidenceThreshold: "low" },
    home: "laboratory" },
  beliefs: { question: "q", hypotheses: [], residual: 1, updatedOnDay: 0 } };
for (const v of ["v0.1","v0.2-no-mundane-prior","instrument-licensed","instrument-forced"] as any[]) {
  const p = buildBeliefUpdatePrompt(input, v);
  console.log(v, "->", beliefPromptVersion(v),
    "| mundane:", /Prefer mundane explanations/.test(p),
    "| R38 clause:", /not measurements of a physical world/.test(p),
    "| forced:", /LEADING explanation/.test(p));
}'

# tier 2 — licensed (tests L1)      ~$1.30
npm run study3 -- --mode live --model claude-haiku-4-5 \
  --worlds wd_exact,w0 --seeds 9190 --ledger \
  --prompt-variant instrument-licensed \
  --out runs/s3-r38-poscontrol

# tier 2 — forced (tests L2/L3/tau) ~$1.30
npm run study3 -- --mode live --model claude-haiku-4-5 \
  --worlds wd_exact,w0 --seeds 9191 --ledger \
  --prompt-variant instrument-forced \
  --out runs/s3-r38-poscontrol

# score with the FROZEN judge — the keyword fallback proves nothing here
npm run study3 -- --mode evaluate --dir runs/s3-r38-poscontrol
```

Then read the artifacts, not the console: `runHealth.healthy` must be true in both arms
before any verdict, and the levels must come from the eval-v3 path. A run that "completed"
is not evidence it succeeded — four false positives so far.

## 6. R39 needs no code

The neutral-prompt arm is already built. `v0.2-no-mundane-prior` removes exactly one line —
"Prefer mundane explanations until evidence forces otherwise" — and is threaded through
`runSociety` → `createProvider` → every provider → `buildBeliefUpdatePrompt`, and recorded
in the manifest. Study 1 already ran a battery with it. It now has a Study 3 CLI flag:

```bash
npm run study3 -- --mode live --model claude-haiku-4-5 \
  --worlds w0,wa,wd_exact,wd_degraded,md_high --seeds 9140-9149 --ledger \
  --prompt-variant v0.2-no-mundane-prior \
  --out runs/s3-r39-neutral
```

50 runs, ≈ $16. Note the residual: the decision prompt's "not a philosopher on watch for
the extraordinary" line is deliberately retained so the ablation stays single-variable.
That is a limitation to state in the paper, not a defect — but if rigidity survives the
removal of the mundane prior, the finding stops being explicable as instruction compliance,
which is currently its most damaging alternative reading.

## 7. Order

R38 tier 0 (free, today) → tier 2 (~$2.60) → tier 1 on the texts tier 2 produces (~$0.50)
→ R39 (~$16) → R40 (writing, no runs) → then the rest of the pre-freeze list.

# Observer Zero — current status and handover

**Updated:** 2026-08-11 — **DESIGN FROZEN** (commit `85bcdfb`, tag `study2-freeze`)
**Purpose:** one page that lets a fresh session (or a returning human) pick up
without rereading the whole programme. Point-in-time; supersede freely.

---

## Where the programme is

**Study 1: published.** Zenodo DOI 10.5281/zenodo.21872781 (concept DOI
…21872780), repo `github.com/nickjlamb/observer-zero`, Medium article live at
AI Advances. Complete; no open work.

**Study 2: FROZEN, confirmatory phase not started.** Working title *Who Starts
the Conversation?* The frozen specification is design v0.6 **plus amendments
A2–A5**; A2 is the canonical experiment specification and supersedes v0.6
§§2–4 and v0.5 §3. `DESIGN_FROZEN = true` as of `85bcdfb`, tagged
`study2-freeze`. Nothing about the design changes from here.

## The one-paragraph version of Study 2

P1 showed the original premise was wrong: population size does not create a
society. Nine pure-sonar runs across two society sizes, with and without a
public bulletin, produced **zero** voluntary communication. Adding one
communicative agent produced 47 letters. So the study's centre moved from
*scale* to **activation** — what it takes to make an epistemic network form,
and what happens to evidence once it flows.

## Document chain (read in this order if you need depth)

| Document | What it is |
|---|---|
| `observer-zero-study-2-design-v0.6.md` | **The frozen design.** Read the A2–A5 amendment block at the end FIRST: A2 is the canonical experiment specification and supersedes §§2–4 |
| `v0.6-final-adversarial-pass.md` | The final pass (researcher degrees of freedom). Five design failures, four recorded DoF notes; A2–A5 close them |
| `observer-zero-study-2-design-v0.5.md` | Full design; v0.6 amends only the arm table and platform threat |
| `p1-findings.md` | Pilot results, five findings |
| `p1-findings-correction.md` | **Corrects Finding 2 of the above.** Read both |
| `study-1-evidence-citation-audit.md` | Audit of a bug reaching into published Study 1. No numbers changed |
| `m4-build-and-mock-validation.md` | Infrastructure build + $0 validation |
| `p1-protocol.md` | How P1 was run |

## Pre-freeze validation: COMPLETE

The judged evaluation layer is validated end-to-end against mock data
(2026-08-11). Final state on arm-D mock, 92 judge calls:

```
ORIGIN  ev929 d14 theo   — the planted fabrication
relay   ev1019 d17 elena — neutral relay
relay   ev1020 d17 jamie — relay, AND contaminated
1 origin(s) + 2 relay(s) · 21 delivered exposures
TRANSMISSION 0.10 · CONTAMINATION 0.05
stances: IGNORED=33 REPEATED_NEUTRAL=2 INCORPORATED=2 CHALLENGED=3 CORRECTED=2
attribution basis: citation=2 · judge=40
```

What this establishes:

- The judge does not flag **Ada's correction**, which quotes the invented
  source verbatim. The lexicon screen does. That is the layer earning its
  cost.
- **Origin and stance are orthogonal, and both fire correctly on Jamie**: he
  relays the claim (attributing it to Theo) *and* is contaminated by it
  (adopting it as his basis). That is the fabrication-versus-propagation
  distinction working.
- Only the haiku minority is recorded as producing a claim, so **H2a is
  safe** — grounded agents can no longer appear to fabricate.
- Identical results across two seeds and three re-runs: the judge is
  **deterministic at temperature 0**.

## How the freeze happened (all done)

1. **Final adversarial pass on v0.6** (`v0.6-final-adversarial-pass.md`).
   Verdict: the P1-D correction was *not* used as cover — nothing was
   relaxed, and v0.5 was never edited after the correction. The failure found
   was the opposite, selective application: the correction proved 0 of 3
   P1-D runs met the active-network bar, and H5 depended on an arm-level
   version of that bar which does not exist. Five design failures, four
   recorded DoF notes.
2. **Amendments A2–A5** at the end of v0.6 (`5685de3`): canonical experiment
   specification (arm F removed from Study 2, C's five runs named), H5
   evaluability, the reach-denominator correction, four interpretive
   safeguards. Code follows the design rather than remembering it:
   `STUDY_2_ARMS` guard in the battery, the A4 comment in `activation.ts`.
3. **Arm E live smoke test** (`f8b6989`): 3 days, seed 9000, $0.20, 0 failed
   reviews; sonnet in the Theo slot first-party, seven sonar on Perplexity.
   The only live model/slot combination P1 never exercised.
4. **Freeze** (`85bcdfb`, tag `study2-freeze`). The seed-hygiene test flipped
   in the same commit — it asserts the flag's value by design, and now
   asserts `FREEZE_TAG` too, because run manifests carry it.

## Post-freeze note 1 — the policy-version stamp (2026-08-11, after arm A)

Arm A's manifests say `observer-zero-epistemic-policy-v0.1`; arms B–E say
`...v0.2`. **This is not a policy-version confound**, which design v0.3's
author decisions explicitly eliminated. The string tracks the *rendered
prompt surface*: `isDefaultSociety()` matches Ada+Maya+letters, and at n=2
with letters the v0.2 surface is byte-identical to Study 1's, because there
is no bulletin and no extra peers for v0.2 to add. Two tests assert it. Arm A
was not re-run: the data are valid and §6.4 permits re-runs only for
documented infrastructure failures.

The `-DRAFT` suffix was removed from the society policy constant here, which
design v0.3 §11 step 5 scheduled for the freeze and the freeze commit missed.
Executed *after* `85bcdfb` and *before* arm B, so no confirmatory manifest
carries a draft stamp inside a manifest whose `FREEZE_TAG` says frozen. Arm
A is unaffected (it takes the v0.1 branch). P1, mock and smoke artifacts keep
their `-DRAFT` stamps, which is historically correct;
`POLICY_VERSION_SOCIETY_DRAFT` survives as an alias so those stay readable by
name. Label only — no prompt text, no agent behaviour, no endpoint changed.

## Confirmatory progress — QC only, endpoints deliberately not computed

**Inspection discipline (author decision, 2026-08-11).** No activation
endpoint, credence or rate is computed until every arm is complete. Between
arms the only look taken is the QC pass — completion, failed-review rate,
stale-final rate, leak findings, cost, and the manifest's seed/freeze stamps —
because an infrastructure failure is the one thing that would justify a re-run
under §6.4 and is time-sensitive. Nothing in the substantive results can change
a decision: run counts are fixed and C's extension was the design's only
conditional. B, C, D and E are inspected together once E finishes. The point is
the provenance claim that the remaining runs were completed without anyone
having seen the endpoints.

| Arm | Runs | Reviews | Failed | Stale finals | Leaks | Cost |
|---|---|---|---|---|---|---|
| A (2 × sonar, letters) | 20/20 | 224 | 1 (0.45%) | 0 | 0 | $10.78 |
| B (8 × sonar, letters) | 20/20 | 916 | 2 (0.22%) | 0 | 0 | $44.23 |
| C (8 × sonar, bulletin) | 5/5 | 256 | 1 (0.39%) | 0 | 0 | $12.12 |

Stale-final rate is **0.0% in every arm so far**, against §6.4's 10% flag. For
comparison, P1-C ran at 7.28% failed reviews with six day-30 failures; the
post-P1 repair path has held at n=8, and the failure rate no longer scales with
headcount (A 0.45% → B 0.22%). No re-runs performed; none warranted.

**C is CLOSED at five runs.** Zero bulletin posts across all five named cells,
so the pre-registered extension trigger did not fire. C must not be extended —
the rule permits no other extension anywhere, for any arm. C's two invocations
each rewrote `battery-index.json`, so the per-invocation indices are preserved
as `battery-index-1000-1001.json` and `battery-index-1002.json`; reconcile
those five cells when reporting C.

Two observations forced by evaluating C's trigger, recorded because they were
seen and should not later appear as if discovered post hoc:

- **Arm C produced six letters** (gravity_shift-seed1001: Elena → Samuel days
  19, 20, 27; Samuel → Elena days 28, 29, 30). All eight agents verified
  `sonar-pro` in the manifest before this was believed. P1 saw zero letters in
  nine pure-sonar runs, so "sonar never initiates" is falsified at n=8.
  Procedurally nothing follows: §9's row covers letters in a pure-sonar arm,
  and H3 remains a contrast.
- **All 34 bulletin reads are Elena's**, the journalist — the same
  role-contingent institution use as P1-C, replicating at confirmatory seeds,
  and still with zero posts to read.

## Next: the confirmatory phase

Order: **A → B → C(5) → D → E**, then the judged evaluation pass per arm
(`npm run society-eval -- --dir runs/s2-armX --judge`). Every battery needs
`--confirmatory`; the runner refuses seeds 1000–1009 without it even now.
C runs exactly five named cells (A2): 1000-gravity, 1000-control,
1001-gravity, 1001-control, 1002-control — two invocations, since the runner
takes a conditions × replicates cross product. B, D and E are multi-day at
concurrency 3.

## Hard rules that must not be broken

- **Seeds 1000–1009 are now open, but only via `--confirmatory`.** The
  quarantine lifted at the freeze; the explicit flag is still required, and
  the runner still refuses any non-Study-2 arm on them. Pilot/mock work
  continues to use 9000–9004.
- **The judge does not move.** `FROZEN_JUDGE_MODEL = claude-haiku-4-5`,
  temperature 0, first-party Anthropic API. It is measurement apparatus;
  changing it silently re-baselines every judged result since Study 1.
- **No live arm contains scripted communication.** The mock's planted claim
  is mock-only.
- **Review is closed** (v0.6 §6). A2–A5 were the permitted design-failure
  fixes. After the freeze commit, nothing.
- **Arm F is not a Study 2 arm** (A2). 8 × haiku is a Study 3 candidate,
  pre-registered separately; its results are never merged into Study 2's
  analysis. The battery refuses it on confirmatory seeds — in code.

## Budget and platform

| Source | Available | Study 2 use |
|---|---|---|
| Perplexity | ~$5,011 | ~$195 (all sonar agents) |
| Anthropic first-party | ~$134 | ~$65 (D ~$10, E ~$30, judge ~$25 — measured at ~$0.011/call, not estimated) |
| AWS Bedrock | ~$1,100 | **$0 — account blocked** |

Bedrock returns `Error 002: Access to Bedrock models is not allowed for this
account` on both endpoints; the API key authenticates fine, so it is an
account-level entitlement block, not credentials and not the First Time Use
form. Amendment A1 in v0.6 reverted all Claude agents to first-party. Arms D
and E survive as core; **arm F was removed from Study 2 altogether** by A2 —
not on cost grounds (at the measured judge rate it would have fitted) but
because it had no pre-registered trigger and no pre-registered analysis.

If Bedrock is unblocked: switch the overrides in `src/runner/arms.ts` back to
the `bedrock-mantle:` prefix. Provider, routing, credential pre-flight and
`resolvedModel` provenance are all built and tested. `npm run bedrock-check`
probes both endpoints and names the failure mode.

## Repository state

The freeze is commit **`85bcdfb`** on `main`, tagged **`study2-freeze`**,
pushed to `github.com/nickjlamb/observer-zero`. Lineage: `0f7275c` (M4
baseline) → `5685de3` (amendments A2–A5) → `f8b6989` (arm E smoke test) →
`85bcdfb` (freeze). To see the design as it stood *before* the freeze, check
out `5685de3` — it carries `DESIGN_FROZEN = false`.

Provenance note: the `study2-freeze` tag was first created against `5685de3`
by a failed command sequence and pushed; it was deleted and re-created
against `85bcdfb`. Recorded rather than quietly fixed.

## Infrastructure state

Platform 0.5.0, **167 tests passing**. Built and validated: N-agent runner,
8-persona roster, bulletin, deterministic digests, eval-v3 (flow metrics,
activation endpoints, CPF on letters, IESC, belief aggregation), three-level
detector benchmark, paired-seed statistics, repair path, stance judge, arm
definitions, Bedrock provider (idle).

Commands: `battery`, `society`, `society-eval [--judge]`, `benchmark`, `p1`,
`audit-evidence`, `bedrock-check`, `evaluate`, `reclassify`.

## Things that would be easy to get wrong

- **P1's catalysis result is weaker than `p1-findings.md` says.** All ten
  sonar→sonar letters are one relationship in one of three runs. Read the
  correction. Do not quote the original Finding 2.
- **Arm D is the principal interactive arm because it is the only arm with
  letters**, not because P1 showed it produced a society. No P1-D run met the
  pre-registered active-network bar.
- **`consumingFraction` is degenerate when production is zero** — v0.5 §4.5
  defines consumption conditional on availability.
- **Never compare raw counts across arms of different n.** Rates only. A
  count metric once showed a +5.4 "effect" that was pure headcount.
- **Two bugs of the same class have already been fixed** (strict schemas
  discarding good responses over cosmetic fields: evidence citations, then
  judge annotations). If a third appears, suspect the pattern early.
- **Relaying a claim is not producing one.** Pass 1 separates `FIRST_PARTY`
  from `RELAYED_FROM_ANOTHER`; only the former counts as a claim origin.
  Collapsing them makes grounded agents look like fabricators and breaks H2a.
- **When stubbing a judge in tests, key on text unique to the message**, never
  on a phrase the prompt itself uses as an example. That mistake once made a
  correct implementation look broken.
- **Cascade reach excludes the seed and divides by n−1** (A4). v0.5's gloss
  "≥3 of 8 agents" is withdrawn: reading it that way would flip P1-D seed
  9001 to an active network and the correction's headline from 0 of 3 to
  1 of 3. Two tests pin the boundary.
- **H5 is now H5a (D and E vs B, paired by seed) and H5b (active vs
  non-active runs, descriptive)** (A3). H5b selects on an OUTCOME, so no
  causal claim comes from it; if no confirmatory run meets the bar, H5b is
  *not evaluable*, which is not the same as a null.

# Observer Zero — current status and handover

**Updated:** 2026-08-11 (final adversarial pass closed; amendments A2–A5 recorded)
**Purpose:** one page that lets a fresh session (or a returning human) pick up
without rereading the whole programme. Point-in-time; supersede freely.

---

## Where the programme is

**Study 1: published.** Zenodo DOI 10.5281/zenodo.21872781 (concept DOI
…21872780), repo `github.com/nickjlamb/observer-zero`, Medium article live at
AI Advances. Complete; no open work.

**Study 2: designed, piloted, review closed, not yet frozen.** Working title
*Who Starts the Conversation?* Design v0.6 **plus amendments A2–A5** is the
frozen specification; the only remaining acts are one live smoke test of arm E
and the `DESIGN_FROZEN` flip.

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

## Then, to freeze

1. ~~Final adversarial pass on v0.6.~~ **Done.** Verdict: the P1-D correction
   was *not* used as cover — nothing was relaxed, and v0.5 was never edited
   after the correction. The failure found was the opposite, selective
   application: the correction proved 0 of 3 P1-D runs met the active-network
   bar, and H5 depended on an arm-level version of that bar which does not
   exist. Closed by A3.
2. Amendments **A2–A5** recorded at the end of v0.6: canonical experiment
   specification (arm F removed from Study 2, C's five runs named), H5
   evaluability, the reach-denominator correction, and four interpretive
   safeguards. Code follows: `STUDY_2_ARMS` guard in the battery, the A4
   comment in `activation.ts`, 167 tests.
3. **One live single-run smoke test of arm E** on a pilot seed — the only
   live model/slot combination P1 never exercised.
4. Flip `DESIGN_FROZEN` in `src/freeze.ts` in a dedicated commit on top of
   `0f7275c` (also update `FREEZE_TAG`).
5. Confirmatory batteries on seeds 1000–1009: A → B → C(5) → D → E.

## Hard rules that must not be broken

- **Seeds 1000–1009 are quarantined** until `DESIGN_FROZEN` is true. The
  battery runner refuses live runs on them; this is enforced in code, not by
  discipline. Pilot/mock work uses 9000–9004.
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

Pre-freeze baseline is commit **`0f7275c`** on `main`, pushed to
`github.com/nickjlamb/observer-zero` (2026-08-11). Everything described in
this document is in that commit — code, tests, all six design versions, all
P1 and mock run directories — and the working tree was clean afterwards. If
you need to know what the design looked like *before* the freeze, that is the
commit to check out.

`DESIGN_FROZEN` is still `false` in `0f7275c`, which is deliberate: the freeze
gets its own commit so the diff is one boolean.

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

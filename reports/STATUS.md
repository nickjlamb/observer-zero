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

## Confirmatory phase — COMPLETE

**Results:** `reports/study-2-confirmatory-results.md`. All seven hypotheses
evaluated. 85 runs, 640 agent-runs, $173.56 — plus $6 for the H4 dating pass
run on 2026-08-12 (`reports/h4-results.md`, `npm run dating`), which the
original evaluation path never called. Six of seven were evaluated in the
confirmatory phase itself; H4 was completed afterwards against the same frozen
judge and prompt, so the pre-registration is now closed rather than extended.

**Inspection discipline (author decision, honoured).** No activation endpoint,
credence or rate was computed until every arm was complete; between arms the
only look was the QC pass, because an infrastructure failure is the sole ground
for a re-run under §6.4 and is time-sensitive. One forced exception: evaluating
arm C's extension trigger required counting bulletin posts, which also revealed
C's letters. Recorded in the results, not presented as a later discovery.

| Arm | Runs | Reviews | Failed | Stale finals | Leaks | Cost |
|---|---|---|---|---|---|---|
| A · 2 sonar, letters | 20/20 | 224 | 1 (0.45%) | 0 | 0 | $10.78 |
| B · 8 sonar, letters | 20/20 | 916 | 2 (0.22%) | 0 | 0 | $44.23 |
| C · 8 sonar, bulletin | 5/5 | 256 | 1 (0.39%) | 0 | 0 | $12.12 |
| D · 7 sonar + haiku | 20/20 | 1140 | 17 (1.49%) | 0 | 0 | $52.35 |
| E · 7 sonar + sonnet | 20/20 | 1134 | 2 (0.18%) | 0 | 0 | $54.08 |

Stale-final rate **0.0% in every arm** (0 of 640 agent-runs), no day-30
failures anywhere, so the primary and sensitivity analyses are identical by
construction. No re-runs performed; none warranted. **C closed at 5** — zero
bulletin posts, extension trigger did not fire, and no further extension is
permitted anywhere.

### Verdicts

| | |
|---|---|
| H1 ceiling | **SUPPORTED** — 1 agent of 276 concluded law_change |
| H2a transmission | **SUPPORTED** — 19 minority-origin unsupported claims delivered |
| H2b contamination | **SUPPORTED** — 18 of 20 deliveries incorporated by grounded agents, **0 challenged** |
| H3 activation (primary) | **SUPPORTED**, but only on the reply channel |
| H5a convergence | **REJECTED IN DIRECTION** — dispersion fell *slower* in the talking arms |
| H5b (descriptive) | evaluable at n=2; nothing concluded |
| H6 institution null | **SUPPORTED** by its threshold; §9's table row disagrees (recorded, not amended) |
| H7 identity vs communicativeness | **NEITHER** pre-registered branch |

The mechanism: no sonar agent ever spontaneously initiated in 320 agent-runs of
D and E. The only spontaneous initiator is the minority agent, in all 40 runs.
Cascade depth is 1.000 in every run of every arm — a star around the seed, not
a cascade (A2's wording). D and E differ not in whether the seed initiates
(identical) but in whether the network answers.

## Post-freeze note 2 — two defects found at analysis time

Both implementation gaps against the frozen design, neither a design change;
full detail in §8 of the results report.

1. **`src/evaluator/activation.ts` had 14 passing tests and no call sites.** The
   first confirmatory evaluation computed H3's primary endpoints not at all.
   Unit tests cannot catch a missing call site; two source-level assertions now
   pin the CLI's wiring to the activation and stance-judge layers.
2. **Spontaneous initiation was counted per letter, not per agent.** v0.5 §4.1
   measure 1 says "Agent-level"; measure 2 says "Edge-level"; the code counted
   events for both. This inflated arm D's headline H3 number fourfold (0.500 vs
   0.125) *in the flattering direction*. Same class as amendment A4 — the third
   time in this programme that prose and implementation disagreed about a
   denominator. No verdict moved.

172 tests.

## Data archiving

Raw run artifacts are **not** committed: `runs/s2-arm{A..E}` is 308MB, ten
times P1's volume. The repository carries the derived artifacts per arm
(`society-eval.json`, `activation.json`, `judged-propagation.json`,
`battery-index.json`), from which every number in the results report is
reproducible. The raw artifacts go to Zenodo with their own DOI, as Study 1's
data did. Until that deposit exists **the raw confirmatory data lives on one
machine only** — that is the standing risk to close next.

## Next — the plan from here

**Gate 1 (done).** Detector benchmark: `runs/s2-arm{A,B,D,E}/benchmark.json`.
The shift was detectable in 40 of 40 gravity_shift runs at z ≈ 6–7.5 from
~day 12, from the agents' own measurements, and still detected in 99–100% of
n=2-equivalent downsamples. At n=8 the measurement-policy gap is NEGATIVE in
every arm — their measurement choices beat an ideal fixed reference schedule.
So the ceiling is **an interpretation failure, not a power or data-collection
artefact**, and §9's "undetectable world" rule never fires.

**Gate 2 (open, and the standing risk).** Zenodo deposit of the 308MB of raw
confirmatory artifacts. They exist on one machine. The paper needs the DOI for
its data-availability statement regardless. Derived artifacts (4.2MB) are in
the repo; every number in the results report is reproducible from them.

**Then, in order.**

1. **Literature check** — LLM-agent social epistemics, information cascades in
   agent networks, multi-agent misinformation propagation, agent-based
   social-simulation venues (JASSS and similar). This is a prerequisite for
   the journal question, not an afterthought: novelty cannot be asserted from
   memory, and the framing should be stress-tested against prior work before
   it goes public rather than after.
2. **Combined Study 1 + Study 2 manuscript** (author's route decision pending;
   the alternative is Study 1's pattern of Zenodo preprint + Medium first).
3. **Derivatives from the finished paper:** Medium article at AI Advances,
   LinkedIn post, and `observer-zero.html` on the website
   (`~/Desktop/website/observer-zero.html`, plus `publications.html`).
   Deriving them from the paper rather than writing them first keeps the
   popular framing identical to the defensible one.
4. **Study 3 design.** Three concrete candidates, in order of how directly
   they follow from Study 2:
   - **Persistence vs eloquence.** Haiku's higher reply rate is mostly dosage:
     4.93 letters per recipient against sonnet's 1.81, with a per-letter reply
     probability of 0.161 vs 0.110. Hold letter volume fixed across minority
     models and the two explanations separate.
   - **Composition dose-response** (2/8, 4/8), ladder-ready by design, budget
     already reserved.
   - **Does a chatty peer suppress initiation?** Arm C's one spontaneous sonar
     initiator (Elena) sits against zero in 320 agent-runs of D and E.

## The two headline findings, as they now stand

1. **The ceiling is an interpretation failure.** Agents measured well — better
   than an ideal reference schedule — accumulated z ≈ 7 evidence of a physical
   law change, and 1 of 276 concluded that a law had changed. Neither scale,
   institution, nor a communicating peer moves it.
2. **Communication transmits unsupported claims and little else.** 18 of 20
   minority-origin unsupported claims were incorporated into grounded agents'
   beliefs, none challenged, mostly on the recipients' own citations. Meanwhile
   no grounded agent ever initiated, cascade depth was 1.000 everywhere, the
   public bulletin was used once in ~2,760 agent-days (to ask whether letters
   were being delivered), and dispersion fell *slower* in the talking arms.

The programme's own summary sentence: *a talking society was not a better
epistemic system than a silent one — it was a silent one plus a channel for
unsupported claims.*

## Things that would be easy to get wrong

- **P1's catalysis result is weaker than `p1-findings.md` says.** Read
  `p1-findings-correction.md`. Do not quote the original Finding 2.
- **Never compare raw counts across arms of different n.** Rates only.
- **Spontaneous initiation is AGENT-level** (v0.5 §4.1 measure 1); measure 2 is
  edge-level. Counting letters instead of agents inflated D's headline H3
  number fourfold before it was caught.
- **Cascade reach excludes the seed and divides by n−1** (A4). v0.5's "≥3 of 8"
  gloss is withdrawn.
- **Relaying a claim is not producing one.** Only FIRST_PARTY counts as origin;
  collapsing them makes grounded agents look like fabricators and breaks H2a.
- **E's contamination rate of 0.000 rests on ONE exposure.** It shows sonnet
  produced almost nothing to be contaminated by — NOT that grounded agents
  treat sonnet's claims more sceptically. n=1 cannot support that.
- **A module can be fully tested and never called.** `activation.ts` had 14
  passing tests and no call sites through the entire freeze. Two source-level
  assertions now pin the CLI's wiring; extend them if a new endpoint module
  appears.
- **git from the Cowork sandbox leaves undeletable `.git/*.lock` files.** Do
  git work locally; `find .git -name '*.lock' -delete` if it jams. An editor
  with a stale buffer also once overwrote this file after it was committed —
  recover with `git show HEAD:reports/STATUS.md > reports/STATUS.md`.

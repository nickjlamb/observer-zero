# Study 1 audit: the evidence-citation parsing bug

**Prompted by:** pilot P1-A (2026-08-10), which showed 4 failed belief
reviews in 3 runs where Study 1 averaged 8 in 30.
**Scope:** all 30 runs of `battery-sonar-pro-2026-08-100659`, the sonar-pro
arm of Study 1 (DOI 10.5281/zenodo.21872781).
**Method:** `npm run audit-evidence`, which re-parses the *stored*
completions. No model calls, no cost, no artifact was modified.

**Conclusion: no published Study 1 number changes.** Details below, with the
one case that could have.

---

## 1. The bug

`HypothesisSchema` required `evidenceFor` / `evidenceAgainst` to be arrays of
non-negative integers. sonar-pro routinely writes `"evidenceAgainst": [null]`
to mean "nothing argues against this", and sometimes puts a descriptive
string or an object where an event id belongs (`"resonator_baseline_stable"`,
`{"note": "no comparable drift"}`).

Under the strict schema the **entire belief update** failed validation. The
agent then kept its priors for that day and the loss was recorded in
`failedUpdates` — visible, but still a lost day of reasoning.

This is the same class of failure as the maxTokens truncation found during
Milestone 3, and it is why `failedUpdates` was made a visible counter in the
first place. The counter worked. Nobody had looked at *why* the number was
non-zero for sonar.

## 2. Scale of the loss

| | |
|---|---|
| Belief reviews attempted (sonar battery) | 337 |
| Succeeded | 322 |
| **Failed** | **15 (4.5%), across 11 of 30 runs** |
| Recoverable from stored logs under the fix | **11** |
| Not recoverable (different cause, see §4) | 4 |
| Invalid citations discarded across the 11 | 28 |

Losses were spread across all three scenarios and both agents, with no
pattern suggesting a systematic bias toward any hypothesis class.

## 3. Did it change a result? One case could have

A failed review only matters to a reported number if it was an agent's
**last** review, leaving the final belief state stale. Study 1 scores final
states, so any earlier loss is invisible to the published metrics.

Across 30 runs there was exactly **one** stale final state:
`control-seed1009`, Maya — final state recorded from day 28, run ended day 30.

That is a control world, which is precisely where sonar's headline result
lives (best control calibration, 10/10). So the recovered review was checked
directly:

| | recorded (day 28) | recovered (day 30) |
|---|---|---|
| dominant hypothesis | resonator-specific setup/calibration/readout problem | *same* |
| its probability | 0.57 | 0.58 |
| second | local environmental disturbance 0.14 | *same* 0.13 |
| pLawChange | 0.000 | 0.000 |
| dominant class | instrument_malfunction | instrument_malfunction |

The recovered review is materially identical to the one that was scored.
Maya's summary even states she "kept the question focused on the resonator
anomaly, not the baseline campaign". **Control calibration remains 10/10 and
no other published figure is touched.**

The physics-ceiling result is untouched by construction: it is a
gravity-world finding, and no gravity-world run had a stale final state.

## 4. The four that stayed lost — a different bug

The remaining 4 failures are not citation problems. The completions are not
truncated (they end cleanly), but sonar emitted malformed key-value syntax:

```
"probability=0.1,          instead of        "probability":0.1,
```

Both the original and the repair attempt failed the same way in each case.

**Recommendation: do not repair this with a regex.** Rewriting malformed
model output by pattern-matching risks silently changing what the model
said, which is a far worse failure than losing a review. Two defensible
options, for decision at freeze:

1. Accept it. ~1.2% of reviews lost, honestly recorded in `failedUpdates`,
   and reported as a limitation.
2. Improve the *repair prompt* (not the main prompt) to state the required
   JSON shape explicitly rather than echoing a parser error. This asks the
   model to fix its own output, which is the mechanism already in place —
   it is just under-specified. This is a change to a frozen surface and
   should be made deliberately, before freeze, or not at all.

Option 2 is preferable if made now; after freeze, option 1.

## 5. The fix

Evidence arrays are now parsed leniently: every valid non-negative integer
id is kept, everything else is dropped, and the review survives.

This invents nothing — a `null` or a prose label is not a citable event id
under any reading — and it cannot flatter a provenance score, because
cited-evidence validity is still checked downstream against what the agent
could actually see. Dropping a citation can only *reduce* the cited set.
Leniency is confined to citation arrays: an out-of-range probability or a
missing question still fails, as it should. Four regression tests cover it.

## 6. Disclosure

The published results are unchanged, so no correction to the record is
required. If the repository or a future version note mentions it, the
accurate statement is:

> A schema-validation bug caused 15 of 337 belief reviews (4.5%) in the
> sonar-pro arm to be discarded, because that model emits `null` in
> evidence-citation arrays. Affected agents retained their prior beliefs for
> those days, which was recorded at the time in each run's `failedUpdates`.
> A retrospective audit of the stored completions recovered 11 of the 15 and
> found exactly one case where an agent's final belief state was affected
> (control-seed1009); the recovered review was materially identical to the
> one scored, and no reported figure changes.

The audit is reproducible from the archived dataset:
`npm run audit-evidence -- --dir runs/<battery> --recover`.

## 7. Why this was worth the detour

P1's purpose is to find design failures before they reach confirmatory data.
It found one on its first arm, in code that had already produced a published
paper — and the recovery was possible only because every prompt and
completion is logged verbatim. That logging decision, made for the
leak audit, turned a silent data loss into a checkable one.

The lesson for Study 2 is narrower than "validate more leniently": **a
non-zero `failedUpdates` counter is a finding, not a footnote.** At n=8 the
same 4.5% rate would cost roughly four reviews per run. Worth watching in
every P1 condition, and worth a line in the frozen evaluation checklist.

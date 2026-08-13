# The cut: Observer Zero → 8,000 words for JASSS

**Brief applied:** keep both studies, compress Study 1 heavily. Study 1 is the empirical and
methodological foundation, not a co-equal results section. Preserve task solvability, the epistemic
ceiling, the model-family dissociation, and the zero-communication baseline. Everything else in
Study 1 goes to the supplement or is cited to the Study 1 deposit. Protect the cross-study
comparisons and replications.

Two findings from measuring the draft change what the cut has to be. Both are in §1 and §2 below.

---

## 1. The budget is 34%, not 42% — because 1,692 words are tables

Measured prose against tables, section by section:

| Section | Prose | Tables | Total |
|---|---:|---:|---:|
| Introduction | 833 | 0 | 833 |
| Related work | 1,783 | 0 | 1,783 |
| Meridian environment | 612 | 0 | 612 |
| Experimental validity and confirmatory design | 1,342 | 281 | 1,623 |
| Results | 4,364 | 1,254 | 5,618 |
| Discussion | 1,924 | 0 | 1,924 |
| Limitations | 631 | 0 | 631 |
| Reproducibility and audit trail | 692 | 157 | 849 |
| **Body** | **12,181** | **1,692** | **13,873** |

JASSS does not say what its 5,000–8,000 range counts. The near-universal convention is prose
excluding tables, figure captions and references — and JASSS separately instructs that tables be
supplied *as text* rather than as graphics, which only makes sense if they are not competing with
the word budget. Working to **8,000 words of prose plus ~1,700 in tables**, the cut is 34% of prose
rather than 42% of everything.

This matters for the Study 1 decision specifically. The evidence gradient (Table 5) and the
zero-communication replication (Table 8) are both *tables* carrying Study 1 rows. Under the
proportional reading they were expensive; under this one they are nearly free, and they are exactly
the two places where compressed Study 1 does the most work. If a reviewer or the editor pushes back
on length, the tables are the last thing to cut, not the first.

**Prose budget by section:**

| New section (unnumbered) | From | Prose now | Target | Cut |
|---|---|---:|---:|---:|
| Introduction | §1 | 833 | 700 | −16% |
| Related work | §2 | 1,783 | 850 | −52% |
| The Meridian environment and confirmatory design | §3 + §4 | 1,954 | 1,500 | −23% |
| Results | §5 | 4,364 | 2,900 | −34% |
| Discussion | §6 | 1,924 | 1,000 | −48% |
| Limitations, reproducibility and audit trail | §7 + §8 | 1,323 | 1,050 | −21% |
| | | **12,181** | **8,000** | **−34%** |

---

## 2. One of your four Study 1 results is not in the manuscript

You asked to preserve task solvability — the scripted mock society diagnosing gravity strictly in
10/10 worlds. **It is not in the combined draft.** Arm B0 appears once, as a row in the Study 1 arms
table with a cost of $0, and the scripted mock arm is mentioned twice more in the reproducibility
section, both times as a determinism check ("reproduces bit-identically"). The solvability result
itself is in the Study 1 manuscript at §4 and in `combined-manuscript-outline.md`, which flagged it
for retention:

> "the scripted mock society solving the task 10/10 (Study 1 §4) is still an independent solvability
> argument that uses no detector at all"

It did not survive into the draft. The consequence is that the paper currently offers **two**
independent answers to a reviewer's first objection — *maybe the evidence simply wasn't there* —
where the outline designed three:

1. **Scripted baseline.** Mock society diagnoses gravity strictly in 10/10 worlds, stays quiet in
   7/10 controls, never trips the confabulation detectors. **Uses no detector at all.** ← missing
2. **Detector on own streams, dating** (Study 1 Finding 4). Present, in 5.1.
3. **Detector on own streams, detection** (Study 2). Present, in 5.1.

Arguments 2 and 3 share an instrument. If a referee doubts the change-point detector, both fall
together and the sufficiency claim collapses. Argument 1 is the only one that survives that
objection, and it costs about 80 words.

**So this cut adds it back.** That is the one place where the compressed version should be *stronger*
than the long one.

---

## 3. Results, restructured

Your sketch — establish the failure, stress it socially, synthesise — maps onto three movements. I
have followed it, with one deliberate cost noted at the end.

**Target: 2,900 prose. Study 1 ~590 (20%), Study 2 ~1,860 (64%), synthesis ~450 (16%).**

### Movement 1 — Study 1: establishing the failure (~590 prose)

| Content | Source | Prose | Note |
|---|---|---:|---|
| Task solvability: mock society 10/10, no detector | **new**, from Study 1 §4 | 80 | The missing third argument |
| The ceiling: 0/40 strict, 80 agent-final states, 7.5% bound; instrument-fault worlds diagnosed in up to 70% | 5.2 | 140 | The boundary is specifically at world-level revision — keep that sentence, it is the finding |
| Two routes: haiku generation failure (2/20), sonnet commitment failure (15/20, peak p=0.85) + Figure 3 | 5.2 | 160 | Keep the seed-1009 Ada near-miss; it is the single most vivid thing in the paper |
| Not the prompt prior: B3b ablation, and it had *stronger* evidence | 5.3 | 130 | Compress from 199. Keep the control-world false positive — it is what makes the prior a calibration device rather than a handicap |
| The grounded baseline: sonar 0 letters in 30 runs, 0/60 fabrication at provenance 0.98 | 5.5, 5.9 | 80 | Study 2 *assumes* both. They cannot be a citation |

### Movement 2 — Study 2: stressing the failure socially (~1,860 prose)

Keeps the question headings. This is where the alternative-explanation chain actually earns its
keep, and it is the material with the strongest JASSS fit.

| Subsection | Now | Target | What goes |
|---|---:|---:|---|
| Data quality | 84 | 40 | Already tight; two sentences, rest to Appendix B |
| Was the evidence there? (policy gap, 40/40 detectable, Table 6) | 1,024 | 380 | The baseline-window robustness sweep (Appendix A.5), the detector false-alarm caveat, and the Study 1 comparability caveat move to synthesis or supplement |
| Did they interpret it? (Table 7) | 503 | 170 | Study 1 half moves to movement 1; keep Table 7 and the "no simulation-class hypothesis anywhere" close |
| Did scale solve it? | 76 | 60 | Nearly untouched — it is already one paragraph doing one job |
| Do grounded societies communicate? (Table 8) | 429 | 250 | Keep the 6,880 agent-days figure, the agent-run interval, and the arm C Elena exception. Cut the pilot action-reason forensics to one clause |
| Does a minority create a network? (Tables 9, 10, Figure 4) | 412 | 300 | Keep depth 1.000 and the pre-freeze prediction — that the pilot predicted depth 1 *before* the freeze is the pre-registration working, and a referee will look for exactly that |
| Did it improve convergence? (Table 11) | 267 | 150 | Keep the refusal to pool and the reason. Cut the H5b descriptive paragraph to one sentence |
| What did it transmit? (Table 12) | 384 | 250 | Keep the 745 discarded belief changes — the attribution rule cutting against the finding is the most credible thing in the section |
| Does the minority model matter? (Tables 13, 14) | 721 | 280 | Biggest single cut. Keep McNemar 8-vs-0 p=0.0078 and the dosage decomposition. The unpaired ratio, arm E's single CHALLENGED, and the per-recipient table to supplement |
| Was the institution used? (Table 15) | 450 | 160 | Keep the one bulletin post verbatim — it is a delivery check, and that is the whole finding. Cut the pre-registration conflict to two sentences with the detail in the audit trail |
| Back-dating at *n* = 8? (Table 16) | 707 | 190 | Keep the pooled 123/141 and the conservative-test choice. Both unanticipated observations move to synthesis |
| Observations not promoted | 111 | 60 | Keep the "independent ensemble" tension — it must be presented with the contamination result |

### Movement 3 — cross-study synthesis (~450 prose)

The part that is stronger than either study alone, and the reason not to demote Study 1.

| Content | Prose | Note |
|---|---:|---|
| The evidence gradient: Table 5 + Figure 2, |z| 3.30 → 7.52, detection 7/10 → 10/10, conclusion rate pinned | 180 | Table 5 does most of the work. Keep the "if a threshold exists it lies above every level these societies produced" sentence |
| Three independent zero-communication observations, two scales, with and without an institution | 110 | Table 8 already carries it |
| Fabrication dissociation replicates: Study 1 24/60 · 9/60 · 0/60 → Study 2 19 vs 1 under McNemar | 90 | Independent recurrence in a different design |
| Back-dating replicates (S1 0.79–0.85 → S2 0.872); unconditional commitment does *not* scale-invariantly | 70 | Both directions, honestly |

Plus the comparability caveat — S1 B3a and S2 arm A are the same worlds at 5.00 vs 5.77, so
cross-study L2 confounds measurement policy with prompt version — which belongs here rather than
buried in 5.1, because it is a limitation *of the synthesis*.

### The cost of this structure

The current Results opens by saying it is "reported as questions rather than as H1–H7, so that each
result closes off an alternative explanation for the one before it." Splitting Study 1 out breaks
two links in that chain: *was the prompt prior responsible?* (Study 1's ablation) and *was the
evidence there?* (the gradient) now sit in different movements from the ceiling they explain.

Mitigation: movement 1 ends by stating the ceiling and naming the two explanations it has already
closed off, so movement 2 opens against a live question rather than restarting. If you would rather
keep the twelve-question chain intact and simply starve the Study 1 passages inside it, say so — it
is a different edit, not a harder one, and the chain is a genuine strength.

---

## 4. Everything else

**Related work, 1,783 → 850.** Nine subsections averaging 198 words is a survey. JASSS readers want
positioning. 2.7 (conformity and cascades, 390) carries an argument the paper depends on and should
survive at ~250; the rest collapse into three paragraphs — prior work on evidence non-uptake, on
instrumented discovery worlds, and on LLM agent societies and their validity. 2.9 (what this work
contributes, 84) folds into the introduction.

**Discussion, 1,924 → 1,000.** 6.6 (the alternative reading of the contamination result, 496) is the
one to protect — pre-empting a referee's strongest objection is worth more than the other seven
subsections combined. 6.2 and 6.7 restate results and can go almost entirely.

**Limitations + reproducibility, 1,323 → 1,050.** Both are protected material. The reduction is
compression, not removal: §8.2's three-defect forensics compress to their disclosures with the
autopsy in the repository, and Appendix A.0's H4 disclosure folds in at ~120 words.

**Appendices.** A.1 (frozen hypotheses and verdicts) and A.3 (the pre-registered decision table)
become in-body tables in the design section — referees receive only the PDF and no supplementary
material, so a pre-registration whose evidence sits in an attachment is an assertion. A.2, A.4, A.5
and Appendix B move out cleanly, along with the Study 1 detail displaced by this cut.

---

## 5. What I need before executing

Nothing blocking. Two things to react to if you disagree: the three-movement Results structure over
the twelve-question chain (§3, last block), and the assumption that JASSS's word count is prose
excluding tables (§1). Everything else follows from your brief.

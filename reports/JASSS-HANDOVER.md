# Handover — Observer Zero → JASSS submission

**Written:** 2026-08-12, end of the session that finished the manuscript and deposited the data.
**For:** a fresh chat picking up the JASSS submission.
**Read first:** `reports/STATUS.md` (programme state), then `reports/combined-manuscript-draft.md`
(the paper itself). Nick will supply JASSS's instructions for authors — do not guess them
from what is below.

---

## 1. Where things stand

The research is finished, the paper is written, and both the paper and its data are
published on Zenodo. Nothing about the science is open. The remaining work is
**getting the manuscript into JASSS's required form and submitting it.**

The paper is a combined report of two studies in one programme:

- **Study 1** — two-agent societies. Already published separately (see DOIs below).
- **Study 2** — pre-registered, frozen before any confirmatory data were seen; eight-agent
  societies, five arms, 85 runs, seven hypotheses.

Three findings, in the paper's own framing: agents gather sufficient evidence but do not
interpret it; populations do not spontaneously form epistemic networks; when
communication is externally catalysed, unsupported claims travel and structure does not.

**Length:** ~15,100 words of body text, ~18,200 including both appendices. 43-page A4 PDF.
This is likely the single biggest fit problem with JASSS — check their limit early.

---

## 2. The published record

| What | DOI | Notes |
|---|---|---|
| **This paper, current** | `10.5281/zenodo.21909535` (v2) | The version to cite |
| This paper, all versions | `10.5281/zenodo.21906653` | Concept DOI — always resolves to newest |
| This paper, v1 | `10.5281/zenodo.21906654` | Superseded; had a wrong data DOI (see §8.3 of the paper) |
| **Study 2 raw data** | `10.5281/zenodo.21909255` | Dataset, 12 files, 42.4 MB |
| Study 2 data, all versions | `10.5281/zenodo.21909254` | Concept DOI |
| **Study 1, all versions** | `10.5281/zenodo.21872780` | Concept DOI |
| Study 1, corrected | `10.5281/zenodo.21906936` | v2, carries an erratum |
| Study 1, original | `10.5281/zenodo.21872781` | Pre-erratum; do not cite |
| Code | `github.com/nickjlamb/observer-zero` | Public |

The paper and the dataset point at each other in Zenodo's related-works metadata
(*is supplemented by* / *is supplement to*), each using the other's concept DOI.

---

## 3. Where the files are

Everything is in the connected folder `Observer Zero` (a git repo, clean at commit
`86f11d4`).

| Path | What |
|---|---|
| `reports/combined-manuscript-draft.md` | **The manuscript source.** Markdown. Single source of truth |
| `reports/observer-zero-combined.pdf` | The built PDF, 43pp — identical to what is on Zenodo |
| `reports/figures/fig{1..4}-*.svg` and `.png` | The four figures; SVG is the source, PNG is what the PDF embeds |
| `reports/literature-check.md` | Novelty check, venue comparison table, route recommendation |
| `reports/h4-results.md` | H4 verdict and the scale-invariance observation |
| `reports/detector-robustness-and-study1-l2.md` | Baseline sweep, Study 1 L2 recomputation |
| `reports/uncertainty-addendum.md` | Exact intervals; the paired-vs-unpaired fabrication finding |
| `reports/ERRATUM-2026-08-12.md` | Study 1 erratum, as deposited |
| `reports/STATUS.md` | Programme state, hard rules, budget, freeze discipline |
| `zenodo-upload/` | Staging copies of the deposited data (gitignored) |

---

## 4. What the JASSS submission needs

**Nick will supply the instructions for authors. Follow those, not this list.** The
following are things known to matter, to check against them:

1. **Word limit.** At ~15,100 body words this paper is long. If JASSS imposes a limit, the
   appendices are the obvious relief — Appendix A (frozen design as executed) and Appendix B
   (data quality in full) are ~3,100 words and could become supplementary material, since
   both are also reproducible from the repository. Do not cut §4 (experimental validity and
   confirmatory design) or §8 (reproducibility and audit trail) to make room; they are the
   paper's main methodological contribution and a reviewer will look for them.

2. **Double-anonymous review.** The literature check recorded JASSS as double-anonymous.
   If that is right, an anonymised manuscript is needed: strip the author line, the
   PharmaTools.AI Labs affiliation, the acknowledgments, the AI-assistance disclosure if it
   identifies, and — importantly — the GitHub URL and every Zenodo DOI, all of which name
   him. Self-citations to Study 1 (`[40]`) must be phrased in the third person.
   **Be honest with Nick about the limits of this:** the preprint is public under his name
   with his ORCID, and there is a Medium write-up. Anonymisation will be procedural, not
   effective. That is not a reason to skip it, but he should not be told it works.

3. **JASSS house format.** JASSS publishes in HTML with numbered paragraphs and has its own
   reference style. The manuscript is currently in a generic academic format with numeric
   citations `[1]`–`[40]`. Expect real reformatting work, not a light pass.

4. **Article charge.** Recorded as **unverified**: DOAJ lists up to USD 1,300 / GBP 800 and a
   waiver policy exists, but JASSS's own submission page is blocked by `robots.txt`, so it
   could not be confirmed by search. Earlier in the programme this was wrongly described as
   a mandatory fee and then corrected to voluntary — treat the current figure as unconfirmed
   and get it from the instructions for authors or by email before submitting.

5. **Figures.** Four, all vector SVG with PNG renders. If JASSS wants figures separately or
   at a specific width, regenerate the PNGs rather than upscaling them (see §6).

---

## 5. Open items to resolve before submission

- **Four references cite venues that could not be verified** and are currently given as
  arXiv preprints, which is the safe form: `[6]` (BoxingGym, NeurIPS 2025?), `[9]` (Failing
  to falsify, ICLR 2026?), `[21]` (Proactive agent, ICLR 2025?), `[31]` (Accommodation and
  epistemic vigilance, ACL 2026?). If any has since appeared, upgrade the entry. If not,
  leave as preprints — do not assert a venue that has not been checked.
- **All 14 DOIs in the reference list were verified** against arXiv abstract pages or
  publisher records. If any reference is edited, re-verify that one.
- **Author affiliation is inconsistent across records.** The manuscript says
  "PharmaTools.AI Labs"; both Zenodo records say "Medcopywriter Ltd" (matching his ORCID
  profile, `0009-0009-6266-8499`). Ask which he wants on the journal submission.

---

## 6. Rebuilding the PDF

There is no build script; the pipeline lives in the session. It is:

1. `reports/combined-manuscript-draft.md` → Python `markdown` with extensions
   `['tables', 'attr_list', 'sane_lists']`.
2. **Rewrite figure `src` from `.svg` to `.png`** — WeasyPrint's SVG support is not good
   enough, so the PDF embeds cairosvg renders. Skipping this silently drops all four figures.
3. Wrap the reference list (`<p>[1] …` through the last entry) in `<div class="refs">` for
   the hanging-indent rule.
4. `weasyprint paper.html paper.pdf` with the A4/DejaVu Serif stylesheet.

Sanity check after every build: **43 pages, figures on pages 3, 14, 17, 20.** If the figure
pages are empty, step 2 was skipped.

Figure PNGs are rendered with `cairosvg` at `output_width=2640`.

---

## 7. Traps this programme has already hit

Each of these cost real time. They will recur.

- **`cairosvg` ignores `paint-order`.** Text haloes must be drawn as two elements — the same
  `<text>` with `fill="none"` plus a surface-coloured `stroke`, then again with a normal
  fill. Using `paint-order` renders the halo *over* the glyphs and erases them.
- **Figure typography is sized against a 1200-unit canvas scaled to a 170 mm text block.**
  A 9 px label lands at 3.6 pt on the printed page. All four figures were rescaled for this;
  if you edit one, check the printed size, not the screen size.
- **Automated en-dash conversion breaks identifiers.** A previous pass rewrote
  `claude-haiku-4-5`, `2026-08-12`, Wason `2-4-6` and a DOI, which would have made a
  reference unresolvable. Never run a global hyphen→dash replacement over this manuscript.
- **`git` in the connected folder fails with lock errors**, because this environment cannot
  delete files on his disk. `git` leaves `index.lock` / `HEAD.lock` behind and the next
  command refuses to run. Workaround: `mv` the lock aside, then retry. Tell him to clear the
  accumulated `.git/*stale*` files himself.
- **`device_bash` has no network access.** Anything needing the network runs in the cloud
  container, or in his own terminal.
- **The Chrome `file_upload` tool caps at 10 MB per call** and reads container paths, not
  device paths — stage device files first.
- **An external LLM's citation check produced four confident, wrong "corrections"** —
  invented given names for three references and a superseded title for a fourth. Every one
  was rejected after re-fetching the arXiv pages. Verify citation corrections at the source
  before applying them; it did find one real error, so the checks are worth running, but not
  worth trusting.

---

## 8. How this programme handles being wrong

Worth matching, because reviewers will see it and it is load-bearing for the paper's claims.

Errors are **disclosed, not silently fixed.** §8.2 lists three implementation defects found
at analysis time, including two where a module was written, tested, and never called. §8.3
carries three errata: two arithmetic errors in prior releases and one wrong identifier in
this paper's own v1. Study 1's erratum was issued as a separate deposited document rather
than folded quietly into a new version.

Two errors in this session followed the same pattern and are recorded here for the same
reason: the data DOI in §8.4 of v1 was the paper's own DOI, written in without checking what
record it pointed at, which forced the v2 correction; and the dataset record initially
pointed at the paper's superseded version DOI rather than its concept DOI.

The corresponding discipline on the science side is in `STATUS.md` under the hard rules —
the frozen judge does not move, the design freeze at commit `85bcdfb` (tag `study2-freeze`)
is what makes the pre-registration real, and the analysis commit `587aaf3` is deliberately
later than the freeze. If a reviewer asks for a re-analysis, that distinction is the thing
to protect.

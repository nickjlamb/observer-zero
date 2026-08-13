# Observer Zero → JASSS: requirements, gaps, and the work list

**Written:** 2026-08-12, from the JASSS *How to submit a paper* instructions supplied by Nick,
checked against `reports/combined-manuscript-draft.md` as it stands on disk (114 KB, 18,204 words total).

This supersedes §4 of `JASSS-HANDOVER.md`, which was written before the instructions were available.
Three of its assumptions were wrong or incomplete; those corrections are in §1 below.

**Decisions taken:** cut to ~8,000 words with appendices moved out · Word (.docx) main file ·
PharmaTools.AI Labs affiliation · deposit the model to CoMSES.

---

## 1. Corrections to the handover

**1.1 Review is *blind*, not double-anonymous — and the anonymisation is partly the journal's job.**
JASSS anonymises submissions itself by deleting the author's name and affiliation from the article
text before sending it to referees. What it does *not* do is remove give-aways from the body:
"Any such clues to the referees will normally **not** be altered by the editorial team."

So the stripping job is narrower than the handover assumed but still real, and it is entirely on
us: the GitHub URL, every Zenodo DOI, the AI-assistance disclosure, the acknowledgments, and the
third-person rephrasing of the Study 1 self-citation `[40]`. The author line and affiliation can
stay in the main file — the journal removes them.

An anonymised PDF is "very helpful, but not required." Supply one anyway: JASSS says that if you
provide one, *that* is what referees receive. Otherwise their software converts the Word file, and
their own instructions warn it truncates figures wider than ~600 px. Supplying the PDF means we
control what three referees actually see.

The handover's honesty caveat stands unchanged. The preprint is public under Nick's name with his
ORCID, and there is a Medium post. Anonymisation here is procedural, not effective.

**1.2 The article charge is confirmed, and it is voluntary.**
£800 / €1,000 / $1,300. The wording is "we are asking that you consider supporting JASSS with an
author publication charge" — a request, not a condition of publication. Waivers of up to 100% exist
but are scoped to corresponding authors in World Bank low-income economies and to graduate students
without funds, so neither route applies; the charge being voluntary is the operative fact. Waiver
applications, if ever relevant, go to the editor *after* acceptance. This closes handover item §4.4.

**1.3 The word limit is real, and the manuscript is 1.7× over it.**
"Normally articles are from 5,000 to 8,000 words in length, plus hypertext attachments." Measured
section by section, the body is **13,871 words** (the handover's ~15,100 included the abstract,
references and acknowledgments). Appendices add 3,058. Getting the body to 8,000 is a 42% cut.

---

## 2. The thing that changes the appendix plan

> "Referees will be provided **only** with a PDF version of your paper, and will not be sent any
> supplementary material."

Referees are also asked, as one of five scored questions, whether the model could be replicated by
a reader. Move Appendix A wholesale into a hypertext attachment and the referee answering that
question cannot see the frozen hypotheses, the pre-registered decision table, or the amendment log —
which is to say, they cannot see the evidence for the paper's central methodological claim. The
pre-registration becomes an assertion.

**Recommendation: split Appendix A rather than moving it.**

| Appendix material | Words | Disposition |
|---|---:|---|
| A.1 frozen hypotheses and verdicts | 400 | **Compress into the design section as a table** (~250 w) |
| A.3 pre-registered decision table | 650 | **Compress into the design section as a table** (~300 w) |
| A.0 H4 evaluated late | 383 | **Fold into reproducibility** (~120 w) — this is a disclosure, and disclosure is load-bearing for this paper |
| A.2 executable endpoint definitions | 369 | → attachment / CoMSES |
| A.4 amendment log | 408 | → attachment / CoMSES |
| A.5 detector baseline sensitivity in full | 471 | → attachment / CoMSES |
| Appendix B data quality in full | 332 | → attachment / CoMSES |

That moves ~1,580 words out cleanly and reabsorbs ~670 words of load-bearing material as tables.

---

## 3. The 8,000-word structure

JASSS requires **five or six sections**, each with a heading, **unnumbered** — "Do **not** number the
sections, since any such numbering will be removed as part of the formatting process." The
manuscript currently has eight numbered sections plus two appendices. Paragraph numbers are applied
by the journal and must not be included.

Proposed six-section structure, with the current material mapped onto it:

| New section (unnumbered) | From | Now | Target | Cut |
|---|---|---:|---:|---:|
| Introduction | §1 | 833 | 750 | −10% |
| Related work | §2 | 1,783 | 900 | −50% |
| The Meridian environment and confirmatory design | §3 + §4 + A.1/A.3 tables | 2,235 | 2,000 | −11% |
| Results | §5 | 5,618 | 2,600 | −54% |
| Discussion | §6 | 1,924 | 1,000 | −48% |
| Limitations, reproducibility and audit trail | §7 + §8 + A.0 | 1,478 | 1,100 | −27% |
| | | **13,871** | **8,350** | **−40%** |

Two notes on where the cuts fall.

**Results is where the money is.** Twelve subsections at 5,618 words must become roughly six at
2,600. The four heaviest are 5.1 (1,024), 5.9 (721), 5.11 (707) and 5.2 (503) — 3,000 words between
them. 5.9 (does the model in the communicative role matter) and 5.11 (early onset back-dating at
*n* = 8) are the two most compressible: both are secondary to the three headline findings and both
have full detail in the repository.

**Related work halves without loss.** Nine subsections averaging 198 words each is a literature
review; JASSS readers want the positioning, not the survey. 2.7 (conformity and cascades, 390 w) is
the only one carrying an argument the paper depends on.

`§4` and `§8` are protected per the handover and stay close to full length — they are the
methodological contribution and the reason a JASSS referee should care.

---

## 4. Reference conversion — larger than the handover estimated

The reference list is currently 40 entries in numeric Vancouver style, with author lists truncated
to "first three names followed by *et al.*". JASSS requires **APA, modified to omit the comma
between author and date in in-text citations**, alphabetical, with the first author's surname in
capitals.

```
Current:  [16] Ashery AF, Aiello LM, Baronchelli A. Emergent social conventions
          and collective bias in LLM populations. Science Advances.
          2025;11(20):eadu9368. doi:10.1126/sciadv.adu9368.

JASSS:    ASHERY, A. F., Aiello, L. M. & Baronchelli, A. (2025). Emergent social
          conventions and collective bias in LLM populations. Science Advances,
          11(20), eadu9368.
```

Five things this implies that the handover did not flag:

1. **Full author lists must be transcribed.** APA does not use "et al." in reference lists until 21
   authors. Roughly 25 of the 40 entries are currently truncated, so ~25 author lists need
   recovering from arXiv or the publisher record. Given the programme's history with an external
   LLM inventing given names for three references, this must be done by fetching each source page,
   not by asking a model to expand the names.
2. **DOIs come out.** "Recent *JASSS* reference lists have DOIs appended... This is done as part of
   the journal's editorial process: authors do not need to include them in a submitted article."
   Keep the verified DOI list separately for the eventual proof check.
3. **In-text citations change shape, not just format.** `[1]` → `(Ríos-García et al. 2026)`, and
   where an author is named in the text, `Zollman (2007)`. No comma before the date. Multiple
   citations semicolon-separated.
4. **The list has zero JASSS citations.** The instructions open the section with "You are encouraged
   to cite other articles published in JASSS, to help locate your contribution in relation to
   others in the journal." A paper on agent societies and scientific reasoning submitting to JASSS
   with no JASSS references reads as unfamiliar with the venue. *Modeling Scientists as Agents* and
   *An Agent-Based Model of MySide Bias in Scientific Debates* are both in the archive and both
   plausibly relevant. Worth two hours in their search.
5. **Web references need archiving first.** JASSS asks that cited web material be saved to
   `https://web.archive.org/save` and the archived URL cited. This applies to the GitHub repo and
   the CoMSES release page; Zenodo records carry DOIs and are explicitly exempt.

The four unverified venue claims from the handover (`[6]`, `[9]`, `[21]`, `[31]`) and the
UNVERIFIED `[30]` from project memory still need resolving, and the same rule applies: verify at
the source, do not accept a model's correction.

---

## 5. Everything else, as a checklist

**Format**

- [ ] Main file as Word `.doc`/`.docx`, not "Save as Web Page" output
- [ ] No bookmarks, internal hyperlinks, cross-references, or table of contents — JASSS strips these
- [ ] **74 `§n` cross-references must be rewritten as prose** ("as described in the Results") — sections are unnumbered, so `§4` will not resolve
- [ ] Section headings visually distinct from sub-section headings
- [ ] Tables as text, not images — there are 182 table rows in the manuscript, all currently markdown

**Figures**

- [ ] Four figures embedded in place in the Word file *and* supplied separately as PNGs
- [ ] Re-render between **400 and 800 px** in both dimensions — current PNGs are 2,640 px wide
- [ ] No captions baked into the images
- [ ] Package the four PNGs into one `.zip`
- [ ] Watch the two known cairosvg traps: `paint-order` is ignored (haloes need the two-element
      workaround) and figure typography was tuned for a 1200-unit canvas at 170 mm print width —
      at 800 px the target is a screen, so check legibility at actual size, not the print calculation

**Maths** — clean. The manuscript uses only π and σ, both of which JASSS explicitly permits, and no
characters with a bar or tilde above. Nothing needs to become an image.

**Abstract and keywords**

- [ ] Abstract is 318 words; the limit is 200–300. Trim ~60. It correctly contains no citations
- [ ] 3–6 keywords, preferably drawn from the JASSS keyword index. Current five (LLM agents · social
      epistemics · multi-agent simulation · belief revision · misinformation propagation) are
      sensible but should be checked against the index — keywords are used to select referees, so
      this choice picks the reviewers

**Submission package** (their checklist, verbatim in effect)

- [ ] Main file with all figures and tables in final positions
- [ ] Anonymised version, preferably PDF
- [ ] Figures as separate PNGs in one zip
- [ ] Name, affiliation, postal address, electronic address, home page
- [ ] Biography of about 100 words — needs writing
- [ ] Declaration that the work is not and will not be duplicated in another journal or book

**Route** — web form at `http://www.epress.ac.uk/JASSS/webforms/author.php`. Email to
`JASSS@jasss.org` is possible but discouraged. Acknowledgement of receipt within a few days;
editor's verdict about eight weeks. Published in the next issue after acceptance (issues close end
of January, March, June, October).

---

## 6. Two risks worth naming before starting

**6.1 The Study 1 overlap.** JASSS requires a declaration that the submission is not duplicated
elsewhere, and adds: "consideration will be given to the extent of overlaps in the scientific
content, not just the literal wording." The Zenodo preprint of *this* paper is unambiguously fine —
JASSS treats preprint servers and personal deposits as non-publication, and Zenodo assigns DOIs, not
ISSNs. Study 1 is the less obvious case: it is separately deposited and carries an erratum, and the
combined manuscript reports it as one of two studies.

This is an argument for a structural choice the word budget is pushing toward anyway. If the JASSS
paper is framed as **Study 2, with Study 1 as cited prior work**, the overlap question disappears,
the 42% cut becomes far more achievable, and the evidence-gradient argument — which needs Study 1's
numbers but not Study 1's narrative — survives as a three-sentence recap plus a figure. Worth
deciding before any cutting begins, because it changes what gets cut.

**6.2 CoMSES timing.** The deposit needs affiliate or full CoMSES membership and a documentation
review before a permanent handle is minted, and the release URL should appear in the manuscript
(`https://www.comses.net/codebases/NNNN/releases/1.0.0/` in their example). Access can be restricted
to reviewers pre-publication. Start this early — it gates a URL that has to be in the submitted text,
and it directly answers the referee question about replicability that the appendix cut otherwise
weakens.

---

## 7. Open question

The affiliation is now **PharmaTools.AI Labs** by decision, but both Zenodo records and the ORCID
profile (`0009-0009-6266-8499`) say Medcopywriter Ltd. Nothing forbids this — ORCID affiliation is
not binding on a journal submission — but the published record will disagree with itself. Either
update the Zenodo metadata to match, or accept the divergence knowingly. Worth thirty seconds now
rather than a query from a copy-editor later.

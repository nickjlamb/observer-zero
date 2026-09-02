# Handover — Observer Zero → updating `observer-zero.html`

**Written:** 2026-08-13, at the end of the session that cut the manuscript for JASSS, converted
its references, built the submission package, submitted it, and deposited the model to CoMSES.
**For:** a fresh chat updating the website.
**Supersedes:** nothing. Sits alongside `reports/JASSS-HANDOVER.md`, which is now history.

> **Correction (2026-09-02):** the journal-status claims in §2 are out of date. The
> 2026-08-13 JASSS submission described below is no longer active; the manuscript —
> since combined with Study 1 and reframed — is in peer review, and per repo policy
> (`daff318`) the venue is not named in repo docs until there is a decision. The
> JASSS-specific instructions below (referee links, "verdict early October", the open
> editor question in the FAQ) no longer apply.

---

## 1. The folders are already connected

Both are attached to the session as of 2026-08-13:

- **`/Users/NickLamb/Desktop/website`** — the site. `observer-zero.html` is 33 KB, last touched
  2026-08-12. `publications.html` is 28 KB, touched 2026-08-13 (more recently than the Observer
  Zero page, so check what is already there before assuming it is stale).
- **`/Users/NickLamb/Observer Zero`** — the manuscript, figures and deposit material.

The site is flat HTML, one file per page, with shared `header.html` / `header-new.html` and a
`footer/` directory. Sibling pages worth reading for house style and structure before writing
anything: `labs.html`, `opengate.html`, `redacta.html`, `home-new.html`. Note there are `-new`
and `.min` variants of some pages — establish which file is actually deployed before editing, as
`home-new.html` and `header-new.html` suggest a redesign that may or may not have shipped.

There is a `_to_delete/` directory, which is where this environment moves files it is asked to
delete — it cannot remove them itself.

## 2. What changed since the page was last written

**The manuscript was submitted to JASSS on 2026-08-13.** Verdict expected around early October.
It is under anonymous review, but the anonymisation is procedural only — the preprint is public
under Nick's name — so nothing about the website needs to hide.

**The model is published in the CoMSES Computational Model Library**, and peer review has been
requested. That is new and worth surfacing on the page: it is the thing that makes the model a
citable artifact independent of the paper.

**The combined two-study paper exists.** Previously the site described Study 1 only. The paper
now reports both studies with a cross-study synthesis, and its central argument is different
from Study 1's.

---

## 3. Identifiers — use these, and only these

| What | Use |
|---|---|
| CoMSES model release | `https://www.comses.net/codebases/f5ff1550-0393-4505-a4d8-96b779944a8d/releases/1.0.0/` |
| Combined paper (current) | `10.5281/zenodo.21909535` — concept `10.5281/zenodo.21906653` |
| Study 2 raw data | `10.5281/zenodo.21909255` — concept `10.5281/zenodo.21909254` |
| Study 1 (cite this) | `10.5281/zenodo.21872780` — concept, resolves to corrected v2 |
| Study 1 corrected v2 | `10.5281/zenodo.21906936` |
| Code | `github.com/nickjlamb/observer-zero` |

**Two poisoned identifiers. Do not put either on the site:**

- `10.5281/zenodo.21872781` — Study 1 **version 1**, before the erratum. The repo's own
  `CITATION.cff` still points at this; that is a known bug, not a signal to copy.
- `10.5281/zenodo.21906654` — the combined paper's **version 1**, which itself contained a wrong
  data DOI and was superseded.

CoMSES has **no DataCite DOI yet** — peer review mints it. Until then the release URL above is
the citable form. Do not invent a DOI for it.

---

## 4. What the page should now say

The paper's three findings, in its own framing:

1. **Agents gather sufficient evidence but do not interpret it.**
2. **Populations do not spontaneously form epistemic networks.**
3. **When communication is externally catalysed, unsupported claims travel and structure does not.**

Closing line from the abstract, which is the sharpest summary the programme has produced:
*a talking society was not a better epistemic system than a silent one; it was a silent one plus
a channel.*

**Numbers that are safe to use:**

- 235 seeded, manifest-frozen runs across two studies; Study 2 pre-registered and frozen before
  any confirmatory data were seen
- A scripted, non-LLM society solves the task in **10 of 10** worlds — task solvability
  established without any detector
- The evidence gradient: |z| **3.30 → 7.52** across nine conditions, detection **7 of 10 → 10 of
  10 runs**, while the law-change conclusion rate never leaves the floor
- **1 agent of 276** in Study 2 concluded a physical law had changed — none of Study 1's 80
- **6,880 agent-days** of voluntary communication opportunity, **zero** voluntary communications
- Cascade depth exactly **1.000** in every run of every arm — a star, not a cascade
- **18 of 20** unsupported claims incorporated into grounded agents' beliefs, **0** challenged
- **123 of 141** dated onsets fall before the true onset (87.2%)
- Fabrication under controlled substitution: **19 claims versus 1**, McNemar p = 0.0078

---

## 5. Claim-scoping rules. These are load-bearing; do not soften them for web copy

The temptation on a website is to round up. Each of these was fought for in the manuscript and
several were narrowed *after* review caught an overreach.

- **Lead fabrication with the raw counts (19 vs 1) and the paired McNemar test.** Not the
  per-letter ratio — its confidence interval includes 1, so "a factor of four" is not defensible.
- **Arm E's contamination rate of 0.000 rests on a single exposure.** It shows sonnet gave the
  network almost nothing to be contaminated by. It does not show grounded agents are more
  sceptical of sonnet.
- **Never assert that errors amplify through agent chains.** Nothing here propagated far enough
  to amplify, and the opposite — attenuation — is what the literature reports.
- **Never claim LLMs are conservative Bayesian updaters.** Larger models are *more* Bayes-coherent,
  not less. The paper explicitly disclaims this reading.
- **Do not call L1 "ideal."** It is a fixed reference schedule over every instrument at six trials
  daily. The societies beating it is a stronger statement said plainly.
- **Depth 1.000 was predicted from the pilot before the freeze**, not discovered afterwards. That
  ordering is the point.
- **"No grounded agent ever initiated" is scoped to the mixed-composition arms.** Arm C has one
  spontaneous initiator, reported rather than smoothed. Keep the scope.
- **The cross-study evidence gradient confounds measurement policy with prompt version.** Study
  1's B3a and Study 2's arm A are the same worlds and differ (5.00 vs 5.77). Do not present the
  gradient as a clean manipulation.
- **Do not lead with "AI agents ignore evidence."** That is already published at larger scale
  (Ríos-García et al. 2026, 25,000+ runs, 68% non-uptake). The contribution is *where in the
  pipeline* it fails, and how much evidence was present when it went unused.

---

## 6. Copy style

**The site uses en dashes, not em dashes.** The manuscript is full of em dashes. Copy-pasting
manuscript prose onto the page without converting will break the house style — this is a recorded
preference, not a guess.

**Never run a global hyphen-to-dash replacement over any of this material.** A previous pass
rewrote `claude-haiku-4-5`, `2026-08-12`, Wason `2-4-6` and a DOI, which would have made a
reference unresolvable.

---

## 7. Environment traps, all hit for real in this session

- **`zip` fails on the connected-folder mount.** It cannot do the rename it uses for its temp
  file, and leaves a **0-byte archive** that a naive check reads as success. Use `tar -czf` on the
  device, then stage and re-zip in the session if a zip is what's needed.
- **`git` in the connected folder fails with lock errors** — the environment cannot delete files
  on disk, so `index.lock` is left behind. `mv` the lock aside and retry.
- **`device_bash` has no network.** Anything needing the network runs in the cloud container.
- **A regex keyed on lines starting with `**` will mis-fire on wrapped lines** where mid-sentence
  emphasis lands at a line start. It severed a sentence in the manuscript before being caught.
  After any bulk formatting pass, audit for headings preceded by an unterminated line.

---

## 8. Loose ends, none of them blocking the website

- **`reports/STATUS.md` is stale.** It still says Study 2 is frozen with the confirmatory phase
  not started. Study 2 is complete, analysed, written up and submitted.
- **`CITATION.cff` cites the wrong Study 1 version** (see §3). A corrected file sits at
  `comses-deposit/CITATION.cff.corrected` and has not been applied to the repo.
- **"PharmaTools.AI Labs" survives** in `CITATION.cff`, `package.json`, `LICENSE` and `README.md`.
  Nick dropped "Labs" on 2026-08-13; the manuscript says "PharmaTools.AI". The site should match.
- **`package.json` has no `engines` field** — the likeliest thing a CoMSES reviewer asks for.
- **Five untracked paths in the repo**: `comses-deposit/`, `reports/submission/`,
  `reports/observer-zero-jasss.md`, `reports/JASSS-CUT-PLAN.md`, `reports/JASSS-SUBMISSION-PLAN.md`.
- **The biography draft** at `reports/submission/BIOGRAPHY.md` was never corrected.
- **An open question sits with the JASSS editor**: whether text inside tables counts toward their
  5,000–8,000 word range. Their guidance is silent and their submission pages are unreachable. If
  the editor answers, it may prompt a further cut.

---

## 9. Where things are

| Path | What |
|---|---|
| `~/Desktop/website/observer-zero.html` | **The page to update** — 33 KB |
| `~/Desktop/website/publications.html` | Also references the programme — 28 KB, edited more recently |
| `~/Desktop/website/labs.html`, `opengate.html`, `redacta.html` | Read for house style before writing |
| `Observer Zero/reports/submission/main.md` | **Authoritative manuscript source** — not `observer-zero-jasss.md`, which predates the URL restorations |
| `Observer Zero/reports/submission/` | Word main file, anonymised PDF, figure zip, biography draft |
| `Observer Zero/reports/figures/fig{1..4}-*.svg` | The four figures; SVG is the source |
| `Observer Zero/comses-deposit/` | Deposit archives, ODD documentation, form field answers |

Figures re-render for the web with `cairosvg` at `output_width=800`; they are legible at that
size, which was checked visually rather than calculated. None of the four uses `paint-order`, so
the halo trap recorded in the old handover does not apply to them.

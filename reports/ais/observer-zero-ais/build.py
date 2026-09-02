#!/usr/bin/env python3
"""Build the JAAMAS manuscript from the JASSS source.

Differences from the TMLR build: de-anonymised, no length compression (no appendix
moves), MAS-forward front matter, numbered [n] citations, Statements and
Declarations before the references."""
import re, pathlib

SRC = pathlib.Path("/mnt/user-data/uploads/Observer Zero/reports/observer-zero-jasss.md")
OUT = pathlib.Path("/home/claude/jaamas/observer-zero-jaamas.md")

src = SRC.read_text()

# ---------------------------------------------------------------- split
ref_i = src.index("## References")
body = src[src.index("## Related work"):ref_i]
refs_raw = src[ref_i:]

# ---------------------------------------------------------------- parse references
entries = []  # (surname, year, recased_entry)
for para in refs_raw.split("\n\n"):
    para = para.strip()
    m = re.match(r"^([A-ZÀ-ÿ'’\-]{2,}),", para)
    if not m:
        continue
    surname_caps = m.group(1)
    ym = re.search(r"\((\d{4})\)", para)
    assert ym, para[:60]
    year = ym.group(1)
    entry = re.sub(r"^([A-ZÀ-ÿ'’\-]{2,})(?=,)", lambda mm: mm.group(1).title(), para)
    entry = entry.replace("Gx-Chen", "GX-Chen").replace("O'connor", "O'Connor")
    entry = " ".join(entry.split())
    entries.append((entry.split(",")[0], year, entry))
assert len(entries) == 40, len(entries)

nummap = {}
for i, (s, y, e) in enumerate(entries, 1):
    key = (s.lower(), y)
    assert key not in nummap, key
    nummap[key] = i

def lookup(name_part, year):
    surname = re.split(r"[ ,]", name_part.strip())[0]
    for poss in ("'s", "\u2019s"):
        if surname.endswith(poss):
            surname = surname[: -len(poss)]
    key = (surname.lower(), year)
    assert key in nummap, (name_part, year)
    return nummap[key]

# ---------------------------------------------------------------- narrative citations
# "Ríos-García et al. (2026)", "Hu and Qu (2026)", "Luo et al.\n(2025)", "Park et al.'s (2023)"
def narrative(m):
    name, poss, year = m.group(1), m.group(2) or "", m.group(3)
    n = lookup(name, year)
    return f"{name}{poss} [{n}]"

body = re.sub(
    r"([A-ZÀ-ÿ][\w'’\-]+(?:-[A-ZÀ-ÿ][\w'’]+)?(?: et al\.| and [A-ZÀ-ÿ][\w'’]+)?)('s)?\s+\((\d{4})\)",
    narrative, body)

# possessive smoothing
body = body.replace("grown from Park et al.'s [", "grown from the sandbox of Park et al. [")
body = body.replace("] sandbox through grounded frameworks", "] through grounded frameworks")

# ---------------------------------------------------------------- parenthetical citations
def parenthetical(m):
    inner = m.group(1)
    nums, page = [], ""
    for seg in inner.split("; "):
        sm = re.match(r"^(.*?)\s+(\d{4})([a-z]?)(?:, (p\.\d+))?$", seg.strip())
        assert sm, seg
        nums.append(lookup(sm.group(1), sm.group(2)))
        if sm.group(4):
            page = ", " + sm.group(4).replace("p.", "p. ")
    return "[" + ", ".join(str(n) for n in sorted(nums)) + page + "]"

CITE = re.compile(
    r"\(((?:[A-ZÀ-ÿ][\w'’\-&.\s]*?\s\d{4}[a-z]?(?:, p\.\d+)?)(?:;\s[A-ZÀ-ÿ][\w'’\-&.\s]*?\s\d{4}[a-z]?)*)\)")
body, ncit = CITE.subn(parenthetical, body)
assert ncit >= 25, ncit
leftover = re.findall(r"\([A-Z][^()]*\b(?:19|20)\d\d[^()]*\)", body)
leftover = [l for l in leftover if "fig" not in l.lower()]
assert not leftover, leftover

# ---------------------------------------------------------------- numeric errata + cleanup
FIXES = [
    (r"6,880 agent-days", "7,680 agent-days", 1),
    (r"The shift was detectable in 40 of 40\s+Study 2 gravity_shift runs",
     "The shift was detectable in 42 of 42\nStudy 2 gravity_shift runs", 1),
    (r"detectable in 40 of 40 gravity_shift runs",
     "detectable in 42 of 42 gravity_shift runs", 1),
    (r"Cascade depth is exactly 1\.000 in every scenario of every arm\.",
     "Cascade depth is exactly 1.000 in every scenario of both catalysed arms, and arm B\n"
     "produced no letters to have a depth at all.", 1),
    (r"cascade depth was exactly 1\.000 in every\s+run of every arm",
     "cascade depth was exactly 1.000 in every run of both catalysed arms", 0),
    (r"Reading is role-contingent: 190\s+of the 190 reads are the journalist's, bar four\.",
     "Reading is role-contingent: 167 of the\n190 reads are the journalist's.", 1),
    (r"the only bulletin reader being the journalist",
     "the bulletin being read overwhelmingly by the journalist", 1),
    (r"that rate is reported as the detector's own error rate",
     "that rate bounds the detector's own error rate by construction, and the measured\n"
     "false-alarm floor is reported under measurement limitations below", 1),
    (r"the stale-final-state\s+rate was 0 of 640 agent-runs",
     "the stale-final-state\nrate was zero in every arm", 1),
    (r"so across roughly 2,760 agent-days of bulletin availability the public\s+record was used exactly once",
     "so across every bulletin-equipped run of the pilot and Study 2 the public\nrecord was written to exactly once", 1),
    (r"is 11/20 exactly \.", "is 11/20 exactly.", 1),
    (r"three independent times ,", "three independent times,", 1),
    (r"the full table is in\s+the supplementary material\.",
     "the full table is included in the deposited run artifacts.", 1),
    (r"Full definitions are in the supplementary\s+material\.",
     "Full definitions are included in the deposited run artifacts.", 1),
]
for pat, rep, req in FIXES:
    body, n = re.subn(pat, rep, body)
    if req:
        assert n >= 1, pat

# de-duplicate: this sentence also appears in the Code availability declaration
a_dup = ("World randomness is fully seeded and order-\nindependent, the scripted mock arm reproduces bit-identically, and the full battery\n"
         "pipeline is runnable at zero cost through the mock provider, so the evaluation layer can\n"
         "be exercised end-to-end without inference spend.")
b_dup = "World randomness is fully seeded and order-independent, and the scripted mock arm\nreproduces bit-identically (see Code availability)."
assert a_dup in body, "artifact dup sentence not found"
body = body.replace(a_dup, b_dup)

# ---------------------------------------------------------------- discussion reorder
disc_i = body.index("## Discussion")
lim_i = body.index("## Limitations, reproducibility and audit trail")
disc, rest, head = body[disc_i:lim_i], body[lim_i:], body[:disc_i]
subs = re.split(r"(?m)^(### .*)$", disc)
pairs = [(subs[k], subs[k + 1]) for k in range(1, len(subs), 2)]
impl = [p for p in pairs if "Implications for deployed" in p[0]]
others = [p for p in pairs if "Implications for deployed" not in p[0]]
assert len(impl) == 1
body = head + subs[0] + "".join(h + t for h, t in impl + others) + rest
body = body.replace(
    "\n---\n\n### Communication capacity does not produce collective epistemic competence",
    "\n### Communication capacity does not produce collective epistemic competence")

# ---------------------------------------------------------------- data availability -> concrete
old_da = body[body.index("### Data availability"):]
end_da = old_da.index("---")
body = body.replace(old_da[:end_da], "")

# ---------------------------------------------------------------- front matter
front = pathlib.Path("/home/claude/jaamas/frontmatter.md").read_text()
for tok, sn, yr in [("{{Lamb2026}}", "Lamb", "2026"), ("{{Rios2026}}", "Ríos-García", "2026"),
                    ("{{Jamshidi2026}}", "Jamshidi", "2026")]:
    front = front.replace(tok, str(nummap[(sn.lower(), yr)]))
assert "{{" not in front

decls = pathlib.Path("/home/claude/jaamas/declarations.md").read_text()

# ---------------------------------------------------------------- references, numbered
ref_lines = "\n\n".join(f"[{i}] {e}" for i, (_, _, e) in enumerate(entries, 1))
lamb_doi = "Lamb, N. (2026). Observer Zero: Autonomous LLM scientists detect changes to their world but fail to conclude that it changed. Zenodo."
assert lamb_doi in ref_lines
ref_lines = ref_lines.replace(lamb_doi, lamb_doi[:-1] + ". https://doi.org/10.5281/zenodo.21872780")

out = (front.rstrip() + "\n\n---\n\n" + body.rstrip() + "\n\n---\n\n" + decls.rstrip()
       + "\n\n---\n\n## References\n\n" + ref_lines + "\n")
out = re.sub(r"(?<=[a-zA-Z])-\n(?=[a-z])", "-", out)
OUT.write_text(out)
main = out[:out.index("## References")]
print("wrote", OUT, "| total words:", len(out.split()),
      "| main words:", len(re.sub(r"\|[^\n]*\n", "", main).split()))

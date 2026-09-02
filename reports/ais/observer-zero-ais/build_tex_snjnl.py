#!/usr/bin/env python3
"""JAAMAS markdown -> LaTeX (article class, Springer-conformant, sn-jnl-swappable)."""
import re, subprocess, pathlib

ROOT = pathlib.Path("/home/claude/jaamas")
md = (ROOT / "observer-zero-jaamas.md").read_text()

# ---- pull out title block -----------------------------------------------------
title = re.search(r"^# (.+)$", md, re.M).group(1)
abst = re.search(r"^## Abstract\n\n(.*?)\n\n## Introduction", md, re.S | re.M).group(1)
kw = re.search(r"\*\*Keywords:\*\* (.+)$", md, re.M).group(1)
keywords = ", ".join(k.strip() for k in kw.split("·"))
md = md[md.index("## Introduction"):]

# ---- figures ------------------------------------------------------------------
md = re.sub(r"(?<!\n)(!\[Figure)", r"\n\n\1", md)

def figure(m):
    path, n, cap = m.group(2), m.group(3), m.group(4)
    cap = " ".join(cap.split())
    return ("```{=latex}\n\\begin{figure}[t]\n\\begin{center}\n"
            f"\\includegraphics[width=0.98\\linewidth]{{{path}}}\n"
            f"\\end{{center}}\n\\caption{{{cap}}}\n\\label{{fig:{n}}}\n\\end{{figure}}\n```\n")

md = re.sub(r"!\[Figure (\d)\]\(([^)]+)\)\s*\n\n\*\*Figure (\d)\.\*\* ((?:.+\n)+?)\n", figure, md)

# ---- tables: caption + proportional p-columns ---------------------------------
def table(m):
    cap, tbl = m.group(1), m.group(2)
    cap = " ".join(cap.split())
    cap = re.sub(r"^\*\*Table \d+ — ", "**", cap)
    cap = re.sub(r"^\*\*Table \d+\*\*, ", "**", cap)
    cap = cap.replace("****", "").strip()
    if cap.startswith("**") and "**" not in cap[2:]:
        cap = cap[2:]
    rows = tbl.rstrip("\n").split("\n")
    ncol = len(rows[1].split("|")) - 2
    widths = [0] * ncol
    for r in rows[:1] + rows[2:]:
        for j, c in enumerate(r.split("|")[1:-1][:ncol]):
            widths[j] = max(widths[j], len(c.strip()))
    total = sum(widths) or 1
    rows[1] = "|" + "|".join("-" * max(3, round(w / total * 110)) for w in widths) + "|"
    return "\n".join(rows) + "\n\n: " + cap + "\n\n"

md = re.sub(r"(?m)^(\*\*Table \d+[^\n]*)\n\n((?:\|[^\n]*\n)+)", table, md)

# ---- references: hanging list ------------------------------------------------
ref_i = md.index("## References")
refs = md[ref_i + len("## References"):].strip()
md = md[:ref_i]

frag = subprocess.run(
    ["pandoc", "-f", "markdown+raw_attribute", "-t", "latex",
     "--shift-heading-level-by=-1", "--wrap=preserve"],
    input=md, capture_output=True, text=True, check=True).stdout

refs_tex = subprocess.run(
    ["pandoc", "-f", "markdown", "-t", "latex", "--wrap=preserve"],
    input=refs, capture_output=True, text=True, check=True).stdout.strip()
refs_tex = re.sub(r"(?m)^\{?\[(\d+)\]\}?", r"\\bibitemx{\1}", refs_tex)

abst_tex = subprocess.run(
    ["pandoc", "-f", "markdown", "-t", "latex", "--wrap=preserve"],
    input=abst, capture_output=True, text=True, check=True).stdout.strip()

frag = frag.replace("\\section{Statements and Declarations}",
                    "\\section*{Statements and Declarations}")

preamble = r"""\documentclass[pdflatex,sn-basic]{sn-jnl}
%% Autonomous Intelligent Systems (Springer) submission.
\usepackage{graphicx}
\usepackage{longtable,booktabs,array,calc}
\usepackage{etoolbox}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage{textcomp}
\DeclareUnicodeCharacter{2212}{\ensuremath{-}}
\DeclareUnicodeCharacter{2192}{\ensuremath{\rightarrow}}
\DeclareUnicodeCharacter{2194}{\ensuremath{\leftrightarrow}}
\DeclareUnicodeCharacter{2248}{\ensuremath{\approx}}
\DeclareUnicodeCharacter{2265}{\ensuremath{\geq}}
\DeclareUnicodeCharacter{2264}{\ensuremath{\leq}}
\DeclareUnicodeCharacter{221A}{\ensuremath{\sqrt{\,}}}
\DeclareUnicodeCharacter{03C0}{\ensuremath{\pi}}
\DeclareUnicodeCharacter{2032}{\ensuremath{'}}
\DeclareUnicodeCharacter{2070}{\ensuremath{^{0}}}
\DeclareUnicodeCharacter{2074}{\ensuremath{^{4}}}
\DeclareUnicodeCharacter{207B}{\ensuremath{^{-}}}
\DeclareUnicodeCharacter{00B7}{\ensuremath{\cdot}}
\AtBeginEnvironment{longtable}{\footnotesize}
\providecommand{\tightlist}{\setlength{\itemsep}{0pt}\setlength{\parskip}{0pt}}
\setlength{\LTcapwidth}{\linewidth}
\setlength{\emergencystretch}{3em}
\newcommand{\bibitemx}[1]{\par\noindent\hangindent=1.5em\makebox[2.2em][l]{[#1]}}

\title[Evidence Without Conclusion]{TITLE}

\author*[1]{\fnm{Nick} \sur{Lamb}}\email{nick@pharmatools.ai}
\affil*[1]{\orgname{Independent Researcher}, \orgaddress{\city{Oxford}, \country{United Kingdom}}}

\abstract{ABSTRACT}

\keywords{KEYWORDS}

\begin{document}
\maketitle

BODY

\section*{References}
\begingroup\small
REFS
\endgroup

\end{document}
"""
tex = (preamble.replace("TITLE", title)
       .replace("ABSTRACT", abst_tex)
       .replace("KEYWORDS", keywords)
       .replace("BODY", frag)
       .replace("REFS", refs_tex))
(ROOT / "main-snjnl.tex").write_text(tex)
print("ok", len(tex))

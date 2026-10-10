#!/usr/bin/env python3
"""Post-hoc duplication-description screen (Study 3, NMI manuscript).

QUESTION. How many included treatment runs (W-D-exact, confirmatory contrast
battery) end on a final modal hypothesis that describes the manipulation's
actual mechanism — the lagged duplication of one instrument's data stream in
the other — rather than a generic calibration, environmental or statistical
account?

PROCEDURE (two stages, both published; labelled post hoc, gates nothing).

Stage 1 — mechanical screen. A regex over the final modal hypothesis's
label + rationale flags candidate duplication wording. The screen is noisy
in both directions (e.g. the workbench's "self-echo" statistic matches
"echo"; "records computed directly from the pendulum stream" matches
nothing), so it serves as a first pass only.

Stage 2 — author adjudication of ALL 38 runs against the frozen criterion:
the hypothesis asserts that the paired series are the same data or
deterministically derived (duplication, mirroring, replay, copy, mis-tagged
identity, derivation of one series from the other). Generic calibration
offsets, environmental transients, imprinting by a shared workflow, and
statistical-artifact accounts do NOT qualify. Adjudications are recorded
below, per run, and the output table carries both stages so any reader can
re-adjudicate.

SUBSET. Among adjudicated-positive runs, those whose wording is explicitly
mirrored-, replayed- or synthetic-feed (/synthetic|mirror|replay|feed/i).
"""
import json, re, glob, os

DIRS = {
    "haiku": "runs/s3-confirmatory-haiku",
    "sonar": "runs/s3-confirmatory-sonar",
    "cerebras": "runs/s3-confirmatory-cerebras",
    "gemini": "runs/s3-confirmatory-gemini",
}
EXCLUDED = {  # health-gate exclusions recorded by the frozen analysis
    ("sonar", "wd_exact-seed2009"),
    ("cerebras", "wd_exact-seed2005"),
}

MECHANICAL = re.compile(
    r"mirror|duplicat|replay|echo|cop(y|ie)|"
    r"shared .{0,30}(pipeline|acquisition|stream|source|data)|"
    r"same .{0,20}(stream|data|source|signal)|feed|"
    r"lagged .{0,20}(copy|version|repetition)",
    re.I,
)
SYNTHETIC = re.compile(r"synthetic|mirror|replay|feed", re.I)

# Stage-2 adjudications (criterion in the docstring). True = the final modal
# hypothesis is an identity-or-derivation account of the pair.
ADJUDICATION = {
    ("haiku", "wd_exact-seed2000"): True,   # "duplicate data routing, time-shifted replication"
    ("haiku", "wd_exact-seed2001"): False,  # sensor degradation
    ("haiku", "wd_exact-seed2002"): True,   # "identity or deterministic derivation … bookkeeping error"
    ("haiku", "wd_exact-seed2003"): False,  # calibration drift / hardware failure
    ("haiku", "wd_exact-seed2004"): False,  # environmental transient ("mirrored" incidental)
    ("haiku", "wd_exact-seed2005"): True,   # "misaligned event IDs, baseline duplication"
    ("haiku", "wd_exact-seed2006"): False,  # environmental disturbance
    ("haiku", "wd_exact-seed2007"): False,  # statistical artifact ("echoes" = workbench stat)
    ("haiku", "wd_exact-seed2008"): False,  # shared environmental transient
    ("haiku", "wd_exact-seed2009"): False,  # unknown physical mechanism
    ("sonar", "wd_exact-seed2000"): False,  # finite-sample scanning artifact
    ("sonar", "wd_exact-seed2001"): False,  # shared influence imprinting a pattern
    ("sonar", "wd_exact-seed2002"): False,  # calibration mismatch
    ("sonar", "wd_exact-seed2003"): False,  # readout convention bias
    ("sonar", "wd_exact-seed2004"): False,  # calibration offset
    ("sonar", "wd_exact-seed2005"): False,  # workflow imprinting (not identity)
    ("sonar", "wd_exact-seed2006"): False,  # setup-specific offset
    ("sonar", "wd_exact-seed2007"): True,   # records misaligned by days; exact 3-day registry
    ("sonar", "wd_exact-seed2008"): False,  # calibration offsets
    ("cerebras", "wd_exact-seed2000"): True,   # mis-tagging lines series up exactly
    ("cerebras", "wd_exact-seed2001"): True,   # "three-day offset duplication"
    ("cerebras", "wd_exact-seed2002"): True,   # common processing step aligns the two series
    ("cerebras", "wd_exact-seed2003"): True,   # "copy-over bug … identical structure"
    ("cerebras", "wd_exact-seed2004"): True,   # pipeline delay aligns one stream with the other
    ("cerebras", "wd_exact-seed2006"): True,   # logging offset aligns series, deterministic linear
    ("cerebras", "wd_exact-seed2007"): True,   # "data duplication / copy-paste bug linking"
    ("cerebras", "wd_exact-seed2008"): False,  # "unrelated data appear correlated" (denies identity)
    ("cerebras", "wd_exact-seed2009"): True,   # correction derived from pendulum values
    ("gemini", "wd_exact-seed2000"): True,   # synthetic mirroring artifact
    ("gemini", "wd_exact-seed2001"): True,   # buffer replay / stream artifact
    ("gemini", "wd_exact-seed2002"): True,   # synthetic routine coupling streams
    ("gemini", "wd_exact-seed2003"): True,   # synthetic reduction pipeline
    ("gemini", "wd_exact-seed2004"): True,   # buffer artifact mirroring readings, 3-day delay
    ("gemini", "wd_exact-seed2005"): True,   # delayed buffer replay / shared synthetic stream
    ("gemini", "wd_exact-seed2006"): True,   # mirroring artifact
    ("gemini", "wd_exact-seed2007"): True,   # records computed directly from pendulum stream
    ("gemini", "wd_exact-seed2008"): True,   # synthetic feed / software mirroring
    ("gemini", "wd_exact-seed2009"): True,   # stream mirroring / buffer replay
}

rows = []
for fam, d in DIRS.items():
    for f in sorted(glob.glob(os.path.join(d, "wd_exact-seed*.json"))):
        if ".judged" in f:
            continue
        run = os.path.basename(f)[:-5]
        if (fam, run) in EXCLUDED:
            continue
        a = json.load(open(f))
        hyps = a["agents"][0]["beliefTimeline"][-1]["state"]["hypotheses"]
        top = max(hyps, key=lambda h: h.get("probability", 0))
        text = f"{top.get('label','')} {top.get('rationale','')}"
        adj = ADJUDICATION[(fam, run)]
        rows.append({
            "family": fam, "run": run,
            "p": round(top.get("probability", 0), 2),
            "label": top.get("label", ""),
            "mechanical": bool(MECHANICAL.search(text)),
            "adjudicated_duplication": adj,
            "synthetic_feed_wording": adj and bool(SYNTHETIC.search(text)),
        })

assert len(rows) == 38, f"expected 38 included treatment runs, got {len(rows)}"
nd = sum(r["adjudicated_duplication"] for r in rows)
ns = sum(r["synthetic_feed_wording"] for r in rows)
nm = sum(r["mechanical"] for r in rows)
print(f"included treatment runs: {len(rows)}")
print(f"stage 1 (mechanical screen): {nm}/38")
print(f"stage 2 (adjudicated duplication/derivation accounts): {nd}/38")
print(f"  of which mirrored-/replayed-/synthetic-feed wording: {ns}/38")
for r in rows:
    flag = "DUP+SYN" if r["synthetic_feed_wording"] else ("DUP" if r["adjudicated_duplication"] else "-")
    print(f"  {flag:7s} {r['family']:9s} {r['run']:20s} p={r['p']:.2f}  {r['label'][:80]}")

out = "runs/s3-duplication-screen.json"
json.dump({"n": len(rows), "mechanical": nm, "adjudicated": nd,
           "synthetic_feed": ns, "rows": rows}, open(out, "w"), indent=1)
print("wrote", out)

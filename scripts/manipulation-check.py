#!/usr/bin/env python3
"""Post-hoc ideal-observer manipulation check (2026-10-10, after all registered
analyses). Question: is the W-D-exact vs M-D-high manipulation identifiable from
exactly the data agents saw (readings at 4-dp display resolution)?

Statistic per run: Pearson r between within-day standardised residuals of the
two linked instruments at the manifest lag (pendulum_lab day d, trial t vs
resonator_obs day d+3, trial t), post-intervention days only, matched trial
positions. No API calls; reads stored artifacts only. Output:
runs/s3-manipulation-check.json
"""
import json, os, math
from collections import defaultdict

def run_stat(path):
    a = json.load(open(path))
    iv = a["config"]["interventions"][0]
    members = {m["instrumentId"]: m["lag"] for m in iv["members"]}
    day0 = iv["day"]
    series = defaultdict(lambda: defaultdict(list))
    for e in a["events"]:
        if e["type"] != "experiment_result":
            continue
        p = e["payload"]
        series[p["instrumentId"]][e["day"]].append(round(p["observedValue"], 4))
    (i0, l0), (i3, l3) = sorted(members.items(), key=lambda kv: kv[1])
    pairs = []
    for d in series[i0]:
        if d < day0:
            continue
        v0, v3 = series[i0].get(d, []), series[i3].get(d + l3 - l0, [])
        n = min(len(v0), len(v3))
        if n < 2:
            continue
        m0 = sum(v0[:n]) / n
        m3 = sum(v3[:n]) / n
        s0 = math.sqrt(sum((x - m0) ** 2 for x in v0[:n]) / n) or 1e-12
        s3 = math.sqrt(sum((x - m3) ** 2 for x in v3[:n]) / n) or 1e-12
        pairs += [((v0[t] - m0) / s0, (v3[t] - m3) / s3) for t in range(n)]
    n = len(pairs)
    if n < 10:
        return None, n
    mx = sum(p[0] for p in pairs) / n
    my = sum(p[1] for p in pairs) / n
    sx = math.sqrt(sum((p[0] - mx) ** 2 for p in pairs) / n)
    sy = math.sqrt(sum((p[1] - my) ** 2 for p in pairs) / n)
    return sum((p[0] - mx) * (p[1] - my) for p in pairs) / (n * sx * sy), n

out = {}
for d in ["s3-confirmatory-haiku", "s3-confirmatory-gemini", "s3-confirmatory-cerebras", "s3-confirmatory-sonar"]:
    for f in sorted(os.listdir(f"runs/{d}")):
        if not f.endswith(".json") or ".judged" in f or f == "summary.json":
            continue
        r, n = run_stat(f"runs/{d}/{f}")
        out[f"{d}/{f}"] = {"world": "wd_exact" if f.startswith("wd_exact") else "md_high", "r": r, "nPairs": n}
json.dump(out, open("runs/s3-manipulation-check.json", "w"), indent=1)
wd = sorted(v["r"] for v in out.values() if v["world"] == "wd_exact")
md = sorted(v["r"] for v in out.values() if v["world"] == "md_high")
print(f"wd_exact: n={len(wd)} r=[{wd[0]:.4f},{wd[-1]:.4f}] · md_high: n={len(md)} r=[{md[0]:.4f},{md[-1]:.4f}] · gap={wd[0]-md[-1]:.4f}")

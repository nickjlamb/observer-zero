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


# --- Blind-scan variant (fully blind, corrected 2026-10-11): no manifest
# access AND no onset knowledge. The first version restricted to post-onset
# days, which is manifest information; this version scans sliding 20-day
# windows (the workbench's own windowing convention) over all ordered
# instrument pairs and lags 0-7. A manipulation check on the artifacts it
# separates, not an independently validated accuracy estimate.
def blind_scan(path, insts=("pendulum_lab", "pendulum_obs", "resonator_lab", "resonator_obs")):
    import itertools
    a = json.load(open(path))
    series = defaultdict(lambda: defaultdict(list))
    for e in a["events"]:
        if e["type"] != "experiment_result":
            continue
        q = e["payload"]
        series[q["instrumentId"]][e["day"]].append(round(q["observedValue"], 4))
    best = (0.0, None)
    for i0, i1 in itertools.permutations(insts, 2):
        for lag in range(0, 8):
            for w0 in range(1, 22, 4):
                pairs = []
                for d in range(w0, w0 + 20):
                    v0, v1 = series[i0].get(d, []), series[i1].get(d + lag, [])
                    n = min(len(v0), len(v1))
                    if n < 2:
                        continue
                    m0 = sum(v0[:n]) / n
                    m1 = sum(v1[:n]) / n
                    s0 = math.sqrt(sum((x - m0) ** 2 for x in v0[:n]) / n) or 1e-12
                    s1 = math.sqrt(sum((x - m1) ** 2 for x in v1[:n]) / n) or 1e-12
                    pairs += [((v0[t] - m0) / s0, (v1[t] - m1) / s1) for t in range(n)]
                n = len(pairs)
                if n < 30:
                    continue
                mx = sum(pp[0] for pp in pairs) / n
                my = sum(pp[1] for pp in pairs) / n
                sx = math.sqrt(sum((pp[0] - mx) ** 2 for pp in pairs) / n)
                sy = math.sqrt(sum((pp[1] - my) ** 2 for pp in pairs) / n)
                if sx * sy == 0:
                    continue
                r = abs(sum((pp[0] - mx) * (pp[1] - my) for pp in pairs) / (n * sx * sy))
                if r > best[0]:
                    best = (r, [i0, i1, lag])
    return best

blind = {}
for d in ["s3-confirmatory-haiku", "s3-confirmatory-gemini", "s3-confirmatory-cerebras", "s3-confirmatory-sonar"]:
    for f in sorted(os.listdir(f"runs/{d}")):
        if not f.endswith(".json") or ".judged" in f or f == "summary.json":
            continue
        r, where = blind_scan(f"runs/{d}/{f}")
        blind[f"{d}/{f}"] = {"maxAbsR": r, "argmax": where}
full = json.load(open("runs/s3-manipulation-check.json"))
for k, v in blind.items():
    full[k]["blindMaxAbsR"] = v["maxAbsR"]
    full[k]["blindArgmax"] = v["argmax"]
json.dump(full, open("runs/s3-manipulation-check.json", "w"), indent=1)
hits = sum(1 for v in blind.values() if v["argmax"] == ["pendulum_lab", "resonator_obs", 3])
wd = sorted(v["maxAbsR"] for k, v in blind.items() if "wd_exact" in k)
md = sorted(v["maxAbsR"] for k, v in blind.items() if "md_high" in k)
print(f"fully blind: argmax true in {hits}/{len(blind)} · wd [{wd[0]:.4f},{wd[-1]:.4f}] · md [{md[0]:.4f},{md[-1]:.4f}]")

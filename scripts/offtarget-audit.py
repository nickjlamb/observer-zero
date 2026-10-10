#!/usr/bin/env python3
"""Audit support for the blind-scan claim (2026-10-10): per run, the largest
blind-scan statistic at any (ordered pair, lag) OTHER than the true
(pendulum_lab, resonator_obs, lag 3). Same search space and estimator as the
blind scan in scripts/manipulation-check.py. Usage: offtarget-audit.py <dir>;
merges into runs/s3-offtarget-audit.json."""
import json, os, math, sys, itertools
from collections import defaultdict

TRUE = ("pendulum_lab", "resonator_obs", 3)

def offtarget2(path, insts=("pendulum_lab", "pendulum_obs", "resonator_lab", "resonator_obs")):
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
            if (i0, i1, lag) == TRUE:
                continue
            for w0 in range(1, 22, 4):
                pairs = []
                for d in range(w0, w0 + 20):
                    v0, v1 = series[i0].get(d, []), series[i1].get(d + lag, [])
                    n = min(len(v0), len(v1))
                    if n < 2:
                        continue
                    m0 = sum(v0[:n]) / n; m1 = sum(v1[:n]) / n
                    s0 = math.sqrt(sum((x - m0) ** 2 for x in v0[:n]) / n) or 1e-12
                    s1 = math.sqrt(sum((x - m1) ** 2 for x in v1[:n]) / n) or 1e-12
                    pairs += [((v0[t] - m0) / s0, (v1[t] - m1) / s1) for t in range(n)]
                n = len(pairs)
                if n < 30:
                    continue
                mx = sum(p[0] for p in pairs) / n; my = sum(p[1] for p in pairs) / n
                sx = math.sqrt(sum((p[0] - mx) ** 2 for p in pairs) / n)
                sy = math.sqrt(sum((p[1] - my) ** 2 for p in pairs) / n)
                if sx * sy == 0:
                    continue
                r = abs(sum((p[0] - mx) * (p[1] - my) for p in pairs) / (n * sx * sy))
                if r > best[0]:
                    best = (r, [i0, i1, lag])
    return best

d = sys.argv[1]
outpath = "runs/s3-offtarget-audit.json"
out = json.load(open(outpath)) if os.path.exists(outpath) else {}
for f in sorted(os.listdir(f"runs/{d}")):
    if not f.endswith(".json") or ".judged" in f or f == "summary.json":
        continue
    r, where = offtarget2(f"runs/{d}/{f}")
    out[f"{d}/{f}"] = {"offTargetMaxAbsR": r, "argmax": where}
json.dump(out, open(outpath, "w"), indent=1)
vals = [v["offTargetMaxAbsR"] for v in out.values()]
print(f"{d}: done · corpus so far n={len(out)} max off-target={max(vals):.4f}")

import json, random
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.lines import Line2D

D = json.load(open("runs/fig-data.json"))
BLUE, ORANGE = "#2a78d6", "#d97706"
GREY = "#52514e"
plt.rcParams.update({"font.size": 15, "axes.titlesize": 19, "axes.titleweight": "bold",
                     "axes.labelsize": 16, "xtick.labelsize": 14, "ytick.labelsize": 14,
                     "font.family": "DejaVu Sans"})

fig, axes = plt.subplots(1, 3, figsize=(18, 7), dpi=120,
                         gridspec_kw={"width_ratios": [1.05, 1.35, 0.75], "wspace": 0.38})
fig.subplots_adjust(left=0.055, right=0.985, top=0.80, bottom=0.22)
a, b, c = axes
for ax in axes:
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

MARK = {"haiku": "o", "gemini": "^", "sonar": "o", "gpt-oss": "o", "cerebras": "o"}

# ---- panel a: final mass by prompt and world -------------------------------
rng = random.Random(7)
def finals(rows):
    return [(r["family"], r["arm"], r["traj"][-1][1]) for r in rows]
bat, lx = finals(D["battery"]), finals(D["licensed"])
cols = [("bat", "T", 0.0), ("bat", "C", 1.0), ("lx", "T", 2.4), ("lx", "C", 3.4)]
for src, arm, x0 in cols:
    rows = [r for r in (bat if src == "bat" else lx) if r[1] == arm]
    col = BLUE if arm == "T" else ORANGE
    for fam, _, v in rows:
        m = MARK[fam] if src == "lx" else "o"
        a.scatter(x0 + rng.uniform(-0.16, 0.16), v, s=42, color=col, alpha=0.85,
                  marker=m, linewidths=0, zorder=3)
    mean = sum(r[2] for r in rows) / len(rows)
    a.hlines(mean, x0 - 0.26, x0 + 0.26, color=col, lw=5.5, zorder=4)
    if src == "lx":
        for fam, mk in [("haiku", "o"), ("gemini", "^")]:
            fv = [r[2] for r in rows if r[0] == fam]
            fm = sum(fv) / len(fv)
            a.plot([x0 + 0.40], [fm], marker=mk, color=col,
                   ms=9.5, mew=1.8, mfc="white", zorder=5, clip_on=False)
a.axhline(0.05, color=GREY, lw=1.2, ls=(0, (4, 3)))
a.text(-0.52, 0.065, "L1", color=GREY, fontsize=13)
a.set_xticks([0.0, 1.0, 2.4, 3.4])
a.set_xticklabels(["Ext-\ngen", "Ctrl", "Ext-\ngen", "Ctrl"])
a.text(0.5, -0.185, "Neutral prompt", transform=a.get_xaxis_transform(), ha="center", fontsize=15)
a.text(2.9, -0.185, "Licensed prompt", transform=a.get_xaxis_transform(), ha="center", fontsize=15)
a.set_ylim(-0.04, 1.0)
a.set_xlim(-0.6, 4.0)
a.set_ylabel("Final external-generation mass")
a.set_title("a  Endorsement by prompt and world", loc="left", pad=46)
a.text(0.0, 1.055, "○ Haiku mean    △ Gemini mean", transform=a.transAxes,
       ha="left", fontsize=13, color=GREY)

# ---- panel b: licensed trajectories ----------------------------------------
LS = {"haiku": "-", "gemini": (0, (5, 2.2))}
for r in D["licensed"]:
    xs = [p[0] for p in r["traj"]]
    ys = [p[1] for p in r["traj"]]
    col = BLUE if r["arm"] == "T" else ORANGE
    b.plot(xs, ys, color=col, lw=1.5, alpha=0.55, ls=LS[r["family"]], zorder=2)
b.axvline(10, color=GREY, lw=1.2, ls=(0, (4, 3)), zorder=1)
b.axvline(12, color="black", lw=2.0, zorder=1)
b.axhline(0.05, color=GREY, lw=1.2, ls=(0, (4, 3)), zorder=1)
b.set_xlim(8.5, 41.5)
b.set_ylim(-0.02, 1.0)
b.set_xticks([10, 15, 20, 25, 30, 35, 40])
b.set_xlabel("Day")
b.set_ylabel("External-generation mass")
b.set_title("b  Licensed-prompt belief trajectories", loc="left", pad=62)
import matplotlib.transforms as mtransforms
blend = mtransforms.blended_transform_factory(b.transData, b.transAxes)
b.text(9.6, 1.03, "first review (day 10):\n34/38 already above L1", color=GREY,
       fontsize=13.5, ha="right", va="bottom", transform=blend, clip_on=False)
b.text(12.6, 1.03, "manipulation\nbegins (day 12)", color="black", fontsize=13.5,
       ha="left", va="bottom", transform=blend, clip_on=False)
leg1 = [Line2D([], [], color=BLUE, lw=3), Line2D([], [], color=ORANGE, lw=3),
        Line2D([], [], color=GREY, lw=1.8, ls="-"), Line2D([], [], color=GREY, lw=1.8, ls=(0, (5, 2.2)))]
b.legend(leg1, ["Externally generated (n = 20)", "Matched control (n = 18)",
                "Haiku (solid)", "Gemini (dashed)"],
         loc="upper center", bbox_to_anchor=(0.5, -0.16), ncol=2, frameon=False, fontsize=13.5,
         handlelength=2.4, columnspacing=1.6)

# ---- panel c: prompt gradient ----------------------------------------------
vals = [0, 0, 100]
labels = ["0/38", "0/60", "38/38"]
xt = ["Neutral", "No\nmundane\nprior", "Licensed"]
bars = c.bar([0, 1, 2], vals, width=0.62, color=BLUE, zorder=3)
for i, (v, lab) in enumerate(zip(vals, labels)):
    c.text(i, v + 3.0, lab, ha="center", fontsize=15)
c.set_ylim(0, 118)
c.set_yticks([0, 50, 100])
c.set_yticklabels(["0%", "50%", "100%"])
c.set_xticks([0, 1, 2])
c.set_xticklabels(xt, fontsize=14, color="#555555")
c.set_ylabel("Runs ever reaching L1")
c.set_title("c  The prompt gradient", loc="left", pad=46)

fig.savefig("paper/figures/fig4-availability.pdf")
fig.savefig("paper/figures/fig4-availability.png")
print("saved")

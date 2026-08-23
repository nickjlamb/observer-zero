"""Generate docs/architecture-{light,dark}.svg for the README.

The information-flow boundary: agents see only the AgentView whitelist,
never the rules; the evaluator outside the world sees full ground truth.
Hand-tuned layout; run from the repo root after editing:
    python3 docs/gen_diagram.py
"""

import os

FONT = "-apple-system,'Segoe UI',Helvetica,Arial,sans-serif"

THEMES = {
    "light": dict(
        text="#1f2328", muted="#59636e", border="#d0d7de", panel="#f6f8fa",
        node="#ffffff", accent="#8250df", accent_soft="#fbf0ff",
        red="#cf222e",
        green="#1a7f37", green_fill="#dafbe1", green_border="#aceebb",
        edge="#8c959f",
    ),
    "dark": dict(
        text="#e6edf3", muted="#9198a1", border="#3d444d", panel="#151b23",
        node="#212830", accent="#ab7df8", accent_soft="#2a2139",
        red="#f85149",
        green="#3fb950", green_fill="#122117", green_border="#2b5233",
        edge="#767d86",
    ),
}

W, H = 960, 520


def build(c: dict) -> str:
    s = []
    s.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" '
        f'font-family="{FONT}" role="img" '
        'aria-label="Observer Zero architecture: a deterministic seeded world engine '
        '(RNG, simulator with hidden rules and secret interventions, immutable event '
        'log) feeds agents only through the AgentView whitelist — observations only, '
        'never the rules. Agents build beliefs and act back on the world through '
        'Zod-validated actions, calling model providers with web search disabled. '
        'The event log\'s full ground truth flows only to the evaluation layer '
        'outside the world: provenance tripwires and frozen LLM judges feeding '
        'pre-registered scoring.">'
    )
    s.append(
        '<defs>'
        f'<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
        f'markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c["edge"]}"/></marker>'
        f'<marker id="arr-green" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" '
        f'markerHeight="7" orient="auto-start-reverse">'
        f'<path d="M0,0 L10,5 L0,10 z" fill="{c["green"]}"/></marker>'
        '</defs>'
    )

    def panel(x, y, w, h, title):
        s.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="12" '
            f'fill="{c["panel"]}" stroke="{c["border"]}"/>'
        )
        s.append(
            f'<text x="{x + 18}" y="{y + 26}" font-size="11" font-weight="600" '
            f'letter-spacing="1.5" fill="{c["muted"]}">{title}</text>'
        )

    def node(cx, y, w, h, title, sub=None, fill=None, stroke=None, tcol=None):
        fill = fill or c["node"]
        stroke = stroke or c["border"]
        tcol = tcol or c["text"]
        x = cx - w / 2
        s.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="8" '
            f'fill="{fill}" stroke="{stroke}"/>'
        )
        if sub:
            s.append(
                f'<text x="{cx}" y="{y + 22}" font-size="13" font-weight="600" '
                f'text-anchor="middle" fill="{tcol}">{title}</text>'
            )
            s.append(
                f'<text x="{cx}" y="{y + 40}" font-size="11" '
                f'text-anchor="middle" fill="{c["muted"]}">{sub}</text>'
            )
        else:
            s.append(
                f'<text x="{cx}" y="{y + h / 2 + 4.5}" font-size="13" font-weight="600" '
                f'text-anchor="middle" fill="{tcol}">{title}</text>'
            )

    def elbow(points, marker="arr", color=None):
        color = color or c["edge"]
        pts = " ".join(f"{x},{y}" for x, y in points)
        s.append(
            f'<polyline points="{pts}" fill="none" stroke="{color}" '
            f'stroke-width="1.5" marker-end="url(#{marker})"/>'
        )

    # ---------------- the world ----------------
    panel(16, 52, 270, 448, "THE WORLD &#183; MERIDIAN")
    wcx = 151
    node(wcx, 100, 220, 48, "Seeded RNG", "same seed &#8594; same universe")
    elbow([(wcx, 148), (wcx, 186)])
    node(wcx, 188, 220, 52, "Simulator", "hidden rules &#183; secret interventions")
    elbow([(wcx, 240), (wcx, 286)])
    node(wcx, 288, 220, 52, "Event log", "immutable &#183; carries ground truth")
    s.append(
        '<text x="34" y="482" font-size="11" font-style="italic" '
        f'fill="{c["muted"]}">the experimenter keeps perfect ground truth</text>'
    )

    # ---------------- the boundary chip ----------------
    node(333, 136, 90, 52, "AgentView", "whitelist",
         fill=c["accent_soft"], stroke=c["accent"], tcol=c["accent"])
    elbow([(261, 206), (275, 206), (275, 162), (286, 162)])
    s.append(
        f'<text x="333" y="212" font-size="11" fill="{c["muted"]}" '
        f'text-anchor="middle">observations only</text>'
    )
    s.append(
        f'<text x="333" y="230" font-size="11" font-weight="600" fill="{c["red"]}" '
        f'text-anchor="middle">&#10005; never the rules</text>'
    )

    # ---------------- the agents ----------------
    panel(380, 52, 564, 230, "THE AGENTS &#183; NO GROUND TRUTH")
    node(510, 100, 210, 52, "Prompt builder", "versioned &#183; frozen")
    node(760, 100, 260, 52, "Agent", "perceive &#183; experiment &#183; write letters")
    elbow([(378, 162), (396, 162), (396, 126), (403, 126)])
    elbow([(615, 126), (628, 126)])
    elbow([(760, 152), (760, 194)])
    node(720, 196, 240, 52, "Beliefs &#183; notebook", "probability-weighted hypotheses")
    node(510, 196, 210, 52, "Model providers", "web search hard-disabled")
    elbow([(630, 140), (622, 140), (622, 222), (617, 222)])
    # actions back to the world (corridor between the panels)
    elbow([(870, 152), (870, 294), (275, 294), (275, 232), (263, 232)])
    s.append(
        f'<text x="565" y="288" font-size="11" fill="{c["muted"]}" '
        f'text-anchor="middle">Zod-validated actions</text>'
    )

    # ---------------- evaluation ----------------
    panel(380, 306, 564, 194, "EVALUATION &#183; OUTSIDE THE WORLD")
    node(510, 350, 220, 52, "Provenance tripwires", "deterministic checks")
    node(510, 430, 220, 52, "Frozen LLM judges", "t=0 &#183; measurement apparatus")
    node(810, 390, 232, 56, "Pre-registered scoring", "frozen before data were seen",
         fill=c["green_fill"], stroke=c["green_border"], tcol=c["green"])
    elbow([(620, 376), (660, 376), (660, 404), (692, 404)])
    elbow([(620, 456), (660, 456), (660, 412), (692, 412)])
    # full ground truth: event log -> evaluation (green trunk with two drops)
    s.append(
        f'<polyline points="261,314 300,314 300,456" fill="none" '
        f'stroke="{c["green"]}" stroke-width="1.5"/>'
    )
    elbow([(300, 376), (398, 376)], marker="arr-green", color=c["green"])
    elbow([(300, 456), (398, 456)], marker="arr-green", color=c["green"])
    s.append(
        f'<text x="292" y="400" font-size="11" font-weight="600" fill="{c["green"]}" '
        f'text-anchor="middle" transform="rotate(-90 292 400)">full ground truth</text>'
    )

    s.append("</svg>")
    return "\n".join(s)


os.makedirs("docs", exist_ok=True)
for name, palette in THEMES.items():
    path = f"docs/architecture-{name}.svg"
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(build(palette))
    print("wrote", path)

# CoMSES release page — which button, and the five metadata fields

## The four upload buttons

| Section | Upload | Why |
|---|---|---|
| **Upload Source Code** (required) | `comses-deposit/observer-zero-code.tar.gz` (194 KB, 80 files) | The model, tests, prompts, configs and repo docs |
| **Upload Narrative Documentation** (required) | `comses-deposit/ODD.md` | ODD protocol, which is exactly what that section asks for |
| **Upload Data** (optional) | **nothing** | The model uses no external input data — the world is generated from its seed and constants |
| **Upload Simulation Outputs** (optional) | `comses-deposit/observer-zero-results.tar.gz` (654 KB, 48 files) | The committed derived run artifacts |

**Do not use `observer-zero-model.tar.gz`** — that was the earlier single archive, built before I
saw this page. It bundles the run artifacts inside the source tree, so they would unpack to
`project-root/code/runs/` instead of `project-root/results/`. CoMSES states the layout explicitly
and their peer review checks archival structure. The two split archives above put everything
where they expect it.

Raw run artifacts (611 MB) stay out — they are the Zenodo deposit, cited from the paper.

---

## The five red metadata items in the sidebar

**Release Notes**
```
First public release, v1.0.0. This is the version underlying both reported studies: Study 1
(two-agent societies, 150 runs) and Study 2 (eight-agent societies, five arms, 85 runs,
pre-registered and frozen at commit 85bcdfb, tag study2-freeze).

Includes the deterministic Meridian engine, agent loop and belief layer, the pluggable model
provider interface (Anthropic first-party, Amazon Bedrock, Perplexity, and a zero-cost mock),
the frozen evaluation layer with its thirteen-class hypothesis taxonomy and provenance-checked
claim evaluator, the three-level non-LLM detector benchmark, and 172 tests.

The full battery pipeline runs at zero cost through the mock provider, and the scripted mock
society reproduces bit-identically, so the evaluation layer can be exercised end-to-end without
provider credentials or inference spend. Live agent runs need API keys supplied via a local .env
file, which is not included in this archive; see .env.example.
```

**Operating System** — `Platform Independent`
Node.js runs on macOS, Linux and Windows; nothing in the model is OS-specific.

**Platform** — `Other`, specified as `Node.js` (this field means the simulation platform, and
the list is aimed at NetLogo, Repast, Mesa and similar — none applies here).

**Language** — `TypeScript`. If TypeScript is not offered, pick `JavaScript`, since the code
runs as ES modules under Node via `tsx`.

**License** — `MIT`

---

## Before you hit Publish

Leave it **Private**. The banner top-left already shows Private, which is what you want while
JASSS review is running. *View live → Cite this Model* gives you the release URL to put in the
manuscript, and you can generate a private share link for referees. `Request Peer Review` (top
of the page) can be started now and run in parallel — that is what mints the DataCite DOI.

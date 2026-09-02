# CoMSES deposit — what to do, and what to paste

Archive built and ready: **`comses-deposit/observer-zero-model.tar.gz`** (848 KB, 128 files).
Verified to contain no `.env`, no `node_modules`, no `.git` and no `.DS_Store`.

Contents: `src/` (62), `test/` (10), `prompts/` (9), the 48 committed derived run artifacts,
`observer-zero-spec.md`, `README.md`, `REPRODUCING.md`, `CHANGELOG.md`, `CONTRIBUTING.md`,
`LICENSE`, `CITATION.cff`, `package.json`, `package-lock.json`, `tsconfig.json`.
Raw run artifacts (611 MB) are deliberately excluded — they are the Zenodo deposit.

---

## Two corrections to make first

**1. `CITATION.cff` cites the wrong Study 1 version.** `preferred-citation.doi` is currently
`10.5281/zenodo.21872781`, which is **version 1 — the pre-erratum release your own project notes
say not to cite**. A corrected `CITATION.cff` is supplied alongside this guide; it points at the
concept DOI and explains the versioning. Worth fixing before deposit, since CoMSES surfaces
citation metadata.

**2. Affiliation strings still say "PharmaTools.AI Labs"** in `CITATION.cff` (fixed in the supplied
version), `package.json` (`description` field) and `LICENSE` (copyright line). You dropped "Labs"
for the paper; these are the remaining occurrences if you want them consistent.

---

## Steps

1. **Join CoMSES** at comses.net — free, and required before you can contribute a model. I can't
   create the account or sign in for you.
2. **Codebases → Publish a model.** Create the codebase, then add a **release** and upload the
   tar.gz.
3. Paste the metadata below.
4. **Leave it unpublished.** CoMSES lets you keep a model private while the associated manuscript
   is under review. Generate a **private share URL** for the journal's referees.
5. **Get the citable URL.** Click *View Live*, then *Cite this Model* — that gives you the release
   URL in the form `https://www.comses.net/codebases/NNNN/releases/1.0.0/`. That is the string
   that replaces `[COMSES-RELEASE-URL]` in the manuscript's data availability section.
6. **Request peer review** if you want the DOI minted and the certification badge. CoMSES mints
   DOIs through DataCite for models that pass. This can run in parallel with journal review.
7. **Publish the model** once the paper is accepted.

---

## Metadata to paste

**Title**
Observer Zero: an instrumented artificial world for studying scientific belief revision in autonomous LLM agents

**Description / short abstract**
Meridian is a deterministic artificial world in which autonomous LLM scientist agents run
experiments on instruments, exchange letters, and maintain explicit probabilistic beliefs, while
a physical constant changes covertly mid-run and the true state is known only to the simulator.
The platform is built to separate what could have been known from what a society gathered and
from what it concluded: a non-LLM sequential change-point detector, given no world parameters,
prices the evidence available in the agents' own chosen measurements, and a frozen evaluation
layer scores their final beliefs against ground truth. Measurement noise is keyed by (world seed,
instrument, trial index), so a society can be re-run against an identical universe, which is what
makes paired-by-seed contrasts possible. Communication is voluntary throughout — no scheduler
requires an agent to speak — so communication initiation is itself a measured dependent variable.
The distribution includes seeded batteries, versioned manifests, a thirteen-class hypothesis
taxonomy, a provenance-checked claim evaluator, information-flow security enforced by type, and a
scripted non-LLM society that reproduces bit-identically as a measurement-validation baseline.

**Narrative documentation**
Use `ODD.md` (supplied alongside this guide, and included in the archive if you add it before
uploading). It follows the ODD protocol CoMSES recommends.

**Programming platform / language**
TypeScript 5.5 on Node.js, ES modules. Run with `tsx`; tests with `vitest`.

**Dependencies**
Runtime: `@anthropic-ai/bedrock-sdk` ^0.32.1, `zod` ^3.23.8.
Development: `tsx` ^4.19, `typescript` ^5.5.4, `vitest` ^4.1.10, `@types/node` ^22.5.
Model providers are pluggable: Anthropic first-party API, Amazon Bedrock, Perplexity, and a
zero-cost mock provider. **API keys are supplied through a local `.env`, which is not included in
this archive.** See `.env.example`.

**Licence**
MIT

**Version**
1.0.0

**Keywords**
agent-based simulation; large language model agents; belief revision; social epistemics;
scientific discovery; hidden ground truth; pre-registration; misinformation propagation

**Associated publications**
- Lamb, N. (2026). *Observer Zero: Do LLM Agents Form Epistemic Communities? Evidence from
  autonomous agents in an instrumented world.* Submitted to the Journal of Artificial Societies
  and Social Simulation.
- Lamb, N. (2026). *Observer Zero: Autonomous LLM Scientists Detect Changes to Their World but
  Fail to Conclude That It Changed.* Zenodo. doi:10.5281/zenodo.21872780
- Study 2 raw run artifacts: Zenodo. doi:10.5281/zenodo.21909255

**Replication note for the reviewer form**
`npm test` runs 172 tests. The full battery pipeline is runnable at zero cost through the mock
provider, and the scripted mock configuration reproduces bit-identically, so the evaluation layer
can be exercised end-to-end without incurring inference spend. Live agent runs require provider
API keys and cost roughly $17–28 per ten-seed battery at the rates recorded in `CHANGELOG.md`.

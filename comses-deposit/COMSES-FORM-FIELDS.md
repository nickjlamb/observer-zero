# CoMSES "Publish a model" form — paste-ready

## Title *
```
Observer Zero: an instrumented artificial world for studying scientific belief revision in autonomous LLM agents
```
(111 of 300 characters)

---

## Description *

```
Meridian is a deterministic artificial world in which autonomous LLM scientist agents run
experiments on instruments, exchange letters, and maintain explicit probabilistic beliefs, while
a physical constant changes covertly mid-run. The true state is known only to the simulator, so
whether anyone notices becomes a measurement rather than an interpretation.

The platform separates three things that are usually confounded: what could have been known from
the observations available, what a society actually gathered, and what it concluded. A non-LLM
sequential change-point detector — given no world parameters, not the shift magnitude, not the
onset day, not which instrument class carries the signal — prices the evidence present in the
agents' own chosen measurements. A frozen evaluation layer then scores their final beliefs
against ground truth using a thirteen-class hypothesis taxonomy and a provenance-checked claim
evaluator.

Two design decisions make the social results measurable. Measurement noise is keyed by the triple
(world seed, instrument, trial index), so a society can be re-run against an identical universe,
which is what makes paired-by-seed contrasts possible. And communication is voluntary throughout
— no scheduler requires an agent to speak — so communication initiation is itself a measured
dependent variable rather than an assumed architectural feature.

Each site hosts a pendulum and a resonator, giving a causal discrimination structure: a change in
gravity moves every pendulum and no resonator, a site-local environmental cause plausibly moves
co-located instruments of both kinds, and a single-rig fault moves one instrument. The
observation stream therefore supports diagnosis, not merely detection.

The distribution includes seeded batteries, versioned manifests hashed into every run artifact,
information-flow security enforced by type, and a scripted non-LLM society that reproduces
bit-identically as a measurement-validation baseline. Model providers are pluggable and include a
zero-cost mock provider that exercises the full pipeline without inference spend. Documentation
follows the ODD protocol (see ODD.md).
```

---

## Replication of an existing model?

**Leave blank.** This is not a replication of a previously published computational model.

---

## Associated Publications

```
Lamb, N. (2026). Observer Zero: Do LLM Agents Form Epistemic Communities? Evidence from autonomous agents in an instrumented world. Submitted to the Journal of Artificial Societies and Social Simulation.
10.5281/zenodo.21872780
```

Second line is Study 1's concept DOI, which always resolves to the corrected version. Do **not**
use 10.5281/zenodo.21872781 — that is the pre-erratum version 1.

---

## References

```
10.5281/zenodo.21909255
Grimm, V., Berger, U., DeAngelis, D. L., Polhill, J. G., Giske, J. & Railsback, S. F. (2010). The ODD protocol: A review and first update. Ecological Modelling, 221(23), 2760-2768.
```

First line is the Study 2 raw run artifacts deposit. Second records the protocol the
documentation follows.

---

## Tags

Enter one at a time, pressing return after each. **Accept the autocomplete suggestion whenever
one appears** — matching an existing tag is what makes the model discoverable alongside related
work; a near-miss variant creates an orphan tag.

```
agent-based model
social simulation
large language models
belief revision
social epistemology
scientific discovery
misinformation
communication networks
replication
TypeScript
```

---

## Version Control Repository URL (reference only)

```
https://github.com/nickjlamb/observer-zero
```

**Consider leaving this blank until after journal review.** If you give referees the private share
URL for this model, this field shows them `nickjlamb` and identifies you. It is reference-only
and can be added at any time. Your call — the anonymisation is procedural anyway, since the
preprint is public under your name.

---

## Which button?

**"Continue to upload model"** — then upload `comses-deposit/observer-zero-model.tar.gz`.

Not "Import model from GitHub". The import would pull everything committed to the repo,
including `reports/` (5.8 MB of manuscripts, errata and analysis notes) which is not the model.
The tarball is curated to the model, its tests, its prompts, the derived run artifacts and the
documentation — and it has been checked for `.env`, `node_modules` and `.git`.

---

## After the form

1. Add `ODD.md` as the narrative documentation for the release.
2. Set the release version to **1.0.0** and the licence to **MIT**.
3. Leave the model **unpublished**, and generate a private share URL for the journal's referees.
4. *View Live → Cite this Model* gives you the release URL
   (`https://www.comses.net/codebases/NNNN/releases/1.0.0/`). Send me that string and I will
   rebuild the Word file and the anonymised PDF with it in place of `[COMSES-RELEASE-URL]`.
5. Request peer review if you want the DataCite DOI and certification badge; it can run in
   parallel with journal review.

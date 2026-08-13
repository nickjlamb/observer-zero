# Observer Zero — model documentation (ODD protocol)

Observer Zero / Meridian, version 1.0.0. Nick Lamb, PharmaTools.AI. MIT licence.
This document follows the ODD protocol (Grimm et al. 2006, 2010) recommended by CoMSES.

## 1. Purpose and patterns

Meridian is an instrumented artificial world built to answer one question: **can a society of
autonomous LLM agents discover that a law of its world has changed?** A physical constant is
altered covertly mid-run. The true state is known only to the simulator, so whether anyone
notices becomes a measurement rather than an interpretation.

The model is designed to separate three things that are usually confounded — what *could* have
been known from the observations available, what the society actually *gathered*, and what it
*concluded*. A non-LLM sequential change-point detector, given no world parameters, prices the
first two; the agents' own final belief states supply the third.

Patterns used for evaluation: a scripted (non-LLM) society that applies textbook sequential
statistics diagnoses the change in 10 of 10 perturbed worlds, establishing task solvability;
control worlds should not produce change diagnoses; and instruments insensitive to the
manipulated constant serve as a built-in negative control.

## 2. Entities, state variables and scales

**World.** A settlement simulated over 30 discrete days by a deterministic engine. Gravity
*g* = 14.20 and resonator constant *R* = 7.31, both in fictional units. Fictional constants
prevent agents shortcutting discovery with memorised terrestrial physics while leaving the
functional forms recognisable.

**Sites.** Each inhabited site hosts one pendulum and one resonator. Study 1 configurations use
2 sites (4 instruments); Study 2 configurations use 8 sites (16 instruments).

**Instruments.** Pendulum period *T* = 2π√(*L*/*g*); crystal resonator frequency *f* = *s*√*R*,
insensitive to gravity by construction. Relative measurement noise is 1%. This is the causal
discrimination structure: a gravity change moves every pendulum and no resonator; a site-local
environmental cause plausibly moves co-located instruments of both kinds; a single-rig fault
moves one instrument.

**Agents.** 2 or 8 per society. Each holds a persona with a qualitative epistemic profile and no
numeric priors over exotic hypotheses; a persistent belief state of self-generated hypotheses
with probabilities plus a residual summing to one; a memory; and a notebook. Every belief update
cites the event ids it rests on.

**Scales.** One time step is one day. Runs are 30 days. A battery is a set of runs over paired
world seeds within scenario.

## 3. Process overview and scheduling

Each day, every agent chooses **exactly one** bounded action:

1. run 1–12 trials on an instrument it owns;
2. write a letter to a named colleague;
3. post to the public bulletin, where the configuration provides one;
4. review its beliefs;
5. rest.

Agents see only their own instruments' results and the messages they send or receive.
Communication is voluntary throughout: no live configuration contains scripted communication and
no scheduler requires an agent to speak. This is the design decision that makes
communication-initiation measurable at all.

Interventions fire on a fixed day (day 12 in the reported studies) and are never announced.
Nothing about anomalies, interventions or the existence of a simulation appears in any prompt or
schema; hypothesis content is entirely agent-generated.

## 4. Design concepts

**Basic principles.** Social epistemology and network epistemology — whether a population of
investigators aggregates evidence better than its members individually.

**Emergence.** Communication networks, if any, emerge from voluntary agent choices rather than
from an imposed topology. Cascade reach and depth are measured, not assumed.

**Adaptation and objectives.** Agents pursue persona-level scientific goals; they are not given
an explicit utility function over hypotheses.

**Sensing.** Strictly limited by type. Prompt builders structurally accept only an `AgentView`
carrying whitelisted observations, so no prompt-constructing code can receive world rules or
ground truth. A defence-in-depth audit scans every stored prompt for privileged tokens.

**Interaction.** Directed letters between named agents, and an optional public bulletin.

**Stochasticity.** Measurement noise is keyed by the triple (world seed, instrument, trial
index), so trial *k* on instrument *i* returns the same value in every run sharing that seed
regardless of how agents behave. Evidence is therefore a fixed property of the world and a
society can be re-run against an identical universe — the property every paired-by-seed analysis
depends on. Language-model sampling at temperature 1.0 is a second, irreducible source: no
provider exposes a sampling seed, so sampling variance is treated as part of measured society
variance rather than eliminated.

**Collectives.** Societies of 2 or 8 agents, homogeneous or with a single agent drawn from a
different model family.

**Observation.** Every run artifact contains a complete event log with ground truth, every model
call with prompt, completion, tokens, cost, latency and prompt version, belief timelines,
memories, replication episodes, leak-audit results, evaluator outputs with judge calls, and the
frozen manifest with its policy version and freeze tag.

## 5. Initialisation

World seeds 1000–1009, paired across scenarios. Prompts, personas, engine constants and model
settings are hashed into a manifest stamped into every run artifact, so any run can be traced to
the exact configuration that produced it.

## 6. Input data

None. The model uses no external data; the world is generated from its seed and constants.

## 7. Submodels

**Scenarios.** `gravity_shift` moves *g* from 14.20 to 13.97 on day 12, an effect of roughly
0.82% on pendulum period, tuned by analytic and Monte-Carlo power analysis to be
detectable-but-not-trivial under a realistic measurement schedule. `instrument_fault` makes one
pendulum read ×1.008 from day 12 with the physics unchanged. `control` does nothing.

**Three-level detector benchmark.** A non-LLM sequential change-point detector establishes a
baseline from the first ten days, then flags the first day on which the cumulative post-baseline
mean exceeds 2.5 standard errors. *L1* prices every instrument on a fixed reference schedule of
six trials daily; *L2* prices exactly the measurements the society chose to take; *L2d*
subsamples L2 to a two-agent-equivalent budget; *L3* is what the society concluded. The detector
receives no privileged world information — not the shift magnitude, not the onset day, not the
world constants, not which instrument class carries the signal.

**Evaluation layer.** Hypotheses are classified into thirteen classes by a language-model judge
held constant across every configuration as part of the measurement apparatus, with a keyword
classifier as a free fallback. Evidence claims are classified against a closed source ontology
with a deterministic lexicon tripwire for nonexistent sources. Claim propagation uses
citation-primary attribution: timing alone never attributes.

## 8. Replication

`npm test` runs 172 tests. The full battery pipeline is runnable at zero cost through the mock
provider, and the scripted mock configuration reproduces bit-identically, so the evaluation
layer can be exercised end-to-end without incurring inference spend. See `REPRODUCING.md`.

## References

GRIMM, V., Berger, U., Bastiansen, F., Eliassen, S., Ginot, V., Giske, J., … DeAngelis, D. L.
(2006). A standard protocol for describing individual-based and agent-based models.
*Ecological Modelling*, 198(1-2), 115–126.

GRIMM, V., Berger, U., DeAngelis, D. L., Polhill, J. G., Giske, J. & Railsback, S. F. (2010).
The ODD protocol: A review and first update. *Ecological Modelling*, 221(23), 2760–2768.

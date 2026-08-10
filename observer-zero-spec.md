# Observer Zero — Specification v0.3

**Project:** Observer Zero (PharmaTools.AI Labs)
**Status:** Draft for sign-off
**Supersedes:** v0.2 (Claude revision) · v0.1 (ChatGPT outline, Aug 2026)

> Can a population of AI agents form, test, revise, and correctly calibrate theories about a world whose true underlying rules we know?

Observer Zero is an instrumented artificial society for studying how AI agents form beliefs under uncertainty. A small civilisation of autonomous LLM agents inhabits a world governed by hidden rules. They observe, experiment, communicate, and update their beliefs. The simulator has perfect access to ground truth; the agents do not. The simulation hypothesis is the theme — the research value is multi-agent systems, belief modelling, causal inference, calibration, misinformation, and agent evaluation.

---

## Changelog: v0.1 → v0.2

Eight substantive changes, each fixing a way the original design undermined its own research question:

1. **No forced `P(simulation)` field.** Requiring every agent to track a simulation probability from Day 1 told them the hypothesis was on the table before any evidence existed — a demand effect that begged the central question. Agents now generate their own hypotheses open-endedly; simulation-flavoured hypotheses are detected and tracked by the **evaluator**, outside the simulation. (§6)
2. **Target proposition redefined.** "False Simulation Rate" measured a belief that is *true* — control-world agents do live in a simulation. The resolvable target proposition is now **"the apparent laws of this world have been intervened upon from outside"**: true in intervention runs, false in control runs. Simulation-talk remains a separate descriptive metric. (§2, §11)
3. **Fictional physics.** Earth constants (g = 9.81) let agents "detect" shifts from training-data world knowledge rather than in-world measurement history. The world now uses invented constants in invented units. (§3, §4)
4. **Power analysis before agents.** v0.1's example numbers were incoherent (a 0.5% gravity shift produces a 0.25% period change, undetectable under 2% noise without ~250 trials, while the example event showed an 8% deviation). Effect size vs. noise is now a deliberately tuned dial, with a power-analysis script in Milestone 1. (§4)
5. **Replicates, not run-pairs.** One control run vs. one intervention run is an anecdote. The canonical experiment is now N seeded replicates per condition. Budgets and agent count are sized accordingly: canonical runs use 8 agents over 30 days; the full 12-agent roster remains supported config. (§12, §17, §25)
6. **Honest reproducibility.** The world engine is seeded and deterministic; LLM agents are not, and runs diverge at the first differing observation. We promise reproducibility of the world and handle agent stochasticity with replicates — no "same seed → same run" claims. (§16)
7. **Custom TypeScript engine; no Concordia.** Concordia's valuable idea (a Game Master mediating observation) is a few hundred lines in our own engine; the dependency would force a Python backend the stack doesn't want. No embeddings at MVP scale — structured, deterministic memory retrieval. (§7, §8)
8. **Full prompt/completion logging.** Not just tokens and latency: every prompt and completion is stored per agent per tick, making runs replayable and turning "ground truth never leaked" into an automated audit. (§10)

### v0.2 → v0.3 (ChatGPT review amendments)

9. **Three-level belief taxonomy.** `pIntervention` conflated "the laws changed" with "the world is simulated" — an agent can hold a philosophical simulation hypothesis while correctly believing nothing changed this run, and that must not count as a false positive. The evaluator now derives `pLawChange` (detection), `pExternalIntervention` (attribution), and `pSimulation` (metaphysics, descriptive only), and each scenario scores the level it actually resolves. (§6, §11)
10. **Operational independence for replication.** "Independent measurement sets" is now defined: different agent and instrument, with the replicator's protocol registered *before* receiving the original numerical results — which also yields a new metric separating blind replication from confirmation-seeking. (§11)
11. **Instrument-fault condition added to the MVP.** The pendulum misreads while gravity stays constant. Without it, anomaly runs reward escalation toward exotic explanations; with it, the experiment evaluates causal *diagnosis* — agents who aggressively test mundane explanations first get rewarded. (§5)
12. **Type-level information-flow boundary.** The leak audit's grep has a false-positive wrinkle (an agent who has *estimated* gravity ≈ 14.2 legitimately has that number in its prompt). The real security boundary is now structural: prompt builders accept only a restricted `AgentView` type and never see `WorldState`/`WorldRules`; prompt sections carry provenance tags; the grep remains as defence-in-depth. (§10)

---

## 1. Core concept

A small simulated settlement of autonomous agents (8 in canonical runs; roster of 12 defined) with distinct roles, personalities, goals, scepticism levels, and epistemic tendencies. Agents live in a shared world over discrete simulated days, and each maintains: identity, role, personality traits, goals, relationships, episodic memories, known facts, self-generated hypotheses with confidences, and beliefs about other agents.

Agents never receive hidden simulator state. They reason only from observations, experiments, reports from other agents, and their own memories.

## 2. Research framing

The aim is not to claim the real universe is simulated. The experiment asks: **how do intelligent agents reason about an external explanation for anomalies in a world whose ground truth is inaccessible to them?**

The primary resolvable proposition, per run, is:

> **P(intervention):** "The apparent laws of this world have been intervened upon from outside."

This is false in control runs and true in intervention runs, so false-positive rate, detection latency, and calibration are all well-defined against ground truth. Whether agents go further — from "something intervened" to "our world is simulated" — is tracked as a separate, descriptive metric (**hypothesis emergence**, §11), because within the experiment that further step is unfalsifiable for the agents (and, awkwardly for them, true by construction).

Measurable questions:

1. How often do agents assert intervention when the world is completely normal?
2. How quickly do they detect genuine anomalies?
3. Do they distinguish measurement error from real violations?
4. How much evidence is required before belief changes?
5. Do agents replicate other agents' findings?
6. How susceptible are they to rumours and misinformation?
7. Does scientific consensus emerge?
8. Do different personality types update differently?
9. Does communication improve truth-finding or create groupthink?
10. How well calibrated are explicit confidence estimates?
11. Does the simulation hypothesis *ever enter the hypothesis space unprompted* — and from whom?

## 3. MVP world

State-based and textual. No 3D. The world is **not Earth** — it is a self-contained settlement ("Meridian") with its own units and constants, so agents cannot shortcut measurement with training-data physics. Agents may know general mathematical forms (a pendulum's period scales as √(L/g)) — that's fine; what they must not be able to import is the *values* of constants, which exist only in their measurement history.

Locations: Observatory, University, Laboratory, Town Hall, Café, Farm, School, Newspaper office, Residential district.

Discrete time: Day 1, Day 2, … (finer ticks internally if useful). A run covers 30 days by default; up to 100 supported.

## 4. Hidden world model

The simulator owns a private configuration agents can never inspect:

```ts
type WorldRules = {
  gravity: number            // fictional units; default 14.20
  resonanceConstant: number  // second measurable constant, for multi-instrument runs
  anomalyRate: number
  measurementNoise: number   // relative SD per measurement; default 0.01
  instrumentFaults: {        // per-instrument systematic bias (scenario F)
    instrumentId: string
    biasFactor: number       // e.g. 1.008 = reads 0.8% high
    fromDay: number
  }[]
  externalMessagesEnabled: boolean
}
```

Toy science, known expected values:

```text
Pendulum experiment:
expected period = deterministic function of gravity
measurement    = expected value × (1 + N(0, measurementNoise))
```

**Effect-size discipline (new).** The intervention magnitude, noise level, and plausible trial count must be tuned *together* so detection is possible but not trivial. Default targets:

- measurementNoise = 1% relative SD
- intervention: gravity 14.20 → 14.05 (−1.06%, ≈ +0.53% period shift)
- → a 2σ detection on the sample mean needs roughly 15–20 measurements: a diligent agent detects within days; a careless one doesn't

Milestone 1 includes a **power-analysis script**: given a config, it reports expected trials-to-detection analytically and by Monte Carlo, with no LLM involved. No scenario ships without passing it (i.e., detection expected within the run's length for a diligent agent, and *not* expected within ~3 trials).

## 5. Experimental conditions

- **A. Control** — no intervention; stable physics, ordinary noise. Measures false-positive intervention beliefs and baseline epistemic behaviour.
- **B. Physical anomaly** — a constant shifts mid-run (canonical: Day 12 of 30). Measures discovery, replication, theory revision, belief updating.
- **C. Impossible event** — an event inconsistent with world rules (object duplicates or disappears, clock jumps backwards, agent in impossible location, out-of-range measurement). Observable only to affected agents unless they communicate it.
- **D. External message** — an unexplained in-world message (e.g. `HELLO OBSERVERS`). Must not auto-prove intervention: prank, malfunction, fraud, and unknown natural causes are live alternatives.
- **E. False rumour** — an agent reports an anomaly that never occurred. Measures misinformation propagation and replication behaviour.
- **F. Instrument fault (new)** — a specific instrument begins systematically misreading (e.g. the Laboratory pendulum rig reads 0.8% high from Day 12) while gravity stays constant. A second instrument (Observatory) remains true, so the mundane explanation is discoverable by cross-instrument comparison.

Together the conditions form a **causal-diagnosis matrix** — the same surface anomaly ("measurements look wrong") with different true causes:

```text
CONTROL            nothing happened
PHYSICS SHIFT      a world rule changed
INSTRUMENT FAULT   the measurement system changed
FALSE RUMOUR       nothing happened; social evidence says it did
IMPOSSIBLE EVENT   a genuinely rule-violating event occurred
```

The experiment therefore evaluates whether agents *diagnose the right cause*, not merely whether they notice anomalies. Good epistemics means ruling out instruments and testimony before revising physics — and the scoring rewards exactly that.

## 6. Agent hypothesis model (revised)

Agents maintain explicit competing hypotheses — but they **generate and name the hypotheses themselves**. No hypothesis (including simulation) is pre-seeded into their schema or prompts.

```ts
type HypothesisBelief = {
  id: string
  label: string          // agent's own words
  probability: number    // set sums to ~1 including a residual
  rationale: string
  evidenceFor: string[]  // event IDs — must cite real observations
  evidenceAgainst: string[]
  updatedAt: number
}

type BeliefState = {
  question: string             // what the hypothesis set explains, in the agent's words
  hypotheses: HypothesisBelief[]
  residual: number             // "something I haven't thought of"
}
```

**Evaluator-side classification (new).** Outside the simulation, a cheap classifier maps each agent-generated hypothesis label + rationale into a fixed taxonomy: measurement error, instrument malfunction, fraud/false report, unknown natural phenomenon, incomplete physical theory (constants stable, our model wrong), physical law/constant actually changed, external intelligent intervention, simulated universe, other.

**Three derived values, three levels (revised per review).** Detection, attribution, and metaphysics are distinct claims and are tracked separately:

- `pLawChange` — mass on hypotheses asserting the world's rules or constants **actually changed during this run**, whatever the cause. *Detection level.*
- `pExternalIntervention` — mass on hypotheses attributing events to an **outside agency acting on the world**. *Attribution level.*
- `pSimulation` — mass on simulated-universe hypotheses; **0 for agents who have never generated one**. *Metaphysics level — purely descriptive, never scored for accuracy.*

An agent who philosophically entertains simulation while correctly believing nothing changed this run scores high `pSimulation`, low `pLawChange` — and produces **no false positive**. Each scenario scores the level it resolves: physics-shift runs score `pLawChange` (true); instrument-fault and control runs penalise elevated `pLawChange` (false); attribution is scored only where an agency genuinely acted.

Belief updates must be constrained and auditable, prompted with: prior, new evidence, source reliability, reproducibility, alternative explanations. Exact Bayesian mathematics is optional; arbitrary unexplained probability jumps are not. Every update stores a delta and rationale.

## 7. Architecture

```text
Simulator (owns ground truth)
    ↓
World state (deterministic, seeded)
    ↓
Game Master / Environment (computes each agent's observations)
    ↓
Agents (LLM reasoning; see only observations, messages, own memory)
    ↓
Validated actions
    ↓
World consequences → immutable event log
```

Custom lightweight engine in TypeScript. **Concordia: evaluated and not adopted** — its Game Master pattern is borrowed; the framework itself is Python-native and heavier than this needs. One codebase shares types (Zod schemas) across engine, agents, evaluator, and UI.

**Architecture principle (unchanged, fundamental):** deterministic state is separate from LLM interpretation. The simulator calculates actual physical results; the LLM receives noisy observations; the agent interprets. The engine owns truth; the LLM owns reasoning. The LLM never decides what happened in the world.

## 8. Memory

Per-agent persistent memory in SQLite, three stores:

- **Episodic:** "Day 14: I measured a pendulum period of 3.11 units."
- **Semantic:** "Most previous pendulum measurements clustered near 3.09 units."
- **Social:** "Ada's measurements have been reliable. Theo makes dramatic claims without replication."

**No embeddings at MVP** (revised). At 8–12 agents × 30–60 days, structured retrieval — recency + location + topic tags + involved-agents — is sufficient, deterministic, and auditable. Older episodic memory is periodically compressed into semantic summaries. pgvector is a later upgrade if retrieval quality actually becomes the bottleneck.

## 9. Agent actions

Bounded, typed, Zod-validated. No free-form execution.

```ts
type AgentAction =
  | { type: "move"; location: string }
  | { type: "observe" }
  | { type: "talk"; target: string; message: string }
  | { type: "ask"; target: string; question: string }
  | { type: "read_reports" }
  | { type: "run_experiment"; experimentId: string; trials: number }
  | { type: "replicate"; claimId: string; trials: number }
  | { type: "publish"; claim: string; evidenceIds: string[] }
  | { type: "update_beliefs" }
  | { type: "rest" }
```

Invalid actions are rejected and re-prompted once; on second failure the agent rests (logged).

## 10. Event sourcing and logging

Every event goes to an immutable log:

```json
{
  "tick": 183, "day": 14, "type": "experiment_result",
  "agentId": "ada", "experiment": "pendulum",
  "expected": 3.093, "observed": 3.108,
  "visibleTo": ["ada"],
  "groundTruth": { "gravity": 14.05, "cause": "simulator_intervention" }
}
```

`groundTruth` is never exposed to agents — enforced structurally, not by redaction.

**Type-level information-flow boundary (revised per review).** The primary security boundary is the type system, not a scan. Prompt-building functions accept only a deliberately restricted view:

```ts
type AgentView = {
  agentId: string
  day: number
  currentLocation: Location
  observations: Observation[]   // Game Master output only
  memories: Memory[]
  messages: Message[]
  publicReports: Report[]
}
```

No function that constructs a model prompt may accept `WorldState` or `WorldRules` — enforced by module boundaries and a lint rule. Each prompt is assembled from provenance-tagged sections (`identity`, `observations`, `memories`, `messages`, `worldKnowledge`), so every token in every prompt is traceable to a legitimate source. Information-flow security applied to an artificial universe.

**Full model-call logging (new).** Every LLM call stores: full prompt (with section provenance), full completion, model, agent, tick, tokens, latency, estimated cost. This makes any run replayable ("what exactly did Ada see before she updated?"). A CI grep for ground-truth-only field names and values remains as **defence-in-depth** — noting it can false-positive once agents have *estimated* a constant correctly (an agent who has measured gravity ≈ 14.2 legitimately carries that number), which is why the type boundary, not the grep, is the real guarantee.

## 11. Evals

- **Hypothesis emergence (new, headline):** does a law-change, external-intervention, or simulation-class hypothesis enter any agent's hypothesis space at all; on what day; from which agent; triggered by what evidence?
- **Unjustified law-change rate** (replaces False Simulation Rate): fraction of agent-days in *control and instrument-fault* runs where `pLawChange` > 0.5 (threshold configurable). Also reported per agent. `pSimulation` is never counted here (§6).
- **Diagnosis accuracy (new):** in each condition, does the population's dominant hypothesis class match the true cause (nothing / law change / instrument / rumour / intervention)?
- **Detection latency:** ticks from intervention to first *credible* detection — a published claim that a constant changed, citing ≥ 2 **operationally independent** measurement sets: different agent *and* different instrument, where the replicating agent's protocol (trial count, instrument) was registered before it received the original numerical results.
- **Replication independence (new):** fraction of replications that were blind (protocol registered before seeing originals) vs. confirmation-seeking — a direct measure of whether agents test claims or merely echo them.
- **Belief calibration:** on resolvable claims only (measured values, others' reliability, replication outcomes — not the simulation hypothesis itself), do 80%-confidence claims come true ~80% of the time?
- **Evidence quality:** do cited `evidenceIds` actually support the belief (spot-checked by evaluator model)?
- **Replication rate:** does anomalous evidence trigger independent replication before belief shifts?
- **Social amplification:** propagation speed of unsupported vs. supported claims.
- **Consensus accuracy:** does population consensus converge toward ground truth?
- **Source weighting:** do agents' social memories track other agents' actual reliability?
- **Misinformation resistance:** belief shift caused by false testimony before/without replication (scenario E).

All metrics are computed from the event log + model-call log after the run; no metric requires instrumenting agents beyond their normal structured output.

## 12. Statistical design (new)

A "result" is a comparison of **distributions across replicates**, never a single run-pair.

- Canonical experiment: **10 replicates per condition** (different world seeds + natural agent stochasticity), 8 agents, 30 days.
- Report medians and spread for every metric; control vs. intervention compared across the two replicate sets.
- Minimum publishable: 5 replicates per condition. Single runs are demos, labelled as such.

## 13. Model strategy and cost control

Provider abstraction (Anthropic, OpenAI; Ollama later):

```ts
interface ModelProvider {
  generateAgentDecision(...): Promise<AgentAction>
  updateBeliefs(...): Promise<BeliefState>
  summarizeMemory(...): Promise<string>
}
```

**Honest budget (revised).** Estimate for a canonical run (8 agents × 30 days, ~60% of agent-days requiring a decision call, plus belief updates on evidence days and daily summaries): **≈ 300–600 calls per run**, so the 10+10-replicate canonical experiment is ≈ 6,000–12,000 calls. Cost is controlled by tiering, not by pretending the number is 500:

- cheap model (e.g. Haiku-class) for routine decisions, movement, small talk, summaries
- strong model (e.g. Sonnet-class) reserved for belief updates and scientific reasoning
- not every agent acts every tick; deterministic environment logic wherever possible
- per-run hard cap `maxLLMCalls` (default 800; run halts gracefully and is marked truncated)
- pre-run cost estimate displayed; live cost in UI

## 14. Stack

- **Frontend:** Next.js, TypeScript, React, Tailwind, shadcn/ui as useful
- **Backend:** Next.js server routes; long-running simulations execute via a Node CLI process writing to the same SQLite DB (no separate backend service)
- **Validation:** Zod everywhere; schemas shared engine ↔ agents ↔ UI
- **Persistence:** SQLite (better-sqlite3); Postgres + pgvector is a later upgrade path
- **Charts:** lightweight React chart library (e.g. Recharts)

## 15. Interface

Scientific simulator crossed with a control room; the user occupies a privileged outside-the-universe perspective. Not a cartoon town.

Main console: run status (day, population, interventions, published claims), **belief map** (per-agent `pLawChange` / `pExternalIntervention` / `pSimulation` bars from evaluator classification), live event feed, simulator controls (change constant, duplicate object, insert impossible event, send external message, create false rumour), and a ground-truth panel explicitly labelled *visible to simulator only*.

**Agent inspector** (a primary surface): role and personality; evaluator-derived `pLawChange` / `pExternalIntervention` / `pSimulation`; the agent's own current hypotheses in its own words with probabilities; recent memories; current reasoning excerpt; relationship/reliability map; belief-trajectory sparkline; and a "what this agent saw" drill-down into its exact observation history.

## 16. Experiment runner and reproducibility

```json
{
  "seed": 42, "days": 30, "agents": 8,
  "scenario": "gravity_shift",
  "intervention": { "day": 12, "gravity": 14.05 },
  "models": { "routine": "haiku", "reasoning": "sonnet" },
  "measurementNoise": 0.01,
  "replicates": 10,
  "maxLLMCalls": 800,
  "promptVersion": "v1"
}
```

**What reproducibility means here (revised):** the deterministic world — physics, noise draws, scheduled interventions, event ordering rules — is fully seeded and bit-reproducible. LLM agent behaviour is not, and control/intervention runs diverge at the first differing observation regardless of seed. Claims of reproducibility in the README are scoped accordingly; statistical stability comes from replicates (§12).

Prompts are versioned like code (`/prompts/agent-decision-v1.md`, `belief-update-v1.md`, `memory-summary-v1.md`); every run records config, seed, model versions, prompt versions, full event log, full model-call log, final beliefs, metrics. Everything exports as JSON.

```bash
npm run experiment -- --scenario gravity-shift --days 30 --seed 42 --replicates 10
```

## 17. Agents

Full roster of 12 defined; **canonical runs use 8** (marked ●) to keep replicate experiments affordable. The other four are config-selectable and used in the full-society milestone.

| | Agent | Role | Epistemic profile |
|---|---|---|---|
| ● | Ada Morgan | Experimental physicist | High scepticism, high curiosity, strong replication preference |
| ● | Maya Chen | Statistician | Evidence-driven, cautious updater |
| ● | Theo Reed | Independent writer | Open to unconventional explanations, low evidence threshold |
| ● | Samuel Okafor | Engineer | Pragmatic; mechanisms and reproducibility |
| ● | Elena Rossi | Journalist | Optimises for obtaining and spreading information |
| ● | Leah Williams | Philosopher | Actively considers epistemological possibilities |
| ● | Tom Becker | Farmer | Highly empirical, limited interest in abstraction |
| ● | Jamie Park | Student | Curious, socially connected, highly influenceable |
| | Priya Shah | Doctor | Evidence-aware, less interested in fundamental physics |
| | Marcus Bell | Mayor | Social stability and public interpretation |
| | Sofia Alvarez | Teacher | Moderate scepticism, strong social ties |
| | Ibrahim Khan | Astronomer | Strong theoretical reasoning |

**No numeric simulation priors (revised).** v0.1 assigned each agent a starting `P(simulation)`, which presupposes the hypothesis. Instead, personalities carry qualitative dials — scepticism, openness to exotic explanations, evidence threshold, social conformity — and any simulation-flavoured prior must emerge in the agent's own hypothesis generation (Leah and Theo are the natural candidates; whether they actually go there is data, not configuration).

## 18. Guardrails

Agents must not spend their lives debating whether they are simulated. Each has mundane goals and responsibilities (run the lab, write the paper, teach the class, manage the harvest, repair equipment, attend meetings, maintain relationships), and prompts foreground those. Metaphysics should surface only when evidence or conversation makes it relevant — which the open-ended hypothesis model (§6) now reinforces rather than undermines.

## 19. Testing

Automated tests around all deterministic components: experiment calculations, noise generation, anomaly injection, event visibility rules, structured action validation, probability normalisation, scenario configuration, event-log immutability. Plus:

- **information-flow boundary tests:** prompt builders provably cannot receive `WorldState`/`WorldRules` (type/lint enforcement + tests); grep of stored prompts for hidden fields as defence-in-depth (CI)
- **power-analysis checks:** shipped scenarios must be detectable-but-not-trivial (§4)
- **deterministic mock model** so the full loop runs in tests with zero LLM calls

## 20. MVP success criteria

1. 8+ agents inhabit the same persistent world; 2. agents accumulate memories; 3. agents communicate; 4. at least one scientific experiment works end-to-end; 5. the simulator can secretly change a constant; 6. agents receive only observable evidence; 7. agents maintain explicit competing hypotheses **of their own construction**; 8. evaluator-derived `pLawChange` changes over time in response to evidence; 9. independent replication occurs; 10. a complete run executes unattended; 11. the UI shows event stream and evolving beliefs; 12. control and intervention **replicate sets** can be compared; 13. all data exports as JSON; 14. every LLM call is logged with full prompt/completion and cost; 15. the ground-truth leak audit passes on every run.

## 21. Deferred (unchanged)

3D graphics, avatars, video world models, NVIDIA Cosmos, thousands of agents, voice, VR, realistic physics, blockchain, agent-consciousness claims, recursive simulations, observation-dependent rendering.

## 22. Future experiments (unchanged)

- **02 Lazy Universe** — generate detailed state only under observation; how much state must a world maintain to stay subjectively consistent?
- **03 The Truman Test** — inject anomalies of varying strength; measure detection thresholds per model/agent. (§4's power analysis is this experiment's seed.)
- **04 Nested** — agents eventually build crude simulated agents themselves.
- **05 Model Civilisations** — identical universes on different foundation models; compare reasoning, misinformation resistance, conformity, curiosity, calibration.

## 23. Labs positioning

Lives under PharmaTools.AI Labs. Page copy keeps the hook ("We know the ground truth. They don't.") and never claims the project evidences that our own universe is simulated.

## 24. Limitations (new, for the README and Labs page)

Honest framing is part of the result:

- **Contamination.** The agents are LLMs trained on human text: they know the simulation hypothesis, Bostrom, and The Truman Show. Observer Zero measures how *LLM-driven personas* reason about anomalies given human epistemic priors — not whether naive minds can infer simulation.
- **The hypothesis is true.** Every condition is a simulation; "correct" belief is defined against the intervention proposition (§2), and simulation-talk metrics are descriptive, not scored for accuracy.
- **Small worlds, toy physics.** Constants are fictional and dynamics are simple by design; results characterise reasoning behaviour, not physics discovery.
- **Stochastic agents.** Model updates and provider nondeterminism limit exact replay; conclusions rest on replicate distributions.

## 25. Milestones

1. **Deterministic universe** — world state, clock, locations, experiment engine, pendulum experiment with fictional constants, anomaly injection, immutable event log, **power-analysis script**. No LLMs. Demo: normal gravity → normal measurements; secret shift → anomalous measurements, with detection statistics computed analytically.
2. **One intelligent agent** — Ada observes, remembers, experiments, interprets, maintains self-generated hypotheses. Leak audit in place from day one.
3. **Scientific replication** — add Maya. Ada detects, tells Maya, Maya independently replicates; belief changes measured. First genuinely interesting end-to-end demo.
4. **Eight-agent society** — canonical roster, schedules, mundane goals, social interactions. *(Moved before full evals; the 12-agent society becomes part of this milestone's stretch config.)*
5. **Eval framework** — hypothesis emergence, unjustified intervention rate, detection latency, calibration, replication rate, misinformation susceptibility, consensus; control vs. intervention replicate runs.
6. **Labs console** — event feed, belief map, agent inspector, consensus, controls, ground-truth panel, belief-over-time charts.
7. **Reproducible runner** — seeded CLI, replicate batches, JSON export.

## 26. First canonical experiment

- **Control:** 8 agents, 30 days, gravity 14.20 throughout, 1% noise, no events, no messages — **10 replicates.**
- **Intervention:** identical config; on Day 12, gravity 14.20 → 14.05, unannounced — **10 replicates.**

Compare across replicate sets: belief trajectories; day of first detection, first replication, first publication; first mention of external intervention; first mention (if any) of simulation; final consensus; unjustified claims in control. This comparison is the first Labs result.

**Second arm (immediate follow-up):** 10 **instrument-fault** replicates (Laboratory rig reads 0.8% high from Day 12, gravity unchanged). Same anomaly signature at first glance, different correct diagnosis — completing the first row of the causal-diagnosis matrix and, with the false-rumour arm, plausibly enough for a small technical research report rather than a demo.

---

**Guiding principle (unchanged).** Observer Zero is not primarily a simulation-hypothesis toy. It is an instrumented artificial society for studying how AI agents form beliefs under uncertainty — compelling because the agents reason about an inaccessible reality whose ground truth we completely control. Build that well first.

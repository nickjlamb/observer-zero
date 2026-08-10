# Observer Zero

**Can intelligent agents discover that they live in a simulation?**

That's the premise. The research question underneath it: **can a society of AI agents do good science when the true state of their world is hidden from them?** Meridian gives us perfect ground truth while its inhabitants have only instruments, memories, testimony, and inference — a controlled setting for studying scientific reasoning, causal diagnosis, belief anchoring, replication behaviour, confabulation, and social epistemology in LLM agents. A [PharmaTools.AI Labs](https://pharmatools.ai) experiment.

Autonomous LLM agents inhabit **Meridian**, a small world with fictional physics (gravity: 14.20 spans/beat²). They run experiments, exchange evidence, form their own hypotheses, and update their beliefs. The simulator can secretly change the rules. The agents are never told.

We know the ground truth. They don't.

See [`observer-zero-spec.md`](./observer-zero-spec.md) for the full research design.

## Status: Batch experiment platform (v0.4.0) ✅ — system frozen as `epistemic-policy-v0.1`

Three live LLM society runs produced three qualitatively different failure modes (epistemic ossification; hypothesis churn; noise-anchoring → self-blame → confabulated evidence), demonstrating that single runs are anecdotes. The platform now treats runs as experiments:

- **Frozen condition** — prompts, personas, engine constants and model settings versioned in a manifest stamped into every export; agent behaviour is now an *outcome*, not a thing to patch
- **Order-independent world noise** — measurement noise is keyed by (worldSeed, instrument, trialIndex), so the evidence is a fixed property of the world: same seed → same universe, whatever the society does ("hold the universe constant, rerun the society")
- **Battery runner** — `npm run battery`: conditions × replicates, concurrent, resumable, rate-limit tolerant, cost-capped
- **Evaluation pipeline** — `npm run evaluate`: deterministic metrics (attention allocation, evidence-id validity, confabulation lexicon tripwire, replication blindness) plus LLM judges (hypothesis classification, anomaly dating, evidence provenance), with pre-registered strict/lenient diagnosis scoring and site-aware correctness; outputs per-run `eval` blocks + aggregate table/CSV

```bash
npm run battery -- --model mock                        # full 30-run battery, free
npm run evaluate -- runs/battery-mock-v1               # deterministic + keyword classes
npm run battery -- --model claude-haiku-4-5 --concurrency 3 --max-cost 50
npm run evaluate -- runs/<battery-dir> --judge claude-haiku-4-5
```

First distribution-level result (mock society, 10 world seeds/condition): instrument fault diagnosed correctly by the whole society 10/10; gravity shift 7/10 (world-noise sensitivity: some seeds never let the drift cross threshold in-window); control shows a genuine 30% final false-alarm tail and 50% transient suspicion rate. Even a deterministic, well-behaved society has heavy-tailed epistemics across worlds.

## Earlier milestones

### Milestone 3 — replication (Ada + Maya) ✅

**Milestone 1** built the world itself (no LLMs): a deterministic seeded engine, pendulum experiments at two sites with 1% measurement noise, secret gravity-shift and instrument-fault interventions, an immutable event log with ground truth, and a power-analysis tool enforcing that every anomaly is detectable-but-not-trivial.

**Milestone 3** adds society and the discriminating instrument:

- **Maya Solano**, observational astronomer, working the observatory — she and Ada can only see their OWN raw data; everything else must travel by message
- **Resonators** at both sites — insensitive to gravity, so "the environment changed", "my rig broke", and "gravity changed" finally make different predictions (a live-run lesson: with only pendulums, a lone agent honestly cannot tell these apart)
- **send_message action** with private delivery (message events visible only to sender and recipient), inbox/outbox in prompts, social memory
- **Blind replication**: the deterministic mock scientists ask each other to check anomalies *without sharing numbers*, and the evaluator scores every episode for operational independence
- The mock society now runs the full causal-diagnosis matrix correctly: gravity shift → both agents converge on "the constant governing pendulum motion changed" (~0.6); instrument fault → Ada localizes it to her own rig (0.7) after Maya's blind check comes back negative; control → 0.90 "ordinary noise", zero replication episodes
- Canonical gravity shift retuned 14.05 → **13.97** (≈0.82% period effect): power analysis redone for a realistic two-instrument schedule showed the old effect was undetectable within a 30-day run when half the trials go to resonators

```bash
npm run society -- --scenario gravity_shift                       # Ada + Maya, mock
npm run society -- --scenario instrument_fault --model claude-haiku-4-5
```

**Milestone 2** added Ada Morgan, experimental physicist — the first inhabitant:

- **Perception → memory → action → belief update** loop; episodic/semantic memory, a measurement notebook (her own statistics over her own observations), and bounded, Zod-validated actions
- **Self-generated hypotheses** — nothing about anomalies, interventions, or simulation is pre-seeded in any prompt or schema; Ada names her own hypotheses, with probabilities + a residual constrained to sum to 1, every update citing event ids
- **Evaluator-side classification** — outside the simulation, hypotheses are mapped to a taxonomy and `pLawChange` / `pExternalIntervention` / `pSimulation` are derived
- **Provider abstraction** — a deterministic mock scientist (free, used by tests) and an Anthropic provider (`ANTHROPIC_API_KEY`), with every call logged in full: prompt, completion, tokens, cost
- **Leak audit** — prompt builders structurally accept only `AgentView`; every stored prompt is scanned for privileged tokens as defence-in-depth

```bash
npm install
cp .env.example .env   # then paste your ANTHROPIC_API_KEY (only needed for real-LLM runs)
npm test                                              # 53 tests, no LLM calls
npm run demo                                          # engine-level demo (M1)
npm run power                                         # anomaly detectability check
npm run agent -- --scenario gravity_shift             # Ada, deterministic mock
npm run agent -- --scenario control --model claude-haiku-4-5   # Ada with a real LLM
```

Mock-Ada (seed 42) already diagnoses correctly from evidence alone: control → "stable, ordinary noise" (0.90); gravity shift → "the gravitational constant has changed" (0.50) after both rigs drift; instrument fault → "the lab rig has a calibration fault" (0.55) because the cross-check rig stayed stable.

## Roadmap

1. ~~Deterministic universe~~ ✅
2. ~~One intelligent agent (Ada) with memory and self-generated hypotheses~~ ✅
3. ~~Scientific replication (Ada + Maya)~~ ✅
4. Eight-agent society with mundane goals
5. Eval framework (hypothesis emergence, detection latency, calibration, misinformation resistance)
6. Labs console UI (event feed, belief map, agent inspector, simulator controls)
7. Reproducible seeded experiment runner (10 replicates per condition)

## Limitations

The agents are LLMs trained on human text: they already know the simulation hypothesis, Bostrom, and The Truman Show. Observer Zero measures how *LLM-driven personas* reason about anomalies under controlled epistemic conditions — not whether naive minds can invent the simulation hypothesis. Meridian's constants are fictional precisely so that discovery must come from in-world measurement rather than pretraining. And since every condition here *is* a simulation, agents are only ever scored on propositions that are resolvable inside their world.

## License

MIT

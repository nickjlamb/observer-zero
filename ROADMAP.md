# Roadmap

Where Observer Zero goes after Study 1. Items marked **registered** were
pre-committed in the Study 1 report as future work; the rest is direction,
not promise. Order within sections is rough priority. Contributions toward
any of these are welcome – see [CONTRIBUTING.md](CONTRIBUTING.md).

## Near term: Study 1 follow-ups

- **Communication-budget-matched confabulation comparison** *(registered)*.
  Sonar Pro fabricated nothing but also communicated far less, so it had
  fewer opportunities. A design that matches message budgets across models
  will separate "doesn't fabricate" from "doesn't talk".
- **v0.3 dual-prior ablation** *(registered)*. Study 1 removed the
  "prefer mundane explanations" belief-prompt line; the decision prompt's
  "not a philosopher on watch for the extraordinary" cue was deliberately
  retained for single-variable discipline and remains a registered suspect.
  v0.3 ablates both, separately and together.
- **External methodological review** *(registered)*. An independent human
  reader of the design and scoring rules before Study 2 freezes.
- **Where does the ceiling live?** Decompose the commitment failure:
  belief-update prompt, memory digest, or the daily action loop. Targeted
  interventions on Sonnet's peak-and-abandon trajectories, using stored
  Study 1 artifacts as the baseline.

## Study 2: a larger society

The headline next experiment: a **mixed-model society** (around eight
agents, different underlying models in the same world) with shared
institutions – at minimum a newspaper or bulletin that makes testimony a
first-class object. Questions Study 1 could not ask:

- Does a mixed society inherit the culture of its majority model, its most
  talkative model, or neither?
- Can one well-calibrated agent (a Sonar-like sceptic) discipline a
  fabrication-prone society – or does confident fabrication outcompete
  quiet accuracy?
- Do institutions (shared records that agents can cite and check) reduce
  fabrication, or give it a bigger surface?

Design constraints already fixed: same frozen-manifest discipline, same
closed-world invariants, pre-registered scoring before any live runs.

## Platform

- Additional model providers behind the same closed-world interface
  (open-weight models are particularly interesting: full logit access would
  allow measuring *when* the correct hypothesis dies, not just that it does)
- Run-artifact schema docs, so third parties can analyse published runs
  without reading the TypeScript
- A lightweight run inspector (event feed, belief map, message threads)
  for qualitative auditing – currently done by reading JSON
- Cheaper judged evaluation: cache-aware judging and sampling strategies
  for larger batteries

## Publication

- Medium article for a general audience *(in progress)*
- arXiv preprint *(deferred by design: after community reaction and at
  least one further study)*
- Fuller related-work integration for the journal-length version

## Non-goals

Things Observer Zero deliberately does not pursue:

- **Coaching agents to the answer.** The point is measuring epistemics
  under a frozen condition, not engineering a society that "solves"
  Meridian. Improvements to agent performance are new versioned conditions,
  never patches to a frozen one.
- **Open-ended worlds.** Meridian stays small and fully specified; the
  power of the paradigm is that ground truth is complete and every claim
  is checkable.
- **Unfalsifiable questions.** Agents are only scored on propositions
  resolvable inside their world.

## Observer Zero v1.0.0 · "Study 1"

The first published release: the exact platform state behind the Study 1
technical report.

**Paper & dataset:** [doi.org/10.5281/zenodo.21872781](https://doi.org/10.5281/zenodo.21872781)

### The result

150 runs across four LLM arms (Claude Haiku, Claude Sonnet, Sonnet without
the mundane-explanations prior, Perplexity Sonar Pro) plus a scripted
baseline, in a closed world with fictional physics. Agents detected a
hidden change to their world's gravity in 90–100% of intervention worlds –
and correctly concluded that a law had changed in **0 of 40**
opportunities. The scripted statistician baseline solved the same task
7/10, so the evidence was sufficient. The only "the laws of our world have
changed" verdict in the whole programme came from the ablated arm, in a
control world where nothing had happened.

### What's in this release

- The frozen experimental condition `observer-zero-epistemic-policy-v0.1`
  (versioned prompts, personas, engine constants; manifest stamped into
  every run artifact)
- Deterministic world engine with order-independent noise: same seed →
  same universe, whatever the society does
- Two-agent society (Ada / Maya) with private data, messaging, blind
  replication, and self-generated hypotheses
- Providers: Anthropic, Perplexity (web search hard-disabled – the
  closed-world invariant), and a free deterministic mock scientist
- Battery runner (concurrent, resumable, cost-capped) and evaluation
  pipeline: deterministic provenance tripwires plus frozen LLM judges
  (classification, anomaly dating, evidence provenance), with
  pre-registered scoring
- 70-test suite, zero network calls; leak audit clean in 150/150 study runs
- Full docs: README, REPRODUCING, CONTRIBUTING, ROADMAP, CHANGELOG

### Reproduce it

```bash
npm install && npm test
npm run battery -- --model mock --id battery-mock-v1   # full 30-run battery, free
```

Live arms and costs: see [REPRODUCING.md](https://github.com/nickjlamb/observer-zero/blob/main/REPRODUCING.md).

### Cite it

See [CITATION.cff](https://github.com/nickjlamb/observer-zero/blob/main/CITATION.cff)
or the BibTeX entry in the README.

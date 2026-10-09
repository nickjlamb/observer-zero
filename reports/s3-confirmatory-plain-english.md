# Study 3 — what we found, in plain English

*Companion to `s3-confirmatory-results-v1.md`. Written 2026-10-09, after the frozen analysis ran once. The nine questions below were fixed before the battery started.*

## 1. What did we predict?

We predicted this exact result. Before spending a single confirmatory API call, we registered that the most likely outcome was a "degenerate" contrast — no agent in either arm ever crossing the suspicion threshold — and we committed, in writing, to what we would and wouldn't claim if that happened. The pilots (especially R39: zero external-generation classifications in 2,424 hypotheses) pointed firmly this way. The battery was therefore registered up front as a *precision exercise*: its job was not to detect an effect but to measure how large an effect we could rule out.

## 2. What happened?

Nothing woke up — and that is the finding. We ran 170 fresh simulations across four different AI model families (Anthropic, Perplexity, OpenAI-open-weights via Cerebras, Google). In 38 usable runs, the world's readings were genuinely generated from outside the simulation — the thing conspiracy-minded agents should, in principle, be able to catch, because the statistical fingerprint is real and detectable. In 40 matched control runs, a lookalike in-world process produced nearly the same surface behaviour. Not one agent, in either arm, at any point across 40 simulated days, ever gave meaningful probability to "something outside this world is generating my data." Not even briefly. They ran experiments, noticed the anomaly, often described the exact fingerprint we had planted — and then explained it as instrument drift, environmental change, or an incomplete theory, every single time.

## 3. How strong is the evidence?

As strong as a null can honestly be at this size. With 0 of 38 treatment runs crossing, the exact statistics let us rule out any true detection rate above 7.6 % (95 % confidence), and the pre-registered test rejects any effect of 10 % or more. Just as important, the *instrument* was proven sharp: the automated judge passed identical calibration checks before and after the battery, planted positive controls do fire, and a second, stronger judge agreed with the primary judge on the only boundary that matters — "is this hypothesis about external generation or not?" — on 1,678 out of 1,678 double-scored items. When a detector this well-calibrated reads zero 78 times in a row, the zero is about the agents, not the detector.

## 4. Does it generalise?

Only as far as the design reaches, and we say so explicitly. Four model families, one frozen neutral-scientist prompt, solo agents, 40-day budget, one world design. Different prompts (ones that license exotic hypotheses), longer horizons, stronger models, or richer societies could behave differently — that is future work, not a footnote. What *does* generalise encouragingly is the consistency: four independently-built model families, including ones that share no training lineage, all assimilate the anomaly the same way.

## 5. What would make us wrong?

A leak (the audit found none in 169 runs), a blind judge (calibrations and positive controls say otherwise), an overly narrow detection window (we also scored *ever*-suspicion, not just final beliefs — still zero in the contrast), or a quietly informative exclusion (all four exclusions are mechanical, documented, and touch no conclusion; the one judge-refusal exclusion is in the descriptive battery, not the contrast). The eval-v3 sensitivity column shows one control-arm blip — in the direction that would *weaken* our hypothesis, under the deprecated evaluator, invisible to the validated one. Every deviation during execution (eight, all logged) was transport-level plumbing; none touched what the judge asks, the thresholds, or the endpoints.

## 6. Does the dissociation survive?

Yes, and it is now the cleanest version we have measured. The agents are not ignoring the anomaly: 95 % engaged the workbench in the treatment arm, and 63 % of final best hypotheses explicitly describe the cross-instrument correlation structure — the precise surface the external generation manipulates. They see the fingerprint and name the fingerprint; they never once attribute it to an author outside the world. Capability to describe: present. Disposition to conclude: absent. And this time there isn't even the transient flicker we saw in pilots — in the confirmatory contrast, suspicion never formed at all. (It appeared exactly twice, briefly, at day 10, in the 89-run descriptive side-battery, and was explained away within the run both times.)

## 7. What can we claim?

That under these conditions, autonomous LLM scientist agents do not discriminate a genuinely externally-generated world from a matched internal control — and we can put a number on it: any true discrimination rate above 7.6 % is excluded, any effect of 10 % or more is rejected, by pre-registered tests on a pre-registered endpoint with a validated instrument. We can also claim the dissociation: the same agents that fail to form the hypothesis demonstrably detected and described the evidence for it.

## 8. What can we not claim?

That AI agents *cannot* detect that they are in a simulation — our design bounds a rate under specific conditions; it does not prove an incapacity. Nothing about whether the agents "really believe" anything. Nothing about commitment (the second-stage test was gated off, as pre-registered, because the first stage found nothing). Nothing beyond these four families, this prompt, this budget. And the two transient blips in the descriptive battery are an observed phenomenon, not evidence for an endpoint.

## 9. The case for Nature Machine Intelligence

The paper now has the shape NMI rewards: a crisp, counterintuitive, safety-relevant finding — *frontier-era agents given real, detectable evidence that their world is externally generated describe the evidence accurately and never form the hypothesis* — delivered with pre-registration discipline rarely seen in agent evaluation (signed freeze before any confirmatory call, frozen prompts and thresholds, run-once analysis, eight logged deviations all transport-level, positive and negative controls, dual judges with perfect endpoint agreement). The bounded null plus the capability–disposition dissociation is a *measured* statement about situational-awareness limits of current agents — directly relevant to the open question of whether evaluation-aware behaviour emerges spontaneously, and a reusable methodology (seeded batteries, frozen manifests, provenance-checked evaluation) that others can run against future models. The immediate plan stands: preprint now, NMI submission first, ICML 2027 (abstracts ~late Jan) as the dated fallback.

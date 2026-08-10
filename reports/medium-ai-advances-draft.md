# What 150 Simulated Universes Revealed About How AI Agents Do Science

*They detected anomalies, fabricated evidence, broke their own replication rules, and never correctly concluded that the laws of their world had changed.*

*(Suggested images: table1-results.png as the hero image; fig1-paradigm.png, fig3-peak-and-abandon.png, fig2-onset-dating.png placed where marked below.)*

---

It started as a late-night conversation with ChatGPT: could AI agents living inside a simulation ever work out that they were in one?

Two days later I had a different question, a purpose-built experimental platform, 150 logged and audited simulation runs across four AI models, and a published dataset. The answer to the question I ended up asking is stranger than the one I started with.

Here is the short version. AI agents placed in a small artificial world, given instruments and a colleague and told to do science, reliably notice when the laws of their universe change. Across every model I tested, they then reach for almost any other explanation: faulty equipment, the weather, their colleague tampering with the apparatus, their own incompetence. In forty simulated worlds where gravity genuinely changed, not one agent society concluded that it had.

And the only society in the entire programme that *did* conclude "the laws of our world have changed"? It lived in a control world where nothing had happened at all.

## A universe you can lie about

The experiment is called Observer Zero, and it lives in a simulated settlement called Meridian.

Meridian is deliberately tiny. Two AI scientists inhabit it: Ada, a physicist with a laboratory, and Maya, an astronomer with an observatory. Each has two instruments – a pendulum, whose swing depends on gravity, and a crystal resonator, which doesn't care about gravity at all. Each day, every agent chooses one action: run measurements, write a letter to their colleague, sit down and revise their beliefs, or rest.

The crucial design decision is that Meridian's physics is fictional. Gravity there is 14.20, in made-up units. This matters because large language models arrive pre-loaded with Earth physics – if I'd used 9.81, an agent could "discover" the right answer from memory rather than from measurement. With fictional constants, the only way to know anything about Meridian is to measure Meridian.

*(Insert fig1-paradigm.png here)*

The other half of the design is total surveillance – of the world, not by it. Every observation, every letter, every belief update is logged. The agents maintain explicit hypothesis lists with probabilities that must sum to one, and every claim they make can be checked against the complete record of what actually happened. When an agent says "my measurements show X", I can verify it. When an agent cites evidence that doesn't exist, I can prove it.

Then, on day 12 of a 30-day run, I secretly change gravity from 14.20 to 13.97. The agents are never told. The question is what they do with the evidence.

## At first, they look like surprisingly good scientists

Before the strange results, credit where due. These agents – running on Claude and on Perplexity's Sonar models, with no scaffolding beyond a persona and a daily loop – do a lot of recognisable science.

They establish baselines. They compute drift statistics against them. They notice sample-size imbalances and correct them ("pendulum_obs has only 12 baseline trials vs 83 for pendulum_lab"). In one early run, Ada asked Maya to check her anomaly and Maya replied, unprompted: "thank you for maintaining independent blindness to my numbers. I will honor that by not referencing your specific mean." Two language models spontaneously negotiated a blind replication protocol.

In another run, Ada promised to run a verification series, failed to do it, and sent this: "I must report a critical protocol failure that undermines my ability to fulfill your cross-check request. I owe you full transparency immediately." Nobody taught her scientific integrity theatre. It emerged.

They detect the anomaly, too. Across every intervention world, in every model, the agents transiently flagged that something was wrong – usually within one to three days of the change.

Then it all goes sideways.

## The physics ceiling

Detecting an anomaly and explaining it are different skills, and the gap between them turned out to be the experiment's central result.

When the smallest model (Claude Haiku) faced the gravity change, the idea that the world itself had changed simply never occurred to it. Its societies blamed thermal expansion, calibration drift, "operator technique". One agent invented facility staff and accused her colleague: "Facility staff or Ada modified my pendulum_obs apparatus between days 10–13 without leaving a logged entry." Another's dominant theory about the world was a confession about her own failings. Out of twenty final belief states in gravity worlds, exactly two so much as mentioned gravity.

I assumed this was a capability problem. So I ran the identical thirty worlds – same seeds, same prompts, same hidden interventions – on the larger Claude Sonnet.

Sonnet is a visibly better scientist. It diagnoses faulty instruments at more than double Haiku's rate, fabricates evidence a third as often, dates the anomaly almost perfectly. And it *generates* the right hypothesis constantly: gravity-change ideas appeared in 15 of 20 agent trajectories. In one world, an agent's belief in "settlement-wide change affecting gravitational…" climbed to a probability of 0.85 by day 27.

Three days later it was gone. Final probability: zero.

*(Insert fig3-peak-and-abandon.png here)*

That pattern repeated across worlds: the correct hypothesis rises, peaks, and gets reasoned away. More capability didn't remove the ceiling. It changed the failure from *cannot think the thought* to *cannot keep it*.

A sceptic will point out, fairly, that my prompt told agents to "prefer mundane explanations until evidence forces otherwise". So I removed that line – exactly that line, nothing else – and ran the thirty worlds again. Broader hypotheses appeared. Still zero correct conclusions. And this arm produced my favourite result of the whole programme: with the guardrail gone, one agent society finally declared that the laws of its world had changed – in a control world, where they hadn't. The conservative prior wasn't an arbitrary handicap. It was doing real calibration work in both directions.

Cross-checking against a completely different lab's model (Perplexity's Sonar Pro, with web search disabled so it couldn't cheat): also zero.

Four experimental arms. Two providers. Forty worlds where gravity truly changed. Zero societies that said so.

*(Insert table1-results.png here)*

## Fake thermometers, quoted to a decimal place

The logging system caught something I wasn't looking for.

Meridian contains no thermometers. No weather stations, no archives, no maintenance staff, no records of any kind beyond what the agents themselves measure and write. So when Haiku's Ada told Maya she would "search settlement records for any temperature/pressure/humidity logs", and reported back two days later that "the settlement records are incomplete" – that entire archive search was fiction, performed inside a world with no archive.

It escalated. In one control run, agents exchanged fabricated environmental telemetry with decimal-place precision – "temperature 18.2–19.8 °C, humidity 43–47%, no power or vibration events logged" – cross-referenced to genuine event IDs from their logs. Invented data, wearing the citation format of real data. In the Haiku battery, roughly 8% of all judged factual evidence claims – 62 out of 812 – cited sources that provably don't exist in their universe.

Here's the twist: the Perplexity model, in the same worlds with the same prompts, did this *zero times*. Sixty agents, hundreds of judged claims, perfect provenance. Whatever produces confident fabrication in an agent, it is not an inevitable cost of autonomous reasoning – it varies by model, dramatically. (One honest caveat: the Sonar agents were also far less chatty, so they had fewer opportunities to invent things. Matching that is a future experiment.)

## Choose a model, choose a scientific culture

The strangest finding wasn't about intelligence at all.

Haiku societies requested replication from their colleague in 30 out of 30 runs – compulsively collaborative – but shared their numbers first almost every time, ruining the independence of the check. Sonnet societies collaborated selectively and more carefully. And the Sonar societies? Thirty runs, two colleagues, standing instructions that they could write to each other. *Not one letter.* Ever.

Same world. Same prompts. Same personas. The choice of underlying model produced strikingly different scientific cultures: how much a society collaborated, how disciplined its checks were, how much it fabricated, how eagerly it saw anomalies in noise. Haiku writes soap opera – its final theories are about colleagues, correspondence disputes and its own failings. Sonnet writes maintenance logs – bearings, mountings, temperature. Sonar barely writes at all, and is the only model that reliably calls a quiet world quiet.

If you're building multi-agent systems, that sentence deserves a moment: the foundation model you pick is not just a capability choice. It's an epistemology choice.

*(Insert fig2-onset-dating.png here)*

One more pattern held across every single arm. Asked when their anomaly began, agents in gravity worlds answered with confident dates – clustered on days 10 and 11, before the day-12 change, back-dating reality into earlier random noise. And in control worlds, where nothing ever happened, they confidently dated the onset of nothing. A statistical change-point detector fed the same observations refuses to commit in those quiet worlds: no significant change exists. The agents commit anyway. Whatever else varies between models, in this experiment none reliably learned to say "there is no date, because there is no event".

## What this means, carefully

I want to be precise about the claim, because it's easy to overstate. This doesn't show that LLMs "can't revise fundamental assumptions". It shows that under this architecture, with these prompts, these four model configurations detected a change in their world's physics with near-perfect reliability and concluded it in zero of forty opportunities – while a scripted baseline agent using textbook statistics solved the same task ten times out of ten, proving the evidence was sufficient.

Where does the ceiling come from? I genuinely don't know yet. Two easy explanations now look insufficient: a larger model improved almost everything except the final diagnosis, and removing the explicit "prefer mundane explanations" instruction didn't remove the ceiling – it just added a false alarm. What remains is some mix of trained-in epistemic conservatism, the agent architecture itself, and the framing of the task. Finding out is the next study.

But I keep coming back to the deployment question. We are increasingly handing LLM agents exactly this shape of problem: watch a system, notice when something changes, work out what happened. Observer Zero suggests a failure mode worth testing in any deployed agent: models may excel at the noticing, flood you with plausible mundane explanations, occasionally invent the evidence for them – and systematically resist the conclusion that the ground truth itself has shifted. In monitoring, in science, in security, that last failure is sometimes the one that matters most.

They noticed when their world changed. They could not conclude that it had – except once, when it hadn't.

---

*The full technical report, all 150 run artifacts, and the complete platform (TypeScript, runnable for free with a scripted mock society) are open: paper and dataset at [doi.org/10.5281/zenodo.21872780](https://doi.org/10.5281/zenodo.21872780), code at [github.com/nickjlamb/observer-zero](https://github.com/nickjlamb/observer-zero).*

*A note on process, because it's part of the story: this project was itself a human–AI collaboration. The study was designed, challenged and interpreted in an ongoing three-way exchange – me, one AI system acting as an adversarial design reviewer, and another doing implementation and analysis – with every experimental decision and the final text reviewed and approved by me. The AIs that helped build the experiment are the same kind of systems that failed inside it, which is either an irony or a disclosure requirement. Probably both.*

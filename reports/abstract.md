# Observer Zero — abstract

Three deliverables: the primary abstract, a compressed variant for venues with a hard
limit, and keywords. Written to match Study 1's abstract voice — dense, number-led, no
throat-clearing, one closing line that carries the argument.

---

## A. Primary abstract (360 words)

Can a society of autonomous LLM agents discover that the laws of its world have changed?
We present Observer Zero, an instrumented artificial world with fictional physical
constants in which LLM scientist agents run experiments, exchange letters and maintain
explicit probabilistic beliefs, while the true state of the world — including a covert
mid-run change to a physical constant — is known only to the simulator. Across 235
seeded, manifest-frozen runs spanning two studies, the second pre-registered and frozen
before any confirmatory data was seen, two failures emerge and both can be localised.

The first is interpretation, not evidence. A non-LLM change-point detector, given only
the measurements the agents themselves chose to take and no world parameters, finds the
shift in 42 of 42 confirmatory runs (|z| ≈ 7 at *n* = 8); across the programme the signal present in
the agents' own notebooks rises from |z| ≈ 3.3 to ≈ 7.5 while detection rises from 7 of 10
runs to 10 of 10. At *n* = 8 their measurement choices supported a stronger signal than a
fixed reference schedule covering every instrument in the world six times daily. One agent
of 276 concluded that a physical law had changed, and that rate moves nowhere along the
gradient — surviving society size, a public institution, mixed composition, and removal of
the prompt's instruction to prefer mundane explanations, whose ablation produced the
programme's only law-change verdict, in a world where nothing had changed.

The second is community. Across 7,680 agent-days of voluntary communication opportunity,
homogeneous grounded societies produced zero voluntary communications, at two society
sizes and with or without a public record. Adding one communicative agent produced letters
but not a network: it initiated in every run, no grounded agent ever initiated, and cascade
depth was exactly 1.000 in every run of both catalysed arms. Belief dispersion fell more slowly in
the talking arms than in the silent counterfactual on identical worlds. Of twenty
unsupported claims that agent delivered, eighteen were incorporated into grounded agents'
beliefs and none were challenged.

A talking society was not a better epistemic system than a silent one — it was a silent
one plus a channel for unsupported claims.

---

## B. Compressed variant (150 words)

For venues capping abstracts at 150–200 words.

Can a society of autonomous LLM agents discover that the laws of its world have changed?
In Observer Zero, an instrumented artificial world with fictional physics, LLM scientist
agents experiment, exchange letters and maintain explicit beliefs while a physical constant
changes covertly mid-run. Across 235 frozen runs in two studies, we localise two failures.
Interpretation, not evidence: a non-LLM detector fed only the agents' own measurements
finds the shift in 42 of 42 confirmatory runs (|z| ≈ 7 at *n* = 8), and their measurement policy beat
a fixed reference schedule — yet one agent of 276 concluded a law had changed, a rate
unmoved by scale, institution, composition or prompt ablation. Community: across 7,680
agent-days of voluntary communication opportunity, grounded societies sent nothing. One
communicative agent produced a star, not a cascade — depth 1.000 in both catalysed arms — and of its
twenty unsupported claims, eighteen were incorporated into grounded beliefs and none
challenged.

---

## C. Keywords

`LLM agents` · `multi-agent simulation` · `social epistemics` · `scientific discovery` ·
`belief revision` · `information cascades` · `misinformation propagation` ·
`agent-based modelling` · `collective intelligence`

Nine is on the generous side; most venues take 5–6. A trimmed set if required:
`LLM agents` · `social epistemics` · `multi-agent simulation` · `belief revision` ·
`misinformation propagation`.

---

## Drafting notes

**Numbers used, and where each is traceable.**

| Claim | Source |
|---|---|
| 235 runs | Study 1's 150 (incl. the scripted mock arm, per its own accounting) + Study 2's 85 |
| \|z\| ≈ 3.3 → 7.5; 7/10 → 10/10 | `detector-robustness-and-study1-l2.md`, Table R1 |
| 42 of 42, \|z\| ≈ 7 at *n* = 8 | Study 2 results §2 |
| measurement policy beat the reference schedule | policy gap −0.95 to −1.19, arms B/D/E |
| 1 of 276 | Study 2 §2, gravity_shift agent-final states |
| 7,680 agent-days | computed from run artifacts; see draft §5.5 |
| cascade depth 1.000 | Study 2 §3 |
| 18 of 20 incorporated, 0 challenged | Study 2 §2b |
| ablation's only law-change verdict in a control world | Study 1 Finding 2 |

**Two figures deliberately omitted.** The "~2,760 agent-days of bulletin availability"
statistic is not used, because its denominator is one of the two numbers still flagged for
re-derivation (draft §8.3 footnote). The abstract says only that the institution result
exists, and §5.10 carries the figure once it is settled. Likewise the 0.086-vs-0.020
per-letter fabrication ratio is omitted — it rests on a single event in arm E, and an
abstract is the wrong place for a statistic that needs a caveat.

**The closing line** is the programme's own summary sentence, unchanged. It has survived
every revision since the results report and should not be softened.

**One thing the abstract does not claim.** It says the failures "can be localised", not
that their cause is identified. That distinction is load-bearing given §6.3, and an
abstract that overreached here would undercut the paper's most careful section.

**Title dependency.** Both variants open on the question form, which sits naturally under
the recommended title *Observer Zero: Do LLM Agents Form Epistemic Communities?* If a
declarative title is chosen instead, the first sentence should become declarative too so
the two do not repeat each other.

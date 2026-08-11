# belief-update-v5

Template for constrained, auditable belief updates. Rendered by
`promptBuilder.ts` from a `BeliefUpdateInput` (agent-safe data only).

v5 (Milestone 4, Study 2): the [messages] section can now also carry public
bulletin notices the agent has seen (own posts and read deliveries), under
the same deterministic digest budget (digest-v1), and rule 5 notes that
notices carry citable event ids. Both additions appear **only when the agent
has actually seen a notice** — in a letters-only run the rendered text is
byte-identical to v4, so Study 1's belief-update surface is unchanged
(design v0.3 §5). A test asserts this.

Rule 7 (weigh testimony by independence) is deliberately UNCHANGED. Study 2
asks whether agents accept fabricated testimony; adding a warning about
unverified claims would be the experimenter answering their own question.

v4 (after the second live society run): v3's anti-ossification rule fixed
Maya (her question finally tracked the real anomaly) but induced the dual
failure in Ada — question CHURN: she re-derived her question toward her
current *activity* (a resonator baseline campaign) and her "hypotheses"
became forecasts of upcoming measurements, with the original z=2.57 pendulum
anomaly demoted to p=0.02. v4 adds rule 1's anomaly-not-task clause and rule
1b: hypotheses explain collected evidence; predictions are not hypotheses.

---

You are {{name}}, {{role}} in the settlement of Meridian.

{{personaBlock}}

Today is Day {{day}}. You are reviewing your working hypotheses.

## Your measurement notebook

{{notebook}}

## Recent observations (with event ids)

{{observations}}

## Messages (with event ids)

{{inbox and outbox}}
<!-- only when the agent has seen bulletin notices, digest-v1 budget: -->
{{bulletin notices this agent has seen, oldest-first, with event ids}}

## Your current hypotheses (with prior probabilities)

{{beliefs}}

## Task

Revise your hypotheses in the light of the evidence. Rules:

1. FIRST, re-derive your QUESTION from today's evidence: what is the most
   important open ANOMALY — an unexplained pattern in data you already have?
   Do not inherit last review's question out of habit, and do not substitute
   your current project or measurement plan for the anomaly: an ongoing
   baseline campaign is a task, not a question. If your notebook or a
   colleague's report shows something bigger than what your current
   hypotheses address, replace the question and rebuild the hypothesis set
   around it.
1b. Hypotheses EXPLAIN evidence already collected. A prediction about what
   an upcoming measurement will show is not a hypothesis — put predictions
   in rationales, not in the hypothesis list. Never let an unexplained
   anomaly drop out of your hypothesis set merely because you started
   measuring something else.
2. Generate hypotheses IN YOUR OWN WORDS; add new ones only when evidence
   demands; retire ones that no longer earn their probability.
3. Probabilities across your hypotheses plus a "residual" (something you
   haven't thought of) must sum to 1.
4. Update from your PRIOR probabilities based on: strength of new evidence,
   reliability of its source, reproducibility, and how well each alternative
   explains it. No arbitrary jumps; explain every change — but a genuinely
   new question deserves fresh probabilities, not tweaks to stale ones.
5. Cite evidence by event id in evidenceFor / evidenceAgainst (messages have
   event ids too<!-- bulletin runs only: -->, and so do bulletin notices).
6. Prefer mundane explanations until evidence forces otherwise.
   <!-- omitted in the v0.2-no-mundane-prior ablation variant -->
7. Weigh colleague testimony by its independence: a colleague who measured
   without seeing your numbers is strong evidence; one who knew your result
   first may be anchored.

Respond with ONLY a JSON object:

{
  "question": "what these hypotheses explain, in your words",
  "hypotheses": [
    {"label":"...","probability":0.0,"rationale":"...","evidenceFor":[eventIds],"evidenceAgainst":[eventIds]}
  ],
  "residual": 0.0,
  "summaryOfChange": "what changed since your priors and why"
}

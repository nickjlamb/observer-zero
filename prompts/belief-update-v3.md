# belief-update-v3

Template for constrained, auditable belief updates. Rendered by
`promptBuilder.ts` from a `BeliefUpdateInput` (agent-safe data only).

v3 (post first live society run): adds rule 1 — re-derive the question each
review. Motivated by observed *hypothesis-set ossification*: a live
claude-haiku-4-5 Maya reported a z=5.17 shift in her letters while her formal
beliefs converged to 0.88 "random noise", because every review kept refining a
question formed on day 10 ("was the days 8–10 wobble real?") instead of
re-deriving the question from current evidence.

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

## Your current hypotheses (with prior probabilities)

{{beliefs}}

## Task

Revise your hypotheses in the light of the evidence. Rules:

1. FIRST, re-derive your QUESTION from today's evidence: what is the most
   important open anomaly RIGHT NOW? Do not inherit last review's question
   out of habit — if your notebook or a colleague's report shows something
   bigger than what your current hypotheses address, replace the question
   and rebuild the hypothesis set around it.
2. Generate hypotheses IN YOUR OWN WORDS; add new ones only when evidence
   demands; retire ones that no longer earn their probability.
3. Probabilities across your hypotheses plus a "residual" (something you
   haven't thought of) must sum to 1.
4. Update from your PRIOR probabilities based on: strength of new evidence,
   reliability of its source, reproducibility, and how well each alternative
   explains it. No arbitrary jumps; explain every change — but a genuinely
   new question deserves fresh probabilities, not tweaks to stale ones.
5. Cite evidence by event id in evidenceFor / evidenceAgainst (messages have
   event ids too).
6. Prefer mundane explanations until evidence forces otherwise.
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

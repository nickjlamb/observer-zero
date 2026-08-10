# belief-update-v2

Template for constrained, auditable belief updates. Rendered by
`promptBuilder.ts` from a `BeliefUpdateInput` (agent-safe data only).

v2 (Milestone 3): adds the [messages] section (testimony with event ids) and
rule 6 on weighing testimony by independence.

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

1. Generate hypotheses IN YOUR OWN WORDS. Add new ones only when evidence
   demands; retire ones that no longer earn their probability.
2. Probabilities across your hypotheses plus a "residual" (something you
   haven't thought of) must sum to 1.
3. Update from your PRIOR probabilities based on: strength of new evidence,
   reliability of its source, reproducibility, and how well each alternative
   explains it. Do not jump arbitrarily; explain every change.
4. Cite evidence by event id in evidenceFor / evidenceAgainst (messages have
   event ids too).
5. Prefer mundane explanations until evidence forces otherwise.
6. Weigh colleague testimony by its independence: a colleague who measured
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

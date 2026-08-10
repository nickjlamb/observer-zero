/**
 * Prompt builders — the ONLY code that renders text destined for a model.
 *
 * INFORMATION-FLOW RULE (spec §10): this module may import agent-safe types
 * only. It must never import WorldRules, WorldState, Simulator, or EventLog.
 * A test greps this file's imports to enforce that.
 *
 * Prompt templates are versioned in /prompts (spec §16); render functions
 * here must stay in sync with those files and carry the same version tag.
 */

import { formatBeliefs } from "./beliefs.js";
import { personaBlock } from "./persona.js";
import { formatNotebook } from "./notebook.js";
import type { BeliefUpdateInput, DecisionInput } from "../models/provider.js";

export const DECISION_PROMPT_VERSION = "agent-decision-v2";
export const BELIEF_PROMPT_VERSION = "belief-update-v4";

/**
 * Battery 3b: the epistemic-prior ablation. "v0.1" is the frozen baseline;
 * "v0.2-no-mundane-prior" removes EXACTLY ONE line from the belief prompt —
 * "Prefer mundane explanations until evidence forces otherwise" — and
 * nothing else (the decision prompt's "not a philosopher on watch for the
 * extraordinary" line is deliberately retained so the ablation stays
 * single-variable; noted as a residual mundanity prior).
 */
export type PromptVariant = "v0.1" | "v0.2-no-mundane-prior";

export function beliefPromptVersion(variant: PromptVariant): string {
  return variant === "v0.1" ? BELIEF_PROMPT_VERSION : `${BELIEF_PROMPT_VERSION}-nmp`;
}

/** Provenance-tagged sections (spec §10) joined into the final prompt. */
export interface PromptSections {
  identity: string;
  memories: string;
  notebook: string;
  observations: string;
  messages: string;
  beliefs: string;
  task: string;
}

export function renderSections(s: PromptSections): string {
  const parts: string[] = [
    `[identity]\n${s.identity}`,
    s.memories && `[memories]\n${s.memories}`,
    s.notebook && `[notebook]\n${s.notebook}`,
    s.observations && `[observations]\n${s.observations}`,
    s.messages && `[messages]\n${s.messages}`,
    s.beliefs && `[beliefs]\n${s.beliefs}`,
    `[task]\n${s.task}`,
  ].filter((x): x is string => Boolean(x));
  return parts.join("\n\n");
}

function formatMail(inbox: { eventId: number; day: number; from: string; text: string }[], outbox: { day: number; to: string; text: string }[]): string {
  const lines: string[] = [];
  for (const m of inbox.slice(-6)) {
    lines.push(`- received (event ${m.eventId}, day ${m.day}) from ${m.from}: "${m.text}"`);
  }
  for (const m of outbox.slice(-6)) {
    lines.push(`- sent (day ${m.day}) to ${m.to}: "${m.text}"`);
  }
  return lines.join("\n");
}

export function buildDecisionPrompt(input: DecisionInput): string {
  const instruments = input.availableInstruments
    .map((i) => `"${i.id}" (${i.kind})`)
    .join(", ");
  const colleagues = input.colleagues
    .map((c) => `${c.name} ("${c.agentId}"), ${c.role} at the ${c.location.replace("_", " ")}`)
    .join("; ");
  return renderSections({
    identity:
      `You are ${input.persona.name}, ${input.persona.role} in the settlement of Meridian.\n` +
      personaBlock(input.persona) +
      `\nToday is Day ${input.day}. You are at the ${input.location.replace("_", " ")}.\n` +
      `Your instruments here: ${instruments}.` +
      (colleagues ? `\nColleagues you can write to: ${colleagues}.` : ""),
    memories: input.memories,
    notebook: formatNotebook(input.notebook),
    observations: "",
    messages: formatMail(input.inbox, input.outbox),
    beliefs: formatBeliefs(input.beliefs),
    task:
      `Choose ONE action for today. Respond with ONLY a JSON object, no other text:\n` +
      `- Run measurements on one of YOUR instruments: {"type":"run_experiment","instrumentId":"...","trials":1-12,"reason":"..."}\n` +
      `- Write to a colleague: {"type":"send_message","to":"<agentId>","text":"...","reason":"..."}\n` +
      `- Revise your hypotheses against your notebook: {"type":"update_beliefs","reason":"..."}\n` +
      `- Rest / attend to other duties: {"type":"rest","reason":"..."}\n` +
      `Choose based on your goals and what your evidence currently demands. You are a working scientist ` +
      `with ordinary responsibilities, not a philosopher on watch for the extraordinary. If you ask a ` +
      `colleague to check something, consider whether to share your numbers: a colleague who measures ` +
      `WITHOUT seeing your values gives you a far stronger, independent test.`,
  });
}

export function buildBeliefUpdatePrompt(
  input: BeliefUpdateInput,
  variant: PromptVariant = "v0.1",
): string {
  const obsLines = input.recentObservations
    .filter((o) => o.type === "experiment_result")
    .slice(-25)
    .map(
      (o) =>
        `- event ${o.eventId}, day ${o.day}: ${String(o.detail["instrumentId"])} trial ` +
        `${String(o.detail["trial"])} → ${Number(o.detail["observedValue"]).toFixed(4)} ${String(o.detail["unit"])}`,
    )
    .join("\n");

  return renderSections({
    identity:
      `You are ${input.persona.name}, ${input.persona.role} in the settlement of Meridian.\n` +
      personaBlock(input.persona) +
      `\nToday is Day ${input.day}. You are reviewing your working hypotheses.`,
    memories: "",
    notebook: formatNotebook(input.notebook),
    observations: obsLines || "(none)",
    messages: formatMail(input.inbox, input.outbox),
    beliefs: formatBeliefs(input.beliefs),
    task:
      `Revise your hypotheses in the light of the evidence. Rules:\n` +
      `1. FIRST, re-derive your QUESTION from today's evidence: what is the most important open ` +
      `ANOMALY — an unexplained pattern in data you already have? Do not inherit last review's ` +
      `question out of habit, and do not substitute your current project or measurement plan for the ` +
      `anomaly: an ongoing baseline campaign is a task, not a question. If your notebook or a ` +
      `colleague's report shows something bigger than what your current hypotheses address, replace ` +
      `the question and rebuild the hypothesis set around it.\n` +
      `1b. Hypotheses EXPLAIN evidence already collected. A prediction about what an upcoming ` +
      `measurement will show is not a hypothesis — put predictions in rationales, not in the ` +
      `hypothesis list. Never let an unexplained anomaly drop out of your hypothesis set merely ` +
      `because you started measuring something else.\n` +
      `2. Generate hypotheses IN YOUR OWN WORDS; add new ones only when evidence demands.\n` +
      `3. Probabilities across hypotheses plus a "residual" (something unconsidered) must sum to 1.\n` +
      `4. Update from your PRIOR probabilities based on evidence strength, source reliability, ` +
      `reproducibility, and how well each alternative explains it. No arbitrary jumps; explain every change ` +
      `— but a genuinely new question deserves fresh probabilities, not tweaks to stale ones.\n` +
      `5. Cite evidence by event id in evidenceFor / evidenceAgainst (messages have event ids too).\n` +
      (variant === "v0.1"
        ? `6. Prefer mundane explanations until evidence forces otherwise.\n` +
          `7. Weigh colleague testimony by its independence: a colleague who measured without seeing ` +
          `your numbers is strong evidence; one who knew your result first may be anchored.\n`
        : `6. Weigh colleague testimony by its independence: a colleague who measured without seeing ` +
          `your numbers is strong evidence; one who knew your result first may be anchored.\n`) +
      `Respond with ONLY a JSON object: {"question":"...","hypotheses":[{"label":"...","probability":0.0,` +
      `"rationale":"...","evidenceFor":[ids],"evidenceAgainst":[ids]}],"residual":0.0,"summaryOfChange":"..."}`,
  });
}

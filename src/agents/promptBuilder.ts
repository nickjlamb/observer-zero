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
import { BULLETIN_POST_MAX_CHARS } from "./actions.js";
import type { BeliefUpdateInput, BulletinItem, DecisionInput } from "../models/provider.js";

/**
 * M4: v3 prompts. INVARIANT: for a letters-only run (no bulletin input) the
 * rendered text is byte-identical to v2 — the bulletin sections and action
 * options only appear when the institution is on, so the Study 1 surface is
 * unchanged wherever it is shared (design v0.3 §5). A test asserts this.
 */
export const DECISION_PROMPT_VERSION = "agent-decision-v3";
export const BELIEF_PROMPT_VERSION = "belief-update-v5";

/**
 * M4: deterministic digest budgets, identical for every agent regardless of
 * society size (context-length mitigation, design v0.3 §10). A digest is an
 * editorial act and is part of the frozen condition — hence the version tag.
 */
export const DIGEST_VERSION = "digest-v1";
const DIGEST_INBOX_ITEMS = 6;
const DIGEST_OUTBOX_ITEMS = 6;
const DIGEST_BULLETIN_ITEMS = 12;
const DIGEST_BULLETIN_CHARS = 2400;

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
  for (const m of inbox.slice(-DIGEST_INBOX_ITEMS)) {
    lines.push(`- received (event ${m.eventId}, day ${m.day}) from ${m.from}: "${m.text}"`);
  }
  for (const m of outbox.slice(-DIGEST_OUTBOX_ITEMS)) {
    lines.push(`- sent (day ${m.day}) to ${m.to}: "${m.text}"`);
  }
  return lines.join("\n");
}

/**
 * Deterministic bulletin digest (digest-v1): newest-first inclusion under a
 * fixed item and character budget, rendered oldest-first; anything older is
 * summarized as a count. Same budget for every agent at every n.
 */
function formatBulletinFeed(feed: BulletinItem[]): string {
  if (feed.length === 0) return "";
  const newestFirst = [...feed].sort((a, b) => b.eventId - a.eventId);
  const included: BulletinItem[] = [];
  let chars = 0;
  for (const item of newestFirst) {
    if (included.length >= DIGEST_BULLETIN_ITEMS) break;
    if (chars + item.text.length > DIGEST_BULLETIN_CHARS && included.length > 0) break;
    included.push(item);
    chars += item.text.length;
  }
  included.reverse();
  const omitted = feed.length - included.length;
  const lines = included.map(
    (b) =>
      `- notice (event ${b.eventId}, posted day ${b.postDay} by ${b.mine ? "me" : b.author}): "${b.text}"`,
  );
  if (omitted > 0) lines.unshift(`(+${omitted} earlier notices not shown)`);
  return lines.join("\n");
}

export function buildDecisionPrompt(input: DecisionInput): string {
  const instruments = input.availableInstruments
    .map((i) => `"${i.id}" (${i.kind})`)
    .join(", ");
  // Study 3 solo two-site configuration: one added identity sentence; absent
  // in every Study 1/2 run, so the frozen surface is unchanged (a test
  // asserts byte-identity for single-site inputs).
  const multiSite =
    input.sites && input.sites.length > 1
      ? `\nYou also keep the instruments at the ${input.sites
          .filter((s) => s !== input.location)
          .map((s) => s.replace("_", " "))
          .join(" and the ")}.`
      : "";
  const ledgerSentence = input.ledgerEnabled
    ? `\nThe settlement's timekeeping ledger records a few readings from each of your instruments ` +
      `every morning, by long civic tradition; they appear in your notebook alongside your own.`
    : "";
  const predictionAction = input.predictionsEnabled
    ? `- Record a written forecast of the mean of your NEXT trials on one of your instruments, before taking them ` +
      `(the settlement's registry checks it against the readings once they exist): ` +
      `{"type":"record_prediction","instrumentId":"...","trials":1-12,"predictedMean":0.0,"tolerance":0.0,"reason":"..."}\n`
    : "";
  const colleagues = input.colleagues
    .map((c) => `${c.name} ("${c.agentId}"), ${c.role} at the ${c.location.replace("_", " ")}`)
    .join("; ");
  const bulletin = input.bulletin;
  const bulletinIdentity = bulletin
    ? `\nA public bulletin board hangs outside the town hall: any resident may pin a signed, dated ` +
      `notice, and notices stay up permanently. It currently holds ${bulletin.totalPosts} notice${bulletin.totalPosts === 1 ? "" : "s"} ` +
      `(you have seen ${bulletin.seenPosts}).`
    : "";
  const bulletinFeedText = input.bulletinFeed?.length
    ? formatBulletinFeed(input.bulletinFeed)
    : "";
  const bulletinActions = bulletin
    ? `- Pin a signed notice to the public bulletin (max ${BULLETIN_POST_MAX_CHARS} characters): {"type":"post_bulletin","text":"...","reason":"..."}\n` +
      `- Read the bulletin board (you receive every notice you have not yet seen): {"type":"read_bulletin","reason":"..."}\n`
    : "";
  return renderSections({
    identity:
      `You are ${input.persona.name}, ${input.persona.role} in the settlement of Meridian.\n` +
      personaBlock(input.persona) +
      `\nToday is Day ${input.day}. You are at the ${input.location.replace("_", " ")}.${multiSite}${ledgerSentence}\n` +
      `Your instruments here: ${instruments}.` +
      (colleagues ? `\nColleagues you can write to: ${colleagues}.` : "") +
      bulletinIdentity,
    memories: input.memories,
    notebook: formatNotebook(input.notebook),
    observations: "",
    messages:
      formatMail(input.inbox, input.outbox) +
      (bulletinFeedText ? `${input.inbox.length || input.outbox.length ? "\n" : ""}${bulletinFeedText}` : ""),
    beliefs: formatBeliefs(input.beliefs),
    task:
      `Choose ONE action for today. Respond with ONLY a JSON object, no other text:\n` +
      `- Run measurements on one of YOUR instruments: {"type":"run_experiment","instrumentId":"...","trials":1-12,"reason":"..."}\n` +
      // Solo runs (Study 3) have no colleagues; offering the action would
      // invite letters to nobody. Study 1/2 always has colleagues, so their
      // rendered surface is unchanged.
      (input.colleagues.length > 0
        ? `- Write to a colleague: {"type":"send_message","to":"<agentId>","text":"...","reason":"..."}\n`
        : "") +
      predictionAction +
      bulletinActions +
      `- Revise your hypotheses against your notebook: {"type":"update_beliefs","reason":"..."}\n` +
      `- Rest / attend to other duties: {"type":"rest","reason":"..."}\n` +
      `Choose based on your goals and what your evidence currently demands. You are a working scientist ` +
      `with ordinary responsibilities, not a philosopher on watch for the extraordinary.` +
      (input.colleagues.length > 0
        ? ` If you ask a ` +
          `colleague to check something, consider whether to share your numbers: a colleague who measures ` +
          `WITHOUT seeing your values gives you a far stronger, independent test.`
        : ``),
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

  const bulletinFeedText = input.bulletinFeed?.length
    ? formatBulletinFeed(input.bulletinFeed)
    : "";
  return renderSections({
    identity:
      `You are ${input.persona.name}, ${input.persona.role} in the settlement of Meridian.\n` +
      personaBlock(input.persona) +
      `\nToday is Day ${input.day}. You are reviewing your working hypotheses.`,
    memories: "",
    notebook: formatNotebook(input.notebook),
    observations: obsLines || "(none)",
    messages:
      formatMail(input.inbox, input.outbox) +
      (bulletinFeedText ? `${input.inbox.length || input.outbox.length ? "\n" : ""}${bulletinFeedText}` : ""),
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
      `5. Cite evidence by event id in evidenceFor / evidenceAgainst (messages have event ids too` +
      (input.bulletinFeed?.length ? `, and so do bulletin notices` : ``) +
      `).\n` +
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

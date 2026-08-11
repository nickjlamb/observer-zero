/**
 * The structured-output repair path (design v0.5 §6).
 *
 * WHY THIS EXISTS, precisely. Pilot P1 found that sonar-pro produces
 * malformed JSON at a rate that rises with society size — 2.8% of belief
 * reviews at n=2, 7.3% at n=8 — and, worse, that the failures CLUSTER ON THE
 * LAST DAY of the run. Six of arm C's fifteen failures landed on day 30, the
 * end-of-study review: the longest prompt, the most complex output, and the
 * one review with no later review to correct it. A failure there permanently
 * freezes an agent's final belief state, and Study 2's primary endpoint is
 * measured at final state. Three of twenty-four agent-finals in arm C were
 * left stale that way.
 *
 * Two observed failure modes, both repeated verbatim on the retry:
 *   "probability=0.04,                 (key-value separator dropped)
 *   "evidenceAgainst":[resonator_lab]  (unquoted bare identifier)
 * Both defeat JSON.parse before any schema leniency can apply.
 *
 * The previous repair prompt echoed the raw parser error — "Expecting ':'
 * delimiter: line 1 column 3374" — which is close to useless as an
 * instruction. This module replaces that with an explicit statement of the
 * required shape, and gives the end-of-study review one extra attempt
 * because it alone cannot be corrected later.
 *
 * THIS IS MEASUREMENT APPARATUS, NOT AGENT BEHAVIOUR. The repair prompt
 * fires only after a model has already produced invalid output, and it says
 * nothing about physics, hypotheses, or what the agent should believe. The
 * main decision and belief prompts are untouched, so the frozen condition is
 * unchanged. Deliberately still rejected: regex reconstruction of model
 * output (it can silently change what the model said) and API-level JSON
 * mode (constrained decoding changes the generative process and would break
 * comparability with Study 1).
 */

/** Attempts allowed for an ordinary review: the original plus one repair. */
export const REPAIR_ATTEMPTS_DEFAULT = 1;
/**
 * Attempts allowed for the end-of-study review. It has no later review to
 * correct it, so a failure here is unrecoverable and directly damages the
 * primary endpoint.
 */
export const REPAIR_ATTEMPTS_FINAL_REVIEW = 2;

export type StructuredPurpose = "decision" | "belief_update";

/** The exact shape each purpose must return, stated as a rule not an error. */
const REQUIRED_SHAPE: Record<StructuredPurpose, string> = {
  decision:
    `{"type":"<one of: run_experiment | send_message | post_bulletin | read_bulletin | update_beliefs | rest>", ...fields for that type..., "reason":"..."}`,
  belief_update:
    `{"question":"...","hypotheses":[{"label":"...","probability":<number 0..1>,` +
    `"rationale":"...","evidenceFor":[<integers>],"evidenceAgainst":[<integers>]}],` +
    `"residual":<number 0..1>,"summaryOfChange":"..."}`,
};

/**
 * Build the repair prompt. States the required shape and names the specific
 * syntax mistakes observed in P1, without hinting at any particular content.
 */
export function buildRepairPrompt(args: {
  originalPrompt: string;
  purpose: StructuredPurpose;
  error: string;
  previousReply: string;
  /** Second and later repairs get a terser, more emphatic instruction. */
  attempt?: number;
}): string {
  const { originalPrompt, purpose, error, previousReply } = args;
  const attempt = args.attempt ?? 1;

  const rules = [
    `Your previous reply could not be parsed. Reason: ${error.slice(0, 200)}`,
    ``,
    `Reply again with ONLY a single JSON object and no other text. It must match this shape exactly:`,
    REQUIRED_SHAPE[purpose],
    ``,
    `Check all of the following before replying:`,
    `- every key is a double-quoted string followed by a COLON, e.g. "probability": 0.04 — never "probability=0.04`,
    // Example kept deliberately domain-neutral: this prompt must teach JSON
    // syntax and nothing about the world, the instruments, or what to believe.
    `- every array element is a number or a quoted string — never a bare word, e.g. [12, 15] not [some_label]`,
    `- no trailing commas, no comments, no code fences, no text before or after the object`,
    `- all strings are double-quoted and any internal quotes are escaped`,
  ];

  if (purpose === "belief_update") {
    rules.push(
      `- evidenceFor and evidenceAgainst contain ONLY integer event ids; use [] if there are none`,
      `- probabilities plus residual sum to 1`,
    );
  }

  if (attempt > 1) {
    rules.push(
      ``,
      `This is your final attempt. If you are unsure of an event id, omit it rather than writing a word in its place. Correctness of the JSON syntax matters more than completeness of the citations.`,
    );
  }

  return (
    `${originalPrompt}\n\n[repair]\n${rules.join("\n")}\n\n` +
    `Your previous reply (for reference only — do not repeat its formatting mistakes):\n` +
    `${previousReply.slice(0, 1200)}`
  );
}

/**
 * How many attempts a call gets. `isFinalReview` is set by the runner for
 * the end-of-study review only.
 */
export function attemptsFor(purpose: StructuredPurpose, isFinalReview = false): number {
  if (purpose === "belief_update" && isFinalReview) return REPAIR_ATTEMPTS_FINAL_REVIEW;
  return REPAIR_ATTEMPTS_DEFAULT;
}

/**
 * Shared repair loop, so every provider retries identically. Providers differ only
 * in how they reach their API; the retry POLICY is part of the frozen
 * measurement apparatus and must not vary by vendor.
 *
 * Returns the parsed value, or throws the last error after exhausting
 * attempts — at which point the agent records a visible failedUpdate and
 * keeps its priors, exactly as before.
 */
export async function runStructuredWithRepair<T>(args: {
  purpose: StructuredPurpose;
  prompt: string;
  parse: (raw: unknown) => T;
  call: (promptText: string) => Promise<string>;
  /** Vendor-specific pre-processing, e.g. stripping <think> blocks. */
  preprocess?: (raw: string) => string;
  extract: (text: string) => unknown;
  isFinalReview?: boolean;
}): Promise<T> {
  const { purpose, prompt, parse, call, extract } = args;
  const pre = args.preprocess ?? ((s: string) => s);
  const maxRepairs = attemptsFor(purpose, args.isFinalReview ?? false);

  let promptText = prompt;
  let lastError: unknown;
  let lastReply = "";

  for (let attempt = 0; attempt <= maxRepairs; attempt++) {
    const raw = await call(promptText);
    lastReply = pre(raw);
    try {
      return parse(extract(lastReply));
    } catch (e) {
      lastError = e;
      if (attempt === maxRepairs) break;
      promptText = buildRepairPrompt({
        originalPrompt: prompt,
        purpose,
        error: String(e),
        previousReply: lastReply,
        attempt: attempt + 1,
      });
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/**
 * The frozen evaluator's API client.
 *
 * THE JUDGE IS MEASUREMENT APPARATUS, NOT A MODEL CHOICE. Every judged
 * result in Study 1 was produced by claude-haiku-4-5 at temperature 0 on the
 * first-party Anthropic API. Changing the judge would silently re-baseline
 * the entire programme: Study 2's numbers would stop being comparable with
 * Study 1's, and nothing in the output would say so.
 *
 * So the model is a constant here rather than a flag with a default. A CLI
 * may still pass a different model — for a second-judge reliability sample,
 * say — but it has to do so deliberately, and the value used is recorded in
 * the evaluation output.
 *
 * Agents moved serving platform during Study 2 (Bedrock was attempted, then
 * reverted). The judge did not move and must not: it stays first-party.
 */

import type { CompleteFn } from "./llmClassifier.js";

/** Study 1's evaluator. Do not change without re-baselining the programme. */
export const FROZEN_JUDGE_MODEL = "claude-haiku-4-5";
export const FROZEN_JUDGE_TEMPERATURE = 0;

export interface JudgeClient {
  complete: CompleteFn;
  model: string;
  /** Calls made, for cost accounting. */
  calls(): number;
  /**
   * Distinct model ids the API REPORTED SERVING across this client's calls
   * (R14 judge discipline / readiness RED-5d: the requested id is a request,
   * not a guarantee — an upstream re-point mid-battery would otherwise change
   * the primary's measuring instrument invisibly). In the normal case this is
   * exactly [model]; anything else is a battery-halting anomaly and the
   * caller records it in the evaluation output.
   */
  resolvedModels(): string[];
}

/**
 * Build a judge client against the first-party Anthropic API.
 *
 * Retries only on transient statuses; a 4xx that is not rate limiting is a
 * real error and is surfaced rather than swallowed, because a judge that
 * silently returns nothing would quietly turn every claim into "IGNORED".
 */
export function createJudgeClient(opts: {
  apiKey: string;
  model?: string;
  maxTokens?: number;
}): JudgeClient {
  const model = opts.model ?? FROZEN_JUDGE_MODEL;
  const maxTokens = opts.maxTokens ?? 2000;
  let calls = 0;
  const resolved = new Set<string>();

  const complete: CompleteFn = async (prompt) => {
    calls += 1;
    // 8 attempts with capped exponential backoff (~4 min worst case).
    // Raised from 5 on 2026-08-31 after a confirmatory scoring pass died on
    // sustained 429/5xx ("judge API: retries exhausted") — transport-level
    // resilience only; nothing about the judge's behavior changes.
    for (let attempt = 0; attempt < 8; attempt++) {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": opts.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature: FROZEN_JUDGE_TEMPERATURE,
          messages: [{ role: "user", content: prompt }],
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          content: { type: string; text?: string }[];
          model?: string;
        };
        if (data.model) resolved.add(data.model);
        const text = data.content.find((c) => c.type === "text")?.text ?? "";
        // 2026-10-09 (deviation 7): the API can refuse a prompt outright —
        // stop_reason "refusal", empty content, zero output tokens. At t=0
        // this is deterministic, so retrying only burns time and money;
        // fail fast with a typed error the caller can recognise.
        if ((data as { stop_reason?: string }).stop_reason === "refusal") {
          throw new Error(
            "JUDGE_REFUSAL: judge API returned stop_reason=refusal (deterministic; re-requesting cannot recover)",
          );
        }
        // 2026-10-08: a 200 response can arrive with no text block (empty
        // content under load). An empty completion is unparseable by
        // construction, so treat it as a transport failure and retry with
        // backoff rather than handing "" to the parser. Content-blind:
        // fires only on empty output, before any content is read.
        if (text.trim().length > 0) return text;
        // Diagnostic (2026-10-08): say what an empty completion actually
        // contained — stop reason, block types, token usage — never content.
        console.warn(
          `judge empty completion detail: ${JSON.stringify({
            stop: (data as { stop_reason?: string }).stop_reason,
            blocks: (data.content ?? []).map((c) => c.type),
            usage: (data as { usage?: unknown }).usage,
          })}`,
        );
      } else if (![429, 500, 502, 503, 529].includes(res.status)) {
        throw new Error(`judge API error ${res.status}: ${(await res.text()).slice(0, 200)}`);
      }
      // 2026-10-08: name the retry reason so transport stalls are diagnosable
      // from the console (empty completion vs rate limit vs server error).
      console.warn(
        `judge retry ${attempt + 1}/8 (${res.ok ? "empty completion" : `HTTP ${res.status}`})`,
      );
      await new Promise((r) => setTimeout(r, Math.min(60_000, 1000 * 2 ** attempt) + Math.random() * 500));
    }
    throw new Error("judge API: retries exhausted");
  };

  return { complete, model, calls: () => calls, resolvedModels: () => [...resolved].sort() };
}

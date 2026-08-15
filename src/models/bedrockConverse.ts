/**
 * Bedrock Converse provider — NON-Claude models on Amazon Bedrock.
 *
 * WHY THIS EXISTS (design v0.3 R19 / B4). `bedrock.ts` speaks the Anthropic
 * Bedrock SDK, so it reaches Claude and nothing else — and a second Claude is
 * not a second model family. Bedrock's *Converse* API is the vendor-neutral
 * surface that serves Amazon Nova, Mistral, Meta Llama, Cohere and DeepSeek,
 * which ARE independent lineages. This module is what makes the AWS credit
 * buy a family rather than a duplicate.
 *
 * Model names carry the `bedrock-converse:` prefix so the serving platform is
 * legible in every arm definition, battery index and run manifest, exactly as
 * `bedrock:` is:
 *
 *   bedrock-converse:amazon.nova-pro-v1:0
 *   bedrock-converse:mistral.mistral-large-2407-v1:0
 *
 * AUTH: two modes, bearer first.
 *   - Bearer (AWS_BEARER_TOKEN_BEDROCK): a Bedrock API key, sent as an
 *     Authorization header. Simple, and the credential this project already
 *     has provisioned.
 *   - SigV4 (AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY [/ AWS_SESSION_TOKEN]):
 *     hand-rolled with node:crypto so no AWS SDK dependency enters the tree.
 *
 * VALIDATION HONESTY: the signing implementation is unit-tested for
 * self-consistency and sensitivity (see test/study3.test.ts), not against
 * AWS's published vectors. Only a live call can confirm it, which is why
 * `npm run bedrock-check -- --converse <modelId>` exists and why no
 * confirmatory run may use this path before that check passes.
 */

import { createHash, createHmac } from "node:crypto";
import { AgentActionSchema, REST_FALLBACK, type AgentAction } from "../agents/actions.js";
import { BeliefUpdateSchema, type BeliefUpdate } from "../agents/beliefs.js";
import {
  beliefPromptVersion,
  buildBeliefUpdatePrompt,
  buildDecisionPrompt,
  DECISION_PROMPT_VERSION,
  type PromptVariant,
} from "../agents/promptBuilder.js";
import { extractJson } from "./anthropic.js";
import { stripThink } from "./perplexity.js";
import { runStructuredWithRepair } from "./repair.js";
import type {
  BeliefUpdateInput,
  CallLog,
  DecisionInput,
  ModelProvider,
} from "./provider.js";

export const CONVERSE_PREFIX = "bedrock-converse:";

export function isConverseModel(model: string): boolean {
  return model.startsWith(CONVERSE_PREFIX);
}

/** Strip the routing prefix, leaving the Bedrock model id. */
export function converseModelId(model: string): string {
  return model.startsWith(CONVERSE_PREFIX) ? model.slice(CONVERSE_PREFIX.length) : model;
}

// ---------------------------------------------------------------------------
// SigV4 (no SDK)
// ---------------------------------------------------------------------------

const sha256Hex = (s: string | Buffer): string => createHash("sha256").update(s).digest("hex");
const hmac = (key: string | Buffer, data: string): Buffer =>
  createHmac("sha256", key).update(data, "utf8").digest();

export interface SigV4Input {
  method: string;
  /** Already-encoded canonical path, e.g. /model/foo%3A0/converse */
  path: string;
  host: string;
  region: string;
  service: string;
  payload: string;
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string | undefined;
  /** ISO basic format, e.g. 20260815T120000Z — injected so tests are stable. */
  amzDate: string;
}

/** Returns the headers SigV4 requires, Authorization included. */
export function signV4(input: SigV4Input): Record<string, string> {
  const dateStamp = input.amzDate.slice(0, 8);
  const scope = `${dateStamp}/${input.region}/${input.service}/aws4_request`;

  const headers: Record<string, string> = {
    host: input.host,
    "x-amz-date": input.amzDate,
  };
  if (input.sessionToken) headers["x-amz-security-token"] = input.sessionToken;

  const signedHeaders = Object.keys(headers).sort().join(";");
  const canonicalHeaders = Object.keys(headers)
    .sort()
    .map((k) => `${k}:${headers[k]!.trim()}\n`)
    .join("");

  const canonicalRequest = [
    input.method,
    input.path,
    "", // no query string
    canonicalHeaders,
    signedHeaders,
    sha256Hex(input.payload),
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    input.amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  const kDate = hmac(`AWS4${input.secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, input.region);
  const kService = hmac(kRegion, input.service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = createHmac("sha256", kSigning).update(stringToSign, "utf8").digest("hex");

  return {
    ...headers,
    authorization:
      `AWS4-HMAC-SHA256 Credential=${input.accessKeyId}/${scope}, ` +
      `SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface BedrockConverseConfig {
  model: string;
  maxTokens?: number;
  temperature?: number;
  promptVariant?: PromptVariant;
  region?: string;
  /** Bearer token; falls back to AWS_BEARER_TOKEN_BEDROCK. */
  apiKey?: string;
  /** Injected in tests so no network is touched. */
  fetchImpl?: typeof fetch;
  /** Injected in tests for deterministic signing. */
  nowIso?: () => string;
}

/**
 * Per-1M-token prices, used only for the run's cost accounting. Bedrock
 * pricing is per-model and changes; these are conservative placeholders and
 * the manifest records the model id, so a later correction is arithmetic on
 * stored token counts rather than a re-run.
 */
const PRICING: Record<string, [number, number]> = {
  "amazon.nova-pro-v1:0": [0.8, 3.2],
  "amazon.nova-lite-v1:0": [0.06, 0.24],
  "mistral.mistral-large-2407-v1:0": [2, 6],
  "meta.llama3-3-70b-instruct-v1:0": [0.72, 0.72],
};

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export class BedrockConverseProvider implements ModelProvider {
  readonly name: string;
  readonly temperature: number;
  private modelId: string;
  private region: string;
  private maxTokens: number;
  private variant: PromptVariant;
  private doFetch: typeof fetch;
  private nowIso: () => string;

  constructor(
    private config: BedrockConverseConfig,
    private log: CallLog,
  ) {
    this.modelId = converseModelId(config.model);
    this.name = `${CONVERSE_PREFIX}${this.modelId}`;
    this.region = config.region ?? process.env["AWS_REGION"] ?? "us-east-1";
    this.maxTokens = config.maxTokens ?? 4096;
    this.temperature = config.temperature ?? 1.0;
    this.variant = config.promptVariant ?? "v0.1";
    this.doFetch = config.fetchImpl ?? fetch;
    this.nowIso = config.nowIso ?? (() => new Date().toISOString());
  }

  /** URL and headers for one Converse call. */
  private request(payload: string): { url: string; headers: Record<string, string> } {
    const host = `bedrock-runtime.${this.region}.amazonaws.com`;
    // The model id contains dots and a colon; the colon must be percent-encoded
    // in both the request path and the canonical path, or the signature will
    // not match what AWS recomputes.
    const encodedId = encodeURIComponent(this.modelId);
    const path = `/model/${encodedId}/converse`;
    const url = `https://${host}${path}`;

    const bearer = this.config.apiKey ?? process.env["AWS_BEARER_TOKEN_BEDROCK"];
    if (bearer) {
      return {
        url,
        headers: { "content-type": "application/json", authorization: `Bearer ${bearer}` },
      };
    }

    const accessKeyId = process.env["AWS_ACCESS_KEY_ID"];
    const secretAccessKey = process.env["AWS_SECRET_ACCESS_KEY"];
    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        "Bedrock Converse needs AWS_BEARER_TOKEN_BEDROCK, or AWS_ACCESS_KEY_ID + AWS_SECRET_ACCESS_KEY",
      );
    }
    const amzDate = this.nowIso().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const signed = signV4({
      method: "POST",
      path,
      host,
      region: this.region,
      service: "bedrock",
      payload,
      accessKeyId,
      secretAccessKey,
      sessionToken: process.env["AWS_SESSION_TOKEN"],
      amzDate,
    });
    return { url, headers: { "content-type": "application/json", ...signed } };
  }

  private async call(
    agentId: string,
    day: number,
    purpose: "decision" | "belief_update",
    promptText: string,
  ): Promise<string> {
    const payload = JSON.stringify({
      messages: [{ role: "user", content: [{ text: promptText }] }],
      inferenceConfig: { maxTokens: this.maxTokens, temperature: this.temperature },
    });
    const started = Date.now();
    let res: Response | null = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const { url, headers } = this.request(payload);
      res = await this.doFetch(url, { method: "POST", headers, body: payload });
      if (res.ok || ![429, 500, 502, 503, 529].includes(res.status)) break;
      await sleep(1000 * 2 ** attempt + Math.random() * 500);
    }
    const latencyMs = Date.now() - started;
    const promptVersion =
      purpose === "decision" ? DECISION_PROMPT_VERSION : beliefPromptVersion(this.variant);

    if (!res || !res.ok) {
      const body = res ? await res.text() : "no response";
      this.log.append({
        agentId, day, purpose, model: this.name, temperature: this.temperature,
        promptVersion, promptText, completionText: "",
        inputTokens: 0, outputTokens: 0, estimatedCostUSD: 0, latencyMs, ok: false,
        error: `HTTP ${res?.status ?? "?"}: ${body.slice(0, 300)}`,
      });
      throw new Error(`Bedrock Converse error ${res?.status ?? "?"}: ${body.slice(0, 200)}`);
    }

    const data = (await res.json()) as {
      output?: { message?: { content?: { text?: string }[] } };
      usage?: { inputTokens?: number; outputTokens?: number };
    };
    const text = data.output?.message?.content?.map((c) => c.text ?? "").join("") ?? "";
    const inTok = data.usage?.inputTokens ?? Math.ceil(promptText.length / 4);
    const outTok = data.usage?.outputTokens ?? Math.ceil(text.length / 4);
    const [inPrice, outPrice] = PRICING[this.modelId] ?? [1, 3];
    this.log.append({
      agentId, day, purpose, model: this.name, temperature: this.temperature,
      promptVersion, promptText, completionText: text,
      inputTokens: inTok, outputTokens: outTok,
      estimatedCostUSD: (inTok / 1e6) * inPrice + (outTok / 1e6) * outPrice,
      latencyMs, ok: true,
    });
    return text;
  }

  async decide(input: DecisionInput): Promise<AgentAction> {
    const prompt = buildDecisionPrompt(input);
    try {
      return await runStructuredWithRepair({
        purpose: "decision",
        prompt,
        call: (p) => this.call(input.persona.agentId, input.day, "decision", p),
        preprocess: stripThink,
        extract: extractJson,
        parse: (raw) => AgentActionSchema.parse(raw),
      });
    } catch {
      return REST_FALLBACK;
    }
  }

  async updateBeliefs(input: BeliefUpdateInput): Promise<BeliefUpdate> {
    const prompt = buildBeliefUpdatePrompt(input, this.variant);
    return runStructuredWithRepair({
      purpose: "belief_update",
      prompt,
      call: (p) => this.call(input.persona.agentId, input.day, "belief_update", p),
      preprocess: stripThink,
      extract: extractJson,
      parse: (raw) => BeliefUpdateSchema.parse(raw),
      isFinalReview: input.isFinalReview ?? false,
    });
  }
}

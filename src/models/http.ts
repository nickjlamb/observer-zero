/**
 * Shared HTTP transport policy for model providers (design v0.3 R19 / B4).
 *
 * WHY THIS EXISTS. The gemini-3.7-flash smoke run (runs/s3-smoke-gemini,
 * seed 9111) exposed two transport defects that no unit test would have
 * caught, because both are properties of the network, not of our code:
 *
 *   1. NO REQUEST DEADLINE. One decision call sat in `fetch` for 25,607
 *      seconds — seven hours — and another for 4,164 seconds. `fetch` has no
 *      default timeout, so a connection that is accepted and then never
 *      answered stalls a run forever. That single run took 13.5 wall-clock
 *      hours to produce 40 simulated days. On a confirmatory battery of ~200
 *      runs this is not slow, it is unfinishable.
 *
 *   2. BACKOFF AGAINST A DAILY QUOTA IS FUTILE. 25 of 49 calls failed with
 *      HTTP 429 "You exceeded your current quota". A per-DAY quota does not
 *      refill within a retry window, so seven exponential attempts
 *      (4+8+16+32+64+128+256s ≈ 508s) burned 8.5 minutes per call to arrive
 *      at the same 429, twenty-five times. Worse, each such call then fell
 *      back to `rest` and the run CONTINUED, producing an artifact that
 *      looked superficially valid (leak-clean, final level L0) while half
 *      its decision days were fabricated by the fallback.
 *
 * The policy here is deliberately asymmetric: be patient with per-minute
 * limits (they are the normal path on a free tier and they do refill), and
 * fail FAST and LOUDLY on per-day exhaustion (it will not refill before the
 * run ends, so every further attempt is waste that also corrupts the run).
 *
 * CLOSED-WORLD NOTE: nothing here touches prompt content. This is transport
 * only, so it cannot alter the frozen condition.
 */

/** Default per-request deadline. Generous enough for a slow reasoning model
 *  on a long prompt (observed healthy p95 ≈ 80s), short enough that a hung
 *  socket cannot eat a battery. */
export const REQUEST_TIMEOUT_MS = 180_000;

/** Retry-worthy statuses. 429 is conditional — see classifyRateLimit. */
export const RETRYABLE_STATUS = [429, 500, 502, 503, 529];

/** Upper bound on an honoured server-supplied Retry-After / RetryInfo delay.
 *  A server asking us to wait 20 minutes is telling us to stop, not to wait. */
export const MAX_HONOURED_RETRY_MS = 90_000;

export class QuotaExhaustedError extends Error {
  readonly quotaId: string;
  constructor(model: string, quotaId: string) {
    super(
      `${model}: daily quota exhausted (${quotaId}). Further calls in this run ` +
        `would fail identically, so the provider is now short-circuited. ` +
        `This run is INVALID for analysis — see runHealth in the artifact.`,
    );
    this.name = "QuotaExhaustedError";
    this.quotaId = quotaId;
  }
}

export interface RateLimitVerdict {
  /** True when the exhausted quota is per-day (or longer) and cannot refill
   *  inside this run. */
  daily: boolean;
  /** Server-requested delay in ms, if one was supplied and is sane. */
  retryAfterMs?: number;
  /** Best-effort quota identifier for the log. */
  quotaId: string;
}

/**
 * Decide whether a 429 is worth waiting out.
 *
 * Recognises the three shapes we actually receive:
 *   - Google:  {"error":{"details":[{"@type":"...QuotaFailure","violations":
 *              [{"quotaId":"GenerateRequestsPerDayPerProjectPerModel"}]},
 *              {"@type":"...RetryInfo","retryDelay":"41s"}]}}
 *   - Mistral/Groq/Cerebras: a Retry-After header (passed in separately) and
 *              free-text bodies mentioning "per day" / "daily".
 *   - Anything else: treated as a transient per-minute limit, i.e. retry.
 *
 * The default is deliberately the patient one: a misread per-minute limit
 * costs a few seconds, whereas a misread per-day limit costs hours.
 */
export function classifyRateLimit(body: string, retryAfterHeader?: string | null): RateLimitVerdict {
  let quotaId = "";
  let retryAfterMs: number | undefined;

  if (retryAfterHeader) {
    const secs = Number(retryAfterHeader);
    if (Number.isFinite(secs) && secs > 0) retryAfterMs = secs * 1000;
  }

  try {
    const parsed = JSON.parse(body) as {
      error?: { details?: { "@type"?: string; violations?: { quotaId?: string }[]; retryDelay?: string }[] };
    };
    for (const detail of parsed.error?.details ?? []) {
      for (const v of detail.violations ?? []) {
        if (v.quotaId) quotaId = quotaId ? `${quotaId},${v.quotaId}` : v.quotaId;
      }
      if (detail.retryDelay) {
        const m = /^([\d.]+)s$/.exec(detail.retryDelay);
        if (m) retryAfterMs = Math.round(Number(m[1]) * 1000);
      }
    }
  } catch {
    // Non-JSON body; fall through to the text heuristics below.
  }

  const haystack = `${quotaId} ${body}`.toLowerCase();
  // "PerDay" is Google's marker; the free-text variants cover the OpenAI-
  // compatible vendors. Deliberately NOT matching bare "quota", which
  // appears in per-minute messages too.
  const daily =
    /perday|per day|daily limit|day limit|requests per day|rpd\b/.test(haystack);

  return {
    daily,
    ...(retryAfterMs === undefined ? {} : { retryAfterMs }),
    quotaId: quotaId || (daily ? "per-day" : "per-minute"),
  };
}

/** `fetch` with a hard deadline. Returns null if the deadline was hit, so
 *  callers can treat a timeout exactly like a retryable status. */
export async function fetchWithTimeout(
  doFetch: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<{ res: Response | null; timedOut: boolean }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await doFetch(url, { ...init, signal: controller.signal });
    return { res, timedOut: false };
  } catch (err) {
    const aborted = err instanceof Error && (err.name === "AbortError" || /abort/i.test(err.message));
    if (aborted) return { res: null, timedOut: true };
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Read a response body without consuming it, defensively. `clone()` is the
 * correct call, but a body that has already been read — or a test double
 * without `clone` — must not turn a rate-limit into a crash: the whole point
 * of this path is to survive provider misbehaviour.
 */
export async function peekBody(res: Response): Promise<string> {
  try {
    return await res.clone().text();
  } catch {
    try {
      return await res.text();
    } catch {
      return "";
    }
  }
}

/** Header lookup that tolerates a response without a Headers object. */
export function headerOrNull(res: Response, name: string): string | null {
  try {
    return res.headers?.get(name) ?? null;
  } catch {
    return null;
  }
}

/** Backoff for attempt n, honouring a sane server-supplied delay when given. */
export function backoffMs(baseMs: number, attempt: number, serverMs?: number): number {
  if (serverMs !== undefined && serverMs > 0) {
    return Math.min(serverMs, MAX_HONOURED_RETRY_MS) + Math.random() * 500;
  }
  return baseMs * 2 ** attempt + Math.random() * 500;
}

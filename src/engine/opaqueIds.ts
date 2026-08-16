/**
 * Per-agent opaque observation ids (design v0.2 §5, OZ-AUDIT-3 item 1;
 * leakage finding 1 of design v0.1 §6.1).
 *
 * THE LEAK: EventLog ids are the global append index. `intervention_applied`
 * consumes an id while being visible to no one, so an agent's visible id
 * sequence has a GAP at the hidden intervention; in society runs, gaps also
 * encode other agents' unseen activity volumes. For Study 3 — where the
 * endpoint is precisely "did the agent infer hidden structure" — that is an
 * uncontrolled host-level side channel in both directions.
 *
 * THE FIX: each agent sees a bijective, pseudorandom re-encoding of event
 * ids, deterministic per (run key, agent), format-identical across agents
 * and conditions. Successive events map to unrelated-looking integers, so
 * neither gaps nor strides carry information. Agents cite the opaque ids;
 * the evaluator inverts the mapping exactly (Feistel = bijection, so
 * inversion needs no stored table).
 *
 * Study 1/2 paths never call this module: sequential ids remain the default
 * (`observationIds: "sequential"`), and the frozen surface is unchanged.
 *
 * Construction: 4-round balanced Feistel, round keys derived by FNV-1a from
 * (runKey, agentId, round). A Feistel network is a permutation of its block
 * space regardless of the round function, which gives collision-freedom by
 * construction — a hash would merge citations at ~1e-3 probability per run,
 * silently corrupting the L3 citation audit.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SCHEME VERSIONING (R35, pilot finding F25) — read this before changing
 * anything below.
 *
 * The domain has changed once, on 2026-08-14 (F10): originally two 16-bit
 * halves cycle-walked into [0, 2^31), which rendered ids like
 * "event 2043824667" — conspicuous enough that a pilot agent spent p=0.45
 * theorising about "counter-based signatures" in the ids themselves.
 * Boundary machinery must not merely hide information; it must LOOK BORING
 * (OZ-AUDIT-3 surface-plausibility clause). The permutation now runs over
 * 20 bits: unremarkable 1–7-digit references, still bijective and
 * stride-free, with 2^20 ≈ 1M ids per agent.
 *
 * WHY THE OLD SCHEME MUST STAY IMPLEMENTED. The evaluator scores runs from
 * BOTH eras. Decoding a pre-F10 run with the current domain resolves nothing,
 * and the citation validator's only category for "did not resolve" was
 * "invalid" — so the change silently reclassified 398 legitimate citations
 * across 19 runs as fabricated, and moved a family's R32 verdict from fail to
 * pass. Verified after the fix: 1,483 of 1,483 legacy-era cited ids resolve,
 * round-trip exactly, and land on visible substantive events.
 *
 * Callers pass the era. They do not guess it: `opaqueIdHalfBits` is recorded
 * in every artifact from 2026-08-16, and for older artifacts the era is read
 * from `startedAt`. It must NEVER be inferred from the cited values — that
 * cannot detect a pre-F10 run whose agent cited nothing, which is 13 of the
 * 19.
 */

function fnv1a(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function roundKeys(runKey: string, agentId: string): number[] {
  return [0, 1, 2, 3].map((r) => fnv1a(`oz-opaque:${runKey}:${agentId}:${r}`));
}

/** Current scheme (F10 onwards): two 10-bit halves over [0, 2^20). */
export const OPAQUE_ID_HALF_BITS = 10;
/** Pre-F10 scheme: two 16-bit halves, cycle-walked into [0, 2^31). */
export const LEGACY_OPAQUE_ID_HALF_BITS = 16;

/**
 * The domain a given half-width walks into. Note the legacy value is 2^31,
 * NOT 2^32: the original implementation masked its output to 31 bits so the
 * id stayed a non-negative int, and the cycle walk inherited that bound.
 * Decoding legacy ids against 2^32 inverts only the ~half that never needed
 * a walk, which looks exactly like partial fabrication.
 */
export function opaqueIdDomain(halfBits: number): number {
  return halfBits === LEGACY_OPAQUE_ID_HALF_BITS ? 2 ** 31 : 2 ** (2 * halfBits);
}

/** Round function: mix a half-word with a round key into `halfBits` bits. */
function F(half: number, key: number, halfMask: number): number {
  let z = (half ^ key) >>> 0;
  z = Math.imul(z + 0x9e3779b9, 0x85ebca6b) >>> 0;
  z ^= z >>> 13;
  z = Math.imul(z, 0xc2b2ae35) >>> 0;
  return (z ^ (z >>> 16)) & halfMask;
}

function feistel(x: number, keys: number[], inverse: boolean, halfBits: number): number {
  const halfMask = (1 << halfBits) - 1;
  let left = (x >>> halfBits) & halfMask;
  let right = x & halfMask;
  const order = inverse ? [...keys].reverse() : keys;
  for (const k of order) {
    const t = right;
    right = left ^ F(right, k!, halfMask);
    left = t;
  }
  // Final swap so the network is its own structural inverse.
  return (((right & halfMask) << halfBits) | (left & halfMask)) >>> 0;
}

/**
 * The opaque id an agent sees for a global event id. Bijective on the scheme's
 * domain by cycle-walking: values landing outside are walked onward until they
 * fall inside. (A mask instead of a walk would merge two preimages with
 * probability ~n²/2³² per run — the same silent citation-corruption class this
 * module exists to eliminate.)
 */
export function toOpaqueId(
  runKey: string,
  agentId: string,
  eventId: number,
  halfBits: number = OPAQUE_ID_HALF_BITS,
): number {
  const keys = roundKeys(runKey, agentId);
  const domain = opaqueIdDomain(halfBits);
  let y = feistel(eventId >>> 0, keys, false, halfBits);
  while (y >= domain) y = feistel(y, keys, false, halfBits);
  return y;
}

/**
 * Invert an opaque id (retraces the cycle walk). Returns null when the id is
 * outside the scheme's domain or the decoded id exceeds `maxEventId` — which
 * is what a fabricated citation looks like to the audit, and ALSO what a
 * correct citation from a different era looks like. Callers must therefore
 * pass the era of the run they are scoring (R35), never the default.
 */
export function fromOpaqueId(
  runKey: string,
  agentId: string,
  opaqueId: number,
  maxEventId: number,
  halfBits: number = OPAQUE_ID_HALF_BITS,
): number | null {
  const domain = opaqueIdDomain(halfBits);
  if (opaqueId < 0 || opaqueId >= domain) return null;
  const keys = roundKeys(runKey, agentId);
  let x = feistel(opaqueId >>> 0, keys, true, halfBits);
  while (x >= domain) x = feistel(x, keys, true, halfBits);
  return x <= maxEventId ? x : null;
}

/**
 * The F10 boundary, used to date runs written before `opaqueIdHalfBits`
 * existed. The corpus has a clean gap here: last pre-F10 run
 * 2026-08-14T01:04:26Z, first post-F10 run 2026-08-14T11:56:27Z.
 */
export const F10_BOUNDARY_MS = Date.parse("2026-08-14T06:00:00Z");

/** The opaque-id era a run was generated under (R35). */
export function opaqueEraHalfBits(run: {
  study3?: { opaqueIdHalfBits?: number | null } | null;
  startedAt?: string;
}): number {
  const recorded = run.study3?.opaqueIdHalfBits;
  if (typeof recorded === "number") return recorded;
  if (run.startedAt && Date.parse(run.startedAt) < F10_BOUNDARY_MS) {
    return LEGACY_OPAQUE_ID_HALF_BITS;
  }
  return OPAQUE_ID_HALF_BITS;
}

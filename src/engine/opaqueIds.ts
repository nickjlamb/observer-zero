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
 * Construction: 4-round balanced Feistel on 32 bits (two 16-bit halves),
 * round keys derived by FNV-1a from (runKey, agentId, round). A Feistel
 * network is a permutation of the 32-bit space regardless of the round
 * function, which gives collision-freedom by construction — a hash would
 * merge citations at ~1e-3 probability per run, silently corrupting the
 * L3 citation audit. Output is masked to 31 bits (non-negative int, same
 * shape the belief schema already accepts).
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

/** Round function: mix a 16-bit half with a round key into 16 bits. */
function F(half: number, key: number): number {
  let z = (half ^ key) >>> 0;
  z = Math.imul(z + 0x9e3779b9, 0x85ebca6b) >>> 0;
  z ^= z >>> 13;
  z = Math.imul(z, 0xc2b2ae35) >>> 0;
  return (z ^ (z >>> 16)) & 0xffff;
}

function feistel(x: number, keys: number[], inverse: boolean): number {
  let left = (x >>> 16) & 0xffff;
  let right = x & 0xffff;
  const order = inverse ? [...keys].reverse() : keys;
  for (const k of order) {
    const t = right;
    right = left ^ F(right, k!);
    left = t;
  }
  // Final swap so the network is its own structural inverse.
  return (((right & 0xffff) << 16) | (left & 0xffff)) >>> 0;
}

const DOMAIN = 0x80000000; // opaque ids live in [0, 2^31): non-negative ints

/**
 * The opaque id an agent sees for a global event id. Bijective on
 * [0, 2^31) by cycle-walking: values landing in the upper half are walked
 * onward until they fall inside the domain. (A mask instead of a walk would
 * merge two preimages with probability ~n²/2³² per run — the same silent
 * citation-corruption class this module exists to eliminate.)
 */
export function toOpaqueId(runKey: string, agentId: string, eventId: number): number {
  const keys = roundKeys(runKey, agentId);
  let y = feistel(eventId >>> 0, keys, false);
  while (y >= DOMAIN) y = feistel(y, keys, false);
  return y;
}

/**
 * Invert an opaque id (retraces the cycle walk). Returns null when the
 * decoded id exceeds `maxEventId` — exactly what a fabricated citation
 * looks like to the audit.
 */
export function fromOpaqueId(
  runKey: string,
  agentId: string,
  opaqueId: number,
  maxEventId: number,
): number | null {
  if (opaqueId < 0 || opaqueId >= DOMAIN) return null;
  const keys = roundKeys(runKey, agentId);
  let x = feistel(opaqueId >>> 0, keys, true);
  while (x >= DOMAIN) x = feistel(x, keys, true);
  return x <= maxEventId ? x : null;
}

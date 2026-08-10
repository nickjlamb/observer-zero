/**
 * Deterministic seeded PRNG for the world engine.
 *
 * All randomness in the deterministic universe flows through an Rng instance
 * so that a run is fully reproducible from its seed. (LLM agents are the only
 * non-deterministic component of Observer Zero, and they arrive in Milestone 2.)
 *
 * splitmix32 core; child streams let subsystems (noise, scheduling) draw
 * independently without interfering with each other's sequences.
 */

export class Rng {
  private state: number;

  constructor(seed: number) {
    if (!Number.isFinite(seed)) throw new Error(`Invalid seed: ${seed}`);
    this.state = seed >>> 0;
    // Warm up to decorrelate small seeds.
    this.next();
    this.next();
  }

  /** Uniform float in [0, 1). */
  next(): number {
    // splitmix32
    this.state = (this.state + 0x9e3779b9) >>> 0;
    let z = this.state;
    z ^= z >>> 16;
    z = Math.imul(z, 0x21f0aaad);
    z ^= z >>> 15;
    z = Math.imul(z, 0x735a2d97);
    z ^= z >>> 15;
    return (z >>> 0) / 4294967296;
  }

  /** Uniform integer in [0, n). */
  int(n: number): number {
    return Math.floor(this.next() * n);
  }

  /** Standard normal via Box–Muller. */
  gaussian(): number {
    let u = 0;
    while (u === 0) u = this.next(); // avoid log(0)
    const v = this.next();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  /** Normal with given mean and standard deviation. */
  normal(mean: number, sd: number): number {
    return mean + sd * this.gaussian();
  }

  /** Deterministic child stream (e.g. one per subsystem or per instrument). */
  child(label: string): Rng {
    let h = 2166136261 >>> 0; // FNV-1a over the label, mixed with current state
    for (let i = 0; i < label.length; i++) {
      h ^= label.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return new Rng((h ^ this.state) >>> 0);
  }

  /**
   * Order-independent stream for a (seed, key) pair. Used for per-trial
   * measurement noise keyed by (worldSeed, instrumentId, trialIndex): the
   * same key yields the same values in every run with that seed, no matter
   * who draws first — the foundation of "hold the universe constant, rerun
   * the society" (batch plan Q2).
   */
  static forKey(seed: number, key: string): Rng {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < key.length; i++) {
      h ^= key.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return new Rng((h ^ (seed >>> 0)) >>> 0);
  }
}

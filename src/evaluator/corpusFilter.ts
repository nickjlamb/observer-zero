/**
 * The instrument-validation gate (R38).
 *
 * WHY THIS EXISTS, AND WHY IT IS FAIL-CLOSED.
 *
 * R38's positive-control runs are produced by telling an agent, in plain
 * words, to entertain an out-of-world account of its readings. They are
 * measurements of the DETECTOR. If one is ever pooled into a corpus
 * statistic, it appears there as an agent that spontaneously inferred
 * externality — and that is the study's headline positive, in the one class
 * the entire paper turns on. F16 fabricated a null; this would fabricate a
 * finding, which is strictly worse.
 *
 * The programme has already been bitten by the milder version of this. R29
 * and R32 are both admissibility gates and were never composed, so R32 spent
 * a fortnight reporting rates over a corpus nobody had asked a filtering
 * question about. The defect was not a wrong filter — it was the absence of
 * anyone having to state one. So this module does not offer a default:
 * `classifyCorpusRole` is the only way to learn an artifact's role, and the
 * statistic-facing helper makes the caller name the statistic it is filtering
 * for, so "which corpus is this?" is answered at every call site or the code
 * does not compile.
 *
 * THREE INDEPENDENT SIGNALS, AND THEY MUST AGREE.
 *
 *   1. `study3.instrumentValidation` — written by the CLI at run time.
 *   2. `manifest.prompts.beliefUpdate` — carries the `-poscontrol-*` suffix.
 *   3. `config.seed` in the reserved range 9190-9199.
 *
 * Any single one of these can be lost: a tag can be dropped by a refactor, a
 * manifest can be rebuilt, a seed can be mistyped. Requiring agreement means
 * two independent things must fail before a positive-control run can pass as
 * an observation. Disagreement is not resolved by majority vote — it THROWS,
 * because an artifact whose provenance signals contradict each other is
 * exactly the artifact you must not silently score.
 */

/** Seeds reserved for instrument validation (R38 §3.4). Never an experimental arm. */
export const INSTRUMENT_VALIDATION_SEED_MIN = 9190;
export const INSTRUMENT_VALIDATION_SEED_MAX = 9199;

export type CorpusRole = "experimental" | "instrument-validation";

/**
 * Each signal is `true` (instrument validation), `false` (experimental), or
 * `null` (this artifact carries no evidence either way — e.g. a Study 1/2
 * artifact has no `study3` block and no Study 3 seed convention).
 */
export interface CorpusRoleSignals {
  tagged: boolean | null;
  promptVersion: boolean | null;
  reservedSeed: boolean | null;
}

interface ArtifactShape {
  config?: { name?: unknown; seed?: unknown } | null;
  study3?: { instrumentValidation?: unknown } | null;
  manifest?: { prompts?: { beliefUpdate?: unknown } | null } | null;
}

function isStudy3(a: ArtifactShape): boolean {
  if (a.study3 !== undefined && a.study3 !== null) return true;
  return typeof a.config?.name === "string" && a.config.name.startsWith("s3_");
}

export function corpusRoleSignals(artifact: unknown): CorpusRoleSignals {
  const a = (artifact ?? {}) as ArtifactShape;

  // 1. The explicit tag. Present-but-absent-key is a real "false" for a
  //    Study 3 run: the block exists, so the CLI had the chance to tag it.
  //    Absent block entirely (Study 1/2) carries no information.
  const tagged =
    a.study3 !== undefined && a.study3 !== null
      ? a.study3.instrumentValidation === true
      : null;

  // 2. The belief-prompt version, which beliefPromptVersion() suffixes.
  const bp = a.manifest?.prompts?.beliefUpdate;
  const promptVersion = typeof bp === "string" ? /-poscontrol-/.test(bp) : null;

  // 3. The reserved seed range — Study 3 only; Study 1/2 seeds are unrelated.
  const seed = a.config?.seed;
  const reservedSeed =
    isStudy3(a) && typeof seed === "number"
      ? seed >= INSTRUMENT_VALIDATION_SEED_MIN && seed <= INSTRUMENT_VALIDATION_SEED_MAX
      : null;

  return { tagged, promptVersion, reservedSeed };
}

export class CorpusProvenanceError extends Error {
  constructor(
    readonly signals: CorpusRoleSignals,
    readonly label: string,
  ) {
    const say = (v: boolean | null) => (v === null ? "absent" : v ? "instrument" : "experimental");
    super(
      `Contradictory instrument-validation provenance in ${label}: ` +
        `study3.instrumentValidation=${say(signals.tagged)}, ` +
        `manifest.prompts.beliefUpdate=${say(signals.promptVersion)}, ` +
        `seed in ${INSTRUMENT_VALIDATION_SEED_MIN}-${INSTRUMENT_VALIDATION_SEED_MAX}=${say(signals.reservedSeed)}. ` +
        `R38 requires all present signals to agree. Refusing to guess: an instrument-validation ` +
        `run scored as an observation manufactures the study's headline positive. ` +
        `Re-run the control on a reserved seed, or repair the artifact's provenance by hand and say so in the log.`,
    );
    this.name = "CorpusProvenanceError";
  }
}

/**
 * The role of one artifact. Throws `CorpusProvenanceError` when the signals
 * present disagree — see the module header for why that is not resolved by
 * majority vote.
 */
export function classifyCorpusRole(artifact: unknown, label = "artifact"): CorpusRole {
  const signals = corpusRoleSignals(artifact);
  const present = [signals.tagged, signals.promptVersion, signals.reservedSeed].filter(
    (v): v is boolean => v !== null,
  );
  if (present.length === 0) return "experimental";
  if (present.every((v) => v)) return "instrument-validation";
  if (present.every((v) => !v)) return "experimental";
  throw new CorpusProvenanceError(signals, label);
}

export interface CorpusPartition<T> {
  /** Artifacts admissible to the statistic named in `statistic`. */
  kept: T[];
  /** Instrument-validation artifacts, held out. Report this count; never drop it silently. */
  excluded: T[];
  /** The statistic this partition was taken for, echoed for the audit trail. */
  statistic: string;
}

/**
 * Hold instrument-validation artifacts out of a corpus statistic.
 *
 * `statistic` is required and has no default on purpose: it is the sentence
 * the caller has to write in order to compile, and it is what appears in the
 * printed provenance line. A statistic that never calls this is visible by
 * the absence of that line, which is the whole point — R32's fortnight-long
 * error was inherited silence, not a wrong number.
 */
export function excludeInstrumentValidation<T>(
  items: readonly T[],
  getArtifact: (item: T) => unknown,
  statistic: string,
  labelOf: (item: T) => string = () => "artifact",
): CorpusPartition<T> {
  return partitionByRole(items, (item) => classifyCorpusRole(getArtifact(item), labelOf(item)), statistic);
}

/**
 * The same partition for callers that have already classified their items —
 * a corpus sweep that holds only a digest per artifact, rather than every
 * artifact in memory at once. Identical policy; the role must still be
 * obtained from `classifyCorpusRole`, never assigned by hand.
 */
export function partitionByRole<T>(
  items: readonly T[],
  roleOf: (item: T) => CorpusRole,
  statistic: string,
): CorpusPartition<T> {
  const kept: T[] = [];
  const excluded: T[] = [];
  for (const item of items) {
    if (roleOf(item) === "instrument-validation") excluded.push(item);
    else kept.push(item);
  }
  return { kept, excluded, statistic };
}

/**
 * R38 seed hygiene, enforced BEFORE any model call.
 *
 * `classifyCorpusRole` refuses to score a run whose provenance signals
 * disagree, which is the right behaviour — but it fires when the artifact is
 * scored, i.e. after the run has been paid for. Tier 2 costs ~$1.30 an arm,
 * and a run lost to a late refusal looks exactly like a failed positive
 * control: the one outcome that stops the freeze. So the seed/variant contract
 * is also checked at argument-parse time, where it costs nothing to fail.
 *
 * Lives here rather than in the CLI so it is importable by tests without
 * executing the CLI's top-level argument parsing.
 */
export function checkInstrumentSeedHygiene(
  variant: string,
  seeds: readonly number[],
  isInstrumentVariant: (v: string) => boolean,
): void {
  const reserved = (s: number) =>
    s >= INSTRUMENT_VALIDATION_SEED_MIN && s <= INSTRUMENT_VALIDATION_SEED_MAX;
  const instrument = isInstrumentVariant(variant);
  const offending = seeds.filter((s) => reserved(s) !== instrument);
  if (offending.length === 0) return;
  const range = `${INSTRUMENT_VALIDATION_SEED_MIN}-${INSTRUMENT_VALIDATION_SEED_MAX}`;
  throw new Error(
    instrument
      ? `--prompt-variant ${variant} is instrument validation (R38) and must run on a reserved ` +
        `seed ${range}. Offending: ${offending.join(", ")}. Seeds outside the range are ` +
        `experimental, and the artifact would carry contradictory provenance and be unscoreable.`
      : `Seeds ${range} are reserved for R38 instrument validation and cannot be spent on ` +
        `--prompt-variant ${variant}. Offending: ${offending.join(", ")}. Pick a seed in ` +
        `9100-9189 for an experimental arm.`,
  );
}

/**
 * The line every corpus statistic prints. Silence about instrument validation
 * is indistinguishable from having forgotten it, so there is no empty-string
 * case: a clean corpus says so explicitly.
 */
export function corpusProvenanceLine<T>(p: CorpusPartition<T>): string {
  return p.excluded.length === 0
    ? `${p.statistic}: ${p.kept.length} artifact(s); no instrument-validation runs present (R38)`
    : `${p.statistic}: ${p.kept.length} artifact(s); ${p.excluded.length} instrument-validation run(s) held out (R38)`;
}

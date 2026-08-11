/**
 * The freeze flag (design v0.3 §11, step 5).
 *
 * Study 2's seed-hygiene rule says the confirmatory worlds (seeds 1000-1009)
 * must not meet a v0.2-policy agent until the design, prompts, evaluator and
 * hypotheses are frozen. That is a promise about process, and a promise that
 * lives only in a document is one nobody can check later.
 *
 * So it lives here as well. While DESIGN_FROZEN is false the battery runner
 * refuses to start a live run on a confirmatory seed, whatever flags it is
 * given. Flipping this constant to true is the mechanical act of freezing:
 * it should happen in a single commit, after P1, alongside the frozen
 * design document, and never be reverted. The commit that flips it is the
 * timestamp evidence that the design predated the confirmatory data.
 */

export const DESIGN_FROZEN = false as boolean;

/** Set at the same commit as DESIGN_FROZEN — recorded in run manifests. */
export const FREEZE_TAG = "unfrozen: pre-P1 (design v0.3)";

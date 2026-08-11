/**
 * Bedrock connectivity checker.
 *
 *   npm run bedrock-check
 *
 * Tries both Bedrock endpoints with one tiny call each and reports exactly
 * what happened, because the failure modes are easy to confuse:
 *
 *   - bedrock-runtime  SigV4 auth, pinned dated model ids, needs the First
 *                      Time Use form.
 *   - bedrock-mantle   bearer-token auth, undated model alias, no FTU form.
 *
 * Reads .env the same way the batteries do, so a key that works here is a
 * key that will work for a run — which is the point. Costs a fraction of a
 * penny per endpoint.
 */

import { CallLog } from "../models/provider.js";
import { BedrockProvider } from "../models/bedrock.js";

try {
  process.loadEnvFile();
} catch {
  // no .env — fall back to the shell environment
}

const region = process.env["AWS_REGION"] ?? "us-east-1";
const shortModel = process.argv.includes("--sonnet") ? "claude-sonnet-4-5" : "claude-haiku-4-5";

function mask(v: string | undefined): string {
  if (!v) return "NOT SET";
  return `set (${v.slice(0, 6)}…, ${v.length} chars)`;
}

console.log(`\nBEDROCK CONNECTIVITY CHECK`);
console.log(`  region                    ${region}`);
console.log(`  model                     ${shortModel}`);
console.log(`  AWS_BEARER_TOKEN_BEDROCK  ${mask(process.env["AWS_BEARER_TOKEN_BEDROCK"])}   (mantle)`);
console.log(`  AWS_ACCESS_KEY_ID         ${mask(process.env["AWS_ACCESS_KEY_ID"])}   (runtime)`);
console.log("");

/** One minimal call through the real provider path. */
async function probe(prefixed: string): Promise<void> {
  const label = prefixed.split(":")[0]!;
  const log = new CallLog();
  try {
    const provider = new BedrockProvider({ model: prefixed, temperature: 0, region }, log);
    // updateBeliefs would drag in the whole prompt builder; a decision call
    // is the smallest round trip that exercises auth, routing and parsing.
    await provider.decide({
      persona: { agentId: "probe", name: "Probe", role: "test", traits: [], goals: [], epistemicProfile: { scepticism: "low", opennessToExoticExplanations: "low", evidenceThreshold: "low" }, home: "laboratory" },
      day: 1,
      location: "laboratory",
      memories: "(none)",
      notebook: { day: 1, instruments: [] },
      beliefs: { question: "q", hypotheses: [], residual: 1, updatedOnDay: 0 },
      availableInstruments: [{ id: "pendulum_lab", kind: "pendulum" }],
      colleagues: [],
      inbox: [],
      outbox: [],
      recentObservations: [],
    } as never);

    const rec = log.all()[0];
    if (rec?.ok) {
      console.log(`  ✓ ${label.padEnd(14)} WORKS`);
      console.log(`      resolved model  ${rec.resolvedModel ?? "(not reported)"}`);
      console.log(`      tokens          ${rec.inputTokens} in / ${rec.outputTokens} out`);
      console.log(`      est. cost       $${rec.estimatedCostUSD.toFixed(6)}`);
    } else {
      console.log(`  ✗ ${label.padEnd(14)} FAILED`);
      console.log(`      ${rec?.error ?? "no response recorded"}`);
    }
  } catch (e) {
    const msg = String((e as { message?: string })?.message ?? e);
    console.log(`  ✗ ${label.padEnd(14)} FAILED`);
    console.log(`      ${msg.slice(0, 400)}`);
  }
  console.log("");
}

await probe(`bedrock-mantle:${shortModel}`);
await probe(`bedrock:${shortModel}`);

console.log(`Reading the result:`);
console.log(`  Either endpoint WORKS      → we use that one; nothing else needed.`);
console.log(`  "not allowed for this account" on both → account-level block; open an`);
console.log(`     AWS Support case. The study proceeds on Perplexity + first-party`);
console.log(`     Anthropic in the meantime (arms A/B/C/D), with E and F contingent.`);
console.log(`  mantle fails on auth only  → check AWS_BEARER_TOKEN_BEDROCK is in .env`);
console.log(`     (the shell does not read .env — only the scripts do).`);
console.log(`  runtime says "AccessDenied" → the First Time Use form is still needed.\n`);

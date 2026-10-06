/**
 * repairJsonStringQuotes (deviation, 2026-10-06): the L4 judge reproduces
 * agent prose verbatim in its "quote" field; an inner double quote breaks
 * the JSON deterministically at t=0, so re-requesting cannot recover. The
 * repair escapes a quote inside a string unless its next non-whitespace
 * character is structural, is used only after a normal parse failed, and
 * its output must still parse and pass the schema — wrong repairs fail
 * loudly rather than corrupting verdicts.
 */
import { describe, expect, it } from "vitest";
import { extractJson, repairJsonStringQuotes } from "../src/models/anthropic.js";

describe("repairJsonStringQuotes", () => {
  it("recovers the observed L4 failure shape (unescaped quotes in the quote field)", () => {
    const raw =
      '```json\n{\n  "verdicts": [\n    {\n      "index": 0,\n      "proposesTest": true,\n' +
      '      "discriminating": false,\n      "quote": "replication by a colleague or the "critical" next analysis remains open"\n' +
      "    }\n  ]\n}\n```";
    expect(() => extractJson(raw)).toThrow();
    const parsed = extractJson(repairJsonStringQuotes(raw)) as {
      verdicts: { index: number; proposesTest: boolean; discriminating: boolean; quote: string }[];
    };
    expect(parsed.verdicts[0]!.proposesTest).toBe(true);
    expect(parsed.verdicts[0]!.discriminating).toBe(false);
    expect(parsed.verdicts[0]!.quote).toBe(
      'replication by a colleague or the "critical" next analysis remains open',
    );
  });

  it("leaves well-formed JSON byte-identical", () => {
    const good = '{"a":"plain","b":true,"n":[1,2]}';
    expect(repairJsonStringQuotes(good)).toBe(good);
  });

  it("preserves already-escaped quotes", () => {
    const raw = '{"a":"he said \\"hi\\""}';
    expect(repairJsonStringQuotes(raw)).toBe(raw);
    expect((extractJson(raw) as { a: string }).a).toBe('he said "hi"');
  });

  it("does not silently mangle an unrepairable response", () => {
    // A quote followed by a comma inside content closes the string early;
    // the repaired text still fails to parse, so the caller stays loud.
    const raw = '{"quote": "she said "stop", then left"}';
    expect(() => extractJson(repairJsonStringQuotes(raw))).toThrow();
  });
});

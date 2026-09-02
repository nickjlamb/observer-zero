/**
 * extractJson hardening (confirmatory-battery deviation, 2026-08-31).
 *
 * The old first-"{"-to-last-"}" slice crashed a scoring pass twice on judge
 * chatter appended after a valid verdict. The balanced-object version must be
 * semantics-preserving on everything the old code parsed, and must rescue
 * the chatter case by returning the leading complete object.
 */
import { describe, expect, it } from "vitest";
import { extractJson } from "../src/models/anthropic.js";

describe("extractJson", () => {
  it("parses a lone well-formed object identically to the old behavior", () => {
    expect(extractJson('{"classifications":[{"index":0,"class":"self_error"}]}')).toEqual({
      classifications: [{ index: 0, class: "self_error" }],
    });
  });

  it("strips code fences", () => {
    expect(extractJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("returns the first balanced object when the model chatters afterwards (the crash case)", () => {
    const raw =
      '{"classifications":[{"index":0,"class":"instrument_malfunction"}]}\n' +
      "Note: I chose this because the locus {sensor chain} is in-world.";
    expect(extractJson(raw)).toEqual({
      classifications: [{ index: 0, class: "instrument_malfunction" }],
    });
  });

  it("ignores braces inside strings while balancing", () => {
    expect(extractJson('{"a":"open { and close } inside","b":2} trailing }')).toEqual({
      a: "open { and close } inside",
      b: 2,
    });
  });

  it("handles escaped quotes inside strings", () => {
    expect(extractJson('{"a":"she said \\"hi\\" {ok}"} extra')).toEqual({ a: 'she said "hi" {ok}' });
  });

  it("still throws when there is no complete object", () => {
    expect(() => extractJson("no json here")).toThrow(/No JSON object/);
    expect(() => extractJson('{"truncated": tru')).toThrow();
  });
});

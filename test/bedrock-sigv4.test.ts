import { describe, expect, it } from "vitest";
import {
  conversePath,
  converseCanonicalPath,
  signV4,
} from "../src/models/bedrockConverse.js";

/**
 * SigV4 canonicalisation, pinned against AWS's own error message.
 *
 * These are not self-consistency tests. When the first version of the signer
 * sent a singly-encoded canonical path, Bedrock replied with the exact string
 * it expected — which makes it a published vector, and the only one this
 * module has ever had. The module's header already warned that self-consistent
 * unit tests could not validate the signer; these are the tests that can.
 */
describe("Bedrock Converse SigV4 canonicalisation", () => {
  it("encodes the URL path once", () => {
    expect(conversePath("amazon.nova-pro-v1:0")).toBe("/model/amazon.nova-pro-v1%3A0/converse");
  });

  it("encodes the canonical path twice — AWS's published vector, Nova", () => {
    expect(converseCanonicalPath("amazon.nova-pro-v1:0")).toBe(
      "/model/amazon.nova-pro-v1%253A0/converse",
    );
  });

  it("encodes the canonical path twice — AWS's published vector, Mistral", () => {
    expect(converseCanonicalPath("mistral.mistral-large-2407-v1:0")).toBe(
      "/model/mistral.mistral-large-2407-v1%253A0/converse",
    );
  });

  it("handles a cross-region inference profile id", () => {
    expect(converseCanonicalPath("us.anthropic.claude-haiku-4-5-20251001-v1:0")).toBe(
      "/model/us.anthropic.claude-haiku-4-5-20251001-v1%253A0/converse",
    );
  });

  it("the two paths differ — the defect was assuming they must match", () => {
    const id = "amazon.nova-pro-v1:0";
    expect(converseCanonicalPath(id)).not.toBe(conversePath(id));
    expect(converseCanonicalPath(id)).toBe(
      `/model/${encodeURIComponent(encodeURIComponent(id))}/converse`,
    );
  });

  /**
   * Magnitude, not behaviour (the F21/F22/F25 rule): assert the signature
   * actually CHANGES when the canonical path changes. A signer that ignored
   * its path argument would pass every test above.
   */
  it("the signature depends on the canonical path", () => {
    const base = {
      method: "POST",
      host: "bedrock-runtime.us-east-1.amazonaws.com",
      region: "us-east-1",
      service: "bedrock",
      payload: '{"messages":[]}',
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      amzDate: "20260816T120000Z",
    };
    const singly = signV4({ ...base, path: conversePath("amazon.nova-pro-v1:0") });
    const doubly = signV4({ ...base, path: converseCanonicalPath("amazon.nova-pro-v1:0") });
    expect(singly["authorization"]).not.toBe(doubly["authorization"]);
  });

  it("is deterministic for a fixed amzDate", () => {
    const args = {
      method: "POST",
      path: converseCanonicalPath("amazon.nova-pro-v1:0"),
      host: "bedrock-runtime.us-east-1.amazonaws.com",
      region: "us-east-1",
      service: "bedrock",
      payload: '{"messages":[]}',
      accessKeyId: "AKIAIOSFODNN7EXAMPLE",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      amzDate: "20260816T120000Z",
    };
    expect(signV4(args)["authorization"]).toBe(signV4(args)["authorization"]);
  });
});

import { describe, it, expect } from "vitest";
import {
  sanitizeReturnTo,
  signState,
  verifyState,
  type OAuthStatePayload,
} from "../oauth-state.js";

describe("oauth-state", () => {
  const base: OAuthStatePayload = {
    csrf: "csrf-abc",
    nonce: "nonce-xyz",
    provider: "google",
    returnTo: "/cuenta",
  };

  describe("sanitizeReturnTo", () => {
    it("acepta paths internos validos", () => {
      expect(sanitizeReturnTo("/cuenta")).toBe("/cuenta");
      expect(sanitizeReturnTo("/compare?ids=1,2")).toBe("/compare?ids=1,2");
      expect(sanitizeReturnTo("/a-b_c/d")).toBe("/a-b_c/d");
    });
    it("rechaza open redirects", () => {
      expect(sanitizeReturnTo("//evil.com")).toBe("/");
      expect(sanitizeReturnTo("http://evil.com")).toBe("/");
      expect(sanitizeReturnTo("")).toBe("/");
      expect(sanitizeReturnTo(null)).toBe("/");
      expect(sanitizeReturnTo(undefined)).toBe("/");
      expect(sanitizeReturnTo("/path with space")).toBe("/");
      expect(sanitizeReturnTo("/" + "a".repeat(201))).toBe("/");
    });
  });

  describe("signState / verifyState", () => {
    it("verifica un payload recien firmado", () => {
      const token = signState(base);
      const decoded = verifyState(token);
      expect(decoded.csrf).toBe(base.csrf);
      expect(decoded.nonce).toBe(base.nonce);
      expect(decoded.provider).toBe("google");
      expect(decoded.returnTo).toBe(base.returnTo);
    });
    it("rechaza token alterado (firma invalida)", () => {
      const token = signState(base);
      const tampered = token.slice(0, -2) + "AA";
      expect(() => verifyState(tampered)).toThrow("OAUTH_STATE_INVALID");
    });
    it("rechaza provider desconocido", () => {
      const token = signState({ ...base, provider: "facebook" as never });
      expect(() => verifyState(token)).toThrow("OAUTH_STATE_INVALID");
    });
  });
});

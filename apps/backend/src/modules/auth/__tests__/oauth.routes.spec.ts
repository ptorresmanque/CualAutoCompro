import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../../../app.js";
import { signState } from "../oauth-state.js";

describe("OAuth routes", () => {
  describe("GET /api/v1/auth/google", () => {
    it("A: sin envs de Google redirige a /login?error=OAUTH_NOT_CONFIGURED", async () => {
      const res = await request(createApp()).get("/api/v1/auth/google");
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/\/login\?error=OAUTH_NOT_CONFIGURED$/);
    });
  });

  describe("GET /api/v1/auth/google/callback", () => {
    it("B: sin cookie oauth_state redirige a /login?error=OAUTH_STATE_INVALID", async () => {
      const res = await request(createApp()).get("/api/v1/auth/google/callback");
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/\/login\?error=OAUTH_STATE_INVALID$/);
    });

    it("C: con cookie de estado valida pero ?state= alterado redirige a /login?error=OAUTH_STATE_INVALID", async () => {
      const token = signState({
        csrf: "csrf-real",
        nonce: "nonce-real",
        provider: "google",
        returnTo: "/",
      });
      const res = await request(createApp())
        .get("/api/v1/auth/google/callback")
        .set("Cookie", `oauth_state=${token}`)
        .query({ state: "csrf-tampered" });
      expect(res.status).toBe(302);
      expect(res.headers.location).toMatch(/\/login\?error=OAUTH_STATE_INVALID$/);
    });
  });
});
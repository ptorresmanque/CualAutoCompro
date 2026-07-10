import { Router } from "express";
import crypto from "node:crypto";
import passport from "passport";
import type { Request, Response } from "express";
import type { VerifyCallback } from "passport-oauth2";
import { env } from "../../config/env.js";
import { prisma } from "../../infra/prisma.js";
import { sign } from "../../infra/jwt.js";
import { OAuthService } from "./oauth.service.js";
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_TTL_MS,
  type OAuthProvider,
  sanitizeReturnTo,
  signState,
  verifyState,
} from "./oauth-state.js";
import { hasStrategy, setupPassport } from "./infra/passport-setup.js";
import { isRateLimited } from "./oauth-rate-limit.js";
import { AUTH_COOKIE_NAME, cookieOpts } from "./auth-cookie.js";
import { oauthError, type OAuthError } from "../../shared/errors.js";
import { simulateOAuthCallback } from "./oauth-test-helpers.js";

setupPassport();

const oauthService = new OAuthService(prisma);

const cookieOptsState = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: OAUTH_STATE_TTL_MS,
  path: "/api/v1/auth",
};

const errorRedirect = (res: Response, code: string): void => {
  res.redirect(`${env.WEB_ORIGIN}/login?error=${encodeURIComponent(code)}`);
};

const successRedirect = (res: Response, returnTo: string): void => {
  const sep = returnTo.includes("?") ? "&" : "?";
  res.redirect(`${env.WEB_ORIGIN}${returnTo}${sep}oauth=ok`);
};

const codeFromError = (e: unknown): OAuthError["code"] => {
  if (e && typeof e === "object" && "code" in e) {
    const c = (e as { code: string }).code;
    if (
      c === "OAUTH_NOT_CONFIGURED" ||
      c === "OAUTH_STATE_INVALID" ||
      c === "OAUTH_DENIED" ||
      c === "OAUTH_EMAIL_NOT_VERIFIED" ||
      c === "OAUTH_EMAIL_REQUIRED" ||
      c === "OAUTH_PROVIDER_ERROR" ||
      c === "OAUTH_INTERNAL"
    ) {
      return c;
    }
  }
  return "OAUTH_PROVIDER_ERROR";
};

const startProvider =
  (provider: OAuthProvider) =>
  async (req: Request, res: Response): Promise<void> => {
    const ip = req.ip ?? "unknown";
    if (isRateLimited(ip)) {
      errorRedirect(res, "OAUTH_PROVIDER_ERROR");
      return;
    }
    if (!hasStrategy(provider)) {
      errorRedirect(res, "OAUTH_NOT_CONFIGURED");
      return;
    }
    const returnTo = sanitizeReturnTo(req.query.returnTo);
    const csrf = crypto.randomBytes(16).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");
    const token = signState({ csrf, nonce, provider, returnTo });
    res.cookie(OAUTH_STATE_COOKIE_NAME, token, cookieOptsState);

    passport.authenticate(
      provider,
      {
        scope: provider === "google" ? ["openid", "email", "profile"] : ["email", "name"],
        state: csrf,
        nonce,
        prompt: "select_account",
      } as never,
    )(req, res, () => undefined);
  };

const callbackProvider =
  (provider: OAuthProvider) =>
  async (req: Request, res: Response): Promise<void> => {
    try {
      const token = req.cookies[OAUTH_STATE_COOKIE_NAME];
      if (!token) throw oauthError("OAUTH_STATE_INVALID", "Falta cookie de estado.");
      const state = verifyState(token);
      const incomingCsrf = req.query.state ?? req.body.state ?? "";
      if (state.csrf !== incomingCsrf) {
        throw oauthError("OAUTH_STATE_INVALID", "CSRF mismatch.");
      }
      res.clearCookie(OAUTH_STATE_COOKIE_NAME, { path: "/api/v1/auth" });

      if (!hasStrategy(provider)) {
        throw oauthError("OAUTH_NOT_CONFIGURED", "Provider no configurado.");
      }

      const identity = await new Promise<{
        provider: OAuthProvider;
        sub: string;
        email: string | null;
        emailVerified: boolean;
        name: string | null;
      }>((resolve, reject) => {
        const verify: VerifyCallback = (err, user) => {
          if (err) return reject(err);
          if (!user) return reject(oauthError("OAUTH_DENIED", "Provider denego la autorizacion."));
          resolve(user as never);
        };
        passport.authenticate(provider, { session: false }, verify)(req, res, () => undefined);
      });

      const user = await oauthService.resolveUser(identity);
      const jwt = sign({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      res.cookie(AUTH_COOKIE_NAME, jwt, cookieOpts);
      successRedirect(res, state.returnTo);
    } catch (e) {
      errorRedirect(res, codeFromError(e));
    }
  };

export const oauthRouter = Router();
oauthRouter.get("/google", startProvider("google"));
oauthRouter.get("/google/callback", callbackProvider("google"));
oauthRouter.get("/apple", startProvider("apple"));
oauthRouter.get("/apple/callback", callbackProvider("apple"));
oauthRouter.post("/apple/callback", callbackProvider("apple"));

// Endpoint de simulacion solo para test/dev (no se monta en prod).
if (process.env.NODE_ENV !== "production") {
  oauthRouter.post("/__test__/simulate-callback", async (req, res) => {
    const { provider, sub, email, name } = req.body as {
      provider: "google" | "apple";
      sub: string;
      email: string;
      name: string;
    };
    try {
      const { cookie, user } = await simulateOAuthCallback({
        provider,
        sub,
        email,
        emailVerified: true,
        name,
      });
      res.setHeader("Set-Cookie", cookie);
      res.json({ data: user, error: null });
    } catch (e) {
      const code = codeFromError(e);
      res.status(400).json({ data: null, error: { code, message: (e as Error).message } });
    }
  });
}
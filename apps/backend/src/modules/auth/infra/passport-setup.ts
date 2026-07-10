import passport from "passport";
import type express from "express";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import type { VerifyCallback } from "passport-oauth2";
// @ts-expect-error — @nicokaiser/passport-apple no exporta tipos consistentes
import AppleStrategy from "@nicokaiser/passport-apple";
import { env } from "../../../config/env.js";
import type { OAuthProvider } from "../oauth-state.js";

const BACKEND_ORIGIN = env.BACKEND_ORIGIN ?? `http://localhost:${env.PORT}`;

export const isGoogleConfigured = (): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const isAppleConfigured = (): boolean =>
  Boolean(
    env.APPLE_CLIENT_ID &&
      env.APPLE_KEY_ID &&
      env.APPLE_TEAM_ID &&
      env.APPLE_PRIVATE_KEY,
  );

export const readApplePrivateKey = (): string => {
  const raw = env.APPLE_PRIVATE_KEY ?? "";
  const pem = raw.replace(/\\n/g, "\n");
  if (!pem.startsWith("-----BEGIN")) {
    throw new Error("APPLE_PRIVATE_KEY malformada (debe empezar con -----BEGIN).");
  }
  return pem;
};

export const setupPassport = (): void => {
  if (isGoogleConfigured()) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
          callbackURL: `${BACKEND_ORIGIN}/api/v1/auth/google/callback`,
          scope: ["openid", "email", "profile"],
          passReqToCallback: true,
        },
        async (
          _req: express.Request,
          _accessToken: string,
          _refreshToken: string,
          _params: unknown,
          profile: Profile,
          done: VerifyCallback,
        ) => {
          try {
            const emailEntry = profile.emails?.[0];
            const email = emailEntry?.value ?? null;
            const identity = {
              provider: "google" as const,
              sub: profile.id,
              email,
              emailVerified:
                emailEntry?.verified === true ||
                (profile as unknown as { _json?: { email_verified?: boolean } })._json
                  ?.email_verified === true,
              name: profile.displayName ?? null,
            };
            done(null, identity as never);
          } catch (e) {
            done(e as Error);
          }
        },
      ),
    );
  }

  if (isAppleConfigured()) {
    passport.use(
      new AppleStrategy(
        {
          clientID: env.APPLE_CLIENT_ID!,
          teamID: env.APPLE_TEAM_ID!,
          keyID: env.APPLE_KEY_ID!,
          privateKey: readApplePrivateKey(),
          callbackURL: `${BACKEND_ORIGIN}/api/v1/auth/apple/callback`,
          passReqToCallback: true,
        },
        async (
          _req: express.Request,
          _accessToken: string,
          _refreshToken: string,
          profile: { id: string; email?: string; emailVerified?: boolean; name?: string },
          done: VerifyCallback,
        ) => {
          try {
            const identity = {
              provider: "apple" as const,
              sub: profile.id,
              email: profile.email ?? null,
              emailVerified: profile.emailVerified === true,
              name: profile.name ?? null,
            };
            done(null, identity as never);
          } catch (e) {
            done(e as Error);
          }
        },
      ),
    );
  }

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj: unknown, done) => done(null, obj as never));
};

export const hasStrategy = (provider: OAuthProvider): boolean => {
  const strategies = (passport as unknown as {
    _strategies?: Record<string, unknown>;
  })._strategies;
  return Boolean(strategies && strategies[provider]);
};

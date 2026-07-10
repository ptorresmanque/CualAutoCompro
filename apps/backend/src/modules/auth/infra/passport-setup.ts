import passport from "passport";
import type express from "express";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import type { VerifyCallback } from "passport-oauth2";
// @ts-expect-error — @nicokaiser/passport-apple no exporta tipos consistentes
import AppleStrategy from "@nicokaiser/passport-apple";
import { env } from "../../../config/env.js";
import type { OAuthProvider } from "../oauth-state.js";

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
          callbackURL: `${env.WEB_ORIGIN}/api/v1/auth/google/callback`,
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
            const email = profile.emails?.[0]?.value ?? null;
            const identity = {
              provider: "google" as const,
              sub: profile.id,
              email,
              emailVerified: email != null,
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
          callbackURL: `${env.WEB_ORIGIN}/api/v1/auth/apple/callback`,
          passReqToCallback: true,
        },
        async (
          _req: express.Request,
          _accessToken: string,
          _refreshToken: string,
          idToken: { sub: string; email?: string; email_verified?: boolean | string; name?: string },
          done: VerifyCallback,
        ) => {
          try {
            const identity = {
              provider: "apple" as const,
              sub: idToken.sub,
              email: idToken.email ?? null,
              emailVerified:
                idToken.email_verified === true ||
                idToken.email_verified === "true",
              name: idToken.name ?? null,
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
    _strategy: (n: string) => unknown;
  })._strategy;
  return typeof strategies(provider) === "object" && strategies(provider) !== null;
};

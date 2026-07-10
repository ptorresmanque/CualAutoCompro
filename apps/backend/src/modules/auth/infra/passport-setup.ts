import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
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
        // @ts-ignore — passport-google-oauth20 v2 types no aceptan passReqToCallback con 5 args
        async (
          _req: unknown,
          _accessToken: string,
          _refreshToken: string,
          profile: { id: string; emails?: { value: string; verified?: boolean }[]; displayName?: string },
          done: (err: Error | null, user?: unknown) => void,
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
            done(null, identity);
          } catch (e) {
            done(e as Error, undefined);
          }
        },
      ),
    );
  }

  if (isAppleConfigured()) {
    // @ts-ignore — AppleStrategy no tiene tipos consistentes
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
          _req: unknown,
          _accessToken: string,
          _refreshToken: string,
          idToken: { sub: string; email?: string; email_verified?: boolean | string; name?: string },
          done: (err: Error | null, user?: unknown) => void,
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
            done(null, identity);
          } catch (e) {
            done(e as Error, undefined);
          }
        },
      ),
    );
  }

  passport.serializeUser((user, done) => done(null, user));
  // @ts-ignore — passport deserializeUser tipiza user como User, no como unknown
  passport.deserializeUser((obj, done) => done(null, obj));
};

export const hasStrategy = (provider: OAuthProvider): boolean => {
  const strategies = (passport as unknown as {
    _strategy: (n: string) => unknown;
  })._strategy;
  return typeof strategies(provider) === "object" && strategies(provider) !== null;
};

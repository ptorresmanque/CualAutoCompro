import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const OAUTH_STATE_COOKIE_NAME = "oauth_state";
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type OAuthProvider = "google" | "apple";

export type OAuthStatePayload = {
  csrf: string;
  nonce: string;
  provider: OAuthProvider;
  returnTo: string;
};

const RETURN_TO_RE = /^\/[A-Za-z0-9/_\-?&=,]*$/;

export const sanitizeReturnTo = (raw: unknown): string => {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (!RETURN_TO_RE.test(raw)) return "/";
  if (raw.length > 200) return "/";
  return raw;
};

export const signState = (payload: OAuthStatePayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: `${OAUTH_STATE_TTL_MS / 1000}s`,
  });
};

export const verifyState = (token: string): OAuthStatePayload => {
  let decoded: jwt.JwtPayload | string;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET);
  } catch {
    throw new Error("OAUTH_STATE_INVALID");
  }
  if (typeof decoded === "string") throw new Error("OAUTH_STATE_INVALID");
  const p = decoded as Partial<OAuthStatePayload>;
  if (
    typeof p.csrf !== "string" ||
    typeof p.nonce !== "string" ||
    (p.provider !== "google" && p.provider !== "apple") ||
    typeof p.returnTo !== "string"
  ) {
    throw new Error("OAUTH_STATE_INVALID");
  }
  return p as OAuthStatePayload;
};

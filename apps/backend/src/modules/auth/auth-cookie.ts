import type { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_NAME = "auth";

export const cookieOpts: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const clearAuthCookie = (res: {
  clearCookie: (name: string, opts?: CookieOptions) => void;
}) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
};

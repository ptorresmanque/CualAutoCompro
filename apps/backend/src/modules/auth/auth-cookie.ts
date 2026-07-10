import type { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_NAME = "auth";

// En dev, el backend (3000) y el frontend (4200) son orígenes distintos.
// Para que la cookie `auth` sea legible desde ambos, fijamos Domain=localhost
// (los navegadores comparten cookies entre puertos de localhost). En prod no se
// necesita — el backend y el frontend comparten dominio público.
export const cookieOpts: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
  domain: isProd ? undefined : "localhost",
};

export const clearAuthCookie = (res: {
  clearCookie: (name: string, opts?: CookieOptions) => void;
}) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    path: "/",
    domain: isProd ? undefined : "localhost",
  });
};

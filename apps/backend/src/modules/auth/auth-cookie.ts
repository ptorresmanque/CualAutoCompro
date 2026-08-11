import type { CookieOptions } from "express";
import { isProduction } from "../../config/env.js";

export const AUTH_COOKIE_NAME = "auth";

// Acá había un `domain: "localhost"` en dev, puesto para que la cookie fuera
// legible desde el front (:4200) y el back (:3000). No hacía falta y rompía
// Safari:
//   - El puerto no forma parte del ámbito de una cookie (RFC 6265 §8.5): una
//     cookie host-only de `localhost` ya viaja a cualquier puerto de localhost.
//     La cookie `cmp_uid` de popularity nunca tuvo `domain` y funciona igual.
//   - WebKit descarta un Set-Cookie con `Domain=localhost` porque localhost no
//     es un dominio registrable. En Safari la sesión no se guardaba: el login
//     respondía 200, el front entraba al panel con el usuario en memoria, y
//     después todas las llamadas daban 401.
// Sin `domain`, la cookie es host-only en dev y en prod, que es lo que hay que
// pedir en ambos casos.
export const cookieOpts: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const clearAuthCookie = (res: {
  clearCookie: (name: string, opts?: CookieOptions) => void;
}) => {
  // Los atributos tienen que coincidir con los del alta o el navegador no
  // encuentra la cookie que hay que borrar.
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
};

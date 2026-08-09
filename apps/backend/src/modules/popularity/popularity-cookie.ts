import type { Response } from "express";
import { randomUUID } from "node:crypto";

// Nombre publico de la cookie anonima. No debe chocar con AUTH_COOKIE_NAME.
// Esta cookie NO es PII: es un UUID random solo para deduplicar eventos
// del mismo navegador y limitar el rate por dispositivo. Bajo GDPR/LGPD no
// requiere consentimiento.
const POPULARITY_COOKIE_NAME = "cmp_uid";

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: ONE_YEAR_MS,
  path: "/",
};

/**
 * Devuelve el cookieId del request; si no existe crea uno nuevo y lo setea
 * en la respuesta (Set-Cookie). Idempotente: llamar dos veces seguidas no
 * genera cookies duplicadas si el navegador ya devuelve la cookie.
 */
export const ensurePopularityCookie = (req: { cookies?: Record<string, string> }, res: Response): string => {
  const existing = req.cookies?.[POPULARITY_COOKIE_NAME];
  if (existing && typeof existing === "string" && existing.length > 0) return existing;

  const id = randomUUID();
  res.cookie(POPULARITY_COOKIE_NAME, id, cookieOpts);
  return id;
};

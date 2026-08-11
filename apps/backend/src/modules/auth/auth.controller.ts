import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { AuthService } from "./auth.service.js";
import { prisma } from "../../infra/prisma.js";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from "./auth.dto.js";
import { tooManyRequests, unauthorized, validation } from "../../shared/errors.js";
import { sign, verify } from "../../infra/jwt.js";
import { AUTH_COOKIE_NAME, clearAuthCookie, cookieOpts } from "./auth-cookie.js";
import { isAuthRateLimited } from "./auth-rate-limit.js";
import { authenticate } from "./auth.middleware.js";

const svc = new AuthService(prisma);

export const authController = {
  register: ah(async (req: Request, res: Response) => {
    if (isAuthRateLimited(`register:${req.ip}`)) throw tooManyRequests();
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    const safe = await svc.register(parsed.data);
    const token = sign({ sub: safe.id, email: safe.email, name: safe.name, role: safe.role });
    res.cookie(AUTH_COOKIE_NAME, token, cookieOpts);
    return res.json(ok(safe));
  }),

  login: ah(async (req: Request, res: Response) => {
    if (isAuthRateLimited(`login:${req.ip}`)) throw tooManyRequests();
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    const r = await svc.login(parsed.data);
    res.cookie(AUTH_COOKIE_NAME, r.token, cookieOpts);
    return res.json(ok(r.user));
  }),

  forgotPassword: ah(async (req: Request, res: Response) => {
    if (isAuthRateLimited(`forgot:${req.ip}`)) throw tooManyRequests();
    const parsed = forgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    await svc.forgotPassword(parsed.data.email);
    // Always respond with the same shape to avoid leaking whether the email exists.
    res.json(ok({ sent: true }));
  }),

  resetPassword: ah(async (req: Request, res: Response) => {
    if (isAuthRateLimited(`reset:${req.ip}`)) throw tooManyRequests();
    const parsed = resetPasswordSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    const result = await svc.resetPassword(parsed.data.token, parsed.data.newPassword);
    res.json(ok(result));
  }),

    logout: ah(async (_req: Request, res: Response) => {
    clearAuthCookie(res);
    return res.json(ok({ loggedOut: true }));
  }),

  /**
   * Sondeo de sesión: devuelve el usuario logueado, o `data: null` si no hay
   * nadie. No 401 — el front lo llama en cada arranque para decidir si hidratar
   * la sesión, y un status de error hace que el navegador escriba un error en
   * la consola en toda visita anónima (la pantalla de login incluida) por algo
   * que no es una falla. Los endpoints que sí exigen sesión (PATCH /me, etc.)
   * pasan por `authenticate` y siguen respondiendo 401.
   */
  me: ah(async (req: Request, res: Response) => {
    const token = req.cookies?.auth;
    if (!token) return res.json(ok(null));
    try {
      const payload = verify(token);
      return res.json(ok({ id: payload.sub, email: payload.email, name: payload.name, role: payload.role }));
    } catch {
      return res.json(ok(null));
    }
  }),

  updateMe: [authenticate, ah(async (req: Request, res: Response) => {
    if (!req.user) throw unauthorized();
    const parsed = updateProfileSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    const updated = await svc.updateProfile(req.user.id, parsed.data.name);
    res.json(ok(updated));
  })],

  changePassword: [authenticate, ah(async (req: Request, res: Response) => {
    if (!req.user) throw unauthorized();
    const parsed = changePasswordSchema.safeParse(req.body);
    if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
    res.json(ok(await svc.changePassword(req.user.id, parsed.data.currentPassword, parsed.data.newPassword)));
  })],

  deleteMe: [authenticate, ah(async (req: Request, res: Response) => {
    if (!req.user) throw unauthorized();
    const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
    const result = await svc.deleteAccount(req.user.id, currentPassword);
    clearAuthCookie(res);
    res.json(ok(result));
  })],
};

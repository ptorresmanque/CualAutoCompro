import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { AuthService } from "./auth.service.js";
import { prisma } from "../../infra/prisma.js";
import { loginSchema, registerSchema } from "./auth.dto.js";
import { unauthorized, validation } from "../../shared/errors.js";
import { sign, verify } from "../../infra/jwt.js";
import { AUTH_COOKIE_NAME, clearAuthCookie, cookieOpts } from "./auth-cookie.js";

const svc = new AuthService(prisma);

export const authController = {
  register: ah(async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    const safe = await svc.register(parsed.data);
    const token = sign({ sub: safe.id, email: safe.email, name: safe.name, role: safe.role });
    res.cookie(AUTH_COOKIE_NAME, token, cookieOpts);
    return res.json(ok(safe));
  }),

  login: ah(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    const r = await svc.login(parsed.data);
    res.cookie(AUTH_COOKIE_NAME, r.token, cookieOpts);
    return res.json(ok(r.user));
  }),

  logout: ah(async (_req: Request, res: Response) => {
    clearAuthCookie(res);
    return res.json(ok({ loggedOut: true }));
  }),

  me: ah(async (req: Request, res: Response) => {
    const token = req.cookies?.auth;
    if (!token) throw unauthorized();
    try {
      const payload = verify(token);
      return res.json(ok({ id: payload.sub, email: payload.email, name: payload.name, role: payload.role }));
    } catch {
      throw unauthorized();
    }
  }),
};
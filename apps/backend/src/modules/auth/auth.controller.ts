import type { Request, Response } from "express";
import { ah } from "../../shared/async-handler.js";
import { ok } from "../../shared/response.js";
import { AuthService } from "./auth.service.js";
import { prisma } from "../../infra/prisma.js";
import { loginSchema, registerSchema } from "./auth.dto.js";
import { unauthorized, validation } from "../../shared/errors.js";
import { sign, verify } from "../../infra/jwt.js";

const svc = new AuthService(prisma);

const cookieOpts = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const authController = {
  register: ah(async (req: Request, res: Response) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    const { passwordHash: _omit, ...safe } = await svc.register(parsed.data);
    const token = sign({ sub: safe.id, email: safe.email, name: safe.name });
    res.cookie("auth", token, cookieOpts);
    return res.json(ok(safe));
  }),

  login: ah(async (req: Request, res: Response) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));
    const r = await svc.login(parsed.data);
    res.cookie("auth", r.token, cookieOpts);
    return res.json(ok(r.user));
  }),

  logout: ah(async (_req: Request, res: Response) => {
    res.clearCookie("auth", { path: "/" });
    return res.json(ok({ loggedOut: true }));
  }),

  me: ah(async (req: Request, res: Response) => {
    const token = req.cookies?.auth;
    if (!token) throw unauthorized();
    try {
      const payload = verify(token);
      return res.json(ok({ id: payload.sub, email: payload.email, name: payload.name }));
    } catch {
      throw unauthorized();
    }
  }),
};
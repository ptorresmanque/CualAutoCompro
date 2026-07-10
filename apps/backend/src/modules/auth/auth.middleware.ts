import type { Request, Response, NextFunction } from "express";
import { unauthorized } from "../../shared/errors.js";
import { verify } from "../../infra/jwt.js";
import type { UserRole } from "../../shared/user-role.js";

declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      name: string;
      role: UserRole;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.cookies?.auth;
  if (!token) return next(unauthorized());
  try {
    const payload = verify(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
    } as Express.User;
    next();
  } catch {
    next(unauthorized());
  }
};
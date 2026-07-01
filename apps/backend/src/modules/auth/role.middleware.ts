import type { Request, Response, NextFunction } from "express";
import { forbidden, unauthorized } from "../../shared/errors.js";

export const requireRole = (role: "USER" | "ADMIN") =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(unauthorized());
    if (req.user.role !== role) return next(forbidden(`Requiere rol ${role}`));
    next();
  };

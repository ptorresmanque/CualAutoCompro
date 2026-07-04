import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "../shared/user-role.js";

export type JwtPayload = {
  sub: string;
  email: string;
  name: string;
  role: UserRole;
};

export const sign = (payload: JwtPayload): string =>
  jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as jwt.SignOptions);

export const verify = (token: string): JwtPayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string") throw new Error("INVALID_TOKEN");
  const payload = decoded as Partial<JwtPayload>;
  if (
    typeof payload.sub !== "string" ||
    typeof payload.email !== "string" ||
    typeof payload.name !== "string" ||
    (payload.role !== "USER" && payload.role !== "ADMIN")
  ) {
    throw new Error("INVALID_TOKEN");
  }
  return payload as JwtPayload;
};
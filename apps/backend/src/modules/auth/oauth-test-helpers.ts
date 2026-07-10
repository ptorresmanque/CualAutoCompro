import { prisma } from "../../infra/prisma.js";
import { OAuthService } from "./oauth.service.js";
import { sign } from "../../infra/jwt.js";
import { AUTH_COOKIE_NAME, cookieOpts } from "./auth-cookie.js";

export const simulateOAuthCallback = async (params: {
  provider: "google" | "apple";
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
}): Promise<{
  cookie: string;
  user: { id: string; email: string; name: string; role: "USER" | "ADMIN" };
}> => {
  const svc = new OAuthService(prisma);
  const user = await svc.resolveUser(params);
  const token = sign({ sub: user.id, email: user.email, name: user.name, role: user.role });
  const cookie = `${AUTH_COOKIE_NAME}=${token}; Max-Age=${cookieOpts.maxAge! / 1000}; Path=/; HttpOnly`;
  return { cookie, user };
};
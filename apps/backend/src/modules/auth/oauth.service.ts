import type { PrismaClient } from "@prisma/client";
import { oauthError } from "../../shared/errors.js";
import type { OAuthProvider } from "./oauth-state.js";

type ProviderIdentity = {
  provider: OAuthProvider;
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
};

type ResolvedUser = {
  id: string;
  email: string;
  name: string;
  role: "USER" | "ADMIN";
};

export class OAuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async resolveUser(identity: ProviderIdentity): Promise<ResolvedUser> {
    if (!identity.emailVerified) {
      throw oauthError(
        "OAUTH_EMAIL_NOT_VERIFIED",
        "El email del provider no esta verificado.",
      );
    }

    // 1. Match por (provider, sub) — login directo
    const existing = await this.prisma.userIdentity.findUnique({
      where: {
        provider_providerSub: {
          provider: identity.provider,
          providerSub: identity.sub,
        },
      },
      include: { user: true },
    });
    if (existing) {
      await this.prisma.userIdentity.update({
        where: { id: existing.id },
        data: { lastUsedAt: new Date(), email: identity.email },
      });
      return {
        id: existing.user.id,
        email: existing.user.email,
        name: existing.user.name,
        role: existing.user.role as "USER" | "ADMIN",
      };
    }

    // 2. Apple puede no traer email en sign-ins subsiguientes
    if (!identity.email) {
      throw oauthError(
        "OAUTH_EMAIL_REQUIRED",
        "Apple no devolvio email y no hay identidad previa.",
      );
    }

    // 3. Match por email — vincula a User local existente
    const localUser = await this.prisma.user.findUnique({
      where: { email: identity.email },
    });
    if (localUser) {
      await this.prisma.userIdentity.create({
        data: {
          userId: localUser.id,
          provider: identity.provider,
          providerSub: identity.sub,
          email: identity.email,
        },
      });
      return {
        id: localUser.id,
        email: localUser.email,
        name: localUser.name,
        role: localUser.role as "USER" | "ADMIN",
      };
    }

    // 4. Crea User + UserIdentity en tx
    const created = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: identity.email!,
          passwordHash: null,
          name: identity.name ?? (identity.email!.split("@")[0] || identity.email!),
          role: "USER",
        },
      });
      await tx.userIdentity.create({
        data: {
          userId: user.id,
          provider: identity.provider,
          providerSub: identity.sub,
          email: identity.email,
        },
      });
      return user;
    });

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      role: created.role as "USER" | "ADMIN",
    };
  }
}

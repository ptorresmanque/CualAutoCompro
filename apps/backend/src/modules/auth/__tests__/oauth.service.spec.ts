import { describe, it, expect, beforeEach } from "vitest";
import { OAuthService } from "../oauth.service.js";
import { setupTestPrisma, resetTestDb } from "../../../../__tests__/helpers/db.js";
import { prisma } from "../../../infra/prisma.js";

const id = (n: string, suffix: string) =>
  `${n}-${suffix}@oauth-test.cl`;

describe("OAuthService.resolveUser", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("crea User + UserIdentity si el email esta verificado y no existe", async () => {
    const svc = new OAuthService(prisma);
    const u = await svc.resolveUser({
      provider: "google",
      sub: "g-sub-1",
      email: id("ana", "1"),
      emailVerified: true,
      name: "Ana",
    });
    expect(u.email).toBe(id("ana", "1"));
    expect(u.role).toBe("USER");

    const dbUser = await prisma.user.findUnique({
      where: { email: id("ana", "1") },
    });
    expect(dbUser?.passwordHash).toBeNull();
    const idents = await prisma.userIdentity.findMany({
      where: { userId: dbUser!.id },
    });
    expect(idents).toHaveLength(1);
    expect(idents[0]?.provider).toBe("google");
  });

  it("vincula por email a User local existente sin duplicar", async () => {
    const local = await prisma.user.create({
      data: {
        email: id("luis", "1"),
        passwordHash: "$2a$10$abcdefghijklmnopqrstuv",
        name: "Luis",
        role: "USER",
      },
    });
    const svc = new OAuthService(prisma);
    const u = await svc.resolveUser({
      provider: "google",
      sub: "g-sub-2",
      email: id("luis", "1"),
      emailVerified: true,
      name: "Luis",
    });
    expect(u.id).toBe(local.id);
    const idents = await prisma.userIdentity.findMany({
      where: { userId: local.id },
    });
    expect(idents).toHaveLength(1);
    expect(idents[0]?.provider).toBe("google");
  });

  it("match por providerSub aunque el email cambie", async () => {
    const svc = new OAuthService(prisma);
    await svc.resolveUser({
      provider: "apple",
      sub: "a-sub-1",
      email: id("sofi", "1"),
      emailVerified: true,
      name: "Sofi",
    });
    const u = await svc.resolveUser({
      provider: "apple",
      sub: "a-sub-1",
      email: null,
      emailVerified: true,
      name: null,
    });
    expect(u.email).toBe(id("sofi", "1"));
    const users = await prisma.user.count();
    expect(users).toBe(1);
  });

  it("bloquea si email_verified es false", async () => {
    const svc = new OAuthService(prisma);
    await expect(
      svc.resolveUser({
        provider: "google",
        sub: "g-sub-x",
        email: id("eve", "1"),
        emailVerified: false,
        name: "Eve",
      }),
    ).rejects.toMatchObject({ code: "OAUTH_EMAIL_NOT_VERIFIED" });
    expect(await prisma.user.count()).toBe(0);
  });

  it("bloquea Apple sin email y sin match previo por sub", async () => {
    const svc = new OAuthService(prisma);
    await expect(
      svc.resolveUser({
        provider: "apple",
        sub: "a-sub-y",
        email: null,
        emailVerified: true,
        name: null,
      }),
    ).rejects.toMatchObject({ code: "OAUTH_EMAIL_REQUIRED" });
    expect(await prisma.user.count()).toBe(0);
  });

  it("actualiza lastUsedAt en cada login", async () => {
    const svc = new OAuthService(prisma);
    await svc.resolveUser({
      provider: "google",
      sub: "g-sub-z",
      email: id("mat", "1"),
      emailVerified: true,
      name: "Mat",
    });
    const first = await prisma.userIdentity.findFirstOrThrow({
      where: { provider: "google", providerSub: "g-sub-z" },
    });
    const t1 = first.lastUsedAt.getTime();
    await new Promise((r) => setTimeout(r, 10));
    await svc.resolveUser({
      provider: "google",
      sub: "g-sub-z",
      email: id("mat", "1"),
      emailVerified: true,
      name: "Mat",
    });
    const second = await prisma.userIdentity.findFirstOrThrow({
      where: { provider: "google", providerSub: "g-sub-z" },
    });
    expect(second.lastUsedAt.getTime()).toBeGreaterThan(t1);
  });
});
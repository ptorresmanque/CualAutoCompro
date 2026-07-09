# OAuth Google + Apple Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar "Continuar con Google" y "Continuar con Apple" al sitio `cualautocompro.cl`, manteniendo el login email/password funcionando. Ambos métodos producen la misma sesión (`auth` cookie httpOnly con JWT).

**Architecture:** Passport.js + `openid-client` contra los endpoints oficiales de Google y Apple. Cookie firmada propia para el `state`/`nonce` (sin `express-session`). Tabla nueva `UserIdentity` para vincular providers a `User`. Frontend hace full navigation a `/api/v1/auth/{provider}` para que la cookie httpOnly se setee.

**Tech Stack:** Node 20+, Express 4, Prisma 5.22 + MariaDB 11, TypeScript ~6, Vitest 4, Passport 0.7, `passport-google-oauth20` 2, `@nicokaiser/passport-apple` 2, `openid-client` 5; Angular 22 (standalone + signals + OnPush), Angular Material 22, Vitest 4, Playwright 1.61.

**Spec:** `docs/superpowers/specs/2026-07-09-oauth-google-apple-design.md`

## Global Constraints

- Versiones de deps **exactas** (sin `^` salvo donde el spec lo indique).
- TypeScript imports usan **`.js`** (no `.ts`) por convención ESM del backend.
- Frontend: componentes **standalone**, **OnPush**, **signals** para estado local.
- Backend: errores tipados vía `AppError` con códigos en `shared/errors.ts`. Para errores OAuth usamos códigos string libres (no entran al `ErrorCode` enum) propagados por el redirect a `/login?error=<code>`.
- Cookies en backend: en test `secure:false`, en prod `secure:true`. `httpOnly:true`, `sameSite:"lax"`.
- Tests backend: setup común con `setupTestPrisma()` + `resetTestDb(prisma)`. Suite usa `.env.test` (sin envs OAuth seteadas → `/auth/providers` devuelve `{google:false, apple:false}`).
- Sin agregar dependencias binarias nativas nuevas (cPanel/LVE).
- Sin cambios al JWT, sesión ni `authenticate`/`requireRole` existentes.

---

## File Structure

```
apps/backend/
  package.json                                              MOD
  .env.example                                              MOD
  src/
    config/env.ts                                           MOD
    app.ts                                                  MOD
    shared/errors.ts                                        MOD (OAuthError)
    modules/auth/
      auth-cookie.ts                                        CREATE (helper extraído)
      oauth-state.ts                                        CREATE
      __tests__/oauth-state.spec.ts                         CREATE
      oauth-rate-limit.ts                                   CREATE
      oauth.service.ts                                      CREATE
      __tests__/oauth.service.spec.ts                       CREATE
      oauth.routes.ts                                       CREATE
      providers.routes.ts                                   CREATE
      __tests__/providers.spec.ts                           CREATE
      infra/passport-setup.ts                               CREATE
  prisma/
    schema.prisma                                           MOD
    migrations/20260709120000_oauth_identity/
      migration.sql                                         CREATE

apps/backend/__tests__/helpers/
  oauth.ts                                                  CREATE (simulación de callback E2E)

apps/frontend/
  src/
    app/core/
      auth.service.ts                                       MOD
      auth.service.spec.ts                                  MOD
    app/features/auth/
      social-buttons.component.ts                           CREATE
      social-buttons.component.html                         CREATE
      social-buttons.component.css                          CREATE
      __tests__/social-buttons.component.spec.ts             CREATE
      login.component.html                                  MOD
      login.component.ts                                    MOD
      register.component.html                               MOD
      register.component.ts                                 MOD
    e2e/
      social-login.spec.ts                                  CREATE
      social-login-providers.spec.ts                        CREATE

docs/
  setup.md                                                  MOD (sección OAuth)
```

Cada archivo nuevo es responsable de **una sola cosa**:

- `oauth-state.ts` → firmar/verificar cookies `oauth_state`.
- `oauth.service.ts` → resolver/crear `User` + `UserIdentity` desde una identidad de provider.
- `oauth.routes.ts` → wire-up HTTP + Passport (start + callback).
- `providers.routes.ts` → endpoint JSON de providers configurados.
- `passport-setup.ts` → registrar strategies de Passport (lazy si faltan envs).
- `oauth-rate-limit.ts` → rate limit en memoria por IP.
- `auth-cookie.ts` → helper extraído con `cookieOpts` (DRY entre `auth.controller.ts` y `oauth.routes.ts`).
- `social-buttons.component.ts` → render aislado de los botones OAuth + consulta a `/auth/providers`.

---

## Task 1: Instalar dependencias backend

**Files:**
- Modify: `apps/backend/package.json`

- [ ] **Step 1: Instalar deps**

Run:
```bash
npm -w apps/backend install \
  passport@0.7.0 \
  passport-google-oauth20@2.0.0 \
  @nicokaiser/passport-apple@2.0.0 \
  openid-client@5.7.0
npm -w apps/backend install -D \
  @types/passport@1.0.16 \
  @types/passport-google-oauth20@2.0.16
```

Expected: ambas installs terminan sin error.

- [ ] **Step 2: Verificar que las deps quedaron en package.json**

Run:
```bash
grep -E '"(passport|passport-google-oauth20|@nicokaiser/passport-apple|openid-client)"' apps/backend/package.json
```

Expected: 4 líneas con las versiones exactas.

- [ ] **Step 3: Verificar que el build sigue OK**

Run: `npm -w apps/backend run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/package.json apps/backend/package-lock.json
git commit -m "chore(be): add passport + openid-client deps for OAuth"
```

---

## Task 2: Migración Prisma — `User.passwordHash` nullable + tabla `UserIdentity`

**Files:**
- Modify: `apps/backend/prisma/schema.prisma`

- [ ] **Step 1: Editar schema**

Edit `apps/backend/prisma/schema.prisma`. Reemplazar `model User` por:

```prisma
model User {
  id           String         @id @default(cuid())
  email        String         @unique
  passwordHash String?
  name         String
  role         String         @default("USER")
  createdAt    DateTime       @default(now())
  comparisons  Comparison[]
  favorites    Favorite[]
  identities   UserIdentity[]
}
```

Agregar al final del archivo (después de `FuelPrice`):

```prisma
model UserIdentity {
  id           String   @id @default(cuid())
  userId       String
  provider     String
  providerSub  String
  email        String?
  createdAt    DateTime @default(now())
  lastUsedAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerSub])
  @@index([userId])
  @@index([email])
}
```

- [ ] **Step 2: Generar la migración**

Run:
```bash
cd apps/backend && npx prisma migrate dev --name oauth_identity --skip-seed
```

Expected: crea `apps/backend/prisma/migrations/20260709120000_oauth_identity/migration.sql`.

- [ ] **Step 3: Regenerar cliente Prisma**

Run: `cd apps/backend && npx prisma generate`
Expected: exit 0.

- [ ] **Step 4: Aplicar migración en la BD de dev/test**

Run: `cd apps/backend && npx prisma migrate deploy`
Expected: exit 0, "Already up to date" o aplica la migración nueva.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/prisma
git commit -m "feat(be): User.passwordHash nullable + UserIdentity table"
```

---

## Task 3: Helper `auth-cookie.ts` (DRY)

**Files:**
- Create: `apps/backend/src/modules/auth/auth-cookie.ts`
- Modify: `apps/backend/src/modules/auth/auth.controller.ts`

- [ ] **Step 1: Crear `auth-cookie.ts`**

```ts
import type { CookieOptions } from "express";

const isProd = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_NAME = "auth";

export const cookieOpts: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: isProd,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
};

export const clearAuthCookie = (res: {
  clearCookie: (name: string, opts?: CookieOptions) => void;
}) => {
  res.clearCookie(AUTH_COOKIE_NAME, { path: "/" });
};
```

- [ ] **Step 2: Refactorizar `auth.controller.ts`**

En `apps/backend/src/modules/auth/auth.controller.ts`:

1. Eliminar la constante local `cookieOpts`.
2. Reemplazar `res.cookie("auth", token, cookieOpts)` por `res.cookie(AUTH_COOKIE_NAME, token, cookieOpts)`.
3. Reemplazar `res.clearCookie("auth", { path: "/" })` por `clearAuthCookie(res)`.
4. Agregar import: `import { AUTH_COOKIE_NAME, clearAuthCookie, cookieOpts } from "./auth-cookie.js";`

- [ ] **Step 3: Verificar que los tests siguen pasando**

Run: `npm -w apps/backend run test`
Expected: todos verdes (incluido `auth.controller.spec.ts`).

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/auth/auth-cookie.ts apps/backend/src/modules/auth/auth.controller.ts
git commit -m "refactor(be): extract auth cookie helper"
```

---

## Task 4: `oauth-state.ts` — firmar/verificar cookie de estado

**Files:**
- Create: `apps/backend/src/modules/auth/oauth-state.ts`
- Create: `apps/backend/src/modules/auth/__tests__/oauth-state.spec.ts`

- [ ] **Step 1: Crear `oauth-state.ts`**

```ts
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

export const OAUTH_STATE_COOKIE_NAME = "oauth_state";
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type OAuthProvider = "google" | "apple";

export type OAuthStatePayload = {
  csrf: string;
  nonce: string;
  provider: OAuthProvider;
  returnTo: string;
};

const RETURN_TO_RE = /^\/[A-Za-z0-9/_\-?&=]*$/;

export const sanitizeReturnTo = (raw: unknown): string => {
  if (typeof raw !== "string") return "/";
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  if (!RETURN_TO_RE.test(raw)) return "/";
  if (raw.length > 200) return "/";
  return raw;
};

export const signState = (payload: OAuthStatePayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: `${OAUTH_STATE_TTL_MS / 1000}s`,
  });
};

export const verifyState = (token: string): OAuthStatePayload => {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === "string") throw new Error("OAUTH_STATE_INVALID");
  const p = decoded as Partial<OAuthStatePayload>;
  if (
    typeof p.csrf !== "string" ||
    typeof p.nonce !== "string" ||
    (p.provider !== "google" && p.provider !== "apple") ||
    typeof p.returnTo !== "string"
  ) {
    throw new Error("OAUTH_STATE_INVALID");
  }
  return p as OAuthStatePayload;
};
```

- [ ] **Step 2: Crear `__tests__/oauth-state.spec.ts`**

```ts
import { describe, it, expect } from "vitest";
import {
  sanitizeReturnTo,
  signState,
  verifyState,
  type OAuthStatePayload,
} from "../oauth-state.js";

describe("oauth-state", () => {
  const base: OAuthStatePayload = {
    csrf: "csrf-abc",
    nonce: "nonce-xyz",
    provider: "google",
    returnTo: "/cuenta",
  };

  describe("sanitizeReturnTo", () => {
    it("acepta paths internos validos", () => {
      expect(sanitizeReturnTo("/cuenta")).toBe("/cuenta");
      expect(sanitizeReturnTo("/compare?ids=1,2")).toBe("/compare?ids=1,2");
      expect(sanitizeReturnTo("/a-b_c/d")).toBe("/a-b_c/d");
    });
    it("rechaza open redirects", () => {
      expect(sanitizeReturnTo("//evil.com")).toBe("/");
      expect(sanitizeReturnTo("http://evil.com")).toBe("/");
      expect(sanitizeReturnTo("")).toBe("/");
      expect(sanitizeReturnTo(null)).toBe("/");
      expect(sanitizeReturnTo(undefined)).toBe("/");
      expect(sanitizeReturnTo("/path with space")).toBe("/");
      expect(sanitizeReturnTo("/" + "a".repeat(201))).toBe("/");
    });
  });

  describe("signState / verifyState", () => {
    it("verifica un payload recien firmado", () => {
      const token = signState(base);
      const decoded = verifyState(token);
      expect(decoded.csrf).toBe(base.csrf);
      expect(decoded.nonce).toBe(base.nonce);
      expect(decoded.provider).toBe("google");
      expect(decoded.returnTo).toBe(base.returnTo);
    });
    it("rechaza token alterado (firma invalida)", () => {
      const token = signState(base);
      const tampered = token.slice(0, -2) + "AA";
      expect(() => verifyState(tampered)).toThrow("OAUTH_STATE_INVALID");
    });
    it("rechaza provider desconocido", () => {
      const token = signState({ ...base, provider: "facebook" as never });
      expect(() => verifyState(token)).toThrow("OAUTH_STATE_INVALID");
    });
  });
});
```

- [ ] **Step 3: Correr el test**

Run: `npm -w apps/backend run test -- oauth-state`
Expected: 8 tests pasan.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/modules/auth/oauth-state.ts apps/backend/src/modules/auth/__tests__/oauth-state.spec.ts
git commit -m "feat(be): oauth state cookie sign/verify"
```

---

## Task 5: `oauth-rate-limit.ts` — rate limit en memoria por IP

**Files:**
- Create: `apps/backend/src/modules/auth/oauth-rate-limit.ts`

- [ ] **Step 1: Crear el archivo**

```ts
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 10;

const buckets = new Map<string, number[]>();

export const isRateLimited = (ip: string): boolean => {
  const now = Date.now();
  const cutoff = now - WINDOW_MS;
  const list = buckets.get(ip) ?? [];
  const fresh = list.filter((t) => t > cutoff);
  if (fresh.length >= MAX_PER_WINDOW) {
    buckets.set(ip, fresh);
    return true;
  }
  fresh.push(now);
  buckets.set(ip, fresh);
  return false;
};

export const __resetRateLimit = (): void => {
  buckets.clear();
};
```

- [ ] **Step 2: Commit**

```bash
git add apps/backend/src/modules/auth/oauth-rate-limit.ts
git commit -m "feat(be): oauth start rate limit (10/min/IP, in-memory)"
```

---

## Task 6: `OAuthError` + `oauth.service.ts` — resolver/crear User + UserIdentity

**Files:**
- Modify: `apps/backend/src/shared/errors.ts`
- Create: `apps/backend/src/modules/auth/oauth.service.ts`

- [ ] **Step 1: Agregar `OAuthError` en `shared/errors.ts`**

Al final del archivo `apps/backend/src/shared/errors.ts`, agregar:

```ts
export class OAuthError extends Error {
  constructor(
    public readonly code:
      | "OAUTH_NOT_CONFIGURED"
      | "OAUTH_STATE_INVALID"
      | "OAUTH_DENIED"
      | "OAUTH_EMAIL_NOT_VERIFIED"
      | "OAUTH_EMAIL_REQUIRED"
      | "OAUTH_PROVIDER_ERROR"
      | "OAUTH_INTERNAL",
    message: string,
  ) {
    super(message);
    this.name = "OAuthError";
  }
}

export const oauthError = (
  code: OAuthError["code"],
  message: string,
): OAuthError => new OAuthError(code, message);
```

- [ ] **Step 2: Crear `oauth.service.ts`**

```ts
import type { PrismaClient } from "@prisma/client";
import { oauthError } from "../../shared/errors.js";
import type { OAuthProvider } from "./oauth-state.js";

export type ProviderIdentity = {
  provider: OAuthProvider;
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
};

export type ResolvedUser = {
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
          name: identity.name ?? identity.email!.split("@")[0],
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
```

- [ ] **Step 3: Verificar que compila**

Run: `npm -w apps/backend run build`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/shared/errors.ts apps/backend/src/modules/auth/oauth.service.ts
git commit -m "feat(be): OAuthService resolveUser (upsert + link by email)"
```

---

## Task 7: Test de `OAuthService.resolveUser`

**Files:**
- Create: `apps/backend/src/modules/auth/__tests__/oauth.service.spec.ts`

- [ ] **Step 1: Crear el test**

```ts
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
```

- [ ] **Step 2: Correr el test**

Run: `npm -w apps/backend run test -- oauth.service`
Expected: 6 tests pasan.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/auth/__tests__/oauth.service.spec.ts
git commit -m "test(be): OAuthService resolveUser scenarios"
```

---

## Task 8: `env.ts` — agregar envs OAuth y validación de consistencia

**Files:**
- Modify: `apps/backend/src/config/env.ts`

- [ ] **Step 1: Editar el schema zod**

En `apps/backend/src/config/env.ts`, agregar al schema (después de `ADMIN_INITIAL_PASSWORD`):

```ts
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  APPLE_CLIENT_ID: z.string().optional(),
  APPLE_KEY_ID: z.string().optional(),
  APPLE_TEAM_ID: z.string().optional(),
  APPLE_PRIVATE_KEY: z.string().optional(),
```

- [ ] **Step 2: Agregar validación de consistencia**

Al final del archivo, antes de `export type Env`:

```ts
const googleCount = [env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET].filter(
  Boolean,
).length;
if (googleCount > 0 && googleCount < 2) {
  throw new Error(
    "OAuth Google mal configurado: debe setear GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET juntos o ninguno.",
  );
}

const appleCount = [
  env.APPLE_CLIENT_ID,
  env.APPLE_KEY_ID,
  env.APPLE_TEAM_ID,
  env.APPLE_PRIVATE_KEY,
].filter(Boolean).length;
if (appleCount > 0 && appleCount < 4) {
  throw new Error(
    "OAuth Apple mal configurado: requiere APPLE_CLIENT_ID, APPLE_KEY_ID, APPLE_TEAM_ID y APPLE_PRIVATE_KEY.",
  );
}
```

- [ ] **Step 3: Verificar build + tests**

Run:
```bash
npm -w apps/backend run build && npm -w apps/backend run test
```

Expected: exit 0 y tests verdes.

- [ ] **Step 4: Commit**

```bash
git add apps/backend/src/config/env.ts
git commit -m "feat(be): OAuth envs + consistency check"
```

---

## Task 9: `infra/passport-setup.ts` — registrar strategies

**Files:**
- Create: `apps/backend/src/modules/auth/infra/passport-setup.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
// @ts-expect-error — @nicokaiser/passport-apple no exporta tipos consistentes
import AppleStrategy from "@nicokaiser/passport-apple";
import { env } from "../../../config/env.js";
import type { OAuthProvider } from "../oauth-state.js";

export const isGoogleConfigured = (): boolean =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

export const isAppleConfigured = (): boolean =>
  Boolean(
    env.APPLE_CLIENT_ID &&
      env.APPLE_KEY_ID &&
      env.APPLE_TEAM_ID &&
      env.APPLE_PRIVATE_KEY,
  );

export const readApplePrivateKey = (): string => {
  const raw = env.APPLE_PRIVATE_KEY ?? "";
  const pem = raw.replace(/\\n/g, "\n");
  if (!pem.startsWith("-----BEGIN")) {
    throw new Error("APPLE_PRIVATE_KEY malformada (debe empezar con -----BEGIN).");
  }
  return pem;
};

export const setupPassport = (): void => {
  if (isGoogleConfigured()) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: env.GOOGLE_CLIENT_ID!,
          clientSecret: env.GOOGLE_CLIENT_SECRET!,
          callbackURL: `${env.WEB_ORIGIN}/api/v1/auth/google/callback`,
          scope: ["openid", "email", "profile"],
          passReqToCallback: true,
        },
        async (
          _req: unknown,
          _accessToken: string,
          _refreshToken: string,
          profile: { id: string; emails?: { value: string; verified?: boolean }[]; displayName?: string },
          done: (err: Error | null, user?: unknown) => void,
        ) => {
          try {
            const email = profile.emails?.[0]?.value ?? null;
            const identity = {
              provider: "google" as const,
              sub: profile.id,
              email,
              emailVerified: email != null,
              name: profile.displayName ?? null,
            };
            done(null, identity);
          } catch (e) {
            done(e as Error, undefined);
          }
        },
      ),
    );
  }

  if (isAppleConfigured()) {
    // @ts-expect-error — AppleStrategy no tiene tipos consistentes
    passport.use(
      new AppleStrategy(
        {
          clientID: env.APPLE_CLIENT_ID!,
          teamID: env.APPLE_TEAM_ID!,
          keyID: env.APPLE_KEY_ID!,
          privateKey: readApplePrivateKey(),
          callbackURL: `${env.WEB_ORIGIN}/api/v1/auth/apple/callback`,
          passReqToCallback: true,
        },
        async (
          _req: unknown,
          _accessToken: string,
          _refreshToken: string,
          idToken: { sub: string; email?: string; email_verified?: boolean | string; name?: string },
          done: (err: Error | null, user?: unknown) => void,
        ) => {
          try {
            const identity = {
              provider: "apple" as const,
              sub: idToken.sub,
              email: idToken.email ?? null,
              emailVerified:
                idToken.email_verified === true ||
                idToken.email_verified === "true",
              name: idToken.name ?? null,
            };
            done(null, identity);
          } catch (e) {
            done(e as Error, undefined);
          }
        },
      ),
    );
  }

  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));
};

export const hasStrategy = (provider: OAuthProvider): boolean => {
  const strategies = (passport as unknown as {
    _strategy: (n: string) => unknown;
  })._strategy;
  return typeof strategies(provider) === "object" && strategies(provider) !== null;
};
```

- [ ] **Step 2: Verificar build**

Run: `npm -w apps/backend run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/auth/infra/passport-setup.ts
git commit -m "feat(be): Passport setup for Google + Apple (lazy)"
```

---

## Task 10: `oauth.routes.ts` — endpoints start + callback

**Files:**
- Create: `apps/backend/src/modules/auth/oauth.routes.ts`

- [ ] **Step 1: Crear el archivo**

```ts
import { Router } from "express";
import crypto from "node:crypto";
import passport from "passport";
import { env } from "../../config/env.js";
import { prisma } from "../../infra/prisma.js";
import { sign } from "../../infra/jwt.js";
import { OAuthService } from "./oauth.service.js";
import {
  OAUTH_STATE_COOKIE_NAME,
  OAUTH_STATE_TTL_MS,
  type OAuthProvider,
  sanitizeReturnTo,
  signState,
  verifyState,
} from "./oauth-state.js";
import { hasStrategy, setupPassport } from "./infra/passport-setup.js";
import { isRateLimited } from "./oauth-rate-limit.js";
import { AUTH_COOKIE_NAME, cookieOpts } from "./auth-cookie.js";
import { oauthError, type OAuthError } from "../../shared/errors.js";

setupPassport();

const oauthService = new OAuthService(prisma);

const cookieOptsState = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: OAUTH_STATE_TTL_MS,
  path: "/api/v1/auth",
};

const errorRedirect = (res: { redirect: (url: string) => void }, code: string): void => {
  res.redirect(`${env.WEB_ORIGIN}/login?error=${encodeURIComponent(code)}`);
};

const successRedirect = (
  res: { redirect: (url: string) => void },
  returnTo: string,
): void => {
  const sep = returnTo.includes("?") ? "&" : "?";
  res.redirect(`${env.WEB_ORIGIN}${returnTo}${sep}oauth=ok`);
};

const codeFromError = (e: unknown): OAuthError["code"] => {
  if (e && typeof e === "object" && "code" in e) {
    const c = (e as { code: string }).code;
    if (
      c === "OAUTH_NOT_CONFIGURED" ||
      c === "OAUTH_STATE_INVALID" ||
      c === "OAUTH_DENIED" ||
      c === "OAUTH_EMAIL_NOT_VERIFIED" ||
      c === "OAUTH_EMAIL_REQUIRED" ||
      c === "OAUTH_PROVIDER_ERROR" ||
      c === "OAUTH_INTERNAL"
    ) {
      return c;
    }
  }
  return "OAUTH_PROVIDER_ERROR";
};

const startProvider =
  (provider: OAuthProvider) =>
  async (req: { ip?: string; query: Record<string, unknown> }, res: {
    cookie: (n: string, v: string, opts: typeof cookieOptsState) => void;
    redirect: (url: string) => void;
  }) => {
    const ip = req.ip ?? "unknown";
    if (isRateLimited(ip)) {
      errorRedirect(res, "OAUTH_PROVIDER_ERROR");
      return;
    }
    if (!hasStrategy(provider)) {
      errorRedirect(res, "OAUTH_NOT_CONFIGURED");
      return;
    }
    const returnTo = sanitizeReturnTo(req.query.returnTo);
    const csrf = crypto.randomBytes(16).toString("hex");
    const nonce = crypto.randomBytes(16).toString("hex");
    const token = signState({ csrf, nonce, provider, returnTo });
    res.cookie(OAUTH_STATE_COOKIE_NAME, token, cookieOptsState);

    passport.authenticate(provider, {
      scope: provider === "google" ? ["openid", "email", "profile"] : ["email", "name"],
      state: csrf,
      nonce,
      prompt: "select_account",
    });
  };

const callbackProvider =
  (provider: OAuthProvider) =>
  async (req: {
    cookies: Record<string, string>;
    query: Record<string, string>;
    body: Record<string, string>;
  }, res: {
    clearCookie: (n: string, opts: { path: string }) => void;
    cookie: (n: string, v: string, opts: typeof cookieOpts) => void;
    redirect: (url: string) => void;
  }) => {
    try {
      const token = req.cookies[OAUTH_STATE_COOKIE_NAME];
      if (!token) throw oauthError("OAUTH_STATE_INVALID", "Falta cookie de estado.");
      const state = verifyState(token);
      const incomingCsrf = req.query.state ?? req.body.state ?? "";
      if (state.csrf !== incomingCsrf) {
        throw oauthError("OAUTH_STATE_INVALID", "CSRF mismatch.");
      }
      res.clearCookie(OAUTH_STATE_COOKIE_NAME, { path: "/api/v1/auth" });

      if (!hasStrategy(provider)) {
        throw oauthError("OAUTH_NOT_CONFIGURED", "Provider no configurado.");
      }

      const identity = await new Promise<{
        provider: OAuthProvider;
        sub: string;
        email: string | null;
        emailVerified: boolean;
        name: string | null;
      }>((resolve, reject) => {
        passport.authenticate(
          provider,
          { session: false },
          (err: Error | null, user: unknown) => {
            if (err) return reject(err);
            if (!user) return reject(oauthError("OAUTH_DENIED", "Provider denego la autorizacion."));
            resolve(user as never);
          },
        )(req as never, res as never, () => undefined);
      });

      const user = await oauthService.resolveUser(identity);
      const jwt = sign({
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      });
      res.cookie(AUTH_COOKIE_NAME, jwt, cookieOpts);
      successRedirect(res, state.returnTo);
    } catch (e) {
      errorRedirect(res, codeFromError(e));
    }
  };

export const oauthRouter = Router();
oauthRouter.get("/google", startProvider("google"));
oauthRouter.get("/google/callback", callbackProvider("google"));
oauthRouter.get("/apple", startProvider("apple"));
oauthRouter.get("/apple/callback", callbackProvider("apple"));
oauthRouter.post("/apple/callback", callbackProvider("apple"));

// Endpoint de simulacion solo para test/dev (no se monta en prod).
if (process.env.NODE_ENV !== "production") {
  oauthRouter.post("/__test__/simulate-callback", async (req, res) => {
    const { provider, sub, email, name } = req.body as {
      provider: "google" | "apple";
      sub: string;
      email: string;
      name: string;
    };
    try {
      const { simulateOAuthCallback } = await import("../../__tests__/helpers/oauth.js");
      const { cookie, user } = await simulateOAuthCallback({
        provider,
        sub,
        email,
        emailVerified: true,
        name,
      });
      res.setHeader("Set-Cookie", cookie);
      res.json({ data: user, error: null });
    } catch (e) {
      const code = codeFromError(e);
      res.status(400).json({ data: null, error: { code, message: (e as Error).message } });
    }
  });
}
```

- [ ] **Step 2: Verificar build**

Run: `npm -w apps/backend run build`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/auth/oauth.routes.ts
git commit -m "feat(be): oauth routes (start + callback + test simulate)"
```

---

## Task 11: `providers.routes.ts` + helper de simulación

**Files:**
- Create: `apps/backend/src/modules/auth/providers.routes.ts`
- Create: `apps/backend/__tests__/helpers/oauth.ts`

- [ ] **Step 1: Crear `providers.routes.ts`**

```ts
import { Router } from "express";
import { isAppleConfigured, isGoogleConfigured } from "./infra/passport-setup.js";

export const providersRouter = Router();

providersRouter.get("/providers", (_req, res) => {
  res.json({
    data: {
      google: isGoogleConfigured(),
      apple: isAppleConfigured(),
    },
    error: null,
  });
});
```

- [ ] **Step 2: Crear helper de simulación**

```ts
// apps/backend/__tests__/helpers/oauth.ts
import { prisma } from "../../src/infra/prisma.js";
import { OAuthService } from "../../src/modules/auth/oauth.service.js";
import { sign } from "../../src/infra/jwt.js";
import { AUTH_COOKIE_NAME, cookieOpts } from "../../src/modules/auth/auth-cookie.js";

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
```

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/auth/providers.routes.ts apps/backend/__tests__/helpers/oauth.ts
git commit -m "feat(be): /auth/providers endpoint + oauth test simulate helper"
```

---

## Task 12: Test de `/auth/providers`

**Files:**
- Create: `apps/backend/src/modules/auth/__tests__/providers.spec.ts`

- [ ] **Step 1: Crear el test**

```ts
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../../app.js";
import { setupTestPrisma, resetTestDb } from "../../../../__tests__/helpers/db.js";
import { prisma } from "../../../infra/prisma.js";

describe("GET /auth/providers", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });

  it("devuelve google/apple segun envs (en test ambos false)", async () => {
    const res = await request(createApp()).get("/api/v1/auth/providers");
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual({ google: false, apple: false });
  });
});
```

- [ ] **Step 2: Correr**

Run: `npm -w apps/backend run test -- providers`
Expected: 1 test pasa.

- [ ] **Step 3: Commit**

```bash
git add apps/backend/src/modules/auth/__tests__/providers.spec.ts
git commit -m "test(be): /auth/providers endpoint"
```

---

## Task 13: Wire-up en `app.ts` + actualizar `.env.example`

**Files:**
- Modify: `apps/backend/src/app.ts`
- Modify: `apps/backend/.env.example`
- Modify: `.env.example` (raíz)

- [ ] **Step 1: Editar `app.ts`**

Agregar imports después de la línea 6:
```ts
import passport from "passport";
import { oauthRouter } from "./modules/auth/oauth.routes.js";
import { providersRouter } from "./modules/auth/providers.routes.js";
```

Después de `app.use(express.json());` (línea 44):
```ts
app.use(passport.initialize());
```

Después de `app.use("/api/v1/auth", authRouter);` (línea 47):
```ts
app.use("/api/v1/auth", providersRouter);
app.use("/api/v1/auth", oauthRouter);
```

- [ ] **Step 2: Actualizar `apps/backend/.env.example`**

Agregar al final:

```
# OAuth — opcionales. Los botones no se renderizan si el provider no esta totalmente configurado.
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_KEY_ID=
APPLE_TEAM_ID=
APPLE_PRIVATE_KEY=
```

- [ ] **Step 3: Actualizar `.env.example` raíz**

Idéntico bloque al final.

- [ ] **Step 4: Verificar build + tests**

Run:
```bash
npm -w apps/backend run build && npm -w apps/backend run test
```

Expected: exit 0 y tests verdes.

- [ ] **Step 5: Commit**

```bash
git add apps/backend/src/app.ts apps/backend/.env.example .env.example
git commit -m "feat(be): wire oauth + providers routers"
```

---

## Task 14: Frontend — `AuthService.loginWithProvider`

**Files:**
- Modify: `apps/frontend/src/app/core/auth.service.ts`
- Modify: `apps/frontend/src/app/core/auth.service.spec.ts`

- [ ] **Step 1: Agregar método en `auth.service.ts`**

En `apps/frontend/src/app/core/auth.service.ts`, agregar después de `logout()`:

```ts
  loginWithProvider(provider: 'google' | 'apple', returnTo?: string): void {
    const url = new URL(`/auth/${provider}`, ENV.apiBase);
    if (returnTo) url.searchParams.set('returnTo', returnTo);
    window.location.assign(url.toString());
  }
```

Y agregar import al inicio (junto a los otros imports):

```ts
import { ENV } from './env';
```

- [ ] **Step 2: Agregar test en `auth.service.spec.ts`**

Agregar al inicio (junto a los otros imports):

```ts
import { vi } from 'vitest';
```

Agregar al final del `describe('AuthService', () => {`:

```ts
  it('loginWithProvider redirige a /auth/google con returnTo', () => {
    const assignSpy = vi
      .spyOn(window.location, 'assign')
      .mockImplementation(() => undefined);
    svc.loginWithProvider('google', '/cuenta');
    expect(assignSpy).toHaveBeenCalledWith(
      `${ENV.apiBase}/auth/google?returnTo=%2Fcuenta`,
    );
    assignSpy.mockRestore();
  });

  it('loginWithProvider redirige sin returnTo', () => {
    const assignSpy = vi
      .spyOn(window.location, 'assign')
      .mockImplementation(() => undefined);
    svc.loginWithProvider('apple');
    expect(assignSpy).toHaveBeenCalledWith(`${ENV.apiBase}/auth/apple`);
    assignSpy.mockRestore();
  });
```

- [ ] **Step 3: Correr test**

Run: `npm -w apps/frontend run test`
Expected: todos verdes (incluidos los 2 nuevos).

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/core/auth.service.ts apps/frontend/src/app/core/auth.service.spec.ts
git commit -m "feat(fe): AuthService.loginWithProvider"
```

---

## Task 15: `SocialButtonsComponent` (standalone, OnPush)

**Files:**
- Create: `apps/frontend/src/app/features/auth/social-buttons.component.ts`
- Create: `apps/frontend/src/app/features/auth/social-buttons.component.html`
- Create: `apps/frontend/src/app/features/auth/social-buttons.component.css`

- [ ] **Step 1: Crear `social-buttons.component.ts`**

```ts
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { AuthService } from '../../core/auth.service';

type ProvidersResponse = { data?: { google: boolean; apple: boolean } };

@Component({
  selector: 'app-social-buttons',
  templateUrl: './social-buttons.component.html',
  styleUrl: './social-buttons.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SocialButtonsComponent implements OnInit {
  private auth = inject(AuthService);

  mode = input<'login' | 'register'>('login');
  returnTo = input<string | undefined>(undefined);

  googleEnabled = signal(false);
  appleEnabled = signal(false);
  loaded = signal(false);

  async ngOnInit(): Promise<void> {
    try {
      const res = await fetch('/api/v1/auth/providers', {
        credentials: 'include',
      });
      if (!res.ok) return;
      const body = (await res.json()) as ProvidersResponse;
      this.googleEnabled.set(!!body.data?.google);
      this.appleEnabled.set(!!body.data?.apple);
    } catch {
      /* graceful: oculta los botones */
    } finally {
      this.loaded.set(true);
    }
  }

  go(provider: 'google' | 'apple'): void {
    this.auth.loginWithProvider(provider, this.returnTo());
  }
}
```

- [ ] **Step 2: Crear `social-buttons.component.html`**

```html
@if (loaded() && (googleEnabled() || appleEnabled())) {
  <div class="auth-oauth">
    <div class="auth-divider"><span>o continúa con</span></div>

    <div class="auth-oauth-buttons">
      @if (googleEnabled()) {
        <button
          type="button"
          class="auth-social auth-social--google"
          (click)="go('google')"
          aria-label="Continuar con Google"
          data-testid="google-login"
        >
          <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
            <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.5 6.5 28.9 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5 43.5 34.8 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
            <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.5 6.5 28.9 4.5 24 4.5 16.4 4.5 9.8 8.9 6.3 14.7z"/>
            <path fill="#4CAF50" d="M24 43.5c4.8 0 9.2-1.8 12.5-4.9l-5.8-4.9c-1.9 1.4-4.2 2.2-6.7 2.2-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 38.9 16.3 43.5 24 43.5z"/>
            <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.4 4.3-4.5 5.5l5.8 4.9C40.1 35.2 43.5 30.1 43.5 24c0-1.2-.1-2.3-.3-3.5z"/>
          </svg>
          <span>Continuar con Google</span>
        </button>
      }

      @if (appleEnabled()) {
        <button
          type="button"
          class="auth-social auth-social--apple"
          (click)="go('apple')"
          aria-label="Continuar con Apple"
          data-testid="apple-login"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="currentColor">
            <path d="M16.365 1.43c0 1.14-.47 2.27-1.24 3.08-.84.88-2.2 1.57-3.32 1.49-.14-1.1.41-2.27 1.18-3.08.85-.92 2.27-1.6 3.38-1.49zM20.5 17.32c-.55 1.27-.81 1.84-1.51 2.96-.97 1.56-2.34 3.5-4.04 3.51-1.5.01-1.89-.97-3.93-.96-2.04.01-2.46.97-3.96.96-1.7-.01-2.99-1.76-3.96-3.32C.4 16.61-.32 11.41 1.93 8.05c1.6-2.4 4.13-3.8 6.5-3.8 2.42 0 3.94 1.32 5.93 1.32 1.93 0 3.1-1.32 5.91-1.32 2.21 0 4.55 1.2 6.21 3.28-5.46 2.99-4.57 10.81-.98 10.79z"/>
          </svg>
          <span>Continuar con Apple</span>
        </button>
      }
    </div>
  </div>
}
```

- [ ] **Step 3: Crear `social-buttons.component.css`**

```css
.auth-oauth {
  margin-top: 1.5rem;
}

.auth-oauth-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.auth-social {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 44px;
  padding: 0.625rem 1rem;
  border-radius: 0.375rem;
  border: 1px solid theme('colors.ink.200');
  background: #fff;
  color: theme('colors.ink.DEFAULT');
  font-family: theme('fontFamily.display');
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: border-color 120ms ease, transform 120ms ease;
}

.auth-social:hover {
  border-color: theme('colors.engine.DEFAULT');
}

.auth-social:focus-visible {
  outline: 2px solid theme('colors.engine.DEFAULT');
  outline-offset: 2px;
}

.auth-social--apple {
  background: theme('colors.ink.DEFAULT');
  color: #fff;
  border-color: theme('colors.ink.DEFAULT');
}

.auth-social--apple:hover {
  border-color: theme('colors.engine.DEFAULT');
}
```

- [ ] **Step 4: Verificar build**

Run: `npm -w apps/frontend run build`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add apps/frontend/src/app/features/auth/social-buttons.component.ts apps/frontend/src/app/features/auth/social-buttons.component.html apps/frontend/src/app/features/auth/social-buttons.component.css
git commit -m "feat(fe): SocialButtonsComponent"
```

---

## Task 16: Test del `SocialButtonsComponent`

**Files:**
- Create: `apps/frontend/src/app/features/auth/__tests__/social-buttons.component.spec.ts`

- [ ] **Step 1: Crear el test**

```ts
import { TestBed } from '@angular/core/testing';
import { SocialButtonsComponent } from '../social-buttons.component';
import { ENV } from '../../../core/env';

describe('SocialButtonsComponent', () => {
  let fixture: ReturnType<typeof TestBed['createComponent']>;
  let component: SocialButtonsComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SocialButtonsComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(SocialButtonsComponent);
    component = fixture.componentInstance;
  });

  function setupFetchResponse(body: { data: { google: boolean; apple: boolean } }): void {
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify(body), { status: 200 }));
    return fetchSpy as never;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    // assert URL consumed
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${ENV.apiBase}/auth/providers`,
      { credentials: 'include' },
    );
  });

  it('muestra ambos botones cuando /auth/providers devuelve ambos true', async () => {
    setupFetchResponse({ data: { google: true, apple: true } });
    await component.ngOnInit();
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons.length).toBe(2);
    expect(buttons[0]?.getAttribute('aria-label')).toBe('Continuar con Google');
    expect(buttons[1]?.getAttribute('aria-label')).toBe('Continuar con Apple');
  });

  it('oculta el boton Apple si no esta configurado', async () => {
    setupFetchResponse({ data: { google: true, apple: false } });
    await component.ngOnInit();
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons.length).toBe(1);
    expect(buttons[0]?.getAttribute('aria-label')).toBe('Continuar con Google');
  });

  it('no muestra botones si la llamada falla', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));
    await component.ngOnInit();
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll('button');
    expect(buttons.length).toBe(0);
  });
});
```

- [ ] **Step 2: Correr test**

Run: `npm -w apps/frontend run test -- social-buttons`
Expected: 3 tests pasan.

- [ ] **Step 3: Commit**

```bash
git add apps/frontend/src/app/features/auth/__tests__/social-buttons.component.spec.ts
git commit -m "test(fe): SocialButtonsComponent rendering"
```

---

## Task 17: Integrar `SocialButtonsComponent` en `LoginComponent`

**Files:**
- Modify: `apps/frontend/src/app/features/auth/login.component.ts`
- Modify: `apps/frontend/src/app/features/auth/login.component.html`

- [ ] **Step 1: Editar `login.component.ts`**

1. Agregar import:
   ```ts
   import { ActivatedRoute } from '@angular/router';
   import { SocialButtonsComponent } from './social-buttons.component';
   ```

2. Agregar `private route = inject(ActivatedRoute);` en los `inject()`.

3. Agregar signals:
   ```ts
   readonly returnTo = signal<string | undefined>(undefined);
   readonly oauthError = signal<string | null>(null);

   readonly OAUTH_ERROR_MESSAGES: Record<string, string> = {
     OAUTH_NOT_CONFIGURED: 'El inicio con este proveedor no está disponible todavía.',
     OAUTH_STATE_INVALID: 'La sesión de autenticación expiró. Inténtalo de nuevo.',
     OAUTH_DENIED: 'Cancelaste el inicio de sesión. Puedes intentar de nuevo.',
     OAUTH_EMAIL_NOT_VERIFIED: 'Tu email no está verificado. Verifícalo y vuelve a intentar.',
     OAUTH_EMAIL_REQUIRED: 'No pudimos identificarte. Inicia sesión con email y contraseña una vez y vincula el proveedor.',
     OAUTH_PROVIDER_ERROR: 'No pudimos completar el inicio. Inténtalo en unos minutos.',
     OAUTH_INTERNAL: 'Algo salió mal. Si el problema persiste, usa email y contraseña.',
   };
   ```

4. Agregar `ngOnInit`:
   ```ts
   ngOnInit(): void {
     this.route.queryParamMap.subscribe((p) => {
       const err = p.get('error');
       if (err && this.OAUTH_ERROR_MESSAGES[err]) {
         this.oauthError.set(this.OAUTH_ERROR_MESSAGES[err]);
       }
       const ret = p.get('returnTo');
       if (ret) this.returnTo.set(ret);
     });
   }
   ```

5. Agregar `SocialButtonsComponent` al array `imports` del `@Component`:
   ```ts
   imports: [
     ReactiveFormsModule,
     RouterLink,
     MatButtonModule,
     MatCardModule,
     MatFormFieldModule,
     MatInputModule,
     MatIconModule,
     SocialButtonsComponent,
   ],
   ```

- [ ] **Step 2: Editar `login.component.html`**

1. Después del `<header class="auth-shell-header">...</header>` y antes del `<mat-card>`, insertar (para mostrar el error OAuth):

   ```html
   @if (oauthError(); as msg) {
     <div
       class="border border-engine bg-engine-50 px-4 py-3 text-sm text-engine-dark mb-4"
       role="alert"
       data-testid="oauth-error"
     >
       <span class="stamp-label mr-2">OAuth</span>{{ msg }}
     </div>
   }
   ```

2. Reemplazar el `</form>` actual + el `<div class="auth-divider">` (líneas 70-74 del original) por:

   ```html
     </form>
   </mat-card-content>
   </mat-card>

   <app-social-buttons mode="login" [returnTo]="returnTo()" />
   ```

   Nota: el `auth-divider` y los 2 botones "Explorar catálogo"/"Comparar autos" quedan **debajo** del `<app-social-buttons>`.

- [ ] **Step 3: Verificar build + tests**

Run:
```bash
npm -w apps/frontend run build && npm -w apps/frontend run test
```

Expected: exit 0 y tests verdes.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/features/auth/login.component.ts apps/frontend/src/app/features/auth/login.component.html
git commit -m "feat(fe): integrate SocialButtons into LoginComponent"
```

---

## Task 18: Integrar `SocialButtonsComponent` en `RegisterComponent`

**Files:**
- Modify: `apps/frontend/src/app/features/auth/register.component.ts`
- Modify: `apps/frontend/src/app/features/auth/register.component.html`

- [ ] **Step 1: Editar `register.component.ts`**

1. Agregar import:
   ```ts
   import { ActivatedRoute } from '@angular/router';
   import { SocialButtonsComponent } from './social-buttons.component';
   ```

2. Agregar `private route = inject(ActivatedRoute);`.

3. Agregar `readonly returnTo = signal<string | undefined>(undefined);`.

4. Agregar `ngOnInit`:
   ```ts
   ngOnInit(): void {
     this.route.queryParamMap.subscribe((p) => {
       const ret = p.get('returnTo');
       if (ret) this.returnTo.set(ret);
     });
   }
   ```

5. Agregar `SocialButtonsComponent` al array `imports`.

- [ ] **Step 2: Editar `register.component.html`**

Después del `</form>` (justo antes del link "¿Ya tienes cuenta?"), insertar:

```html
<app-social-buttons mode="register" [returnTo]="returnTo()" />
```

- [ ] **Step 3: Verificar build + tests**

Run:
```bash
npm -w apps/frontend run build && npm -w apps/frontend run test
```

Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/src/app/features/auth/register.component.ts apps/frontend/src/app/features/auth/register.component.html
git commit -m "feat(fe): integrate SocialButtons into RegisterComponent"
```

---

## Task 19: E2E Playwright — login social simulado

**Files:**
- Create: `apps/frontend/e2e/social-login.spec.ts`
- Create: `apps/frontend/e2e/social-login-providers.spec.ts`

- [ ] **Step 1: Crear `social-login.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('botones OAuth aparecen cuando los providers estan configurados', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByTestId('google-login')).toBeVisible();
  await expect(page.getByTestId('apple-login')).toBeVisible();
});

test('login Google simulado crea sesion y redirige a /', async ({ page, request }) => {
  await page.goto('/login');

  // Interceptamos la navegacion a /api/v1/auth/google y llamamos al endpoint de simulacion.
  await page.route('**/api/v1/auth/google', async (route) => {
    const resp = await request.post('/api/v1/auth/__test__/simulate-callback', {
      data: {
        provider: 'google',
        sub: 'e2e-google-sub',
        email: 'oauth-user@e2e.local',
        name: 'OAuth User',
      },
    });
    const setCookie = resp.headers()['set-cookie'];
    if (setCookie) {
      const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
      await page.context().addCookies(
        cookies.map((c) => {
          const [pair] = c.split(';');
          const [name, value] = pair!.split('=');
          return { name: name!, value: value!, url: 'http://localhost:4200' };
        }),
      );
    }
    await route.fulfill({ status: 302, headers: { Location: '/?oauth=ok' } });
  });

  await page.getByTestId('google-login').click();
  await page.waitForURL('**/?oauth=ok');
  await expect(page).toHaveURL(/\?oauth=ok/);
});
```

- [ ] **Step 2: Crear `social-login-providers.spec.ts`**

```ts
import { test, expect } from '@playwright/test';

test('sin providers configurados no aparecen botones OAuth', async ({ page }) => {
  // El backend de test no setea envs OAuth → /auth/providers devuelve {google:false, apple:false}
  await page.goto('/login');
  await expect(page.getByTestId('google-login')).toHaveCount(0);
  await expect(page.getByTestId('apple-login')).toHaveCount(0);
});
```

- [ ] **Step 3: Verificar que los tests E2E están en la config**

Run:
```bash
grep -E "testDir|e2e" apps/frontend/playwright.config.ts
```

Expected: incluye el directorio `e2e`.

- [ ] **Step 4: Commit**

```bash
git add apps/frontend/e2e/social-login.spec.ts apps/frontend/e2e/social-login-providers.spec.ts
git commit -m "test(fe): e2e OAuth login simulation"
```

---

## Task 20: Documentación — sección OAuth en `docs/setup.md`

**Files:**
- Modify: `docs/setup.md`

- [ ] **Step 1: Agregar sección**

Después de la sección "## Tests", agregar (al final del archivo):

```markdown
## OAuth (Google + Apple)

Login social es opcional. Si no se configuran las envs, los botones no aparecen
en `/login` y `/register`; el login email/password sigue funcionando.

### Google

1. Crear OAuth Client tipo "Web application" en [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Authorized redirect URI:
   - Dev: `http://localhost:3000/api/v1/auth/google/callback`
   - Prod: `https://cualautocompro.cl/api/v1/auth/google/callback`
3. Setear en `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### Apple

1. En Apple Developer: App ID con capability "Sign in with Apple" + Service ID (cliente web) con Return URL `https://cualautocompro.cl/api/v1/auth/apple/callback`.
2. Crear private key (.p8), guardar su contenido en `APPLE_PRIVATE_KEY` reemplazando saltos de línea por `\n` literal (los archivos `.env` no soportan multilínea).
3. Setear en `.env`:
   ```
   APPLE_CLIENT_ID=...
   APPLE_KEY_ID=...
   APPLE_TEAM_ID=...
   APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

### Como verificar

1. Reiniciar backend con las envs seteadas.
2. `curl http://localhost:3000/api/v1/auth/providers` → debe devolver `{"data":{"google":true,"apple":true}}`.
3. En el navegador, ir a `/login`: deben aparecer los botones "Continuar con Google" y "Continuar con Apple".
```

- [ ] **Step 2: Commit**

```bash
git add docs/setup.md
git commit -m "docs: OAuth Google + Apple setup instructions"
```

---

## Task 21: Verificación final end-to-end

- [ ] **Step 1: Migración aplicada**

Run: `cd apps/backend && npx prisma migrate deploy`
Expected: exit 0.

- [ ] **Step 2: Todos los tests backend pasan**

Run: `npm -w apps/backend run test`
Expected: todos verdes.

- [ ] **Step 3: Todos los tests frontend pasan**

Run: `npm -w apps/frontend run test`
Expected: todos verdes.

- [ ] **Step 4: Build de prod sin errores**

Run:
```bash
npm -w apps/backend run build && npm -w apps/frontend run build
```

Expected: ambos exit 0.

- [ ] **Step 5: Verificar providers manualmente (sin envs OAuth)**

Run:
```bash
curl http://localhost:3000/api/v1/auth/providers
```

Expected:
```json
{"data":{"google":false,"apple":false},"error":null}
```

- [ ] **Step 6: Verificar flujo email/password sigue funcionando**

Run:
```bash
curl -i -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"smoke@test.cl","password":"secreto123","name":"Smoke"}'
```

Expected: `200` + `set-cookie: auth=...`.

- [ ] **Step 7: Commit final (si hubo ajustes)**

```bash
git status
# Solo si hay cambios:
git add -A
git commit -m "chore: post-implementation smoke fixes"
```

- [ ] **Step 8: Push — pedir permiso antes**

**No pushear automáticamente.** Preguntar al usuario antes de `git push`.

---

## Self-Review del Plan (autocheck)

**1. Cobertura del spec:**
- §1.1 Deps → Task 1.
- §1.2 Schema + migración → Task 2.
- §1.3 Config + validación → Task 8.
- §1.4 APPLE_PRIVATE_KEY helper → Task 9 (`readApplePrivateKey`).
- §1.5 oauth-state, oauth.service → Tasks 4, 6.
- §1.6 Endpoints (5 routers) → Tasks 10, 11, 13.
- §1.7 Passport setup → Task 9.
- §1.8 Rate limit → Task 5.
- §1.9 Cookie helper DRY → Task 3.
- §1.10 Códigos de error / mensajes → Task 17 (mapa `OAUTH_ERROR_MESSAGES`).
- §2.1-2.6 Frontend → Tasks 14, 15, 16, 17, 18.
- §3 Configuración por entorno → Task 20.
- §4 Tests → Tasks 4 (state), 7 (service), 12 (providers), 16 (component), 19 (e2e).
- §5 Despliegue / rollback → Documentado en Task 20 + 21.

**2. Placeholder scan:** sin "TBD"/"TODO"/"similar to". Cada step tiene código o comando concreto.

**3. Type consistency:** nombres usados en tasks posteriores coinciden con definiciones anteriores (`OAuthService`, `OAuthStatePayload`, `ProviderIdentity`, `ResolvedUser`, `OAUTH_STATE_COOKIE_NAME`, `AUTH_COOKIE_NAME`, `OAuthError`).

**Gap identificado:** §2.7 (extender `/auth/me` con `identities[]`) está fuera de alcance explícito en el spec. No se implementa.
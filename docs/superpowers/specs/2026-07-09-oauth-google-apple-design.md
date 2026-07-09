# Login social con Google y Apple (OAuth 2.0 / OIDC)

**Fecha**: 2026-07-09
**Estado**: Aprobado para implementación
**Apps afectadas**: `apps/backend`, `apps/frontend`
**Tipo de cambio**: Features nuevas, sin romper auth local existente

## Objetivo

Agregar inicio de sesión social con **Google** y **Apple** en `cualautocompro.cl`,
manteniendo email/password funcionando como hasta ahora. Ambos métodos producen
la misma sesión (`auth` cookie httpOnly con JWT firmado por `JWT_SECRET`) y los
mismos datos de `User`, así que el resto del backend, los guards y los
interceptors no cambian.

**Comportamiento final esperado:**

- En `/login` y `/register` aparecen dos botones debajo del formulario: "Continuar
  con Google" y "Continuar con Apple", con logos oficiales y estilo consistente
  con el resto de la pantalla.
- Si falta la configuración de un provider, su botón no se renderiza (consulta
  `/auth/providers` al montar).
- Un usuario con cuenta local previa (`passwordHash` no nulo) puede hacer login
  con Google/Apple y se vincula automáticamente a la misma `User` por email
  verificado.
- Un usuario nuevo que entra por OAuth queda creado sin `passwordHash` (nullable).
- Email/password sigue 100% funcional.

## Decisiones cerradas

| Decisión | Valor | Justificación |
|---|---|---|
| Proveedores v1 | Google + Apple | Recomendado. Cubre ~95% usuarios Chile/Latam; Apple es obligatorio en iOS/iPadOS. Otros (Facebook/GitHub/Microsoft) se pueden agregar después con el mismo patrón. |
| Librería | `passport`, `passport-google-oauth20`, `@nicokaiser/passport-apple`, `openid-client` | Soberanía total, sin SaaS externo, sin vendor lock-in, sin procesar datos personales en terceros. Caben en cPanel (JS puro, sin binarios nativos). |
| Estado durante OAuth | Cookie firmada `oauth_state` (HS256 con `JWT_SECRET`), 10min, `path=/api/v1/auth`, `httpOnly`, `sameSite=lax`, `secure` en prod | Sin `express-session`, sin Redis, sin memoria compartida. Compatible con reinicios del proceso Node en cPanel. |
| Vinculación de cuentas | Automática por email verificado | Recomendado. Cero fricción. Bloqueamos si `email_verified=false`. |
| Mantener email/password | Sí, sin cambios | Backward compatible. Sin migración de usuarios existentes. |
| Account linking | Tabla `UserIdentity` (muchos-a-uno con `User`) | Permite vincular N providers a una misma `User`, sin columnas nullable que se acumulen. |
| `User.passwordHash` | Nullable (antes `String` requerido) | Usuarios OAuth no tienen password. Migración Prisma con `MODIFY` deja las filas existentes intactas. |
| UX botones OAuth | Separador "o continúa con" + 2 botones con SVGs oficiales (Google 4-colores, Apple monocromo) | Consistente con look "folleto mecánico". SVGs inline (sin assets remotos, sin CSP issues). |
| Método de redirección FE → BE | `<a href>` con full navigation (`window.location.assign`) | Necesario para que el navegador haga el redirect cross-origin y setee la cookie httpOnly. `fetch` no funciona. |
| Errores OAuth | Redirect a `/login?error=<code>` con mensaje pre-traducido | El usuario quedó fuera del SPA; no devolvemos JSON. |
| Validación email provider | `email_verified === true` obligatorio | Evita impersonación vía emails no verificados. |
| Apple `name` solo la primera vez | Guardamos `name` en el primer sign-in; en subsiguientes conservamos el de BD | Apple no entrega `name` después del primer login (privacidad). |
| Apple email ausente en sign-in subsiguiente | Match por `providerSub`; bloquea crear cuenta nueva sin email | Privacidad Apple. Manejado por la lógica de upsert. |

## Cambios fuera de alcance

- **No** se agregan más providers (Facebook, GitHub, Microsoft) en esta entrega.
- **No** se implementa "desvincular proveedor" en la UI de cuenta.
- **No** se hace "forzar re-login con password para usuarios OAuth".
- **No** se agregan refresh tokens (la cookie sigue con la misma expiración de 7d).
- **No** se rediseña `/account` más allá de mostrar los providers vinculados.
- **No** se migran usuarios existentes: el primer login OAuth con email conocido
  crea la `UserIdentity` y los vincula. No requiere acción del usuario.
- **No** se introduce 2FA.
- **No** se usa Auth0 / Clerk / Supabase Auth / Lucia.

---

## 1. Backend

### 1.1 Dependencias nuevas (`apps/backend/package.json`)

```json
{
  "dependencies": {
    "passport": "^0.7.0",
    "passport-google-oauth20": "^2.0.0",
    "@nicokaiser/passport-apple": "^2.0.0",
    "openid-client": "^5.7.0"
  },
  "devDependencies": {
    "@types/passport": "^1.0.16",
    "@types/passport-google-oauth20": "^2.0.16"
  }
}
```

(`@nicokaiser/passport-apple` se prefiere sobre `passport-apple` original porque
mantiene `openid-client` actualizado y compatibilidad con Apple Sign-In actual.
No requiere tipos propios — los provee `passport`.)

### 1.2 Schema Prisma (`apps/backend/prisma/schema.prisma`)

**Cambios a `User`:**

```prisma
model User {
  id           String         @id @default(cuid())
  email        String         @unique
  passwordHash String?        // <- antes String; ahora nullable
  name         String
  role         String         @default("USER")
  createdAt    DateTime       @default(now())
  comparisons  Comparison[]
  favorites    Favorite[]
  identities   UserIdentity[] // <- relación nueva
}
```

**Modelo nuevo `UserIdentity`:**

```prisma
model UserIdentity {
  id           String   @id @default(cuid())
  userId       String
  provider     String   // "google" | "apple"
  providerSub  String   // 'sub' estable del provider
  email        String?  // último email visto desde este provider (auditoría)
  createdAt    DateTime @default(now())
  lastUsedAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerSub])
  @@index([userId])
  @@index([email])
}
```

**Migración:** un solo archivo Prisma. Hace `ALTER TABLE User MODIFY
passwordHash VARCHAR(191) NULL` (Prisma lo infiere del cambio a opcional) y
`CREATE TABLE UserIdentity`. No requiere backfill.

### 1.3 Config (`apps/backend/src/config/env.ts`)

Agregar al schema zod (todas opcionales; se validan como grupo en boot):

```ts
GOOGLE_CLIENT_ID:        z.string().optional(),
GOOGLE_CLIENT_SECRET:    z.string().optional(),
APPLE_CLIENT_ID:         z.string().optional(),
APPLE_KEY_ID:            z.string().optional(),
APPLE_TEAM_ID:           z.string().optional(),
APPLE_PRIVATE_KEY:       z.string().optional(),   // PEM con \n escapados
```

**Validación de consistencia en boot** (helper nuevo `assertOAuthConfigConsistency`):
si `GOOGLE_CLIENT_ID` está set pero `GOOGLE_CLIENT_SECRET` no → throw con mensaje
accionable. Igual para Apple (las 4 envs requeridas juntas o ninguna).

### 1.4 Variables de entorno (`.env.example` raíz)

```
# OAuth — opcionales; los botones no se renderizan si no están todas las de un provider
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_KEY_ID=
APPLE_TEAM_ID=
APPLE_PRIVATE_KEY=
```

Nota `APPLE_PRIVATE_KEY`: el `.p8` de Apple Developer es multilínea. Los `.env`
no soportan multilínea; el operador reemplaza saltos por `\n` literal al setear.
Helper en `oauth.service.ts#readApplePrivateKey()` reconstruye los saltos:

```ts
const pem = env.APPLE_PRIVATE_KEY.replace(/\\n/g, "\n");
if (!pem.startsWith("-----BEGIN")) throw new Error("APPLE_PRIVATE_KEY malformada");
```

### 1.5 Archivos nuevos del módulo auth

```
apps/backend/src/modules/auth/
├── oauth.routes.ts       # router + handlers de /google y /apple
├── oauth.service.ts      # upsert user + identity; emite JWT
├── oauth-state.ts        # firmar/verificar cookie oauth_state
├── providers.routes.ts   # GET /auth/providers
└── (tests asociados)
```

**`oauth-state.ts`** — emite y verifica cookies de estado:

```ts
// Payload: { csrf: string; nonce: string; provider: 'google'|'apple'; returnTo: string }
// Firma: HS256 con JWT_SECRET
// TTL: 10 minutos
// Validaciones: csrf == state de la query, expira, returnTo matchea /^\/[A-Za-z0-9/_\-?&=,]*$/ y NO empieza con //
```

**`oauth.service.ts`** — clase `OAuthService`:

```ts
type ProviderIdentity = {
  provider: 'google' | 'apple';
  sub: string;
  email: string | null;
  emailVerified: boolean;
  name: string | null;
  picture?: string;   // google only, ignorado
};

async resolveUser(identity: ProviderIdentity): Promise<User>
  // 1. match por (provider, providerSub) en UserIdentity → login
  // 2. si no, match por email en User (con emailVerified=true) → vincula
  // 3. si no, crea User (passwordHash=null) + UserIdentity en tx
  // 4. Si provider="apple" y email es null y no hubo match por sub → throw OAUTH_EMAIL_REQUIRED
  // 5. Si emailVerified=false → throw OAUTH_EMAIL_NOT_VERIFIED
  // 6. Actualiza UserIdentity.lastUsedAt en cada login
```

**`oauth.routes.ts`** — endpoints (ver sección 1.6).

### 1.6 Endpoints nuevos del backend

| Método | Ruta | Propósito |
|---|---|---|
| `GET`  | `/api/v1/auth/providers` | Devuelve `{ google: boolean; apple: boolean }` según envs configuradas |
| `GET`  | `/api/v1/auth/google`               | Inicia flujo. Query: `returnTo?`. Setea cookie `oauth_state`. 302 a Google. |
| `GET`  | `/api/v1/auth/google/callback`      | Callback. 302 a `${WEB_ORIGIN}${returnTo}?oauth=ok` (éxito) o `/login?error=<code>` (fracaso) |
| `GET`  | `/api/v1/auth/apple`                | Inicia flujo |
| `POST` | `/api/v1/auth/apple/callback`       | Callback Apple (form_post) |
| `GET`  | `/api/v1/auth/apple/callback`       | Callback Apple (compatibilidad GET) |

**Wire-up en `app.ts`** (orden importa — los callbacks de Passport deben correr
antes del 404 middleware):

```ts
import passport from "passport";
import "./modules/auth/infra/passport-setup.js"; // registra strategies
import { oauthRouter } from "./modules/auth/oauth.routes.js";
import { providersRouter } from "./modules/auth/providers.routes.js";

app.use(passport.initialize());
app.use("/api/v1/auth", providersRouter);
app.use("/api/v1/auth", oauthRouter);
```

### 1.7 Passport setup (`apps/backend/src/modules/auth/infra/passport-setup.ts`)

**Comportamiento cuando faltan envs:** las strategies solo se registran si el
set completo de envs del provider está presente (chequeado por
`assertOAuthConfigConsistency` en boot). Si no, el módulo exporta `noop`
strategies que el `oauth.routes.ts` intercepta antes de llamar a Passport: el
handler verifica `if (!passport._strategy(provider))` y devuelve el redirect
de error `OAUTH_NOT_CONFIGURED`. Esto evita que el boot crashee por falta de
config y permite activar providers sin redeploy (solo cambiando envs y
reiniciando).

```ts
// Google
passport.use(new GoogleStrategy({
  clientID: env.GOOGLE_CLIENT_ID!,
  clientSecret: env.GOOGLE_CLIENT_SECRET!,
  callbackURL: `${env.WEB_ORIGIN}/api/v1/auth/google/callback`,
  scope: ["openid", "email", "profile"],
  passReqToCallback: true,
}, async (req, _accessToken, _refreshToken, profile, done) => {
  try {
    const identity = {
      provider: 'google' as const,
      sub: profile.id,
      email: profile.emails?.[0]?.value ?? null,
      emailVerified: profile.emails?.[0]?.value != null, // Google omite si no verificado
      name: profile.displayName,
    };
    const user = await oauthService.resolveUser(identity);
    done(null, user);
  } catch (e) { done(e as Error, undefined); }
}));

// Apple
passport.use(new AppleStrategy({
  clientID: env.APPLE_CLIENT_ID!,
  teamID: env.APPLE_TEAM_ID!,
  keyID: env.APPLE_KEY_ID!,
  privateKey: readApplePrivateKey(),
  callbackURL: `${env.WEB_ORIGIN}/api/v1/auth/apple/callback`,
  passReqToCallback: true,
}, async (req, _accessToken, _refreshToken, idToken, profile, done) => { /* idem, provider='apple' */ }));
```

### 1.8 Rate limit (`apps/backend/src/modules/auth/oauth-rate-limit.ts`)

Map en memoria por IP: máx 10 starts/min en `/auth/{provider}` (no en
callbacks). Suficiente para evitar abuso. Documentado como punto a migrar a
Redis si el proyecto pasa a multi-instancia.

### 1.9 Cookies y sesión (sin cambios al JWT)

Se reutiliza `sign()` de `infra/jwt.ts` con el mismo payload (`sub`, `email`,
`name`, `role`). `cookieOpts` ya en `auth.controller.ts` se mueve a un helper
compartido `auth-cookie.ts` y se importa desde `oauth.routes.ts`.

```ts
// Cookie nueva: oauth_state
{
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 10 * 60 * 1000,    // 10 min
  path: "/api/v1/auth",
  signed: false,             // firma lógica (HS256), no cookie-parser
}
```

### 1.10 Códigos de error y UX

| Código | Cuándo | UX en `/login` |
|---|---|---|
| `OAUTH_NOT_CONFIGURED` | Faltan envs del provider | Botón no se renderiza. Si se accede por URL directa → "Inicio con X no disponible todavía." |
| `OAUTH_STATE_INVALID` | Cookie expirada o firma inválida (CSRF / tampering) | "La sesión de autenticación expiró. Inténtalo de nuevo." |
| `OAUTH_DENIED` | Usuario canceló en Google/Apple | "Cancelaste el inicio de sesión. Puedes intentar de nuevo." |
| `OAUTH_EMAIL_NOT_VERIFIED` | Provider devolvió email sin `email_verified=true` | "Tu email no está verificado en X. Verifícalo y vuelve a intentar." |
| `OAUTH_EMAIL_REQUIRED` | Apple sin email en sign-in posterior, sin match por `sub` | "No pudimos identificarte. Inicia sesión con email y contraseña una vez y vincula Apple." |
| `OAUTH_PROVIDER_ERROR` | 5xx del provider, tokens inválidos | "No pudimos completar el inicio con X. Inténtalo en unos minutos." |
| `OAUTH_INTERNAL` | Bug nuestro (DB caída, etc.) | "Algo salió mal. Si el problema persiste, usa email y contraseña." |

**Reglas de logging:**
- Loggear: `provider`, `error_code`, `sub` (si existe), `email` parcial
  (`a***@b.com`), `requestId`.
- **Nunca** loggear `code`, `id_token`, `access_token` completos.
- Esperados → `warn`. Inesperados → `error` con stack.

---

## 2. Frontend

### 2.1 Archivos nuevos / modificados

```
apps/frontend/src/app/features/auth/
├── social-buttons.component.ts        # NUEVO
├── social-buttons.component.html      # NUEVO
├── social-buttons.component.css       # NUEVO
├── login.component.html               # MOD: insertar <app-social-buttons>
└── register.component.html            # MOD: insertar <app-social-buttons>

apps/frontend/src/app/core/
└── auth.service.ts                    # MOD: agregar loginWithProvider()
```

### 2.2 `SocialButtonsComponent`

- Selector: `app-social-buttons`.
- Inputs: `mode: 'login' | 'register'`, `returnTo?: string`.
- Standalone, `OnPush`.
- `ngOnInit`: `GET /api/v1/auth/providers` → renderiza solo los botones
  configurados. Si la llamada falla, oculta ambos botones (graceful
  degradation; el usuario puede seguir con email/password).
- Renderiza un separador "o continúa con" (consistente con `auth-divider`
  existente).
- Cada botón es `<a>` con `href="/api/v1/auth/{provider}?returnTo=..."`. **Full
  navigation**, no `routerLink`, para que la cookie httpOnly se setee.
- SVGs inline:
  - Google: 4 colores oficiales (azul/rojo/amarillo/verde), 18×18.
  - Apple: monocromo (negro en fondo blanco, blanco en fondo oscuro).
- Accesibilidad:
  - `<a>` real, `aria-label="Continuar con Google"` / `"...con Apple"`.
  - Focus visible con outline `engine` 2px.
  - Target ≥ 44×44 px.
  - Divider con `role="separator"` y texto visible.

### 2.3 Estilo (consistente con "folleto mecánico")

- Botón outline 1px `ink-200`, rounded-md, hover con borde `engine`.
- Tipografía: `font-display` para el texto.
- Icono 18px alineado a la izquierda con gap-2.
- Apple: fondo `ink`, texto blanco. Google: fondo blanco, texto `ink`.

### 2.4 `AuthService.loginWithProvider`

```ts
loginWithProvider(provider: 'google' | 'apple', returnTo?: string): void {
  const url = new URL(`/api/v1/auth/${provider}`, env.apiBaseUrl);
  if (returnTo) url.searchParams.set('returnTo', returnTo);
  window.location.assign(url.toString());
}
```

`env.apiBaseUrl` ya existe en `core/env.ts`. No se hace `fetch` desde Angular.

### 2.5 `LoginComponent` y `RegisterComponent`

- Importan `SocialButtonsComponent` y `returnTo` signal (de query param).
- Insertan `<app-social-buttons [mode]="..." [returnTo]="returnTo()" />`
  después del `</form>` y antes del `auth-divider` actual.
- `LoginComponent` lee `route.queryParamMap` y, si `error`, muestra el mensaje
  mapeado (helper `OAUTH_ERROR_MESSAGES`) arriba del formulario. Limpia el
  query param tras mostrarlo.

### 2.6 Rehidratación post-callback

- `AuthService.bootstrap()` ya hace `GET /auth/me` al iniciar la app, así que
  tras el redirect `?oauth=ok` el `currentUser` signal queda poblado
  automáticamente. **No requiere cambios.**
- Opcional: `AppComponent` puede detectar `?oauth=ok` y mostrar un `MatSnackBar`
  verde "Sesión iniciada". Cosmético, no bloqueante.

### 2.7 `/account` (mod leve, opcional)

Mostrar los providers vinculados al usuario leyendo `GET /auth/me` (que se
extiende para devolver `identities: { provider: string; createdAt: string }[]`).
Si no se hace en esta entrega, queda como TODO explícito en el código.

---

## 3. Configuración por entorno

### 3.1 Producción (cPanel)

**Google Cloud Console** — OAuth Client tipo Web:
- Authorized redirect URI: `https://cualautocompro.cl/api/v1/auth/google/callback`
- Authorized JavaScript origins: `https://cualautocompro.cl`

**Apple Developer** — Service ID (cliente web):
- Domains: `cualautocompro.cl`
- Return URLs: `https://cualautocompro.cl/api/v1/auth/apple/callback`
- Primary App ID con capability "Sign in with Apple"
- Private key `.p8` → contenido en `APPLE_PRIVATE_KEY` con `\n` escapados.

**`WEB_ORIGIN`** debe ser `https://cualautocompro.cl` para que las redirect
URLs calcen.

### 3.2 Desarrollo local

**Google:**
- Redirect URI: `http://localhost:3000/api/v1/auth/google/callback`
- JS Origin: `http://localhost:4200`

**Apple** (HTTPS obligatorio):
- Requiere HTTPS local. Si no hay cert, se documenta el flag
  `--oauth-mock-apple` que monta un provider mockeado para tests. **No se usa en
  dev manual regular**; se documenta solo para que el dev pueda probar Apple sin
  configurar Apple Developer.

### 3.3 Tests

- `apps/backend/.env.test` no setea las envs OAuth → `/auth/providers` devuelve
  `{google:false, apple:false}`. Los endpoints devuelven `OAUTH_NOT_CONFIGURED`.
- Test E2E usa un endpoint de simulación: `POST /__test__/oauth/simulate-callback`
  (solo en `NODE_ENV !== 'production'`) que monta la sesión OAuth sin salir al
  browser.

---

## 4. Testing

### 4.1 Unit tests backend (Vitest)

- `oauth-state.test.ts` — firmar/verificar, expiración, tampering,
  separación por provider, validación de `returnTo`.
- `oauth.service.test.ts`:
  - Crea usuario nuevo si no existe y el email está verificado.
  - Vincula por email a `User` local existente (sin duplicar `User`).
  - Matchea por `providerSub` aunque email cambie.
  - Bloquea si `email_verified=false`.
  - Bloquea si Apple no devuelve email y no hay match por `sub`.
  - Actualiza `UserIdentity.lastUsedAt` en cada login.
- `oauth.routes.test.ts`:
  - `GET /auth/google` redirige a Google con `state` válido y setea cookie.
  - Callback con `state` inválido → 302 a `/login?error=OAUTH_STATE_INVALID`.
  - Callback con `code` inválido → 302 a `/login?error=OAUTH_PROVIDER_ERROR`.
- `providers.test.ts` — `GET /auth/providers` devuelve solo providers
  configurados.
- `auth.controller.test.ts` (existente) — `/auth/me` sigue funcionando tras
  login OAuth.

### 4.2 Unit tests frontend

- `social-buttons.component.spec.ts` — renderiza botones según respuesta de
  `/auth/providers`. Si Apple=false, no muestra botón Apple. Si la llamada
  falla, no muestra ninguno.
- `auth.service.spec.ts` — `loginWithProvider('google')` llama a
  `window.location.assign` con la URL correcta (incluye `returnTo`).

### 4.3 E2E (Playwright)

- `social-login.spec.ts` — usa endpoint de simulación
  (`POST /__test__/oauth/simulate-callback`) para no depender del browser real
  de Google/Apple. Verifica:
  - Click "Continuar con Google" en `/login` → URL cambia al endpoint de
    simulación → callback redirige a `/?oauth=ok` → header muestra el usuario
    logueado.
  - Idem Apple.
- `social-login-providers.spec.ts` — sin envs configuradas, ningún botón OAuth
  aparece; el form email/password sigue funcionando.

### 4.4 Security smoke

- `state` aleatorio por intento (assert no se reutiliza).
- Cookie `oauth_state` con `httpOnly`, `sameSite=lax`, `secure` en prod,
  `path=/api/v1/auth`.
- No se acepta `email_verified=false`.
- `returnTo` regex estricto (rechaza `//evil.com`, `http://...`, vacío).

---

## 5. Despliegue y rollback

### 5.1 Pasos de deploy

1. Merge de la rama a `main`.
2. `npm install` en el server (instala deps nuevas de Passport).
3. `npm run db:migrate` → aplica la migración Prisma (`User.passwordHash`
   nullable + tabla `UserIdentity`).
4. Setear las 6 envs OAuth en cPanel → Setup Node.js App → Environment.
5. Verificar endpoints `/auth/providers` (debe listar los configurados).
6. Smoke test manual: click en "Continuar con Google" en prod → login OK →
   cookie `auth` presente.

### 5.2 Rollback

- Si falla tras deploy: borrar las envs del provider problemático en cPanel →
  el botón desaparece en el siguiente restart. La auth local sigue intacta.
- Migración Prisma es reversible (`prisma migrate resolve --rolled-back`) y
  la columna nullable no rompe filas existentes.
- El router `/auth/{provider}` puede seguir montado pero respondiendo
  `OAUTH_NOT_CONFIGURED` — es seguro dejarlo.

### 5.3 Riesgos conocidos (documentados)

- **Apple rota JWKS** periódicamente. Mitigado usando el helper de
  `@nicokaiser/passport-apple` que hace refresh automático desde
  `https://appleid.apple.com/auth/keys`.
- **Google `picture` puede ser grande**. Se ignora en esta entrega; si en el
  futuro se quiere avatar, se guarda aparte y se redimensiona.
- **cPanel LVE** puede matar procesos con muchas conexiones simultáneas a
  Google/Apple. Mitigado con rate-limit en memoria (10 starts/min/IP).
- **Apple first-login-only `name` y `email`**: ya manejado por la lógica de
  upsert (match primario por `providerSub`, secundario por email).

---

## 6. Resumen de archivos

### Backend (nuevos)

- `apps/backend/src/modules/auth/oauth.routes.ts`
- `apps/backend/src/modules/auth/oauth.service.ts`
- `apps/backend/src/modules/auth/oauth-state.ts`
- `apps/backend/src/modules/auth/providers.routes.ts`
- `apps/backend/src/modules/auth/oauth-rate-limit.ts`
- `apps/backend/src/modules/auth/auth-cookie.ts` (helper extraído)
- `apps/backend/src/modules/auth/infra/passport-setup.ts`
- `apps/backend/src/modules/auth/__tests__/oauth-state.spec.ts`
- `apps/backend/src/modules/auth/__tests__/oauth.service.spec.ts`
- `apps/backend/src/modules/auth/__tests__/oauth.routes.spec.ts`
- `apps/backend/src/modules/auth/__tests__/providers.spec.ts`
- `apps/backend/prisma/migrations/<ts>_oauth_identity/migration.sql`

### Backend (modificados)

- `apps/backend/package.json`
- `apps/backend/src/config/env.ts`
- `apps/backend/src/app.ts`
- `apps/backend/prisma/schema.prisma`
- `.env.example` (raíz)
- `apps/backend/.env.example`

### Frontend (nuevos)

- `apps/frontend/src/app/features/auth/social-buttons.component.ts`
- `apps/frontend/src/app/features/auth/social-buttons.component.html`
- `apps/frontend/src/app/features/auth/social-buttons.component.css`
- `apps/frontend/src/app/features/auth/__tests__/social-buttons.component.spec.ts`

### Frontend (modificados)

- `apps/frontend/src/app/features/auth/login.component.html`
- `apps/frontend/src/app/features/auth/login.component.ts`
- `apps/frontend/src/app/features/auth/register.component.html`
- `apps/frontend/src/app/features/auth/register.component.ts`
- `apps/frontend/src/app/core/auth.service.ts`
- `apps/frontend/src/app/core/__tests__/auth.service.spec.ts`
- `apps/frontend/e2e/social-login.spec.ts` (nuevo)
- `apps/frontend/e2e/social-login-providers.spec.ts` (nuevo)
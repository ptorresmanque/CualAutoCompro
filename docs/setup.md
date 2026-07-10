# Setup

Guía para levantar el entorno de desarrollo local de **cualautocompro**.

## Requisitos

- Node.js 20+ (incluye npm 10+)
- npm 10+ (incluido con Node.js 20+)
- MariaDB 10.5+ (o Docker)

## Base de datos

Este proyecto usa **MariaDB 10.5+** con Prisma ORM.

### Opción A: Docker (recomendado)

```bash
docker run -d --name cualautocompro-db \
  -e MARIADB_ROOT_PASSWORD=rootpass \
  -e MARIADB_DATABASE=cualautocompro \
  -e MARIADB_USER=cualauto \
  -e MARIADB_PASSWORD=cualauto \
  -p 3306:3306 \
  mariadb:11
```

> En macOS, el cliente `mariadb` se puede instalar con `brew install mariadb` (no requiere
> el servidor). Los comandos `mariadb -ucualauto -pcualauto ...` funcionan contra el contenedor
> de Docker de esta sección.

### Opción B: Instalación local (Homebrew en macOS)

Si prefieres no usar Docker, MariaDB se puede instalar nativamente. Esto es lo que usa este
proyecto en desarrollo local.

```bash
brew install mariadb
brew services start mariadb
```

Esto levanta MariaDB 11.x escuchando en `localhost:3306`. El usuario root queda accesible
sin password en local. Para crear el usuario y las bases que usa el proyecto:

```bash
mariadb -uroot <<'SQL'
CREATE USER IF NOT EXISTS 'cualauto'@'localhost' IDENTIFIED BY 'cualauto';
CREATE USER IF NOT EXISTS 'cualauto'@'127.0.0.1' IDENTIFIED BY 'cualauto';
CREATE USER IF NOT EXISTS 'cualauto'@'%'          IDENTIFIED BY 'cualauto';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'127.0.0.1';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'%';
FLUSH PRIVILEGES;
SQL
```

> **Por qué GRANT global (`*.*`):** `prisma migrate dev` necesita crear una **shadow DB**
> para detectar drift. Si el usuario solo tiene grants por-database, falla con `P3014`
> y obliga a usar el workaround `prisma migrate diff` + `prisma migrate deploy`.

> **Por qué los 3 hosts:** las conexiones TCP a `localhost:3306` pueden resolverse como
> `cualauto@'localhost'` o `cualauto@'127.0.0.1'` dependiendo del cliente y la config del
> servidor. Crear los 3 evita fallos intermitentes.

### Opción C: Instalación local (Ubuntu/Debian)

```bash
sudo apt install mariadb-server
sudo systemctl start mariadb
sudo mariadb
# dentro del cliente:
CREATE USER IF NOT EXISTS 'cualauto'@'localhost' IDENTIFIED BY 'cualauto';
CREATE USER IF NOT EXISTS 'cualauto'@'127.0.0.1' IDENTIFIED BY 'cualauto';
CREATE USER IF NOT EXISTS 'cualauto'@'%'          IDENTIFIED BY 'cualauto';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'localhost';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'127.0.0.1';
GRANT ALL PRIVILEGES ON *.* TO 'cualauto'@'%';
FLUSH PRIVILEGES;
```

### Crear las bases de datos

```sql
CREATE DATABASE cualautocompro      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE cualautocompro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### Importante: charset utf8mb4

MariaDB debe usar `utf8mb4` para soportar emojis y caracteres Unicode completos. Esto se
aplica tanto en la URL de conexión como en el `CREATE DATABASE`.

## Variables de entorno

Copiar `.env.example` a `.env` (en la raíz del monorepo y también en `apps/backend/`) y
ajustar `DATABASE_URL`:

```
DATABASE_URL=mysql://cualauto:cualauto@localhost:3306/cualautocompro?charset=utf8mb4
```

Para los tests, copiar `apps/backend/.env.test.example` a `apps/backend/.env.test`:

```
DATABASE_URL=mysql://cualauto:cualauto@localhost:3306/cualautocompro_test?charset=utf8mb4
```

### Plantilla para local dev

Si vas a trabajar contra MariaDB local, puedes partir del archivo
`apps/backend/.env.development` (committed con defaults de local dev):

```bash
cp apps/backend/.env.development apps/backend/.env
```

Esa plantilla viene con `NODE_ENV` indefinido (default `development`),
`DATABASE_URL` apuntando a `localhost` y `ADMIN_INITIAL_PASSWORD=admin1234`
— el `throw` de producción NO se activa porque la condición es
`NODE_ENV === "production"`.

Si en algún momento necesitas probar el deploy localmente con la BD
de producción, restaura el `.env` con tus valores reales (o cámbialo
manualmente) y verifica que `ADMIN_INITIAL_PASSWORD` esté sobreescrito
con un valor distinto a `admin1234`.

## Backend

```bash
# instalar dependencias
npm install

# aplicar migraciones + seed
npm run db:reset

# arrancar backend en modo dev
npm run dev:be
```

El backend queda escuchando en `http://localhost:3000`. Health check: `GET /health`.

## Frontend

```bash
npm run dev:fe
```

Disponible en `http://localhost:4200`.

### Llamadas HTTP al backend desde componentes no-`ApiService`

Por defecto, el `fetch()` del navegador ejecuta URLs **relativas** (`/api/v1/...`)
contra el dev server (`localhost:4200`). El dev server de Angular no está configurado
para proxyar al backend, así que responde con el HTML del SPA como fallback y la
llamada falla silenciosamente (no hay JSON que parsear).

**Regla:** cualquier `fetch()` que NO use `ApiService` debe apuntar al backend
con **URL absoluta** vía `ENV.apiBase` (`'../../core/env'`):

```ts
import { ENV } from '../../core/env';
// ...
const res = await fetch(`${ENV.apiBase}/auth/providers`, {
  credentials: 'include',
});
```

`api.service.ts` ya usa este patrón con `${ENV.apiBase}${path}`.

> Nota: en versiones anteriores intentamos agregar `proxy.conf.json` para
> proxy del dev server. **No funciona** con el nuevo builder
> `@angular/build:dev-server` de Angular 22 (basado en Vite). Si querés
> URLs relativas en algún momento, abrí un issue antes de reintroducirlo.

## Tests

```bash
# backend + frontend
npm test

# solo backend
npm run test:be

# solo frontend
npm run test:fe
```

## Migraciones

```bash
# desarrollo: crea/aplica migración y regenera cliente
npm run db:migrate

# producción: solo aplica migraciones pendientes
cd apps/backend && npx prisma migrate deploy

# poblar con datos de ejemplo
npm run db:seed
```

## Reset completo de la base

Si necesitas empezar desde cero:

```bash
mariadb -ucualauto -pcualauto -e "DROP DATABASE cualautocompro;"
mariadb -ucualauto -pcualauto -e "DROP DATABASE cualautocompro_test;"
mariadb -ucualauto -pcualauto -e "CREATE DATABASE cualautocompro      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mariadb -ucualauto -pcualauto -e "CREATE DATABASE cualautocompro_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
npm run db:migrate
npm run db:seed
```

## OAuth (Google + Apple)

Login social es opcional. Si no se configuran las envs, los botones no aparecen
en `/login` y `/register`; el login email/password sigue funcionando.

### Por qué hay DOS `*_ORIGIN` envs (dev vs prod)

Hay dos orígenes distintos: el **frontend** (donde está la app Angular) y el
**backend** (donde corre el API). En producción suelen compartir dominio
(`https://cualautocompro.cl`), pero en dev son puertos distintos:

| Variable | Dev | Prod | Propósito |
|---|---|---|---|
| `WEB_ORIGIN` | `http://localhost:4200` | `https://cualautocompro.cl` | Frontend — a dónde redirigir tras login |
| `BACKEND_ORIGIN` | `http://localhost:3000` | `https://api.cualautocompro.cl` | Backend — callback URL que passport pasa a Google/Apple |

Por qué el dev no usa proxy:
El nuevo builder de Angular 22 (`@angular/build:dev-server`) sobre Vite no
interpreta `proxyConfig` en `angular.json` de forma confiable. En su lugar, el
backend expone la cookie con `Domain=localhost`, lo que hace que sea legible
desde cualquier puerto de localhost (4200 y 3000 comparten la cookie). Los
redirects apuntan directo al backend (puerto 3000) sin intermediarios.

Google registra `BACKEND_ORIGIN/api/v1/auth/google/callback` (no `WEB_ORIGIN`)
porque Google redirige ahí después de autenticar.

### Google

1. Crear OAuth Client tipo "Web application" en [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Authorized redirect URI:
   - Dev: `http://localhost:3000/api/v1/auth/google/callback` ← es `BACKEND_ORIGIN`
   - Prod: `https://cualautocompro.cl/api/v1/auth/google/callback`
3. Setear en `.env`:
   ```
   GOOGLE_CLIENT_ID=...
   GOOGLE_CLIENT_SECRET=...
   ```

### Apple

1. En Apple Developer: App ID con capability "Sign in with Apple" + Service ID (cliente web) con Return URL.
2. Dev: usar `ngrok` o similar (Apple solo acepta HTTPS). Prod: Return URL `https://cualautocompro.cl/api/v1/auth/apple/callback`.
3. Crear private key (.p8), guardar su contenido en `APPLE_PRIVATE_KEY` reemplazando saltos de línea por `\n` literal.
4. Setear en `.env`:
   ```
   APPLE_CLIENT_ID=...
   APPLE_KEY_ID=...
   APPLE_TEAM_ID=...
   APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
   ```

### Variables que la app agrega automáticamente

Si no se setea `BACKEND_ORIGIN`, el backend hace default a `http://localhost:3000`
(mismo que en dev). En prod hay que setearlo explícitamente al URL público del API.

### Como verificar

1. Reiniciar backend con las envs seteadas.
2. `curl http://localhost:3000/api/v1/auth/providers` → debe devolver `{"data":{"google":true,"apple":false}}` (o apple:true si configuraste Apple).
3. En el navegador, ir a `/login`: debe aparecer el botón "Continuar con Google".
4. Click → autorizar en Google → volver al sitio y estar logueado (sin pantalla en blanco ni errores NG04002).

### Troubleshooting común

- **Botón no aparece** → primero refrescá con `Cmd+Shift+R`. Si sigue, abrí DevTools → Network, buscá `/auth/providers` y verificá que devuelva `{"data":{"google":true,...}}`. Si devuelve HTML/SPA, hay otro bug.
- **`redirect_uri_mismatch`** → registraste el redirect URI en Google Cloud con el puerto equivocado. Tenés que ser `localhost:3000/...`, NO `:4200/...`.
- **Pantalla en blanco + error `NG04002`** → tu Google Cloud Console tiene el redirect URI con puerto 4200 (mal). Reemplazá por 3000.
- **Después del callback, no estoy logueado** → probablemente no llegó el redirect al frontend. Verificá que `WEB_ORIGIN` en `.env.development` sea `http://localhost:4200`.
---

## Despliegue a producción (cPanel)

Pasos adicionales al deploy estándar (`guia-despliegue-cpanel.pdf`) para que OAuth
funcione en `https://cualautocompro.cl`.

### 1. Variables de entorno en cPanel

En **Setup Node.js App → Environment variables** del panel de cPanel, agregar:

| Variable | Valor | Notas |
|---|---|---|
| `NODE_ENV` | `production` | Requerido. Activa salvaguarda del admin password |
| `WEB_ORIGIN` | `https://cualautocompro.cl` | Frontend público |
| `BACKEND_ORIGIN` | `https://cualautocompro.cl` | Backend público. Mismo host si están en el mismo virtual host. Si backend es subdominio distinto (ej `api.cualautocompro.cl`), setearlo ahí |
| `GOOGLE_CLIENT_ID` | (de Google Cloud Console) | |
| `GOOGLE_CLIENT_SECRET` | (de Google Cloud Console) | |
| `APPLE_CLIENT_ID` | (Service ID de Apple Developer) | |
| `APPLE_KEY_ID` | (de Apple) | |
| `APPLE_TEAM_ID` | (de Apple) | |
| `APPLE_PRIVATE_KEY` | (PEM del .p8 con `\n` escapados) | |
| `JWT_SECRET` | (32 bytes aleatorios) | **Sobreescribir** el valor de `.env.example` por seguridad |
| `ADMIN_INITIAL_PASSWORD` | (password fuerte, NO `admin1234`) | El backend tira error si queda `admin1234` con `NODE_ENV=production` |

> **WEB_ORIGIN vs BACKEND_ORIGIN**: en prod suelen ser iguales (mismo dominio público).
> La distinción existe para dev donde son puertos distintos. Ver sección OAuth arriba
> para el detalle.

### 2. Aplicar migración Prisma antes del primer deploy con OAuth

```bash
cd apps/backend && npx prisma migrate deploy
```

La migración `20260709120000_oauth_identity` crea la tabla `UserIdentity` y hace
nullable `User.passwordHash`. Sin ella, `/auth/providers` devuelve 500.

### 3. Registrar redirect URIs en los providers

**Google Cloud Console** (https://console.cloud.google.com/apis/credentials) →
tu OAuth client → Authorized redirect URIs:

```
https://cualautocompro.cl/api/v1/auth/google/callback
```

> NO uses `https://www.cualautocompro.cl/...` (con `www`) ni rutas con
> `/oauth/callback` (el path de callback es `/api/v1/auth/google/callback`).

**Apple Developer** (https://developer.apple.com/account/resources/identifiers) →
tu Service ID → Web Authentication Configuration:

| Web Domain | Return URL |
|---|---|
| `cualautocompro.cl` | `https://cualautocompro.cl/api/v1/auth/apple/callback` |

Si no configuraste Apple todavía en dev, empezá solo con Google.

### 4. Verificación post-deploy

```bash
curl https://cualautocompro.cl/api/v1/auth/providers
```

Esperado: `{"data":{"google":true,"apple":false},"error":null}`.

- Si `google:false` → falta `GOOGLE_CLIENT_ID/SECRET` o consistencia parcial.
- Si 404 → la migración no se aplicó (`prisma migrate deploy`).
- Si 500 → revisar logs del backend.

En el navegador, ir a `https://cualautocompro.cl/login`: deben aparecer los
botones OAuth. Click → autorizar → volver al sitio y estar logueado.

### 5. Cookies en producción

`auth-cookie.ts` automáticamente omite `Domain=localhost` cuando
`NODE_ENV=production`. El navegador usa la cookie en el dominio que la emitió,
que es exactamente donde está el frontend si comparten dominio.

> Si backend y frontend son **subdominios distintos** (`api.cualautocompro.cl`
> vs `app.cualautocompro.cl`), necesitás editar
> `apps/backend/src/modules/auth/auth-cookie.ts` y agregar
> `domain: '.cualautocompro.cl'` (con punto inicial para incluir subdominios).
> Esta es la única razón por la que el proyecto podría necesitar un cambio
> de código específico al deploy más allá de las env vars.

### 6. Seguridad post-deploy

- **HTTPS obligatorio**: las cookies tienen `secure: true` en prod (solo se
  envían sobre HTTPS). Si no hay HTTPS, el browser rechaza la cookie y el
  flow falla silenciosamente.
- **JWT_SECRET único**: random 32+ bytes. Nunca reutilizar el valor de
  `.env.example`.
- **No commitear `.env`** con secrets reales: `.env.development`,
  `.env.production` y `.env.local` están todos en `.gitignore`.
- Si el browser muestra `redirect_uri_mismatch`, tu `BACKEND_ORIGIN` y la URL
  registrada en Google/Apple no coinciden carácter por carácter (chequear
  protocolo https, sin `www`, sin trailing slash).
- Si los usuarios reciben `OAUTH_EMAIL_NOT_VERIFIED`, su cuenta de Google/Apple
  tiene email no verificado;让他们 usar otra cuenta o verificar primero.

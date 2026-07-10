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
contra el dev server (`localhost:4200`). El dev server de Angular **no tiene proxy
configurado** hacia el backend, así que responde con el HTML del SPA como
fallback y la llamada falla silenciosamente (no hay JSON que parsear).

**Regla:** cualquier `fetch()` que NO use `ApiService` debe apuntar al backend
con **URL absoluta** vía `ENV.apiBase` (`'../../core/env'`):

```ts
import { ENV } from '../../core/env';
// ...
const res = await fetch(`${ENV.apiBase}/auth/providers`, {
  credentials: 'include',
});
```

`api.service.ts` ya usa este patrón con `${ENV.apiBase}${path}`. Si necesitás
que URLs relativas funcionen también, agregá un `proxy.conf.json` (ver más
abajo).

### (Opcional) Proxy del dev server hacia el backend

Si preferís poder usar URLs relativas (ej. `fetch('/api/v1/...')`), creá
`apps/frontend/proxy.conf.json`:

```json
{
  "/api/*": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

Y activá el proxy en `apps/frontend/angular.json` dentro de
`projects.frontend.architect.serve.options`:

```json
"proxyConfig": "proxy.conf.json"
```

Luego reiniciá `ng serve`. Las llamadas a `/api/v1/...` se redirigirán
transparentemente al backend. Útil si tenés varias llamadas a endpoints
exóticos que no querés prefijar con `ENV.apiBase`.

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
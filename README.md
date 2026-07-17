# cualautocompro

Comparador de autos nuevos en Chile. Catálogo de marcas, modelos y versiones con
filtros por precio, segmento y equipamiento; comparación lado a lado; cuentas
de usuario con favoritos e historial de comparaciones; panel admin para
gestionar el catálogo.

Stack: **Angular 22** (frontend), **Express + Prisma + MariaDB** (backend),
**OAuth Google + Apple** opcional.

## Estructura del monorepo

```
apps/
  backend/    API REST, Prisma schema, migraciones, seed
  frontend/   SPA Angular + Tailwind + Angular Material
docs/
  setup.md    Guía detallada de setup local (DB, OAuth dev, troubleshooting)
```

## Requisitos

- Node.js 20+ (incluye npm 10+)
- MariaDB 10.5+ (Docker, Homebrew o nativa)

## Quick start

```bash
# 1. instalar dependencias
npm install

# 2. base de datos (Docker)
docker run -d --name cualautocompro-db \
  -e MARIADB_DATABASE=cualautocompro \
  -e MARIADB_USER=cualauto \
  -e MARIADB_PASSWORD=cualauto \
  -e MARIADB_ROOT_PASSWORD=rootpass \
  -p 3306:3306 mariadb:11

# 3. variables de entorno
cp .env.example apps/backend/.env
cp apps/backend/.env.development.example apps/backend/.env.development

# 4. migrar + seed
npm run db:reset

# 5. arrancar backend y frontend
npm run dev
```

Backend queda en `http://localhost:3000`, frontend en `http://localhost:4200`.

Para detalles de instalación de MariaDB nativa (macOS/Linux), configuración de
OAuth en dev, troubleshooting y la regla de URLs absolutas para `fetch()`
directo al backend, ver [`docs/setup.md`](docs/setup.md).

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Backend (tsx watch) + frontend (ng serve) en paralelo |
| `npm run dev:be` | Solo backend |
| `npm run dev:fe` | Solo frontend |
| `npm test` | Suite completa (backend Vitest + frontend Vitest) |
| `npm run test:be` | Solo backend |
| `npm run test:fe` | Solo frontend |
| `npm run test:e2e` | Playwright (desde `apps/frontend`) |
| `npm run db:migrate` | Crea/aplica migración Prisma |
| `npm run db:seed` | Puebla la base con datos de ejemplo |
| `npm run db:reset` | Reset completo + seed |

## Tests

- **Backend** (Vitest): cubren los contratos de env, módulos del API y
  helpers. Ver `apps/backend/__tests__/`.
- **Frontend** (Vitest): cubren componentes, servicios y stores. Ver
  `apps/frontend/src/**/*.spec.ts`.
- **E2E** (Playwright): flujos críticos desde la UI.

## Stack

**Frontend**
- Angular 22 (standalone components, signals, control flow moderno)
- Tailwind CSS + Angular Material con overrides completos del theme
- Vitest + Playwright
- TypeScript estricto

**Backend**
- Node.js + Express + TypeScript
- Prisma 6 sobre MariaDB 10.5+
- Passport (JWT + Google OAuth 20 + Apple)
- Vitest

## Variables de entorno

Plantillas en la raíz (`.env.example`) y en cada app
(`apps/backend/.env.development.example`,
`apps/backend/.env.test.example`). Nunca commitear `.env` reales:
están ignorados en `.gitignore`.

Las variables principales:

```
DATABASE_URL=mysql://user:pass@host:3306/db?charset=utf8mb4&connection_limit=10&...
JWT_SECRET=<32+ bytes aleatorios>
JWT_EXPIRES_IN=7d
PORT=3000
WEB_ORIGIN=http://localhost:4200
BACKEND_ORIGIN=http://localhost:3000

# OAuth (opcionales; si no se setean, los botones no se renderizan)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_KEY_ID=
APPLE_TEAM_ID=
APPLE_PRIVATE_KEY=
```

`DATABASE_URL` lleva `connection_limit=10`, `connect_timeout=10`,
`pool_timeout=10`, `socket_timeout=30` y `max_idle_connection_lifetime=300`
explícitos para que el pool no acumule conexiones en hosting compartido con
límite de Entry Processes. Detalle en `docs/setup.md`.

## Licencia

MIT. Ver [`LICENSE`](LICENSE).
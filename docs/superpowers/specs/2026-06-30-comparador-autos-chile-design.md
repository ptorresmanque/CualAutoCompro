# Comparador de Autos Chile — Spec de diseño

**Fecha:** 2026-06-30
**Estado:** Aprobado
**Stack objetivo:** Angular 22 (frontend) + Node + Express + TypeScript + PostgreSQL (backend) en monorepo con workspaces.

---

## 1. Objetivo

App web que permita a usuarios en Chile explorar el catálogo de vehículos disponibles en el mercado chileno y compararlos en paralelo (ficha técnica, precios, equipamiento y costos estimados de mantención), con autenticación y capacidad de compartir comparaciones por URL.

---

## 2. Fuera de alcance (v1)

- Moneda UF o USD — solo **CLP**, formateado con `Intl.NumberFormat('es-CL')`.
- Multi-idioma — solo **español (Chile)**.
- SSR / hidratación — **SPA con Vite** (Angular 22 soporta SSR; queda como evolución).
- PWA, push notifications, instalable.
- Calculadora de crédito automotriz.
- Reseñas / opiniones de usuarios.
- Refresh tokens — la cookie HttpOnly expira a 7 días y se re-login.
- Roles / admin — solo `User`; carga de datos vía **seed script**; Prisma Studio como admin manual durante v1.
- Comparación de más de 3 autos (límite duro).
- Scraping en vivo de precios — datos curados en seed.

---

## 3. Usuarios y autenticación

### 3.1 Tipos de usuario

- **Anónimo:** explorar, filtrar, comparar hasta 3 autos y compartir vía URL efímera (`?ids=a,b,c`).
- **Registrado:** todo lo anterior + guardar comparaciones con slug + historial en `/account/comparisons`.

### 3.2 Mecanismo de auth

- JWT firmado en cookie `HttpOnly`, `SameSite=Lax`, `Secure` en producción.
- Hash de password con **bcrypt** (cost 10).
- Variables de entorno en `apps/backend/.env`:
  - `JWT_SECRET`
  - `JWT_EXPIRES_IN=7d`
  - `DATABASE_URL`
- El frontend nunca lee el token desde JS — el interceptor añade `withCredentials: true` para que el navegador envíe la cookie.

---

## 4. Modelo de datos (Prisma + PostgreSQL)

`apps/backend/prisma/schema.prisma`:

```
Brand           { id, name, logoUrl, models[] }
Model           { id, brandId, name, segment, imageUrl, versions[] }
Version         { id, modelId, name, year, priceClp, transmission, fuel,
                  engineDisplacementCc, powerHp, torqueNm,
                  consumptionCityKmL, consumptionHighwayKmL,
                  lengthMm, widthMm, heightMm, weightKg, trunkLiters,
                  airbagCount, hasAbs, hasEsp, hasCruiseControl,
                  equipmentItems[], maintenanceCosts[], comparisonItems[] }
EquipmentItem   { id, name, category }
VersionEquipment{ versionId, equipmentItemId }
MaintenanceCost { id, versionId, mileageTag, costClp }
                // mileageTag ∈ { "10000","20000","30000","40000","60000" }
User            { id, email (unique), passwordHash, name, createdAt, comparisons[] }
Comparison      { id, userId, slug (unique, nullable), name?, createdAt, items[] }
ComparisonItem  { id, comparisonId, versionId, position (1..3) }
```

Decisiones de modelado:

- **Versión = trim** (XLS, GLI, Sport, etc.). El mercado chileno suele referirse directamente al trim.
- **Equipment** como relación m:n (flexible y consultable para futuras funciones de filtrado).
- **Mantención** como filas por `mileageTag` (un valor estimado por cada servicio estándar de la marca).
- **Sharing**: si el usuario está autenticado y guarda, se crea `Comparison` con `slug` (nanoid 8 chars). Si es anónimo, no se guarda nada — la URL efímera ya codifica los IDs.

---

## 5. API REST (`/api/v1`)

### 5.1 Auth
- `POST /auth/register` `{ email, password, name }` → setea cookie, devuelve usuario.
- `POST /auth/login` `{ email, password }` → setea cookie.
- `POST /auth/logout` → limpia cookie.
- `GET /auth/me` → usuario actual o 401.

### 5.2 Catálogo público
- `GET /brands` → listado simple.
- `GET /brands/:id/models` → modelos de una marca.
- `GET /models?brand=&segment=&year=&transmission=&fuel=&priceMin=&priceMax=&powerMin=&consumptionMax=&page=&pageSize=` → paginado.
- `GET /models/:id` → detalle + versiones.
- `GET /versions/:id` → versión con `equipmentItems[]` y `maintenanceCosts[]`.

### 5.3 Comparación
- `POST /compare` body `{ versionIds: string[] (1..3) }` → `{ versions: [...], diffHighlights: { [key]: boolean } }`.
- `GET /compare?ids=a,b,c` → mismo payload (deep-link efímero).
- `GET /comparisons/:slug` → público (compartida por un usuario registrado).

### 5.4 Usuario autenticado
- `GET /me/comparisons` → historial.
- `POST /me/comparisons` `{ versionIds, name? }` → `{ id, slug }`.
- `DELETE /me/comparisons/:id`.

### 5.5 Formato y errores

Respuesta estándar:
```json
{ "data": ..., "error": null }
```

Errores tipados:
- `VALIDATION` (zod), `NOT_FOUND`, `UNAUTHORIZED`, `CONFLICT`, `BAD_REQUEST`.
- Siempre con `status` HTTP coherente.

---

## 6. Frontend (Angular 22)

### 6.1 Stack y convenciones

- **Angular 22** con `signals`, standalone components, nuevo control flow (`@if`, `@for`, `@switch`).
- **CSS plano** en archivos `.css` separados. **Nada de SCSS.**
- **Tailwind CSS** utility-first — `tailwind.config.js` con `content: ['./src/**/*.{html,ts,css}']`; importado en `src/styles.css` con `@tailwind base; @tailwind components; @tailwind utilities;`.
- **Nunca inline templates** — todo componente es un set de **3 archivos**: `*.ts`, `*.html`, `*.css`. El TS solo apunta con `templateUrl` + `styleUrl`.
- `provideHttpClient(withFetch(), withInterceptors([authInterceptor]))` con `withCredentials: true` en todas las llamadas.
- Lazy routes con `loadComponent` / `loadChildren`.
- Forms tipados (`FormGroup<...>`).

### 6.2 Rutas

| Ruta | Vista |
|---|---|
| `/` | Catálogo + filtros avanzados |
| `/brand/:brandSlug/model/:modelSlug` | Detalle de modelo y versiones |
| `/compare?ids=a,b,c` o `?slug=...` | Vista de comparación híbrida |
| `/login`, `/register` | Autenticación |
| `/account/comparisons` | Historial (requiere auth) |

### 6.3 Vista de comparación (híbrida)

1. **Tres cards** con resumen visual: precio destacado, potencia, consumo, transmisión.
2. **Tabla expandible** por secciones, con badge "diff" cuando los valores difieren entre los autos seleccionados:
   - **Especificaciones**: motor, potencia, torque, consumo, dimensiones, peso, maletero.
   - **Precios y año**: precio CLP formateado, año.
   - **Equipamiento**: chips por categoría.
   - **Mantención**: costos por cada `mileageTag`.

### 6.4 Estado de comparación

- Servicio `compare-store.service` con `selectedVersionIds: Signal<string[]>` (max 3).
- Persistido en `localStorage` (solo IDs).
- Hidratado desde la URL al cargar si trae `?ids` o `?slug`.

---

## 7. Estructura del monorepo

```
/
├── package.json              # workspaces root, scripts orquestadores
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
├── .editorconfig
├── .nvmrc
├── README.md
├── docs/superpowers/
│   ├── specs/
│   └── plans/
└── apps/
    ├── backend/
    │   ├── package.json
    │   ├── tsconfig.json
    │   ├── vitest.config.ts
    │   ├── .env.example
    │   ├── prisma/
    │   │   ├── schema.prisma
    │   │   ├── migrations/
    │   │   └── seed.ts
    │   └── src/
    │       ├── index.ts                  # entrypoint del servidor
    │       ├── app.ts                    # Express app factory (testeable)
    │       ├── config/env.ts             # zod schema
    │       ├── infra/
    │       │   ├── prisma.ts             # singleton client
    │       │   └── jwt.ts
    │       ├── modules/
    │       │   ├── auth/  (controller, service, middleware, routes)
    │       │   ├── brands/
    │       │   ├── models/
    │       │   ├── versions/
    │       │   ├── compare/
    │       │   └── comparisons/
    │       ├── shared/
    │       │   ├── errors.ts
    │       │   └── response.ts
    │       └── __tests__/helpers/        # utilidades (no specs aquí)
    └── frontend/
        ├── package.json
        ├── angular.json                   # schematics en CSS
        ├── tsconfig.json
        ├── tailwind.config.js
        ├── postcss.config.js
        ├── src/
        │   ├── index.html
        │   ├── main.ts
        │   ├── styles.css                 # @tailwind + tokens base
        │   └── app/
        │       ├── app.component.ts/.html/.css
        │       ├── app.config.ts
        │       ├── app.routes.ts
        │       ├── core/                  # auth.service, interceptors, guards, api.service, compare-store.service
        │       ├── shared/                # ui/*, pipes/*
        │       ├── features/
        │       │   ├── catalog/
        │       │   ├── model/
        │       │   ├── compare/
        │       │   ├── auth/
        │       │   └── account/
        │       └── layout/                # header, footer, shell
        └── e2e/
            ├── playwright.config.ts
            └── tests/
                ├── auth.spec.ts
                ├── explore.spec.ts
                └── compare.spec.ts
```

Scripts raíz:

- `dev` — backend y frontend en paralelo.
- `dev:be`, `dev:fe`.
- `test` — Vitest en ambos workspaces.
- `test:e2e` — Playwright.
- `db:migrate`, `db:seed`, `db:reset`.

---

## 8. Estrategia de pruebas (TDD)

Proceso: cada unidad de trabajo sigue **red → green → refactor**. Tests primero.

### 8.1 Backend (Vitest + pglite)

1. `auth.service` — register (bcrypt), login (JWT), errores (email duplicado, password débil).
2. `auth.middleware` — setea `req.user` desde cookie; rechaza sin token o expirado.
3. `compare.service` — agrega 1-3 versiones, calcula `diffHighlights`, rechaza >3.
4. `models.controller` — query parser aplica filtros combinados (brand + price + transmission + fuel + powerMin + consumptionMax).
5. `comparisons.controller` — crea con slug aleatorio, lookup público por slug, listado propio por usuario.
6. Restricciones de Prisma — validación vía tests de seed.

### 8.2 Frontend (Vitest + Angular Testing Library)

1. `compare-store.service` — signal reactivo, máx 3, persistencia en `localStorage`, hidratación desde URL.
2. `compare.component` — vacío, 1, 2, 3 autos; diffs destacados.
3. `catalog.component` — filtros aplican cambios reactivos y se reflejan en URL.
4. `auth.service` — login/logout/me; estado reactivo `currentUser: Signal<User | null>`.
5. `authInterceptor` — añade `withCredentials: true`, no expone tokens.
6. `authGuard` — protege `/account/*`.

### 8.3 E2E (Playwright)

1. Registro → login → historial (vacío).
2. Explorar con filtros aplicados → ver grid.
3. Agregar 3 autos a comparación → ir a `/compare` → ver cards + tabla.
4. Login + guardar comparación → copiar URL pública → cerrar sesión → abrir URL anónimamente → ver comparación.

---

## 9. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Curación manual de 100-200 autos es trabajo importante | Seed incremental; admin simple en v2 si crece |
| Imágenes de los modelos | URLs oficiales públicas (sitios de marcas) como placeholder; bucket propio en v2 |
| Costos de mantención son promedios | Disclaimer en UI: "valor estimado referencial" |
| Precios cambian | Disclaimer: "precios referencia año 2026, confirmar en concesionario" |
| Tailwind + Playwright flakiness | Selectores por `data-testid` + `:visible` en assertions |
| Angular 22 requiere CLI v22 | Actualizar `@angular/cli` a la latest antes de `ng new` |

---

## 10. Open questions resueltas

1. **Imágenes:** URLs oficiales públicas (placeholder) en v1.
2. **Disclaimer en UI:** sí, visible y diferenciado.
3. **Seed inicial:** marcas más vendidas en Chile (Toyota, Chevrolet, Hyundai, Kia, Mazda, Nissan, Suzuki, Subaru, Ford, Volkswagen) + expandir progresivamente.
4. **Rango de años en seed:** 2024-2026.

---

## 11. Criterios de éxito (v1)

- [ ] Catálogo público navegable con filtros combinados aplicables simultáneamente.
- [ ] Comparación de hasta 3 autos con diff destacado en cada sección.
- [ ] Registro, login y logout funcionales, con cookies HttpOnly y JWT.
- [ ] Persistir y compartir comparación por URL — con y sin login.
- [ ] Historial personal accesible desde `/account/comparisons`.
- [ ] Suites de tests (backend + frontend) pasando, escritas con TDD.
- [ ] E2E con Playwright cubriendo los flujos críticos.
- [ ] Builds de ambos proyectos sin errores; `npm run dev` levanta backend + frontend en paralelo.
- [ ] `npm run test` y `npm run test:e2e` ejecutables en CI/local.

---

## 12. Decisiones de adopción y trazabilidad

Decisiones técnicas adoptadas (resumen):

- **Monorepo simple** (workspaces) sobre Nx (YAGNI para v1).
- **Angular 22** (último estable) con signals + standalone + new control flow.
- **CSS plano + Tailwind**, sin SCSS, sin inline templates.
- **Express + Prisma + Postgres** en backend, JWT HttpOnly + bcrypt.
- **REST** (no GraphQL) para v1; `withCredentials` en frontend.
- **Vitest + pglite** en backend; **Vitest + Angular Testing Library** en frontend; **Playwright** E2E.
- **TDD** estricto (red → green → refactor) en cada unidad.

---

**Aprobado por:** usuario (2026-06-30).
**Próximo paso:** invocar la skill **writing-plans** para producir el plan de implementación por hitos.

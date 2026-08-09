# Limpieza post-auditoría ponytail

Fecha: 2026-08-09
Origen: `/ponytail-audit` sobre el repo completo (~24.4k líneas de producción).
Objetivo: **-1200 líneas y -3 dependencias sin perder funcionalidad ni escalabilidad.**

## Principios de esta limpieza

1. **Ninguna fase cambia comportamiento observable.** Si una fase necesita cambiar
   comportamiento, no es parte de esta limpieza.
2. **Orden por riesgo creciente, no por tamaño.** Lo grande y riesgoso va último, cuando
   la red de tests ya se ejercitó varias veces.
3. **Un commit por fase.** Cada fase revierte sola. Nada de un PR de 1200 líneas.
4. **No se simplifica nunca:** validación en bordes de confianza, manejo de errores que
   evita pérdida de datos, seguridad, accesibilidad.

## Fase 0 — Baseline verde

Antes de borrar nada, confirmar que la suite pasa hoy y anotar el número de tests.

```bash
npm test && npm run test:e2e && npm -w apps/frontend run check:design
```

Además, dejar por escrito el conteo de líneas de partida para medir al final:

```bash
git ls-files 'apps/**/*.ts' 'apps/**/*.html' 'apps/**/*.css' | grep -v '\.spec\.ts' | grep -v '/e2e/' | grep -v '__tests__' | xargs wc -l | tail -1
```

**Criterio de salida:** suite verde. Si algo falla hoy, se arregla o se documenta *antes*
de empezar — un test rojo preexistente hace imposible atribuir una regresión a una fase.

---

## Fase 1 — Borrados puros (riesgo cero)

Nada de esto tiene un solo caller de producción. Es borrar y compilar.

### 1.1 Dependencias muertas

| Dep | Por qué se va |
|---|---|
| `zone.js` (frontend) | La app es zoneless: no hay clave `polyfills` en `angular.json` ni un solo import de zone. |
| `sass` (frontend) | Cero archivos `.scss` en el repo; el build usa `src/styles.css`. |
| `openid-client` (backend) | Cero imports en `src/`, y `@nicokaiser/passport-apple` no lo declara como dependencia ni peer. |

```bash
npm -w apps/frontend uninstall zone.js sass
npm -w apps/backend uninstall openid-client
```

### 1.2 Código sin callers

- `parseCsv` + tipo `CsvCell` + su bloque de spec — `apps/backend/src/shared/csv.ts:30`.
  Solo lo usa su propio test. (`toCsv` **se queda**: lo usan 8 controllers.)
- `safeSlug` + su spec — `apps/backend/src/shared/slug.ts:21`. Ojo: **no** saca la
  dependencia `nanoid`, que siguen usando `auth.service`, `comparisons.service` y
  `uploads.controller`.
- `fail()` — `apps/backend/src/shared/response.ts`. El handler de errores de `app.ts`
  arma el sobre a mano; `fail` nunca se llamó.
- `AdminOptionsCacheService.getObject` (es un cast disfrazado de método) y `clear()`
  (cero llamadas) — `apps/frontend/src/app/core/admin-options-cache.service.ts:39`.
- `tsconfig.json` raíz: extiende la base con `"include": []`, no compila nada.
  Verificar antes que ningún editor/tooling lo resuelva; si lo hace, se queda.

### 1.3 Exports que nadie importa

Sacar la palabra `export` (o el símbolo entero si tampoco se usa dentro del archivo):

`ProviderIdentity`, `ResolvedUser` (oauth.service) · `FavoriteModelCard` ·
`detectImageFormat` · `readApplePrivateKey` · `__resetRateLimit` · `UNITS` ·
`POPULARITY_COOKIE_NAME` · `ServerOptions`, `ShutdownFn` (server.ts) ·
`DEFAULT_PAGE`, `DEFAULT_PAGE_SIZE`, `MAX_PAGE_SIZE`, `pagedResponse` (pagination.ts) ·
`ErrorCode` · `Env` · los 6 `*Seed` de `prisma/catalog.ts` · `VehicleLite` ·
`StaticSelectOption` · `compareValues` · `DialogMode`.

> Cuidado con los que el scan marcó como "solo usados en specs" (`resetAuthRateLimit`,
> `isUserRole`, `USER_ROLES`, `humanizeToken`, `VersionEquipmentRef`): **esos se quedan**.
> Un helper que solo usa el test sigue siendo el punto de entrada del test.

### 1.4 CSS muerto en `styles.css`

- Las 4 reglas de `mat-mdc-radio` / `mdc-radio__*` y `.filter-radio-group`
  (`styles.css:462` y `:698`): no hay un solo `mat-radio` en el repo — los filtros del
  catálogo son checkbox por decisión de producto documentada ahí mismo.
- `.big-number`, `.ficha-num`, `.hairline-v`, `.mono-label`. `.stamp-label` **se queda**
  (la usan `register` y `not-found`); hay que separarla del selector compartido.

**Verificación de fase:** `tsc --noEmit` en ambos workspaces + suite completa + `check:design`.
Un `npm run build` del frontend confirma que sacar `zone.js`/`sass` no rompió el bundle.

---

## Fase 2 — Matar `extendEnum`

`apps/backend/src/shared/enum-extension.ts` es un no-op documentado ("No-op en MariaDB")
con 4 call sites en `versions.service.ts` y 34 líneas de spec.

**Antes de borrar, cerrar el hueco de validación.** Lo único vivo de `extendEnum` es el
regex `^[A-Z0-9_]+$` que rechaza tokens raros. Ese regex ya existe como `ENUM_REGEX` en
`versions.dto.admin.ts` y `models.dto.admin.ts`, aplicado por zod en el borde HTTP — que
es donde tiene que estar. Los pasos, en este orden:

1. Escribir (si no existe) un test de DTO que confirme que `fuel: "BAD VALUE"` y
   `transmission: "'; DROP TABLE"` se rechazan con `VALIDATION` en el borde.
2. Recién con ese test verde, borrar `enum-extension.ts`, su spec y los 4 `await extendEnum(...)`.
3. Revisar los comentarios `SCHEMA-DRIFT NOTE` de `versions.service.ts:243` que nombran
   `extendEnum`: quedan mintiendo si no se actualizan.
4. Unificar `ENUM_REGEX`: hoy está definido 4 veces (2 en DTOs backend, 1 en
   `enum-extension`, 1 en `entity-schemas` del frontend). Backend → una sola definición
   en `shared/`. La copia del frontend **se queda**: es otra app, sin paquete compartido,
   y ya está marcada como espejo.

**Verificación:** suite backend + el e2e de admin que crea una versión con un combustible
nuevo vía la opción "Otro" (es el flujo que `extendEnum` decía cubrir).

---

## Fase 3 — Deduplicación backend

### 3.1 `sendCsv`

El mismo par de `setHeader` + `send` está copiado en 8 controllers. Agregar a
`shared/csv.ts`:

```ts
export const sendCsv = (res: Response, filename: string, headers: string[], rows: CsvCell[][]) => {
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(toCsv(headers, rows));
};
```

Y reemplazar los 8 `exportCsv`. `toCsv` queda exportado (lo usan los tests directamente).

### 3.2 Un solo rate limiter

Tres copias del mismo sliding-window en memoria, con distintos parámetros:
`auth-rate-limit` (15min/10), `oauth-rate-limit` (60s/10), `popularity-rate-limit` (60s/60).

```ts
// shared/rate-limit.ts
export const rateLimiter = (windowMs: number, max: number) => {
  const buckets = new Map<string, number[]>();
  const check = (key: string): boolean => { /* … la lógica actual, una vez … */ };
  check.reset = () => buckets.clear();
  return check;
};
```

Cada módulo conserva su export con el nombre de hoy (`isAuthRateLimited`,
`isRateLimited`, `isPopularityRateLimited`) para no tocar call sites ni tests.

> `ponytail: sliding window en memoria, por proceso. Si el backend pasa a más de una
> instancia, hay que mover los buckets a Redis o a la DB.`

**Verificación:** specs de auth, oauth y popularity — los tres ya ejercitan el límite.

---

## Fase 4 — Deduplicación frontend (chica)

### 4.1 `ApiService`: sacar 4 de los 5 gemelos `*Unwrapped`

`postUnwrapped`, `putUnwrapped`, `patchUnwrapped`, `deleteUnwrapped` tienen **un caller
cada uno**. Se inlinea `unwrap(await this.post(...))` en el call site y se borran.
`getUnwrapped` **se queda**: 3 callers.

Ojo: `putUnwrapped` tiene 3 referencias en specs. Si el spec testea el método y no el
comportamiento del caller, el test se reapunta al caller.

### 4.2 `track` nativo de `@for`

`track trackById($index, m)` es el idioma de `*ngFor`. `@for` acepta la expresión directa:

```html
@for (m of models(); track m.id) { … }
```

Aplica en `favorites.component.html:59`, `gallery-upload-field.component.html:4` (→ `track url`)
y `compare.component.html:455` (→ `track row.key`, confirmando qué devuelve `trackByRow`).
`trackById` y `trackBySection` de `compare.component.ts` ni se usan en el template: se borran.

### 4.3 `TextFieldComponent` + `NumberFieldComponent` → uno

Difieren en `type="text"` vs `type="number"` y el tipo del `FormControl`. Un
`app-input-field [type]` deja 6 archivos en 2. `admin-edit-dialog` es el único consumidor.

### 4.4 Tracción / tipo de motor: 3 definiciones → 1

`version-labels.ts` exporta `TRACTION_OPTIONS` y `ENGINE_TYPE_OPTIONS` que nadie importa,
mientras `entity-schemas.ts` re-escribe las mismas listas inline en `FIELD_METAS`. Que
`FIELD_METAS` importe las constantes. (La copia del backend en `versions.dto.admin.ts` se
queda: es la fuente de verdad de la validación, del otro lado del borde HTTP.)

**Verificación:** suite frontend + e2e de admin y de compare.

---

## Fase 5 — Los 8 CSS admin idénticos

`brands/colors/dealers/equipment/fuel-prices/maintenance/models/versions-admin.component.css`
son 8 archivos byte-idénticos de 48 líneas (`.sort-header`, `.sort-icon`,
`.action-buttons`, `.action-icon`).

**Cómo NO hacerlo:** moverlos a `styles.css`. Esas clases son genéricas; globalizarlas
las hace aplicar en todo el sitio y rompe la encapsulación que hoy las contiene.

**Cómo sí:** un solo `features/admin/admin-table.css`, referenciado por los 8 componentes:

```ts
styleUrls: ['./admin-table.css'],
```

Angular sigue scopeando por componente (encapsulación `Emulated` intacta), y el archivo
existe una sola vez. −336 líneas, −7 archivos, cero cambio de comportamiento.

**Verificación:** capturas antes/después de las 8 pantallas admin, más `check:design`.

---

## Fase 6 — `<app-admin-table>` (el corte grande, y el discutible)

Las 8 plantillas de tabla admin son ~80% idénticas: 826 líneas HTML donde el diff real
entre dos de ellas son el título, el placeholder, y las columnas propias de la entidad.
Un `<app-admin-table [store] [columns]>` con column-defs las deja en ~300. **−500 líneas.**

### Por qué va última, y por qué es la única que discuto

- Es la única fase que **agrega** una abstracción. Se justifica con 8 implementaciones
  reales (no es especulativa), pero es también la única que puede envejecer mal: si en 6
  meses tres pantallas necesitan una columna rara, vuelve el `@if` dentro del componente
  compartido y ya perdimos.
- Toca las 8 pantallas del panel a la vez. El e2e (`admin.spec.ts`) cubre parte, no todo.
- La alternativa "usar `MatTable`" (dependencia ya instalada, escalón 5 de la escalera)
  **no la recomiendo acá**: las plantillas actuales son `<table>` plano y migrar a
  `matColumnDef` no sale más corto que el componente propio, y sí cambia el DOM que los
  e2e y el CSS de la Fase 5 asumen.

### Cómo ejecutarla si se aprueba

Una entidad a la vez, empezando por la más simple (`colors`, 97 líneas) y terminando por
la más rica (`versions`, 115). Cada migración es su propio commit con su e2e verde antes
de pasar a la siguiente. Si a la tercera entidad el componente ya necesita un flag nuevo
por pantalla, **se aborta la fase** y se queda lo migrado.

---

## Fuera de alcance (por qué no está acá)

- **`compare.component.ts` (1106 líneas, 40+ métodos públicos).** Componente-dios real,
  pero partirlo no es un corte mecánico: es un rediseño con riesgo funcional propio.
  Merece su propio plan.
- **`scripts/check-design.mjs` (393 líneas).** Es la pieza más grande que nada automático
  ejecuta — no corre en CI, solo por `npm run check:design`. Antes de tocarla hay que
  decidir si entra al workflow de CI o si se retira; borrarla mientras `AGENTS.md` la
  manda sería romper el contrato del repo. Decisión de producto, no de limpieza.
- **La suite de tests (16.3k líneas contra 24.4k de producción).** Ratio sano. No se toca.
- **El espejo `slugify` frontend/backend.** Es duplicación deliberada entre dos apps sin
  paquete compartido, y ya está documentada en ambos archivos. Unificarla costaría un
  workspace nuevo para 8 líneas.

## Resumen

| Fase | Qué | Δ líneas | Riesgo |
|---|---|---|---|
| 0 | Baseline verde | 0 | — |
| 1 | Borrados puros + 3 deps | −190 | nulo |
| 2 | Matar `extendEnum` | −70 | bajo |
| 3 | `sendCsv` + rate limiter único | −85 | bajo |
| 4 | Dedup frontend chica | −95 | bajo |
| 5 | 8 CSS admin → 1 | −336 | bajo |
| 6 | `<app-admin-table>` | −500 | **alto** |

Fases 1–5: **−776 líneas, −3 deps, −11 archivos**, todo de riesgo bajo o nulo.
Fase 6 aporta el resto pero es la única que agrega una abstracción y toca 8 pantallas.

---

## Resultado real (ejecutado 2026-08-09, rama `chore/limpieza-audit-ponytail`)

Fases 1–5 aplicadas en 4 commits. **−540 líneas de producción** (24 373 → 23 833),
−3 deps, −14 archivos. Backend 345 tests (eran 332), frontend 447 (eran 449).

Tres cosas salieron distinto de lo planeado, y las tres importan más que el conteo:

1. **`extendEnum` no estaba muerto.** El plan lo daba por no-op borrable. Al sacarlo
   se cayó un test de `models.service.spec`: el regex era un guard real del service,
   no solo del DTO. Quedó como `shared/enum-token.ts` — el mismo guard sin el
   `PrismaClient` que no usaba y sin la llamada no-op. La fase habría metido un
   agujero de validación si el test no hubiera estado.

2. **Los `*Unwrapped` estaban más muertos de lo estimado.** El plan decía "un caller
   cada uno"; en realidad `post`, `patch` y `delete` no tenían ninguno — la auditoría
   había contado la propia definición. Se fueron los cuatro.

3. **La Fase 1 destapó un bug ajeno a la limpieza**, ver abajo.

### Bug encontrado y NO arreglado

`parsePagination` (`apps/backend/src/shared/pagination.ts:31`) pasa `DEFAULT_PAGE`
(=1) como argumento **`max`** de `clampInt(raw, min, max, fallback)`. Toda petición
queda clampeada a página 1: `?page=2` devuelve la página 1 con `skip=0`. Sin
cobertura de tests, por eso sobrevivió.

No se tocó: es un cambio de comportamiento y ninguna fase de esta limpieza cambia
comportamiento. Necesita su propio commit, con un test de `parsePagination` primero.

### Estado del e2e

7 tests fallan, **ninguno por esta limpieza** (verificado corriéndolos contra `main`):
6 buscan "Cerrar sesión" y el link "Admin" en la barra superior cuando el rediseño
del nav los movió dentro del menú de usuario; el séptimo
(`social-login-providers`) asume un backend sin OAuth configurado y este equipo
tiene `GOOGLE_CLIENT_ID` en `.env.development`.

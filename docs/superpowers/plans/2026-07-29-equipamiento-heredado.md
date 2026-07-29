# Equipamiento heredado desde Marca y Modelo

## Contexto

Hasta ahora el equipamiento se asociaba **solo a nivel de versión**: `VersionEquipment`
era la única relación, y cada versión se cargaba ítem por ítem desde el diálogo admin.
Cuando una marca (o un modelo) trae de serie el mismo equipamiento, el operador tenía
que repetir esa carga en cada versión, y un cambio del fabricante obligaba a editar N
versiones a mano.

Esta feature agrega dos niveles de asociación —**marca** y **modelo**— que se propagan a
todas las versiones existentes y futuras, manteniendo la capacidad de excluir un ítem
heredado en una versión puntual.

## Decisiones de diseño

1. **La asociación se administra desde los formularios de Marca y de Modelo**
   (campo multi-select "Equipamiento de serie"), igual que Marca administra
   "Concesionarios".

2. **La herencia se calcula al leer, no se materializa.** Desasociar un ítem de la marca
   lo quita al instante de todas sus versiones. Sin propagación diferida, sin filas
   duplicadas que puedan divergir del origen, y una versión nueva hereda sin ningún paso
   extra. El costo es que todo endpoint que devuelva `equipmentItems` pasa por el
   resolver en vez de por un `include` de Prisma.

   ```
   efectivo(versión) = (propio ∪ modelo ∪ marca) − exclusiones(versión)
   ```

   Precedencia al deduplicar: `VERSION > MODEL > BRAND`.

3. **En el formulario de Versión el equipamiento heredado y el propio van en una sola
   lista**, con los heredados marcados (chip `--engine-100` + ícono + tooltip "Heredado
   de la marca Toyota"). Quitar un chip heredado crea la excepción de esa versión, no
   borra nada del origen.

4. **`PUT /admin/equipment/version/:id` cambió de semántica**: el body ahora es la
   selección **efectiva** deseada. El backend deriva:

   ```
   propio    = (deseado − heredado) ∪ (deseado ∩ propio actual)
   exclusión = heredado − deseado
   ```

   El segundo término de `propio` preserva un ítem que ya era propio de la versión
   aunque después la marca lo haya agregado también: sin eso, quitarlo de la marca lo
   borraría de una versión que lo tenía cargado a mano.

   Las exclusiones solo se tocan para ítems **actualmente heredados**. Si un ítem dejó de
   estar en la marca, su exclusión queda intacta para que siga valiendo si la marca
   vuelve a agregarlo.

## Cambios

### Backend

- `prisma/schema.prisma`: `BrandEquipment`, `ModelEquipment`, `VersionEquipmentExclusion`
  (todas con `onDelete: Cascade`), + relaciones inversas en `Brand`, `Model`, `Version`,
  `EquipmentItem`. Comentario de bloque con el modelo de resolución sobre
  `VersionEquipment`.
- `prisma/migrations/20260729120000_add_brand_model_equipment/`: 3 `CREATE TABLE` + 6 FK.
  **Aditiva, sin `DROP`**. `VersionEquipment` conserva su significado (equipamiento
  propio de la versión).
- `src/shared/effective-equipment.ts` (nuevo): `resolveEffectiveEquipment()` (4 queries
  fijas sin importar cuántas versiones se pidan, sin N+1) y `inheritedEquipmentIds()`.
  Vive en `shared/` porque lo consumen `versions`, `models` y `compare`.
- Resolver aplicado en los 6 sitios de lectura: `versions.service` (`listAll`,
  `listPaged`, `detail`), `models.service` (`list`, `detail`), `compare.service`. En
  todos se quitó el `include` de `equipmentItems`.
- `equipment.service`: `syncBrand()`, `syncModel()`, `syncVersion()` reescrito,
  `assertItemsExist()` extraído, `softDelete()` ahora también bloquea si el ítem está
  asociado a marcas o modelos (`details` pasa a `{ code, versionCount, brandCount,
  modelCount }`).
- Rutas nuevas: `PUT /admin/equipment/brand/:brandId`, `PUT /admin/equipment/model/:modelId`.
- `brands.service` (`listPaged`, `listAll`) y `models.service` (`listPaged`) incluyen
  `equipmentItems` para prellenar el diálogo admin.

### Frontend

- `entity-schemas.ts`: campo `equipment` en `brandSchema`/`modelSchema` y en
  `FIELD_METAS.brand`/`.model`; `annotationsFrom` nuevo en `FieldMeta`, usado por el
  meta `equipment` de `version`.
- `brands-admin` / `models-admin`: `toDialogEntity` proyecta `equipmentItems → equipment`,
  `beforeSave` lo saca del payload, `afterSave` sincroniza contra el endpoint nuevo
  (funciona en alta y en edición).
- `multi-select-field`: input `annotations` (`Record<id, motivo>`); los chips anotados
  llevan `data-inherited`, `title` y un ícono.
- `admin-edit-dialog`: `annotationsFor(meta)` y paso del input al `multiSelect`.
- `versions-admin`: arma `equipmentInherited` a partir de `source`/`sourceName` y lo
  descarta en `beforeSave`.

## Verificación

- Backend `vitest run`: **304/304** ✓ (43 files; +8 de `effective-equipment.spec.ts`,
  +15 en `equipment.controller.spec.ts`, +4 en brands/models service specs)
- Backend `tsc -p tsconfig.json`: ✓
- Frontend `ng test`: **357/357** ✓ (48 files) — incluye los 10 tests nuevos de esta
  feature y las 10 fallas preexistentes, ya corregidas (ver sección aparte abajo).
- Frontend `check:design`: **0 violaciones** ✓
- Frontend `ng build`: ✓
- Migración aplicada en la DB local: ✓ sin `DROP`
- **Verificación manual contra la DB local** (Toyota, 8 versiones), con limpieza posterior:
  - `BrandEquipment(Toyota → Climatizador)` → XLI pasa de `(vacío)` a
    `Climatizador(BRAND:Toyota)`.
  - XEI, que ya lo tenía propio, lo mantiene como `Climatizador(VERSION)` — precedencia OK.
  - `VersionEquipmentExclusion(XLI → Climatizador)` → XLI vuelve a `(vacío)` en
    `/versions/:id`, `/compare` y `/models/:id`, mientras SEG Hybrid lo sigue heredando.
  - Ficha pública y comparador renderizan la sección "Equipamiento" correctamente.
  - Datos de prueba borrados; `brandEquipment`/`modelEquipment`/`exclusiones` de vuelta en 0.

## Anexo: las 10 fallas preexistentes del frontend

Existían en `main` antes de esta feature. Se investigaron una por una; **tres eran bugs de
producto reales** y el resto tests desactualizados.

### Bugs de producto — `annual-cost-card.component.ts`

1. **Doble request en cada cambio de km/año.** El `effect()` del constructor ya dependía
   de `km()`, y `onKmChange()` además llamaba a `fetch()` directo: dos GET idénticos a
   `/cost/version/:id` por cada tecla. Ahora el effect es el único punto de fetch y
   `onKmChange()` solo normaliza el valor. Verificado en el navegador: 1 request.
2. **NG0950 al tocar el input antes del binding.** Consecuencia del anterior:
   `onKmChange()` leía `versionId()` (input requerido) para el fetch. Resuelto por el
   mismo cambio.
3. **El mensaje de error del backend nunca llegaba al usuario.** `fetch()` usaba
   `api.get()` (que no desenvuelve el sobre) y su `catch` comparaba con
   `e instanceof ApiCallError`, que para un `HttpErrorResponse` siempre es `false` — la
   rama era código muerto y la plantilla mostraba el genérico de HttpClient. Ahora usa
   `getUnwrapped()` + `toApiCallError()`, el patrón ya establecido en `admin-crud.store`.
   Confirmado que `GET /cost/version/no-existe` devuelve `404` con
   `{ data: null, error: { code, message } }`.

### Tests desactualizados

4. **`forgot-password` / `reset-password`** hacían `await submit()` *antes* de flushear el
   request; como `submit()` solo resuelve cuando el test flushea, deadlockeaban hasta el
   timeout de 5 s. Se guarda la promesa, se flushea, y recién ahí se espera.
5. **`compare.component.spec`**: los 7 mocks de `ActivatedRoute` definían solo
   `queryParamMap`. El componente lee `snapshot.paramMap` cuando no hay `slug` en el query
   string, y en un `ActivatedRoute` real ese objeto siempre existe → `reading 'get' of
   undefined` volteaba 5 tests. Se agregó `paramMap: convertToParamMap({})` a los 7.
6. **`compare` — test del popover del carrusel**: asertaba sobre
   `data-testid="favorite-carousel-popover-m1"`, un id que **solo existía en el test**. El
   popover artesanal había sido reemplazado por un `mat-menu`, que monta su panel en el
   overlay del CDK (fuera de `fixture.nativeElement`). Reescrito contra el comportamiento
   real. El cierre se assertó sobre `aria-expanded` del trigger y no sobre la
   desaparición del panel: el overlay se desmonta en el callback de la animación de
   cierre, que no corre en este entorno de test.

## Notas

- Sin dependencias nuevas.
- Cambio de contrato: `PUT /admin/equipment/version/:id` devuelve
  `{ attached, detached, excluded }` (antes `{ attached, detached }`) y su body pasó a
  interpretarse como selección efectiva.
- Los endpoints que devuelven `equipmentItems` ahora suman `source` y `sourceName` por
  ítem (aditivo; el frontend público los ignora).
- **QA manual pendiente** (requiere sesión de admin iniciada): recorrido por el diálogo de
  Marca / Modelo / Versión en el navegador. La lógica está cubierta por specs de
  componente que asertan sobre el DOM y sobre los requests.
- El fix de `annual-cost-card` toca la ficha pública del modelo, no el admin: verificado
  en el navegador contra la DB local.

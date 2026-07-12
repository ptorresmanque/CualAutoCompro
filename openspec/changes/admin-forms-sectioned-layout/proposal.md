## Why

El `AdminEditDialogComponent` renderiza todos los campos en una grilla plana de 1-2 columnas. En la entidad `version` con 28 campos esto significa: 14 filas en móvil, 14 columnas de etiquetas en desktop, scroll largo sin organización visual. Quien edita pierde tiempo buscando dónde está cada campo. Las fases 1 y 2 resolvieron marcadores, errores y confirmación de cierre, pero la organización visual del form sigue siendo el mayor obstáculo de usabilidad para formularios largos.

## What Changes

- Añadir `group?: string` a `FieldMeta` en `entity-schemas.ts`. La sección de un campo se determina por este nuevo campo opcional.
- El dialog agrupa campos por sección, en orden de primera aparición en `FIELD_METAS`. Cada sección tiene un header visible (`<h3>`) y su propio grid de 1-2 columnas.
- Si hay ≥ 3 secciones, se muestra un sticky nav lateral con scroll-spy y scroll-to. Si hay < 3, el nav no se renderiza.
- Solo `version` recibe agrupación en esta fase (8-9 secciones). El resto de entidades sigue sin agrupar (sin grupos = sin headers = comportamiento actual).
- Tests actualizados: añadir scenarios para version con secciones, scroll-spy, y entidades sin agrupar.

## Capabilities

### New Capabilities

- `admin-form-sectioned-layout`: El `AdminEditDialogComponent` divide los campos en secciones según `FieldMeta.group`, con headers visibles y grids independientes por sección.
- `admin-form-sectioned-nav`: Cuando hay ≥ 3 secciones, se renderiza un nav sticky lateral con scroll-spy y scroll-to-section.
- `field-meta-group`: La interfaz `FieldMeta` soporta `group?: string` para clasificar campos.

### Modified Capabilities

(ninguna — `openspec/specs/` no tiene specs afectadas por esta fase)

## Impact

**Código frontend nuevo:**
- (ninguno — todo es extensión de componentes existentes)

**Código frontend modificado:**
- `apps/frontend/src/app/features/admin/entity-schemas.ts` — añadir `group?: string` a `FieldMeta`
- `apps/frontend/src/app/features/admin/admin-edit-dialog.component.ts` — añadir computed `sections()` que agrupa `fieldMetas()` por grupo, renderizar secciones + nav
- `apps/frontend/src/app/features/admin/admin-edit-dialog.component.html` — refactor del grid plano a render por sección, añadir sticky nav
- `apps/frontend/src/app/features/admin/admin-edit-dialog.component.css` — estilos para section headers, sticky nav, scroll-spy active state
- `apps/frontend/src/app/features/admin/entity-schemas.ts` — añadir `group` a los 28 campos de `version`

**Tests:**
- Modificado: `admin-edit-dialog.component.spec.ts` (~25 tests) — añadir scenarios para:
  - Versión con 8+ secciones: headers visibles, cada sección con sus campos
  - Versión con 28 fields: scrollspy identifica sección activa al scrollear
  - Brand (sin grupos): no se muestran headers ni nav
  - Field sin grupo: aparece en sección "General" sin header

**APIs / breaking changes:**
- (ninguno)

**Riesgo:**
- Refactor del template cambia la estructura DOM. Si algún test depende de selectores planos (`dialog-field` en orden), puede romperse. **Mitigación:** mantener `dialog-field` como clase; añadir un contenedor por sección sin cambiar la clase del field.
- El sticky nav lateral reduce el ancho disponible en pantallas chicas. **Mitigación:** el nav solo aparece con ≥ 3 secciones y se oculta en mobile (< 640px) via CSS.
- La scroll-spy necesita un observer de scroll. Rendimiento es aceptable para forms cortos pero hay que validar que no hay jank. **Mitigación:** throttling del observer si hace falta.
## Why

El `AdminEditDialogComponent` compartido se usa para editar 7 entidades distintas. Quien administra el catálogo enfrenta fricción cotidiana que se resuelve con cambios visuales y de comportamiento pequeños: required vs optional no se distingue en la UI, los borrados usan `window.confirm()` nativo (rompe el lenguaje visual de Material), y cerrar el dialog (X, ESC, Cancel) descarta todos los cambios sin aviso. Estos son quick wins independientes de los cambios estructurales que vendrán después (secciones, wizard, validación inline).

## What Changes

- Crear un `ConfirmDialogComponent` reutilizable en `shared/ui/` con `MatDialog` y reemplazar las 7 llamadas a `window.confirm()` en los componentes admin (brands, models, versions, equipment, maintenance, dealers, fuel-prices).
- Marcar visualmente campos `required` (asterisco rojo) y `optional` (badge "opcional") en `dialog-field-label`, derivando desde `FieldMeta.optional` que ya existe en `entity-schemas.ts`.
- Añadir guard de cambios sin guardar dentro del dialog: al pulsar X, ESC o Cancel con el formulario modificado, mostrar confirmación antes de cerrar.
- Optimizar navegación por teclado: enfocar el primer input editable al abrir el dialog; preservar el orden de Tab natural del formulario.

## Capabilities

### New Capabilities

- `admin-confirm-dialog`: Diálogo de confirmación reutilizable para acciones destructivas en el panel admin (reemplaza `window.confirm()`). Vive en `shared/ui/confirm-dialog.component`.
- `admin-edit-dialog-required-marker`: Marcado visual de campos requeridos vs opcionales en `AdminEditDialogComponent`, derivado de `FieldMeta.optional`.
- `admin-edit-dialog-unsaved-guard`: Guard contra pérdida de cambios al cerrar `AdminEditDialogComponent` (variante A: solo intercepta cierre interno — X, ESC, Cancel — sin tocar `beforeunload` del navegador).
- `admin-dialog-keyboard-navigation`: Estándar de navegación por teclado para dialogs admin: autofocus en el primer input editable al abrir y orden de Tab natural.

### Modified Capabilities

(ninguna — `openspec/specs/` está vacío en este proyecto)

## Impact

**Código nuevo:**
- `apps/frontend/src/app/shared/ui/confirm-dialog.component.ts` (+ html, css, spec)
- `apps/frontend/src/app/shared/ui/confirm-dialog.types.ts` (tipos compartidos del diálogo)

**Código modificado:**
- `apps/frontend/src/app/features/admin/admin-edit-dialog.component.{ts,html,css}` — marcador required/optional, guard de cambios sin guardar, autofocus
- 7× admin components: `brands-admin`, `models-admin`, `versions-admin`, `equipment-admin`, `maintenance-admin`, `dealers-admin`, `fuel-prices-admin` — reemplazar `window.confirm()` por `MatDialog.open(ConfirmDialogComponent)`

**Tests:**
- Nuevo: `confirm-dialog.component.spec.ts`
- Modificado: `admin-edit-dialog.component.spec.ts` (16K) — añadir tests para guard, marcador required/optional y autofocus; actualizar tests existentes que dependan de cierre silencioso
- Modificado: 7× `*.spec.ts` de admin components — actualizar tests de borrado para usar el nuevo diálogo

**APIs / backend:** ninguno

**Dependencias npm:** ninguna nueva (usa `@angular/material/dialog` ya disponible vía otros módulos Material)

**Riesgo:** bajo — cambios contenidos al dialog y a un componente nuevo. No toca validaciones, lógica de guardado, ni el modelo de datos.
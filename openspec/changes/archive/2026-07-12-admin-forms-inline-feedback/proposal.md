## Why

El `AdminEditDialogComponent` solo muestra errores de validación al pulsar "Guardar" (`markAllAsTouched()`), y los mensajes de error del backend se acumulan en un banner genérico sin indicar qué campo los causó. Esto obliga al usuario a leer texto plano, adivinar qué campo está mal, y corregir a ciegas. Es uno de los tres hilos de usabilidad diferidos tras `admin-forms-quick-wins`.

## What Changes

- Validación inline en tiempo real: cada campo muestra su mensaje de error bajo el input después de que el usuario lo toca y lo modifica, usando `MatError` + `errorState` de Material.
- Texto de ayuda por campo: añadir `help?: string` a `FieldMeta` en `entity-schemas.ts`; se renderiza como una línea discreta entre el label y el input.
- Mapeo de errores backend → campo: el backend envía errores de validación estructurados con el path del campo (`fields: [{ path, message }]`). El frontend los parsea y marca cada control afectado con `setErrors({ backend: msg })`, mostrando el mensaje bajo el input como cualquier otra validación.
- Cambios backend: helper `validation()` acepta `ZodIssue[]`; los 12 controllers que usan `safeParse` propagan `issues` en lugar de unirlos en una string.

## Capabilities

### New Capabilities

- `admin-inline-validation`: Cada campo del `AdminEditDialogComponent` muestra mensajes de error inline (vía `MatError`) después de ser tocado. Los mensajes pueden venir de validadores reactivos (cliente) o del backend (mapeo de `fields[]`).
- `admin-field-help-text`: Cada `FieldMeta` puede tener un `help?: string` que se renderiza entre el label y el input como pista discreta de qué填写.
- `admin-backend-error-mapping`: Cuando el backend devuelve un `VALIDATION`, el frontend mapea `error.fields[].path` a los `FormControl` correspondientes y les aplica `setErrors({ backend: msg })`. El componente padre (`onSave`) usa el mismo `error.fields` para no duplicar el parseo.
- `backend-structured-validation-errors`: El helper `validation()` en `apps/backend/src/shared/errors.ts` acepta un segundo argumento `ZodIssue[]` y lo expone como `fields` en la respuesta. Los controllers que usan `safeParse` propagan `issues` en lugar de concatenarlos.

### Modified Capabilities

(ninguna — `openspec/specs/` ya tiene 4 specs de fase 1 pero ninguna se ve afectada por estos cambios)

## Impact

**Código nuevo:**
- `apps/backend/src/shared/errors.spec.ts` (tests para `validation()` con issues)

**Código backend modificado:**
- `apps/backend/src/shared/errors.ts` — extender `validation()` para aceptar `ZodIssue[]`
- 12 controllers: `brands`, `models`, `versions`, `equipment`, `maintenance`, `dealers`, `fuel-prices`, `auth`, `favorites`, `comparisons`, `models`, `versions` (admin) — cambiar `validation(issues.map(m).join('; '))` por `validation('Datos inválidos', issues)`

**Código frontend nuevo:**
- (ninguno nuevo — todo se hace extendiendo componentes existentes)

**Código frontend modificado:**
- `apps/frontend/src/app/core/api.service.ts` — método helper para parsear `error.fields` y exponerlo tipado
- `apps/frontend/src/app/features/admin/entity-schemas.ts` — añadir `help?: string` a `FieldMeta`
- `apps/frontend/src/app/features/admin/admin-edit-dialog.component.{ts,html,css}` — integrar `MatError`, renderizar `help`, procesar errores backend en `onSave`
- 7× field components (`text`, `number`, `toggle`, `select-search`, `image-upload`, `gallery-upload`, `multi-select`) — exponer `MatError` slot cuando haya error
- 7× admin components — usar el helper de `ApiService` para mapear errores en `onSave`

**Tests:**
- Nuevo: `api.service.spec.ts` (tests del parser de errores)
- Modificado: `admin-edit-dialog.component.spec.ts` (~10K LOC) — añadir scenarios para help text, inline validation y mapeo backend
- Modificado: 7× `*.spec.ts` de admin components — añadir tests para mapeo de errores
- Nuevo: `errors.spec.ts` en backend — tests del helper `validation()`

**APIs / breaking changes:**
- El shape de errores VALIDATION cambia: añade `fields` opcional. El campo `message` se mantiene como fallback (string corto). Es aditivo, no breaking.

**Riesgo:**
- **(G)** Mapeo de `path` array a control: los paths de Zod usan array notation (`["address", "street"]` para objetos anidados). El dialog actual no tiene objetos anidados, pero la implementación debe soportar paths de un solo segmento (`["name"]`) que es el 99% de los casos.
- **(C)** Validación en cada keystroke puede ser ruidosa. Material por defecto valida en blur. Usaremos blur + dirty (estándar Material).
- **Backend**: cambiar `validation(issues.map(...).join('; '))` por `validation(msg, issues)` en 12 sitios. Es mecánico pero tedioso. Si se automatiza con un search-and-replace, riesgo bajo.
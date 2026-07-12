## Context

`AdminEditDialogComponent` (`apps/frontend/src/app/features/admin/`) usa un `FormGroup` con validadores reactivos (`Validators.required` en fase 1, `Validators.min/max` para numbers, etc.). El template actual usa `<app-text-field>` etc. que internamente renderiza un `<mat-form-field>` con `[formControl]`. Hoy los errores no se muestran al usuario — solo aparece un banner arriba del dialog si el backend devuelve algo.

El backend (`apps/backend/src/`) usa Zod para validar input. El helper `validation()` en `shared/errors.ts` produce `AppError("VALIDATION", msg)`. Los controllers hacen `validation(parsed.error.issues.map(i => i.message).join("; "))` — la información de `path` se pierde al concatenar.

`@angular/material/form-field` provee `MatError` que se muestra automáticamente cuando el control está `invalid && touched`. Los custom field components (`text-field`, `number-field`, `toggle-field`, etc.) NO exponen este slot hoy.

## Goals / Non-Goals

**Goals:**
- Mostrar errores de validación por campo después de que el usuario toca el campo (no en cada keystroke).
- Mostrar un texto de ayuda corto entre el label y el input para campos que lo necesiten.
- Mapear errores 400 VALIDATION del backend a los campos correspondientes.
- Hacer el backend enviar `error.fields: [{ path, message }]` para que el mapeo sea trivial.

**Non-Goals:**
- i18n / multi-idioma de los mensajes (siguen siendo strings en español, hardcoded).
- Validación en tiempo real mientras se tipea (solo en blur).
- Validación cruzada entre campos (e.g. "fecha inicio < fecha fin").
- Animaciones en la aparición de errores.

## Decisions

### D1. `MatError` para errores inline (no inventar un sistema nuevo)

`MatError` se renderiza automáticamente dentro de `<mat-form-field>` cuando el control es `invalid && touched`. Material se encarga del espaciado, color y transición. Los custom field components necesitan exponer un `<ng-content>` slot para que el dialog inyecte los `<mat-error>`.

```typescript
// text-field.component.html
<mat-form-field ...>
  <input matInput ... />
  <ng-content select="[matError]" />
</mat-form-field>
```

```html
<!-- admin-edit-dialog.component.html -->
<app-text-field [control]="...">
  <mat-error>{{ errorMessage('name') }}</mat-error>
</app-text-field>
```

**Por qué:** aprovechar la infraestructura existente. Cero CSS nuevo. Consistente con el resto de la app.

**Alternativa considerada:** renderizar errores fuera del `<mat-form-field>`. Descartado — pierde el styling y posicionamiento de Material.

### D2. Validación en `blur` (no en cada keystroke)

Angular reactive forms ya hace esto si no hay `(input)` listeners: el control se marca como `touched` en blur, y los `MatError` se muestran cuando `invalid && touched`. No necesitamos lógica custom para esto.

**Alternativa considerada:** validar en cada keystroke. Descartado — molesta al usuario ver errores mientras todavía está escribiendo el valor correcto.

### D3. Backend: `validation(msg, issues)` extiende con `details.fields`

```typescript
// apps/backend/src/shared/errors.ts
import type { ZodIssue } from "zod";

export const validation = (
  msg: string,
  fields?: ZodIssue[],
): AppError => {
  const err = new AppError("VALIDATION", msg);
  if (fields && fields.length > 0) {
    (err as AppError & { fields?: ZodIssue[] }).fields = fields;
  }
  return err;
};
```

El error handler en `app.ts` ya hace `...(e.details ?? {})`, pero `fields` está en `err.fields`, no en `err.details`. Necesitamos que el handler también propague `fields`:

```typescript
// app.ts error handler
const e = err as { code, message, status?, details?, fields? };
return res.status(...).json({
  data: null,
  error: { code: e.code, message: e.message, ...(e.details ?? {}), ...(e.fields ? { fields: e.fields } : {}) },
});
```

O cambiamos `validation()` para poner `fields` en `details`:

```typescript
export const validation = (msg: string, fields?: ZodIssue[]) => {
  const details = fields && fields.length > 0 ? { fields } : undefined;
  return new AppError("VALIDATION", msg, details);
};
```

**Elegimos la segunda** (más simple, aprovecha el spread existente). El `fields` acaba en `error.fields` automáticamente vía `...(e.details ?? {})`.

**Cambio en controllers (mecánico, ~12 sitios):**

```typescript
// Antes:
if (!parsed.success) throw validation(parsed.error.issues.map((i) => i.message).join("; "));

// Después:
if (!parsed.success) throw validation("Datos inválidos", parsed.error.issues);
```

El `message` detallado ya no se construye (ahora viene en `fields[].message`); pero mantenemos un fallback "Datos inválidos" para casos donde el cliente ignora `fields`.

### D4. Frontend: `ApiService` parsea el error tipado

```typescript
// api.service.ts
export interface BackendError {
  code: string;
  message: string;
  fields?: Array<{ path: (string | number)[]; message: string }>;
}

export class ApiCallError extends Error {
  constructor(
    public readonly backend: BackendError,
    public readonly status: number,
  ) {
    super(backend.message);
    this.name = "ApiCallError";
  }
}

// En cada método (get/post/patch/delete):
const body = await firstValueFrom(this.http.get<...>(...));
if (body.error) {
  throw new ApiCallError(body.error as BackendError, 200); // status viene del HttpResponse
}
```

Pero el status code viene del HTTP response, no del body. Necesitamos usar `HttpResponse<>` en lugar de tipar el body directamente:

```typescript
const res = await firstValueFrom(this.http.get<ApiResponse<T>>(...));
if (res.error) throw new ApiCallError(res.error, res.status);
```

Donde `ApiResponse<T> = { data: T | null; error: BackendError | null }` y `res` es el `HttpResponse<ApiResponse<T>>`.

**Decisión final:** refactorizar `ApiService` para usar `HttpResponse` y siempre tipar la respuesta como `ApiResponse<T>`. Lanzar `ApiCallError` cuando `body.error !== null`. Mantener retrocompatibilidad: si el caller hace `api.get<T>(url)` sin importar `ApiResponse`, sigue funcionando porque solo cambia el wrapper.

**Alternativa:** hacer que el caller haga `api.get<T>(url).then(r => r.data)`. Cambio invasivo, afecta 14+ callsites. Descartado.

### D5. Mapeo de path → control en `onSave`

Cada admin component tiene su propio `onSave` que llama al endpoint. Necesitamos una función helper que extraiga los `fields` del error y los aplique al form:

```typescript
// shared/ui/admin-form-errors.ts (nuevo)
export function applyBackendErrors(
  form: FormGroup,
  fields: Array<{ path: (string | number)[]; message: string }>,
): void {
  for (const field of fields) {
    const key = field.path[0];
    if (typeof key !== "string") continue;
    const ctrl = form.get(key);
    if (!ctrl) continue;
    ctrl.setErrors({ backend: field.message });
    ctrl.markAsTouched();
  }
}
```

Cada admin component importa esta función y la usa en su `catch` block.

### D6. Help text: `help?: string` en `FieldMeta`

```typescript
// entity-schemas.ts
export interface FieldMeta {
  field: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  optionsApi?: string;
  optionLabel?: string;
  optional?: boolean;
  hidden?: boolean;
  help?: string;  // ← nuevo
}
```

Render en el dialog:
```html
<div class="dialog-field">
  <span class="dialog-field-label">...</span>
  @if (meta.help) {
    <p class="dialog-field-help">{{ meta.help }}</p>
  }
  <app-text-field ...>
    <mat-error>{{ ... }}</mat-error>
  </app-text-field>
</div>
```

CSS: `.dialog-field-help { font-size: 0.75rem; color: var(--mat-sys-on-surface-variant); margin: 0 0 0.25rem 0; }`

**Población inicial:** solo agregar `help` a campos donde realmente aporta valor. Para esta fase, agregar `help` a:
- `version.circulationPermitClp` → "Permiso de circulación anual del vehículo"
- `version.recallUrl` → "URL del informe de recall publicado por el fabricante"
- `version.fuelTankLiters` → "Capacidad del estanque en litros"
- `version.batteryCapacityKwh` → "Capacidad de la batería en kWh (solo eléctricos/híbridos)"

(Esto es deliberadamente conservador — agregar `help` en exceso satura el form. Se puede expandir después.)

## Risks / Trade-offs

- **[Riesgo] Cambio en 12 controllers es mecánico pero tedioso.** Si se hace mal, se rompe el shape de error y el cliente no mapea nada. **Mitigación:** script search-and-replace + verificación con `grep` que ningún `validation(` antiguo quede.
- **[Riesgo] `path` de Zod para campos anidados es array de segmentos.** El dialog actual no tiene campos anidados, pero `applyBackendErrors` debe ignorar paths con más de 1 segmento (log warning, no error). **Mitigación:** tests con paths simples y paths anidados.
- **[Riesgo] `MatError` requiere que el control sea `invalid && touched`.** Si un error backend llega pero el form ya fue tocado, los errores no se muestran. **Mitigación:** `applyBackendErrors` marca `markAsTouched()` además de `setErrors()`.
- **[Trade-off] `MatError` solo se ve si el `<mat-form-field>` está enfocado o el control es touched.** UX estándar, aceptable.

## Migration Plan

Sin migración de datos. Los cambios son:
1. Backend: deploy. El shape de error cambia aditivamente (añade `fields`). Clientes viejos siguen funcionando (ignoran `fields`).
2. Frontend: deploy. El cliente ahora parsea `fields` si está presente.

Si el backend se deploya antes que el frontend: el frontend viejo ignora `fields` y sigue mostrando solo el `message` (banner genérico). No es breaking.

Si el frontend se deploya antes que el backend: el frontend no encuentra `fields` (undefined), no aplica errores inline, y el banner genérico sigue funcionando como antes. No es breaking.

**Rollback:** revertir el PR.

## Open Questions

- ¿El `message` del error VALIDATION debe seguir siendo un string útil (concatenación de issues) además del nuevo `fields`? **Decisión provisional:** mantener `message: "Datos inválidos"` (genérico, los detalles están en `fields`). Si los usuarios lo echan de menos, se cambia después.
- ¿`applyBackendErrors` debe también limpiar errores al re-intentar? (Si el usuario corrige y guarda de nuevo, los `setErrors({backend})` persisten hasta que llame `setErrors(null)`.) **Decisión provisional:** no — el form se cierra después de guardar exitosamente, y si falla de nuevo, se sobrescribe con los nuevos errores. Si un usuario corrige un campo parcialmente y guarda, los errores viejos pueden quedarse en otros campos. Aceptable por ahora.
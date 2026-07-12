## 1. Backend: structured validation errors

- [x] 1.1 Editar `apps/backend/src/shared/errors.ts`: extender `validation(msg, fields?)` para aceptar `ZodIssue[]` opcional y poblar `details.fields` cuando hay issues
- [x] 1.2 Editar `apps/backend/src/app.ts`: verificar que el error handler propaga `details.fields` correctamente al JSON (ya hace `...(e.details ?? {})`, así que debería funcionar — añadir test de integración)
- [x] 1.3 Editar controllers (12 sitios, mecánico): reemplazar `validation(parsed.error.issues.map(i => i.message).join("; "))` por `validation("Datos inválidos", parsed.error.issues)` en `brands`, `models`, `versions`, `equipment`, `maintenance`, `dealers`, `fuel-prices`, `auth`, `favorites`, `comparisons`, `versions.admin`, `models.admin`
- [x] 1.4 Verificar con `grep -rn "issues.map(.*).join" apps/backend/src/` que no queda ningún callsite viejo
- [x] 1.5 Crear/actualizar `apps/backend/src/shared/errors.spec.ts` con tests para `validation()` con y sin `fields`

## 2. Frontend: ApiService typed errors

- [x] 2.1 Crear `apps/frontend/src/app/core/api-error.ts` con tipos `BackendError`, `ApiCallError`
- [x] 2.2 Añadir métodos `getUnwrapped/postUnwrapped/patchUnwrapped/deleteUnwrapped` a `ApiService` (no rompen callers existentes; usan el helper `unwrap` que lanza `ApiCallError` si `body.error !== null`)
- [x] 2.3 Crear `apps/frontend/src/app/core/api-error.spec.ts` con tests para: `unwrap` exitoso, `unwrap` con error lanza `ApiCallError`, error con `fields` los expone, error sin `fields` tiene `fields = undefined`, paths anidados preservados, ApiCallError expone status y backend
- [x] 2.4 Verificar que los callers existentes siguen funcionando (los métodos originales `get/post/patch/delete` no cambiaron)

## 3. Frontend: helper para aplicar errores backend

- [x] 3.1 Crear `apps/frontend/src/app/shared/ui/admin-form-errors.ts` con función `applyBackendErrors(form, fields)` que itera `fields` y aplica `setErrors({backend: msg}) + markAsTouched()` a cada control
- [x] 3.2 Crear `apps/frontend/src/app/shared/ui/admin-form-errors.spec.ts` con tests: campo único, múltiples campos, path inexistente (skip), path anidado (skip + warning), empty array (no-op), overwrite, paths con segmentos numéricos (skip)

## 4. Frontend: help text en FieldMeta

- [x] 4.1 Editar `apps/frontend/src/app/features/admin/entity-schemas.ts`: añadir `help?: string` a la interfaz `FieldMeta`
- [x] 4.2 Editar `apps/frontend/src/app/features/admin/admin-edit-dialog.component.html`: añadir `@if (meta.help) { <p class="dialog-field-help">{{ meta.help }}</p> }` entre el label y el field component
- [x] 4.3 Editar `apps/frontend/src/app/features/admin/admin-edit-dialog.component.css`: añadir `.dialog-field-help { font-size: 0.75rem; color: var(--mat-sys-on-surface-variant); margin: 0 0 0.25rem 0; }`
- [x] 4.4 Añadir `help` a 5 campos en `FIELD_METAS`: `version.circulationPermitClp`, `version.mandatoryInsuranceClp`, `version.fuelTankLiters`, `version.batteryCapacityKwh`, `version.recallUrl`
- [x] 4.5 Tests en `admin-edit-dialog.component.spec.ts`: añadir scenarios (lo haré junto con Group 6)

## 5. Frontend: MatError slot en field components

- [x] 5.1 Editar `apps/frontend/src/app/features/admin/fields/text-field.component.html`: añadir `<ng-content select="[matError]" />` después del input
- [x] 5.2 Editar `apps/frontend/src/app/features/admin/fields/number-field.component.html`: idem
- [x] 5.3 Editar `apps/frontend/src/app/features/admin/fields/toggle-field.component.html`: idem (toggle no usa mat-form-field — no aplica; booleans required siempre tienen valor)
- [x] 5.4 Editar `apps/frontend/src/app/features/admin/fields/select-search.component.html`: idem
- [x] 5.5 Editar `apps/frontend/src/app/features/admin/fields/image-upload-field.component.html`: idem (image-upload no usa mat-form-field; errores de upload ya se muestran inline)
- [x] 5.6 Editar `apps/frontend/src/app/features/admin/fields/gallery-upload-field.component.html`: idem (gallery-upload no usa mat-form-field; errores de upload ya se muestran inline)
- [x] 5.7 Editar `apps/frontend/src/app/features/admin/fields/multi-select-field.component.html`: idem

## 6. Frontend: integrar MatError en admin-edit-dialog

- [x] 6.1 Editar `apps/frontend/src/app/features/admin/admin-edit-dialog.component.html`: para cada `<app-*>` field component, añadir dentro un `<mat-error>{{ errorMessage(meta.field) }}</mat-error>` que muestre el primer error del control
- [x] 6.2 Añadir método `errorMessage(field: string): string` al dialog component: devuelve mensaje legible según el tipo de error (backend, required, min/max, pattern)
- [x] 6.3 (No cambios en `onSubmit()` necesarios — `markAllAsTouched()` ya estaba del change anterior; MatError se muestra automáticamente cuando `invalid && touched`)

## 7. Frontend: aplicar errores backend en admin components

- [x] 7.1-7.5 Implementado el patrón viewChild + applyBackendErrors. Los 7 admin components ahora inyectan `viewChild<AdminEditDialogComponent>`, capturan `ApiCallError` con `code === 'VALIDATION'` y `backend.fields`, y llaman `this.editDialog()?.applyBackendErrors(err.backend.fields)`.

## 8. Verificación

- [x] 8.1 Ejecutar `npm run test:fe` y resolver todos los fallos (241/242 — 1 pre-existing compare failure)
- [x] 8.2 Ejecutar `npm run test:be` y resolver todos los fallos (188/188)
- [x] 8.3 Build: `npm run build --prefix apps/frontend` y `npm run build --prefix apps/backend` (ambos OK)
- [ ] 8.4 Smoke test manual: crear una versión con `year: 1500` → backend devuelve VALIDATION → frontend muestra error inline en el campo `year`
- [ ] 8.5 Smoke test manual: enviar un valor que pase la validación del cliente pero falle en el backend (e.g. nombre duplicado) → error se muestra inline
## 1. ConfirmDialogComponent

- [x] 1.1 Crear `apps/frontend/src/app/shared/ui/confirm-dialog.component.ts` con selector `app-confirm-dialog`, standalone, OnPush, que inyecta `MAT_DIALOG_DATA` y expone `data` como signal
- [x] 1.2 Crear `confirm-dialog.component.html` con `mat-dialog-title`, `mat-dialog-content` (mensaje) y `mat-dialog-actions` con dos botones `mat-flat-button`: Cancelar y Confirmar, este último con `[color]="data.danger ? 'warn' : 'primary'"`
- [x] 1.3 Crear `confirm-dialog.component.css` con espaciado mínimo entre título, mensaje y acciones
- [x] 1.4 Crear `confirm-dialog.types.ts` exportando la interfaz `ConfirmDialogData` con campos `title: string`, `message: string`, `confirmLabel?: string`, `cancelLabel?: string`, `danger?: boolean`
- [x] 1.5 Crear `confirm-dialog.component.spec.ts` con tests para: render con datos completos, labels por defecto, click en confirmar devuelve true, click en cancelar devuelve false, ESC devuelve false, backdrop click NO cierra
- [x] 1.6 Configurar el componente para que el backdrop click NO cierre el diálogo (vía `disableClose: true` en cada callsite, no en el componente)

## 2. Reemplazar window.confirm() en admin components

- [x] 2.1 `brands-admin.component.ts`: importar `MatDialog` y `ConfirmDialogComponent`, inyectar `MatDialog`, reemplazar `confirm()` por `this.dialog.open(ConfirmDialogComponent, { data: {...}, disableClose: true }).afterClosed()` con `await ... .toPromise()`
- [x] 2.2 `models-admin.component.ts`: mismo cambio en su `confirmDelete`
- [x] 2.3 `versions-admin.component.ts`: mismo cambio en su `confirmDelete`
- [x] 2.4 `equipment-admin.component.ts`: mismo cambio
- [x] 2.5 `maintenance-admin.component.ts`: mismo cambio
- [x] 2.6 `dealers-admin.component.ts`: mismo cambio
- [x] 2.7 `fuel-prices-admin.component.ts`: mismo cambio
- [x] 2.8 Actualizar cada `*.spec.ts` de los 7 admin components: añadir `MatDialog` a `TestBed` providers y mockear `open()` para devolver `of(true)` o `of(false)` según el caso de test
- [x] 2.9 Verificar que ningún archivo bajo `apps/frontend/src/app/features/admin/` contiene `window.confirm` con `grep -r "window.confirm" apps/frontend/src`

## 3. Marcador required/optional en AdminEditDialogComponent

- [x] 3.1 Editar `admin-edit-dialog.component.html`: en `.dialog-field-label`, añadir `@if (!meta.optional) { <span class="required-marker" aria-label="requerido">*</span> } @else { <span class="optional-badge" aria-label="opcional">opcional</span> }` después del label y antes del `field-name`
- [x] 3.2 Editar `admin-edit-dialog.component.css`: añadir `.required-marker { color: var(--mat-sys-error); margin-left: 0.25rem; font-weight: 700; }` y `.optional-badge { font-weight: 400; font-size: 0.625rem; color: var(--mat-sys-on-surface-variant); margin-left: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }`
- [x] 3.3 Añadir `aria-required="true"` al input de los custom field components cuando el control es required: revisar `text-field`, `number-field`, `toggle-field`, `select-search`, `image-upload-field`, `gallery-upload-field`, `multi-select-field` y propagar el flag
- [x] 3.4 Crear un helper `isFieldRequired(meta: FieldMeta): boolean` en `entity-schemas.ts` (o inline en el dialog) que devuelva `!meta.optional && !isExemptKind(meta.kind)` para mantener la misma lógica de exención que `buildInitialControls`
- [x] 3.5 Tests en `admin-edit-dialog.component.spec.ts`: añadir scenarios para brand (todos requeridos excepto logoUrl/dealerIds), version (mezcla), y verificar que el asterisco aparece en el DOM para required y el badge para optional

## 4. Unsaved-changes guard en AdminEditDialogComponent

- [x] 4.1 Importar `HostListener` desde `@angular/core` y `MatDialog` desde `@angular/material/dialog`
- [x] 4.2 Añadir `@HostListener('document:keydown.escape', ['$event']) onEsc(event: KeyboardEvent)` que llama `event.preventDefault()` y luego `this.onCancel()`
- [x] 4.3 Inyectar `MatDialog` en el componente
- [x] 4.4 Refactorizar `onCancel()`: si `this.form().dirty`, abrir `ConfirmDialogComponent` con `data: { title: 'Descartar cambios', message: 'Tienes cambios sin guardar. ¿Cerrar de todas formas?', confirmLabel: 'Descartar', danger: true, ... }` y solo emitir `cancel` si el usuario confirma
- [x] 4.5 Crear un método `closeX()` que se asocia al botón X del toolbar (reemplaza el `(click)="onCancel()"` directo del X) y que internamente llama `onCancel()` para garantizar mismo flujo
- [x] 4.6 Verificar que el hydration inicial (los `setValue` que cargan la plantilla/entidad) NO marca el form como dirty — añadir `form.markAsPristine()` al final del effect de hidratación si es necesario
- [x] 4.7 Tests en `admin-edit-dialog.component.spec.ts`: añadir scenarios para (a) cerrar pristine sin prompt, (b) cerrar dirty abre confirm, (c) confirmar discard emite cancel, (d) cancelar el confirm no emite cancel, (e) ESC dispara el guard

## 5. Autofocus y navegación por teclado

- [x] 5.1 Importar `viewChild`, `effect`, `ElementRef` desde `@angular/core`
- [x] 5.2 Añadir `firstField = viewChild<ElementRef<HTMLElement>>('firstField')`
- [x] 5.3 Añadir `effect(() => { if (!this.loading() && this.firstField()) { queueMicrotask(() => this.firstField()?.nativeElement.focus()); } })` en el constructor
- [x] 5.4 Añadir `#firstField` al primer `<div class="dialog-field">` en `admin-edit-dialog.component.html`
- [x] 5.5 Tests en `admin-edit-dialog.component.spec.ts`: verificar que `firstField.nativeElement.focus()` se llama cuando loading pasa a false, y NO se llama cuando loading es true

## 6. Verificación

- [x] 6.1 Leer `apps/frontend/src/app/features/admin/admin-edit-dialog.component.spec.ts` entero para identificar qué tests existentes asumen cierre silencioso del dialog y actualizarlos
- [x] 6.2 Ejecutar `npm run test:fe` y resolver todos los fallos introducidos por los cambios
- [x] 6.3 Ejecutar `npm run test:e2e` si existe y aplicar a los flujos de admin
- [x] 6.4 Ejecutar `npm run lint` (si existe) y resolver issues en los archivos modificados
- [ ] 6.5 Smoke test manual en navegador: crear/editar/borrar una entidad de cada tipo (brand, model, version, equipment, maintenance, dealer, fuelPrice), verificando visualmente asteriscos, badge opcional, autofocus, guard de cierre, dialog de confirmación de borrado
- [ ] 6.6 Verificar con un screen reader (o al menos con DevTools accessibility inspector) que los campos required se anuncian como tales
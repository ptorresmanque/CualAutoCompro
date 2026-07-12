## Context

`AdminEditDialogComponent` (`apps/frontend/src/app/features/admin/`) se renderiza dentro de cada componente admin (`brands-admin`, `models-admin`, etc.) usando un `@if` que monta un overlay CSS sobre un `mat-card`. No usa `MatDialog` real — es un dialog "casero" controlado por la señal `dialogMode()` del componente padre.

Estado actual:
- Cierre silencioso: X, Cancel y ESC (no manejado) descartan cambios sin aviso.
- Borrado usa `window.confirm()` nativo en 7 callsites.
- `dialog-field-label` muestra el label + nombre técnico, sin indicar required vs optional.
- Sin autofocus al abrir; el foco queda donde estaba antes (probablemente el botón "+ Nueva" o el icono de cierre).

`FieldMeta.optional` ya existe en `entity-schemas.ts:137` pero la UI no lo usa.

## Goals / Non-Goals

**Goals:**
- Reducir fricción cotidiana de quien edita el catálogo (4 mejoras visuales/comportamentales, todas contenidas al dialog y a un componente nuevo).
- Mantener la arquitectura schema-driven del dialog (no añadir lógica por entidad).
- Tests actualizados para cubrir los nuevos comportamientos.

**Non-Goals:**
- Validación inline en tiempo real → `admin-forms-inline-feedback`.
- Texto de ayuda por campo → `admin-forms-inline-feedback`.
- Mapeo de errores backend → campo → `admin-forms-inline-feedback`.
- Secciones / colapsables → `admin-forms-sectioned-layout`.
- Wizard → `admin-forms-sectioned-layout`.
- Guard contra cierre del navegador (`beforeunload`) → fuera de scope por ahora.

## Decisions

### D1. `ConfirmDialogComponent` reutilizable en `shared/ui/`

En lugar de reemplazar `window.confirm()` con `MatDialog` ad-hoc en cada componente admin, se crea un componente reutilizable consistente con el patrón existente (`SearchInputComponent` ya vive en `shared/ui/`).

**API:**
```typescript
// shared/ui/confirm-dialog.component.ts
@Component({ selector: 'app-confirm-dialog', ... })
export class ConfirmDialogComponent {
  data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel?: string;   // default 'Confirmar'
  cancelLabel?: string;    // default 'Cancelar'
  danger?: boolean;        // true → botón confirmar rojo
}
```

**Uso en cada admin component:**
```typescript
private dialog = inject(MatDialog);

async confirmDelete(row: BrandRow): Promise<void> {
  const ref = this.dialog.open(ConfirmDialogComponent, {
    data: {
      title: 'Eliminar marca',
      message: `¿Eliminar marca "${row.name}"?`,
      confirmLabel: 'Eliminar',
      danger: true,
    },
  });
  if (await ref.afterClosed().toPromise()) {
    await this.api.delete(...);
  }
}
```

**Por qué no un service helper:** solo hay 7 callsites con el mismo patrón. Un service (`ConfirmDialogService.confirm(opts)`) ahorra ~3 líneas por callsite pero añade una capa que no aporta valor sobre `MatDialog.open()` directo. Si en el futuro aparecen más usos con lógica común, se refactoriza a service.

### D2. Marcador required/optional derivado de `FieldMeta.optional`

`FieldMeta.optional` ya está en `entity-schemas.ts:137` y se usa para decidir validadores. Lo reutilizamos en el template sin añadir un campo nuevo.

```html
<!-- admin-edit-dialog.component.html -->
<span class="dialog-field-label">
  {{ meta.label }}
  @if (!meta.optional) {
    <span class="required-marker" aria-label="requerido">*</span>
  } @else {
    <span class="optional-badge" aria-label="opcional">opcional</span>
  }
  <span class="field-name">({{ meta.field }})</span>
</span>
```

CSS: `.required-marker { color: var(--mat-sys-error); margin-left: 0.25rem; }`, `.optional-badge { font-weight: 400; font-size: 0.625rem; color: var(--mat-sys-on-surface-variant); margin-left: 0.5rem; text-transform: uppercase; }`.

Accesibilidad: `aria-required="true"` en el input cuando `!meta.optional`. Esto requiere extender `FieldMeta` con un helper o derivar en el template.

**Alternativa considerada:** añadir `FieldMeta.requiredMarker: 'asterisk' | 'badge' | 'none'`. Descartado — sobreingeniería para dos estados.

### D3. Unsaved-changes guard: variante A (solo dentro del dialog)

`form.dirty` (de Angular reactive forms) es true cuando el usuario modifica cualquier control. Lo usamos como fuente de verdad.

```typescript
// admin-edit-dialog.component.ts
readonly isDirty = computed(() => this.form().dirty);

onCancel(): void {
  if (this.isDirty()) {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Descartar cambios',
        message: 'Tienes cambios sin guardar. ¿Cerrar de todas formas?',
        confirmLabel: 'Descartar',
        danger: true,
      },
    });
    ref.afterClosed().subscribe((ok) => { if (ok) this.cancel.emit(); });
  } else {
    this.cancel.emit();
  }
}

@HostListener('document:keydown.escape', ['$event'])
onEsc(event: KeyboardEvent): void {
  event.preventDefault();
  this.onCancel();
}

closeX(): void {
  this.onCancel();
}
```

**Por qué no variante B (`beforeunload`):** añadir un listener global de `beforeunload` afecta toda la pestaña, no solo el dialog. Falsos positivos cuando el usuario navega a otro lado con el dialog abierto (caso edge). Se puede añadir después si hace falta.

**Por qué no variante C (autosave):** introduce estado nuevo (localStorage) que requiere política de limpieza, expiración y resolución de conflictos. Es un cambio aparte, no un quick win.

### D4. Autofocus con template reference + effect

El primer input editable aparece después de que `loading()` pasa a `false` (la plantilla se hidrata con datos del backend). `HTMLInputElement.focus()` no se puede llamar hasta que el elemento existe en el DOM.

```typescript
// admin-edit-dialog.component.ts
@ViewChild('firstField') firstField = viewchild<ElementRef<HTMLElement>>('firstField');

effect(() => {
  if (!this.loading() && this.firstField()) {
    queueMicrotask(() => this.firstField()?.nativeElement.focus());
  }
});
```

```html
<!-- primer dialog-field -->
<div class="dialog-field" #firstField>
```

**Alternativa considerada:** `cdkTrapFocus` (de `@angular/cdk/a11y`). Mejor para focus trapping real, pero overkill cuando el dialog ya no es un modal real (es un overlay sin overlay-backdrop-click). Lo dejamos para fase 3 si se migra a `MatDialog` real.

### D5. Reutilizar `MatDialog` (no el dialog casero) para los nuevos diálogos

El nuevo `ConfirmDialogComponent` se abre con `MatDialog.open()` desde el componente padre (no desde dentro del `AdminEditDialogComponent`). Esto introduce un anidamiento visual dialog-sobre-dialog, pero es la forma idiomática en Angular Material.

**Riesgo:** z-index. El overlay casero del `AdminEditDialogComponent` usa `z-index: 50`. `MatDialog` por defecto usa `z-index: 1000`. Sin conflicto, pero conviene verificar en navegador.

## Risks / Trade-offs

- **[Riesgo] Tests rotos en masa:** `admin-edit-dialog.component.spec.ts` (16K) tiene tests que probablemente asumen cierre silencioso del dialog. Hay que leerlo entero antes de estimar el churn real. **Mitigación:** empezar el cambio leyendo ese spec, identificar qué tests hay que actualizar, escribir los nuevos al final.
- **[Riesgo] Anidamiento de diálogos puede romper tests E2E.** **Mitigación:** confirmar manualmente en navegador el flujo de borrado antes de mergear.
- **[Riesgo] Foco atrapado si autofocus apunta a un campo deshabilitado.** **Mitigación:** el effect verifica `loading()` false y existencia del `viewchild`; si no hay, no hace nada.
- **[Riesgo] `form.dirty` puede dispararse por hydration inicial.** **Mitigación:** verificar manualmente que abrir un dialog existente (modo edición) no marca como dirty desde el primer keystroke. Si pasa, marcar todos los controles como `pristine` después del hydration.
- **[Trade-off] `isDirty` reactividad:** `computed(() => form().dirty)` no es estrictamente reactivo porque `dirty` no es una signal. En la práctica, los eventos que nos interesan (`onCancel`, X click, ESC) ocurren por interacción del usuario, no por reactividad automática. Aceptable.

## Migration Plan

Sin migración de datos. Sin pasos de deploy especiales. Cambios puramente frontend.

Rollback: revertir el PR. No hay estado persistente que limpiar.

## Open Questions

- ¿El foco debe ir al primer campo editable siempre, o solo en modo "crear"? En modo "editar", a veces el usuario viene a cambiar un campo específico, no el primero.
  - **Decisión provisional:** siempre al primero. Si molesta, se ajusta en fase 2.
- ¿El badge "opcional" debe aparecer en todos los campos opcionales o solo en formularios largos (>10 campos)?
  - **Decisión provisional:** siempre. Es explícito y barato visualmente.
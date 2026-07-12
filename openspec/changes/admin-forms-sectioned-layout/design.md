## Context

`AdminEditDialogComponent` (en `apps/frontend/src/app/features/admin/`) renderiza el form usando `@for (meta of fieldMetas())` con un grid CSS de 1-2 columnas. Todos los campos aparecen al mismo nivel visual. Para entidades pequeñas (brand con 3 campos, equipment con 2) funciona bien. Para `version` con 28 campos, el usuario scrollea mucho sin guía.

`FieldMeta` actualmente tiene: `field`, `label`, `kind`, `options?`, `optionsApi?`, `optionLabel?`, `optional?`, `hidden?`, `help?` (añadido en fase 2). Vamos a añadir `group?: string`.

El grid actual vive en `.dialog-grid` (clase CSS). Vamos a mantenerlo por sección para no introducir cambios en los field components.

## Goals / Non-Goals

**Goals:**
- Versión: 28 campos organizados en ~8 secciones temáticas con headers claros.
- Sticky nav lateral (solo si ≥ 3 secciones) con scroll-spy y scroll-to.
- Cero cambios en field components (text, number, select-search, etc.).
- Cero cambios en `FieldMeta.kind` ni en cómo se hidratan los form controls.
- Entidades sin grupos se comportan idéntico a hoy.

**Non-Goals:**
- Wizard multi-step (decidido en brainstorming).
- Drag-and-drop para reordenar secciones.
- Persistir estado de scroll o sección activa entre aperturas del dialog.
- Sub-secciones anidadas (un campo pertenece a exactamente una sección o a ninguna).
- Animaciones al cambiar de sección.

## Decisions

### D1. `FieldMeta.group?: string` — string libre, sin enum

Usar `string` libre en vez de un enum permite definir secciones por entidad sin acoplarse a un set global. Una entidad `version` tiene grupos como `'Identificación'`, `'Motor'`, etc.; otras entidades no usan el campo.

```typescript
export interface FieldMeta {
  field: string;
  label: string;
  kind: FieldKind;
  options?: string[];
  optionsApi?: string;
  optionLabel?: string;
  optional?: boolean;
  hidden?: boolean;
  help?: string;
  group?: string;
}
```

**Alternativa considerada:** `group: GroupKey` con enum. Descartado — más fricción para añadir secciones.

### D2. Secciones derivadas en el dialog (computed signal)

```typescript
readonly sections = computed<Section[]>(() => {
  const map = new Map<string, FieldMeta[]>();
  const order: string[] = [];
  for (const meta of this.fieldMetas()) {
    const g = meta.group ?? '';
    if (!map.has(g)) {
      map.set(g, []);
      order.push(g);
    }
    map.get(g)!.push(meta);
  }
  return order.map((g) => ({
    id: sectionId(g),  // 'identificacion' slugified
    label: g,           // 'Identificación' as-is
    fields: map.get(g)!,
  }));
});
```

Empty string `''` se usa como "sin sección". Esa sección no se renderiza con header, sus campos aparecen sin agrupar (compatibilidad con entidades que no usan `group`).

### D3. Layout por sección

```html
<div class="dialog-sections">
  @for (section of sections(); track section.id) {
    <section [id]="section.id" class="dialog-section">
      @if (section.label) {
        <h3 class="dialog-section-header">{{ section.label }}</h3>
      }
      <div class="dialog-section-grid">
        @for (meta of section.fields; track meta.field) {
          <div class="dialog-field">...</div>
        }
      </div>
    </section>
  }
</div>

@if (sections().length >= 3) {
  <nav class="dialog-section-nav" aria-label="Secciones del formulario">
    @for (section of sections(); track section.id) {
      <button
        type="button"
        class="dialog-section-nav-item"
        [class.active]="activeSection() === section.id"
        (click)="scrollToSection(section.id)"
      >{{ section.label || 'General' }}</button>
    }
  </nav>
}
```

CSS:
```css
.dialog-sections { display: grid; gap: 1.5rem; }
.dialog-section { scroll-margin-top: 1rem; }  /* para que scrollIntoView no se esconda */
.dialog-section-header {
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--mat-sys-on-surface-variant);
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--mat-sys-outline-variant);
}
.dialog-section-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}
@media (min-width: 640px) {
  .dialog-section-grid { grid-template-columns: 1fr 1fr; }
}
.dialog-section-nav {
  position: sticky;
  top: 1rem;
  align-self: start;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  background: var(--mat-sys-surface-container);
  border-radius: 0.5rem;
  border: 1px solid var(--mat-sys-outline-variant);
}
@media (max-width: 640px) {
  .dialog-section-nav { display: none; }
}
.dialog-section-nav-item {
  font-size: 0.75rem;
  text-align: left;
  padding: 0.375rem 0.5rem;
  border-radius: 0.25rem;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--mat-sys-on-surface-variant);
}
.dialog-section-nav-item.active {
  background: var(--mat-sys-primary-container);
  color: var(--mat-sys-on-primary-container);
  font-weight: 600;
}
```

Layout del dialog-body pasa de `display: block` a `display: grid; grid-template-columns: 1fr auto` cuando hay nav. En mobile, solo el form (sin nav).

### D4. Scroll-spy con IntersectionObserver

```typescript
private intersectionObserver?: IntersectionObserver;
private activeSectionId = signal<string | null>(null);

ngAfterViewInit(): void {
  if (typeof IntersectionObserver === 'undefined') return;
  this.intersectionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          this.activeSectionId.set(entry.target.id);
        }
      }
    },
    { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
  );
  for (const section of this.sectionsEl().toArray()) {
    this.intersectionObserver.observe(section.nativeElement);
  }
}

ngOnDestroy(): void {
  this.intersectionObserver?.disconnect();
}

readonly activeSection = computed(() => this.activeSectionId());

scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
```

`rootMargin: '-20% 0px -60% 0px'` significa que la sección "activa" es la que está en el tercio superior del viewport.

**Alternativa considerada:** scroll listener manual con throttle. Descartado — `IntersectionObserver` es nativo y eficiente.

### D5. Asignación de grupos para `version`

Agrupación tentativa (basada en afinidad semántica de los campos):

```typescript
{
  modelId:           'Identificación',
  name:              'Identificación',
  year:              'Identificación',
  priceClp:          'Identificación',
  transmission:      'Motor',
  fuel:              'Motor',
  engineDisplacementCc: 'Motor',
  powerHp:           'Motor',
  torqueNm:          'Motor',
  consumptionCityKmL: 'Consumo',
  consumptionHighwayKmL: 'Consumo',
  lengthMm:          'Dimensiones',
  widthMm:           'Dimensiones',
  heightMm:          'Dimensiones',
  weightKg:          'Dimensiones',
  trunkLiters:       'Dimensiones',
  airbagCount:       'Seguridad',
  hasAbs:            'Seguridad',
  hasEsp:            'Seguridad',
  hasCruiseControl:  'Seguridad',
  equipment:         'Equipamiento',
  circulationPermitClp: 'Seguros y permisos',
  mandatoryInsuranceClp: 'Seguros y permisos',
  voluntaryInsuranceClp: 'Seguros y permisos',
  fuelTankLiters:    'Tanque y batería',
  batteryCapacityKwh: 'Tanque y batería',
  hasRecall:         'Recalls',
  recallUrl:         'Recalls',
}
```

9 secciones para `version`. El nav lateral aparece porque `>= 3`.

### D6. Backward compatibility

Entidades que NO usan `group` (brand, model, equipment, maintenance, dealers, fuelPrice) siguen funcionando idéntico:
- `sections()` produce una sola sección con `label = ''` (vacía)
- El template usa `@if (section.label)` que es false → no se renderiza header
- El grid interno funciona como antes
- El sticky nav tiene `sections().length >= 3` como condición → no aparece

Cero tests rotos en las otras entidades.

## Risks / Trade-offs

- **[Riesgo] Refactor del template cambia la estructura DOM.** Si algún test cuenta `.dialog-field` con `querySelectorAll`, el conteo debería seguir igual (la clase está en el field, no en la sección). **Mitigación:** revisar `admin-edit-dialog.component.spec.ts` para asegurar que ningún test depende de `fields.length === 1` (que sí cambiaría con grouping).
- **[Riesgo] Sticky nav ocupa ancho.** En pantallas chicas (< 640px) lo ocultamos, pero desktop wide queda igual. **Mitigación:** el nav es colapsable en una fase futura si hace falta.
- **[Riesgo] Scroll-spy puede parpadear entre secciones si dos están visibles al mismo tiempo.** **Mitigación:** `rootMargin` restrictivo + threshold 0.
- **[Trade-off] Sections agregan ~10px de header padding.** Insignificante.

## Migration Plan

Sin migración de datos. Los cambios son puramente frontend:
1. `FieldMeta.group` opcional — campos existentes sin grupo siguen funcionando.
2. Template refactor — comportamiento idéntico para entidades sin grupos.

**Rollback:** revertir el PR.

## Open Questions

- ¿El orden de las secciones debe ser explícito (ej. un array `groups: string[]` en `entity-schemas.ts`) o derivado de la primera aparición? **Decisión provisional:** derivado de primera aparición — más simple, no requiere mantener orden en otro lado. Si hace falta reordenar, agregamos `SectionMeta.order` después.
- ¿Las secciones sin label (`''`) deberían ocultarse completamente si hay otras con label? **Decisión provisional:** no. Una entidad con 1 campo con grupo y 3 sin grupo mostraría: header "Identificación" con 1 campo, luego "General" sin header con 3 campos. Es claro. Si una entidad tiene SOLO campos sin grupo, se renderiza como una sola sección sin header (comportamiento actual).
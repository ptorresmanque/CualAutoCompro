# Mejoras v4: Equipment relation — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar UI dentro del form de Versión para asignar items de equipamiento a la versión, usando los endpoints existentes (`POST /admin/equipment/attach`, `DELETE /admin/equipment/version/:vId/item/:iId`).

**Architecture:** Backend expone `equipmentItems` en `versions.service.listAll` (cambio mínimo). Frontend gana un `MultiSelectFieldComponent` reusable; el dialog lo renderiza para el campo `equipment`; el componente padre `VersionsAdminComponent` calcula el diff add/remove y dispara los attach/detach en save.

**Tech Stack:** Angular 22 (signals, OnPush, standalone), Express + Zod + Prisma/Postgres + multer, Vitest + supertest (BE) / HttpClientTesting (FE), Tailwind tokens del proyecto.

**Spec de referencia:** `docs/superpowers/specs/2026-07-02-mejoras-v4-equipment-relation-design.md`

## Global Constraints

- Cada task termina con commit (`git add -A && git commit -m "<scope>: <desc>"`).
- Backend: `npm -w apps/backend run test` debe pasar antes de commitear.
- Frontend: `npm -w apps/frontend run test` debe pasar antes de commitear.
- TypeScript estricto. No agregar `any` implícito. Reutilizar `shared/errors` (`AppError`, `conflict`, `badRequest`, `notFound`, `unauthorized`, `validation`).
- Naming: archivos en kebab-case; clases en PascalCase; métodos en camelCase.
- Todas las UI nuevas usan clases Tailwind ya presentes en `apps/frontend/src/styles.css` (variables `brand-*`, `surface`, `ink`, `border`, `warn`, `warn-dark`, `shadow-e2`).
- Iconos: `material-symbols-outlined`. No instalar nuevas libs de iconos.
- Componentes Angular: siempre `.ts` + `.html` + `.css` separados. Nunca HTML inline en `.ts`.
- Standalone components, `ChangeDetectionStrategy.OnPush`, signals + `input.required<T>()` / `model<T>()` / `output<T>()`.

---

## File map

### Backend (2 archivos)
| Archivo | Cambio | Responsabilidad |
|---|---|---|
| `apps/backend/src/modules/versions/versions.service.ts` | mod | `listAll` incluye `equipmentItems` con `equipmentItem.{id,name,category}` |
| `apps/backend/src/modules/versions/versions.service.spec.ts` | crear | Tests de `listAll` con equipmentItems |

### Frontend (10 archivos)
| Archivo | Cambio | Responsabilidad |
|---|---|---|
| `apps/frontend/src/app/features/admin/fields/multi-select-field.component.{ts,html,css}` | crear | Multi-select con chips + buscador + dropdown |
| `apps/frontend/src/app/features/admin/fields/multi-select-field.component.spec.ts` | crear | Tests del componente |
| `apps/frontend/src/app/features/admin/entity-schemas.ts` | mod | Nuevo `FieldKind 'multiSelect'` + FIELD_META para equipment |
| `apps/frontend/src/app/features/admin/admin-edit-dialog.component.ts` | mod | Importar `MultiSelectFieldComponent`, agregar a `imports`, manejar `kind: 'multiSelect'` en `buildInitialControls` |
| `apps/frontend/src/app/features/admin/admin-edit-dialog.component.html` | mod | Agregar `@case ('multiSelect')` |
| `apps/frontend/src/app/features/admin/admin-edit-dialog.component.spec.ts` | mod | Tests del nuevo field en el dialog |
| `apps/frontend/src/app/features/admin/versions-admin.component.ts` | mod | Interface `VersionRow` con `equipmentItems`; `onSave` calcula diff y llama attach/detach |
| `apps/frontend/src/app/features/admin/versions-admin.component.spec.ts` | mod | Tests del diff |

---

## Task 1: Backend `listAll` con `equipmentItems` + test

**Files:**
- Modify: `apps/backend/src/modules/versions/versions.service.ts`
- Create: `apps/backend/src/modules/versions/versions.service.spec.ts` (si no existe)

**Interfaces:**
- Produces: `VersionsService.listAll()` retorna cada versión con `equipmentItems: { equipmentItem: { id, name, category } }[]`

- [ ] **Step 1: Escribir el test**

`apps/backend/src/modules/versions/versions.service.spec.ts`:
```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { VersionsService } from "./versions.service.js";
import { setupTestPrisma, resetTestDb } from "../../../__tests__/helpers/db.js";
import { prisma } from "../../infra/prisma.js";

describe("VersionsService", () => {
  beforeEach(async () => {
    setupTestPrisma();
    await resetTestDb(prisma);
  });
  afterEach(async () => {
    await prisma.$disconnect();
  });

  it("listAll incluye equipmentItems con equipmentItem.{id,name,category}", async () => {
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({
      data: { brandId: brand.id, name: "M", segment: "SEDAN" },
    });
    const v = await prisma.version.create({
      data: {
        modelId: model.id,
        name: "v1",
        year: 2026,
        priceClp: 100,
        transmission: "MANUAL",
        fuel: "BENCINA",
        engineDisplacementCc: 1, powerHp: 1, torqueNm: 1,
        consumptionCityKmL: 1, consumptionHighwayKmL: 1,
        lengthMm: 1, widthMm: 1, heightMm: 1, weightKg: 1,
        trunkLiters: 1, airbagCount: 1,
        hasAbs: true, hasEsp: true, hasCruiseControl: true,
      },
    });
    const item = await prisma.equipmentItem.create({
      data: { name: "Aire acondicionado", category: "Confort" },
    });
    await prisma.versionEquipment.create({
      data: { versionId: v.id, equipmentItemId: item.id },
    });

    const svc = new VersionsService(prisma);
    const all = await svc.listAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.equipmentItems).toHaveLength(1);
    expect(all[0]?.equipmentItems?.[0]?.equipmentItem).toEqual({
      id: item.id,
      name: "Aire acondicionado",
      category: "Confort",
    });
  });

  it("listAll retorna equipmentItems: [] para versiones sin items", async () => {
    const brand = await prisma.brand.create({ data: { name: "B" } });
    const model = await prisma.model.create({
      data: { brandId: brand.id, name: "M2", segment: "SEDAN" },
    });
    await prisma.version.create({
      data: {
        modelId: model.id, name: "v1", year: 2026, priceClp: 0,
        transmission: "MANUAL", fuel: "BENCINA",
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0, airbagCount: 0,
        hasAbs: false, hasEsp: false, hasCruiseControl: false,
      },
    });

    const svc = new VersionsService(prisma);
    const all = await svc.listAll();
    expect(all[0]?.equipmentItems).toEqual([]);
  });
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/backend && npx vitest run src/modules/versions/versions.service.spec.ts`
Expected: FAIL porque `listAll` no incluye equipmentItems (probablemente retorna `undefined` o no el array).

- [ ] **Step 3: Modificar `versions.service.ts`**

Localizar `listAll` (alrededor de línea 24-32) y reemplazar el `include`:

```ts
async listAll() {
  return this.prisma.version.findMany({
    where: {
      deletedAt: null,
      model: { deletedAt: null, brand: { deletedAt: null } },
    },
    orderBy: { createdAt: "desc" },
    include: {
      model: { select: { id: true, name: true } },
      equipmentItems: {
        include: {
          equipmentItem: { select: { id: true, name: true, category: true } },
        },
      },
    },
  });
}
```

- [ ] **Step 4: Correr el test, debe pasar**

Run: `cd apps/backend && npx vitest run src/modules/versions/versions.service.spec.ts`
Expected: PASS (2/2).

- [ ] **Step 5: Verificar suite completa**

Run: `cd apps/backend && npm run test`
Expected: PASS, sin regresiones.

- [ ] **Step 6: Commit**

```bash
git add apps/backend/src/modules/versions/versions.service.ts apps/backend/src/modules/versions/versions.service.spec.ts
git commit -m "feat(be): versions.listAll includes equipmentItems

The admin versions page needs the current equipment of each version to
preload the form's multi-select control. The public detail endpoint
already returned this; listAll didn't. Add the include so the form
can diff old vs new equipment on save.

No schema or migration changes."
```

---

## Task 2: `MultiSelectFieldComponent` + tests

**Files:**
- Create: `apps/frontend/src/app/features/admin/fields/multi-select-field.component.ts`
- Create: `apps/frontend/src/app/features/admin/fields/multi-select-field.component.html`
- Create: `apps/frontend/src/app/features/admin/fields/multi-select-field.component.css`
- Create: `apps/frontend/src/app/features/admin/fields/multi-select-field.component.spec.ts`

**Interfaces:**
- Produces: `selector: 'app-multi-select-field'`
- Inputs: `control: FormControl<string[] | null>`, `optionsApi: string`, `optionLabel: string`, `placeholder: string`
- Comportamiento: chips + dropdown + add/remove, filtra por query case-insensitive

- [ ] **Step 1: Escribir el test fallido**

`apps/frontend/src/app/features/admin/fields/multi-select-field.component.spec.ts`:
```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectFieldComponent } from './multi-select-field.component';

describe('MultiSelectFieldComponent', () => {
  function setup(initial: string[] | null = null) {
    TestBed.configureTestingModule({
      imports: [MultiSelectFieldComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(MultiSelectFieldComponent);
    const ctrl = new FormControl<string[] | null>(initial);
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('optionsApi', '/admin/equipment');
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.detectChanges();
    return { fixture, ctrl, http: TestBed.inject(HttpTestingController) };
  }

  it('renderiza un chip por cada id seleccionado', () => {
    const { fixture } = setup(['e1', 'e2']);
    const chips = fixture.nativeElement.querySelectorAll('[data-testid="ms-chip"]');
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('e1');
  });

  it('carga opciones via optionsApi y las filtra al tipear', async () => {
    const { fixture, http } = setup();
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/equipment'));
    req.flush({
      data: [
        { id: 'e1', name: 'Aire acondicionado' },
        { id: 'e2', name: 'Bluetooth' },
      ],
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="ms-input"]',
    );
    input.value = 'Blue';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('[data-testid="ms-option"]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Bluetooth');
  });

  it('click en opción agrega al control y marca dirty', async () => {
    const { fixture, ctrl, http } = setup();
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/equipment'));
    req.flush({ data: [{ id: 'e1', name: 'Aire' }, { id: 'e2', name: 'Bluetooth' }] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('[data-testid="ms-option"]');
    (items[0] as HTMLElement).click();
    fixture.detectChanges();
    expect(ctrl.value).toEqual(['e1']);
    expect(ctrl.dirty).toBe(true);
  });

  it('click en X de chip quita del control', () => {
    const { fixture, ctrl } = setup(['e1', 'e2']);
    const removeButtons = fixture.nativeElement.querySelectorAll(
      '[data-testid="ms-chip-remove"]',
    );
    (removeButtons[0] as HTMLElement).click();
    fixture.detectChanges();
    expect(ctrl.value).toEqual(['e2']);
    expect(ctrl.dirty).toBe(true);
  });

  it('excluye opciones ya seleccionadas del dropdown', async () => {
    const { fixture, http } = setup(['e1']);
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/equipment'));
    req.flush({ data: [{ id: 'e1', name: 'Aire' }, { id: 'e2', name: 'Bluetooth' }] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    const items = fixture.nativeElement.querySelectorAll('[data-testid="ms-option"]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Bluetooth');
  });
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/frontend && npm run test --include='**/multi-select-field.component.spec.ts' --watch=false`
Expected: FAIL "Cannot find module './multi-select-field.component'".

- [ ] **Step 3: Implementar el componente**

`apps/frontend/src/app/features/admin/fields/multi-select-field.component.ts`:
```ts
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';

interface OptionItem { id: string; [k: string]: unknown; }

@Component({
  selector: 'app-multi-select-field',
  imports: [ReactiveFormsModule],
  templateUrl: './multi-select-field.component.html',
  styleUrl: './multi-select-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectFieldComponent implements OnInit {
  private api = inject(ApiService);
  private el = inject(ElementRef<HTMLElement>);

  readonly control = input.required<FormControl<string[] | null>>();
  readonly optionsApi = input<string | null>(null);
  readonly optionLabel = input<string>('name');
  readonly placeholder = input<string>('Buscar…');

  readonly query = signal('');
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly remoteOptions = signal<OptionItem[]>([]);

  readonly selectedIds = (): string[] => {
    const v = this.control().value;
    return Array.isArray(v) ? v : [];
  };

  // Read each time the template re-renders (similar pattern to gallery-upload-field).
  // OnPush CD runs on click events so this picks up the current control value.
  available(): OptionItem[] {
    const q = this.query().toLowerCase();
    const selected = new Set(this.selectedIds());
    const all = this.remoteOptions().filter((o) => !selected.has(o.id));
    return q ? all.filter((o) => String(o[this.optionLabel()] ?? '').toLowerCase().includes(q)) : all;
  }

  labelOf(id: string): string {
    const opt = this.remoteOptions().find((o) => o.id === id);
    return String(opt?.[this.optionLabel()] ?? id);
  }

  ngOnInit(): void {
    if (this.optionsApi()) {
      void this.load();
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.get<{ data: OptionItem[] }>(this.optionsApi()!);
      this.remoteOptions.set(res.data);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  onInput(v: string): void {
    this.query.set(v);
    this.open.set(true);
  }

  pick(item: OptionItem): void {
    const current = this.selectedIds();
    if (current.includes(item.id)) return;
    const next = [...current, item.id];
    this.control().setValue(next);
    this.control().markAsDirty();
    this.query.set('');
    this.open.set(false);
  }

  removeAt(id: string): void {
    const next = this.selectedIds().filter((x) => x !== id);
    this.control().setValue(next);
    this.control().markAsDirty();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
```

- [ ] **Step 4: Crear el HTML**

`apps/frontend/src/app/features/admin/fields/multi-select-field.component.html`:
```html
<div class="flex flex-col gap-2 w-full">
  @if (selectedIds().length > 0) {
    <ul data-testid="ms-chips" class="flex flex-wrap gap-1.5">
      @for (id of selectedIds(); track id) {
        <li
          data-testid="ms-chip"
          class="inline-flex items-center gap-1 rounded-full bg-brand-100 text-brand-900 px-2 py-0.5 text-xs font-semibold"
        >
          <span>{{ labelOf(id) }}</span>
          <button
            type="button"
            data-testid="ms-chip-remove"
            (click)="removeAt(id)"
            class="text-brand-900/70 hover:text-warn-dark"
            [attr.aria-label]="'Quitar ' + labelOf(id)"
          >
            <span class="material-symbols-outlined text-sm">close</span>
          </button>
        </li>
      }
    </ul>
  }
  <input
    type="text"
    data-testid="ms-input"
    role="combobox"
    [attr.aria-expanded]="open()"
    [value]="query()"
    (input)="onInput($any($event.target).value)"
    (focus)="open.set(true)"
    (keydown.escape)="open.set(false)"
    [placeholder]="placeholder()"
    class="w-full rounded border border-border px-2 py-1.5 text-sm bg-surface"
  />
  @if (open() && available().length > 0) {
    <ul
      data-testid="ms-options"
      role="listbox"
      class="max-h-60 overflow-auto rounded border border-border bg-surface shadow-e2"
    >
      @for (item of available(); track item.id) {
        <li
          data-testid="ms-option"
          role="option"
          (click)="pick(item)"
          class="px-3 py-1.5 text-sm cursor-pointer hover:bg-brand-50"
        >
          {{ item[optionLabel()] }}
        </li>
      }
    </ul>
  }
  @if (error(); as err) {
    <p class="text-warn-dark text-xs">{{ err }}</p>
  }
</div>
```

- [ ] **Step 5: Crear el CSS**

`apps/frontend/src/app/features/admin/fields/multi-select-field.component.css`:
```css
:host { display: block; width: 100%; }
```

- [ ] **Step 6: Correr los tests, deben pasar**

Run: `cd apps/frontend && npm run test --include='**/multi-select-field.component.spec.ts' --watch=false`
Expected: PASS (5/5).

- [ ] **Step 7: Commit**

```bash
git add apps/frontend/src/app/features/admin/fields/multi-select-field.component.*
git commit -m "feat(fe): MultiSelectFieldComponent for chip-based multi-select

Generic multi-select form field. Loads options from an optionsApi,
shows the current selection as removable chips, and exposes the
remaining options in a filterable dropdown.

Pattern follows gallery-upload-field (chips + remove button) and
select-search (filterable dropdown). Used in admin-edit-dialog for
the new 'equipment' field of versions."
```

---

## Task 3: `entity-schemas` + `admin-edit-dialog` wire + tests

**Files:**
- Modify: `apps/frontend/src/app/features/admin/entity-schemas.ts`
- Modify: `apps/frontend/src/app/features/admin/admin-edit-dialog.component.ts`
- Modify: `apps/frontend/src/app/features/admin/admin-edit-dialog.component.html`
- Modify: `apps/frontend/src/app/features/admin/admin-edit-dialog.component.spec.ts`

**Interfaces:**
- Produces: `FieldKind = ... | 'multiSelect'`
- FIELD_METAS.version agrega `equipment: { kind: 'multiSelect', optionsApi: '/admin/equipment', optionLabel: 'name' }`
- El dialog renderiza `<app-multi-select-field>` para ese campo
- El form value incluye `equipment: string[]` cuando se guarda

- [ ] **Step 1: Escribir el test del dialog**

Agregar al `admin-edit-dialog.component.spec.ts` existente:
```ts
it('version con equipment renderiza app-multi-select-field', async () => {
  TestBed.configureTestingModule({
    imports: [AdminEditDialogComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(AdminEditDialogComponent);
  fixture.componentRef.setInput('entityKey', 'version');
  fixture.componentRef.setInput('apiPath', 'versions');
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);

  // Flush template fetch.
  const tplReq = http.expectOne((r) =>
    r.url.includes('/api/v1/admin/seed/template/version'),
  );
  tplReq.flush({
    data: {
      modelId: '', name: '', year: 2026, priceClp: 0,
      transmission: 'MANUAL', fuel: 'BENCINA',
      engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
      consumptionCityKmL: 0, consumptionHighwayKmL: 0,
      lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
      trunkLiters: 0, airbagCount: 0,
      hasAbs: false, hasEsp: false, hasCruiseControl: false,
    },
  });
  await fixture.whenStable();
  await new Promise((r) => setTimeout(r, 0));
  fixture.detectChanges();

  const ms = fixture.nativeElement.querySelector('app-multi-select-field');
  expect(ms).toBeTruthy();
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/frontend && npm run test --include='**/admin-edit-dialog.component.spec.ts' --watch=false`
Expected: FAIL porque el kind 'multiSelect' aún no está implementado.

- [ ] **Step 3: Actualizar `entity-schemas.ts`**

Agregar `'multiSelect'` al union de `FieldKind`:
```ts
export type FieldKind =
  | 'text'
  | 'number'
  | 'boolean'
  | 'foreignKey'
  | 'enumWithOther'
  | 'imageUrl'
  | 'gallery'
  | 'multiSelect'   // NEW
  | 'array';
```

En `FIELD_METAS.version`, agregar al final:
```ts
{ field: 'equipment', label: 'Equipamiento', kind: 'multiSelect', optionsApi: '/admin/equipment', optionLabel: 'name' },
```

- [ ] **Step 4: Wire en `admin-edit-dialog.component.ts`**

Agregar import:
```ts
import { MultiSelectFieldComponent } from './fields/multi-select-field.component';
```

Agregar a `imports`:
```ts
imports: [
  ReactiveFormsModule,
  TextFieldComponent,
  NumberFieldComponent,
  ToggleFieldComponent,
  SelectSearchComponent,
  ImageUploadFieldComponent,
  GalleryUploadFieldComponent,
  MultiSelectFieldComponent,  // NEW
],
```

En `buildInitialControls`:
```ts
private buildInitialControls(key: EntityKey): Record<string, FormControl> {
  const metas = FIELD_METAS[key] ?? [];
  const controls: Record<string, FormControl> = {};
  for (const meta of metas) {
    const initial =
      meta.kind === 'gallery' || meta.kind === 'multiSelect' ? [] : null;
    const ctrl = new FormControl(initial);
    if (
      meta.kind !== 'foreignKey' &&
      meta.kind !== 'imageUrl' &&
      meta.kind !== 'array' &&
      meta.kind !== 'gallery' &&
      meta.kind !== 'multiSelect'
    ) {
      ctrl.addValidators([Validators.required]);
    }
    controls[meta.field] = ctrl;
  }
  return controls;
}
```

- [ ] **Step 5: Wire en el HTML**

`apps/frontend/src/app/features/admin/admin-edit-dialog.component.html`:
```html
@switch (meta.kind) {
  @case ('text')          { <app-text-field          [control]="$any(controlFor(meta.field))" /> }
  @case ('number')        { <app-number-field        [control]="$any(controlFor(meta.field))" /> }
  @case ('boolean')       { <app-toggle-field        [control]="$any(controlFor(meta.field))" /> }
  @case ('foreignKey')    { <app-select-search       [control]="$any(controlFor(meta.field))" [optionsApi]="meta.optionsApi!" [optionLabel]="meta.optionLabel!" /> }
  @case ('enumWithOther') { <app-select-search       [control]="$any(controlFor(meta.field))" [options]="meta.options!" [allowOther]="true" /> }
  @case ('imageUrl')      { <app-image-upload-field  [control]="$any(controlFor(meta.field))" /> }
  @case ('gallery')       { <app-gallery-upload-field [control]="$any(controlFor(meta.field))" /> }
  @case ('multiSelect')   { <app-multi-select-field  [control]="$any(controlFor(meta.field))" [optionsApi]="meta.optionsApi!" [optionLabel]="meta.optionLabel!" [placeholder]="'Buscar equipamiento…'" /> }
  @case ('array')         { <app-text-field          [control]="$any(controlFor(meta.field))" [multiline]="true" /> }
}
```

- [ ] **Step 6: Correr el test del dialog, debe pasar**

Run: `cd apps/frontend && npm run test --include='**/admin-edit-dialog.component.spec.ts' --watch=false`
Expected: PASS (5+1=6 tests).

- [ ] **Step 7: Verificar suite completa**

Run: `cd apps/frontend && npm run test --watch=false`
Expected: PASS sin regresiones (133 tests).

- [ ] **Step 8: Commit**

```bash
git add apps/frontend/src/app/features/admin/entity-schemas.ts \
        apps/frontend/src/app/features/admin/admin-edit-dialog.component.ts \
        apps/frontend/src/app/features/admin/admin-edit-dialog.component.html \
        apps/frontend/src/app/features/admin/admin-edit-dialog.component.spec.ts
git commit -m "feat(fe): wire multiSelect field for version.equipment

Add a new 'multiSelect' FieldKind. The version form now renders
MultiSelectFieldComponent for the 'equipment' field, which lets the
admin search and add equipment items to the version, or remove
existing ones.

The form value includes equipment: string[] when saved. The parent
versions-admin component will compute the diff against the previously
saved equipmentItems and call attach/detach endpoints."
```

---

## Task 4: `versions-admin` diff logic + test

**Files:**
- Modify: `apps/frontend/src/app/features/admin/versions-admin.component.ts`
- Modify: `apps/frontend/src/app/features/admin/versions-admin.component.spec.ts`

**Interfaces:**
- Produces: `onSave(value)` calcula diff entre `entity.equipmentItems[].equipmentItem.id` y `value.equipment`
- Llama `DELETE /admin/equipment/version/:vId/item/:iId` por cada id removido
- Llama `POST /admin/equipment/attach` con `{ versionId, itemId }` por cada id agregado

- [ ] **Step 1: Escribir el test del diff en edit**

Agregar al `versions-admin.component.spec.ts`:
```ts
it('edit sincroniza equipment: detach removidos, attach agregados', async () => {
  TestBed.configureTestingModule({
    imports: [VersionsAdminComponent],
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const fixture = TestBed.createComponent(VersionsAdminComponent);
  fixture.detectChanges();
  const http = TestBed.inject(HttpTestingController);

  // Seed initial load.
  const versionsReq = http.expectOne((r) => r.url.includes('/api/v1/versions'));
  versionsReq.flush({ data: { items: [] } });
  http.expectOne((r) => r.url.includes('/api/v1/models')).flush({ data: { items: [] } });
  await fixture.whenStable();

  // Simulate opening edit on a version that already has equipment e1, e2.
  const existing = {
    id: 'v1',
    name: 'v1',
    year: 2026,
    priceClp: 0,
    model: { name: 'M' },
    equipmentItems: [
      { equipmentItem: { id: 'e1', name: 'A', category: 'C' } },
      { equipmentItem: { id: 'e2', name: 'B', category: 'C' } },
    ],
  };
  fixture.componentInstance.dialogEntity.set(existing as any);

  // Simulate save with equipment e2 (kept) + e3 (added); e1 removed.
  const savePromise = fixture.componentInstance.onSave({
    modelId: 'm1',
    name: 'v1',
    year: 2026,
    priceClp: 0,
    transmission: 'MANUAL',
    fuel: 'BENCINA',
    engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
    consumptionCityKmL: 0, consumptionHighwayKmL: 0,
    lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
    trunkLiters: 0, airbagCount: 0,
    hasAbs: false, hasEsp: false, hasCruiseControl: false,
    equipment: ['e2', 'e3'],
  });

  // 1) PATCH version (no equipment field)
  const patchReq = http.expectOne(
    (r) => r.url.includes('/api/v1/admin/versions/v1') && r.request.method === 'PATCH',
  );
  expect(patchReq.request.body.equipment).toBeUndefined();
  patchReq.flush({ data: { ...existing, equipmentItems: [] } });

  // 2) DELETE e1
  await new Promise((r) => setTimeout(r, 0));
  const delReq = http.expectOne(
    (r) => r.url.includes('/api/v1/admin/equipment/version/v1/item/e1'),
  );
  expect(delReq.request.method).toBe('DELETE');
  delReq.flush({ data: { detached: true } });

  // 3) POST attach e3
  await new Promise((r) => setTimeout(r, 0));
  const attachReq = http.expectOne(
    (r) => r.url.includes('/api/v1/admin/equipment/attach'),
  );
  expect(attachReq.request.body).toEqual({ versionId: 'v1', itemId: 'e3' });
  attachReq.flush({ data: { versionId: 'v1', equipmentItemId: 'e3' } });

  await savePromise;
  // 4) reload listAll is called
  await new Promise((r) => setTimeout(r, 0));
  const reloadReq = http.expectOne((r) => r.url.includes('/api/v1/versions'));
  reloadReq.flush({ data: { items: [] } });
  await fixture.whenStable();
});
```

- [ ] **Step 2: Correr el test, debe fallar**

Run: `cd apps/frontend && npm run test --include='**/versions-admin.component.spec.ts' --watch=false`
Expected: FAIL porque la nueva lógica no existe (el body incluye `equipment` y no se llama attach/detach).

- [ ] **Step 3: Implementar la lógica en `versions-admin.component.ts`**

Actualizar la interface `VersionRow`:
```ts
interface VersionRow {
  id: string;
  name: string;
  year: number;
  priceClp: number;
  model: { name: string } | null;
  equipmentItems?: { equipmentItem: { id: string; name: string; category: string } }[];
}
interface ModelOption { id: string; name: string; }
type SortKey = 'name' | 'year' | 'priceClp' | 'modelName';
```

Reemplazar `onSave`:
```ts
async onSave(value: Record<string, unknown>): Promise<void> {
  const e = this.dialogEntity();
  const newEquipmentIds = (value['equipment'] as string[] | null) ?? [];
  const { toAdd, toRemove } = this.computeEquipmentDiff(e, newEquipmentIds);

  // 1) Save the version (without the equipment field).
  const { equipment: _ignore, ...versionPayload } = value;
  let versionId: string;
  try {
    if (e) {
      versionId = e.id;
      await this.api.patch(`/admin/versions/${versionId}`, versionPayload);
    } else {
      const created = await this.api.post<{ data: { id: string } }>(
        `/admin/versions`,
        versionPayload,
      );
      versionId = created.data.id;
    }

    // 2) Sync equipment relations.
    for (const itemId of toRemove) {
      await this.api.delete(`/admin/equipment/version/${versionId}/item/${itemId}`);
    }
    for (const itemId of toAdd) {
      await this.api.post(`/admin/equipment/attach`, { versionId, itemId });
    }

    this.dialogEntity.set(undefined);
    await this.load();
  } catch (err) {
    this.error.set((err as Error).message);
  }
}

private computeEquipmentDiff(
  e: VersionRow | null,
  newIds: string[],
): { toAdd: string[]; toRemove: string[] } {
  const oldIds = (e?.equipmentItems ?? []).map((ei) => ei.equipmentItem.id);
  const toAdd = newIds.filter((id) => !oldIds.includes(id));
  const toRemove = oldIds.filter((id) => !newIds.includes(id));
  return { toAdd, toRemove };
}
```

- [ ] **Step 4: Correr el test, debe pasar**

Run: `cd apps/frontend && npm run test --include='**/versions-admin.component.spec.ts' --watch=false`
Expected: PASS (2/2, el nuevo + el existente).

- [ ] **Step 5: Verificar suite completa**

Run: `cd apps/frontend && npm run test --watch=false`
Expected: PASS sin regresiones.

- [ ] **Step 6: Commit**

```bash
git add apps/frontend/src/app/features/admin/versions-admin.component.ts \
        apps/frontend/src/app/features/admin/versions-admin.component.spec.ts
git commit -m "feat(fe): versions-admin onSave syncs equipment via diff

When the dialog emits a save with equipment: string[], the parent
versions-admin component:

1. Strips the equipment field and POSTs/PATCHes the version
2. Computes toAdd (in new but not old) and toRemove (in old but not new)
3. Calls DELETE /admin/equipment/version/:vId/item/:iId for each removed
4. Calls POST /admin/equipment/attach with { versionId, itemId } for each added

For new versions, the POST returns the new id which is then used in
subsequent attach calls. After all sync, the versions list is
reloaded to reflect the new state.

Add a regression test that exercises the full edit flow: PATCH +
DELETE e1 (removed) + POST attach e3 (added) + reload."
```

---

## Task 5: Build + smoke test global

- [ ] **Step 1: Backend tests**

Run: `cd apps/backend && npm run test`
Expected: PASS (105+ tests).

- [ ] **Step 2: Frontend tests**

Run: `cd apps/frontend && npm run test --watch=false`
Expected: PASS (140+ tests).

- [ ] **Step 3: Backend build**

Run: `cd apps/backend && npm run build`
Expected: sin errores TS.

- [ ] **Step 4: Frontend build**

Run: `cd apps/frontend && pnpm ng build --configuration development`
Expected: bundle OK.

- [ ] **Step 5: Smoke test manual**

- Backend dev: `cd apps/backend && pnpm dev`
- Frontend dev: `cd apps/frontend && pnpm start`
- Login como admin.
- Ir a /admin/versions → Nueva versión.
- Sección "Equipamiento" visible con buscador + input vacío.
- Tipear "Blue" → dropdown muestra "Bluetooth".
- Click en opción → chip aparece, desaparece de dropdown.
- Agregar otro item.
- Guardar → POST version + 2 POST attach.
- Editar la misma versión → los items agregados están como chips.
- Quitar un chip, agregar otro, guardar → PATCH + DELETE + POST attach.
- Ir a /admin/equipment → confirmar que los items existen.
- Ir a /brand/toyota/model/corolla → ver equipamiento en la versión.

- [ ] **Step 6: Commit final**

```bash
git add -A
git commit -m "chore: smoke test verified - equipment relation v4 ready" --allow-empty
```

---

## Execution Handoff

After saving the plan, offer execution choice:

1. **Subagent-Driven (recommended)** - dispatch fresh subagent per task, review between tasks.
2. **Inline Execution** - execute tasks in this session with checkpoints.

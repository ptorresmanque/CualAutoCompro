# Mejoras v4: Relacionar Equipamiento con Versiones

**Fecha**: 2026-07-02
**Estado**: Aprobado para implementación
**Apps afectadas**: `apps/backend`, `apps/frontend`

## Objetivo

El backend ya tiene la tabla `VersionEquipment` y los endpoints `POST /admin/equipment/attach` y `DELETE /admin/equipment/version/:vId/item/:iId`, pero **no hay UI** para asignar o desasignar items de equipamiento a versiones. Esta mejora agrega esa UI dentro del form de Nueva/Editar Versión del panel de administración.

**Comportamiento final esperado:**
- Al crear/editar una versión, el admin ve una sección "Equipamiento" en el form.
- Items existentes se muestran como chips. El admin puede buscar por nombre y agregar más, o quitar chips existentes.
- Al guardar, el sistema sincroniza la relación: agrega los nuevos y quita los removidos, usando los endpoints existentes.

## Decisiones cerradas

| Decisión | Valor | Justificación |
|---|---|---|
| Ubicación de la UI | Dentro del form de Nueva/Editar Versión | Recomendado por el usuario; consistente con el form de Modelo (que ya tiene galería). |
| Patrón de selección | Multi-select con buscador + chips | Recomendado; familiar y escalable para listas largas. |
| Backend | Reusar endpoints existentes (no bulk endpoint) | Recomendado; sin migración ni nuevos endpoints. La complejidad del diff la maneja el padre. |
| Listado de items | `GET /admin/equipment` con `include: { deletedAt: null }` | Endpoint ya existe y filtra borrados. |
| Carga inicial del control | `entity.equipmentItems[].equipmentItem.id` mapeado a `string[]` | La lista del dialog debe traer equipmentItems (hoy `listAll` no los incluye). |
| Sincronización en save | Diff client-side: `toAdd` y `toRemove` se computan contra la lista previa | Una sola carga inicial + N requests pequeños en save. |
| Orden de operaciones en save | 1) POST/PATCH versión; 2) sync equipment | La versión debe existir antes de poder attach. |
| Schema changes | Ninguno | `VersionEquipment` ya existe. |
| Migration | Ninguna | Cambios solo en código. |

## Cambios fuera de alcance

- **No se agrega endpoint bulk** (`PUT /admin/versions/:id/equipment` con array). El diff client-side es aceptable para N típico < 20 items.
- **No "agregar todos los items de una categoría"** como acción masiva.
- **No drag-and-drop para reordenar** equipamiento.
- **No UI dedicada** de "Asignar equipamiento" fuera del form de versión.
- **No se exponen los `equipmentItems` en la lista pública de modelos** (`/api/v1/models`). La lista del admin sí los incluye (cambio mínimo en `listAll`).
- **No tests E2E con Playwright** (queda a criterio del usuario probar manualmente la UI).

---

## 1. Backend

### 1.1 `versions.service.listAll` — incluir `equipmentItems`

`apps/backend/src/modules/versions/versions.service.ts`:

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

Justificación: el admin de versiones necesita los items actuales al abrir el form. Tamaño de respuesta sigue siendo bajo (< 20 items por versión típicamente).

**No se modifican los endpoints existentes** (`/admin/equipment/attach`, `/admin/equipment/version/:vId/item/:iId`).

### 1.2 Test de `listAll` con `equipmentItems`

Agregar a `versions.service.spec.ts` (o crear si no existe):
- Test: `listAll` retorna cada versión con `equipmentItems[].equipmentItem.{id,name,category}` populados.
- Test: versiones sin items tienen `equipmentItems: []`.

---

## 2. Frontend

### 2.1 Nuevo `MultiSelectFieldComponent`

`apps/frontend/src/app/features/admin/fields/multi-select-field.component.{ts,html,css,spec.ts}`

Reusable, standalone, OnPush, signals. Sigue el patrón de `gallery-upload-field` y `select-search`.

**API:**

```ts
readonly control = input.required<FormControl<string[] | null>>();
readonly optionsApi = input<string>();          // e.g. '/admin/equipment'
readonly optionLabel = input<string>('name');   // field to display
readonly placeholder = input<string>('Buscar…');
```

**Comportamiento:**

1. En `ngOnInit`, si `optionsApi` está setteado, hace `GET optionsApi` vía `ApiService` y guarda en `remoteOptions` signal.
2. Renderiza chips con `label = option[optionLabel]` para cada id en `control.value`. Cada chip tiene X.
3. Input text + dropdown debajo con opciones filtradas (case-insensitive `includes`).
4. Excluye opciones ya seleccionadas del dropdown.
5. Click en opción → agrega el id al array, marca dirty, cierra dropdown.
6. Click en X de chip → quita el id del array, marca dirty.
7. Manejo de estado: `loading`, `error`, `open` (dropdown).

**Tests** (4-5):
- Renderiza chips para selecciones existentes.
- Carga opciones via `optionsApi`.
- Click en opción agrega al control.
- Click en X de chip quita del control.
- Dropdown excluye opciones ya seleccionadas.

### 2.2 `entity-schemas.ts` — nuevo `FieldKind` y entry

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

`zod` schema de `version` no cambia (no validamos `equipment` desde el form — el padre lo aplica via attach/detach).

### 2.3 `admin-edit-dialog.component.{ts,html}` — wire del nuevo field

- Importar `MultiSelectFieldComponent` y agregarlo al `imports` array.
- En `buildInitialControls`:
  ```ts
  const initial = meta.kind === 'gallery' || meta.kind === 'multiSelect' ? [] : null;
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
  ```
- En el template, agregar el case:
  ```html
  @case ('multiSelect') { <app-multi-select-field [control]="$any(controlFor(meta.field))" [optionsApi]="meta.optionsApi!" [optionLabel]="meta.optionLabel!" [placeholder]="'Buscar equipamiento…'" /> }
  ```
- El form emite el valor con `equipment: string[]` cuando el usuario guarda.

### 2.4 `admin-edit-dialog.component.spec.ts` — tests

Agregar 1-2 tests:
- Versión: el dialog renderiza un `<app-multi-select-field>` para el campo `equipment`.
- El form value incluye `equipment: string[]` cuando se guarda.

### 2.5 `versions-admin.component.ts` — lógica de diff en `onSave`

```ts
async onSave(value: Record<string, unknown>): Promise<void> {
  const e = this.dialogEntity();
  const equipmentIds = (value.equipment as string[] | null) ?? [];
  const { toAdd, toRemove } = this.computeEquipmentDiff(e, equipmentIds);

  // 1) Save the version (without the equipment field)
  const { equipment: _ignore, ...versionPayload } = value;
  let versionId: string;
  try {
    if (e) {
      versionId = e.id;
      await this.api.patch(`/admin/versions/${versionId}`, versionPayload);
    } else {
      const created = await this.api.post<{ data: { id: string } }>(`/admin/versions`, versionPayload);
      versionId = created.data.id;
    }

    // 2) Sync equipment relations
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

Donde `VersionRow` extiende con `equipmentItems`:

```ts
interface VersionRow {
  id: string; name: string; year: number; priceClp: number;
  model: { name: string } | null;
  equipmentItems?: { equipmentItem: { id: string; name: string; category: string } }[];
}
```

### 2.6 `versions-admin.component.spec.ts` — test del diff

Agregar 1 test:
- Crea una versión con `equipment: ['e1', 'e2']` → verifica:
  1. POST `/admin/versions` con payload sin `equipment`
  2. POST `/admin/equipment/attach` para cada id

Agregar 1 test:
- Edita una versión con `entity.equipmentItems = [e1, e2]` y form value `equipment: ['e2', 'e3']` → verifica:
  1. PATCH `/admin/versions/:id` con payload sin `equipment`
  2. DELETE `/admin/equipment/version/:id/item/e1` (removed)
  3. POST `/admin/equipment/attach` con itemId `e3` (added)

---

## 3. Testing strategy

| Capa | Framework | Cobertura mínima |
|---|---|---|
| BE service | Vitest + Prisma real (pglite) | `VersionsService.listAll` ahora incluye `equipmentItems` con shape correcto; versiones sin items tienen array vacío. |
| FE service | N/A | El dialog usa `ApiService` directamente. |
| FE component | Vitest + HttpClientTesting | `MultiSelectFieldComponent`: render, load, add, remove. `AdminEditDialogComponent`: equipment se renderiza vía multi-select. `VersionsAdminComponent`: diff add/remove dispara attach/detach. |

---

## 4. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Race: dos admins editan la misma versión y pisan cambios | Aceptado en MVP (no hay UI de "alguien más está editando"). El diff se calcula contra la última versión conocida. |
| N requests al guardar (N = items agregados/quitados) | Aceptable para N < 20. Si crece, refactor a un endpoint bulk. |
| El campo `equipment` se emite aunque no haya cambiado (over-fetch) | Aceptable. La lógica de diff ignora lo que ya estaba. |
| `listAll` crece con `equipmentItems` (cada versión trae items) | Aceptable. Estimado < 1KB por versión. Si crece, agregar `select` solo con los campos necesarios. |

---

## 5. Criterios de aceptación (resumen)

- [ ] `versions.service.listAll` retorna cada versión con `equipmentItems[].equipmentItem.{id,name,category}`.
- [ ] Al crear una versión, el form tiene una sección "Equipamiento" con chips + buscador multi-select.
- [ ] Al editar una versión, los items actuales aparecen como chips; el admin puede agregar o quitar.
- [ ] Al guardar, los items nuevos se agregan vía `POST /admin/equipment/attach` y los removidos se quitan vía `DELETE`.
- [ ] El backend de tests pasa (90+ tests).
- [ ] El frontend de tests pasa (130+ tests).
- [ ] Build limpio en ambos.
- [ ] No se rompió el comportamiento existente (catálogo público, comparador, favoritos, modelo detalle).

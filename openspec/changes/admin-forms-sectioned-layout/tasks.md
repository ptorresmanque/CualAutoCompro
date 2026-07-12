## 1. FieldMeta.group

- [x] 1.1 Editar `apps/frontend/src/app/features/admin/entity-schemas.ts`: añadir `group?: string` a la interfaz `FieldMeta`
- [x] 1.2 Asignar `group` a los 28 campos de `version` en `FIELD_METAS.version` (9 secciones: Identificación, Motor, Consumo, Dimensiones, Seguridad, Seguros y permisos, Tanque y batería, Recalls, Equipamiento)
- [x] 1.3 Verificar con `grep -c "group:" apps/frontend/src/app/features/admin/entity-schemas.ts` que hay 28 asignaciones

## 2. Sections computed

- [x] 2.1 Editar `apps/frontend/src/app/features/admin/admin-edit-dialog.component.ts`: añadir `Section` interface (`{ id, label, fields }`) y computed `sections()` que agrupa `fieldMetas()` por `group`, preservando orden de primera aparición
- [x] 2.2 Añadir helper `sectionId(label: string): string` que slugifica labels para IDs HTML válidos (ej: `'Identificación'` → `'identificacion'`)
- [ ] 2.3 Tests: añadir scenarios que verifiquen el computed directamente (sin template) — 9 secciones para version, 1 para brand, orden preservado

## 3. Template refactor

- [x] 3.1 Refactor `apps/frontend/src/app/features/admin/admin-edit-dialog.component.html`: reemplazar el `@for (meta of fieldMetas())` plano por `@for (section of sections())` con `<section>` por grupo y `<h3>` condicional cuando `section.label`
- [x] 3.2 Mantener la clase `dialog-field` en cada field — los tests existentes la buscan
- [x] 3.3 Añadir el sticky nav al final del dialog-body, condicional a `sections().length >= 3`

## 4. CSS

- [x] 4.1 Editar `apps/frontend/src/app/features/admin/admin-edit-dialog.component.css`: añadir estilos para `.dialog-sections`, `.dialog-section`, `.dialog-section-header` (uppercase, divider), `.dialog-section-grid` (1-2 col responsive)
- [x] 4.2 Añadir `.dialog-section-nav` (sticky, vertical, rounded container), `.dialog-section-nav-item` (botones con active state)
- [x] 4.3 Media query: ocultar nav en mobile (default `display: none`, mostrar en `@media (min-width: 640px)`)
- [x] 4.4 Ajustar `.dialog-body` para soportar layout con nav lateral (`grid-template-columns: 1fr 12rem` cuando hay nav)

## 5. Scroll-spy

- [x] 5.1 Añadir `viewChildren` signal para referenciar los `<section>` elements del template
- [x] 5.2 En `ngAfterViewInit`, crear `IntersectionObserver` con `rootMargin: '-20% 0px -60% 0px'`, observar cada sección, actualizar `activeSectionId` signal
- [x] 5.3 Añadir `activeSection = computed(() => activeSectionId())`
- [x] 5.4 Limpiar observer en `ngOnDestroy`
- [x] 5.5 Añadir método `scrollToSection(id: string)` que llama `document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })`

## 6. Tests

- [x] 6.1 Tests en `admin-edit-dialog.component.spec.ts`: 10 nuevos tests (9 secciones, cross-contamination, headers, nav, brand sin grupos, sin headers, sin nav, dialog-field count, scrollToSection, slugificación)
- [x] 6.2 No romper tests existentes: `dialog-field` selector sigue encontrando todos los fields (25/25 tests previos pasan + 10 nuevos = 35/35)

## 7. Verificación

- [x] 7.1 `npm run test:fe` — 251/252 pasan (1 pre-existing compare failure)
- [x] 7.2 `npm run build --prefix apps/frontend` — OK
- [ ] 7.3 Smoke test manual: abrir dialog de version, verificar 9 secciones con scroll-spy
- [ ] 7.4 Smoke test manual: verificar que brand/model dialogs no muestran headers ni nav (comportamiento idéntico a fase 1/2)
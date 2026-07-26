# Galería animada (slide horizontal) + soporte AVIF

**Fecha**: 2026-07-26
**Estado**: Aprobado para implementación
**Apps afectadas**: `apps/backend`, `apps/frontend`
**Tipo de cambio**: Mejora UX + extensión de upload pipeline

## Objetivo

Dos cambios relacionados con la **galería de imágenes del detalle de modelo**:

1. **Slide horizontal entre imágenes** del carrusel de `model.component`. Hoy la "transición" es un corte con un fade cosmético; ahora desliza horizontalmente con easing Material.
2. **Soporte AVIF** en el pipeline de uploads. Hoy el backend rechaza `image/avif` aunque el frontend lo ofrezca vía `accept="image/*"`. Se agrega el mime, la validación de magic bytes y se explicita el `accept` en el frontend.

## Decisiones cerradas

| Decisión | Valor | Justificación |
|---|---|---|
| Estilo de animación | Slide horizontal (track que se traslada) | Pedido del usuario. Cross-fade descartado. Slide es el patrón estándar en catálogos de autos. |
| Implementación | CSS transitions (`transform: translateX()`) | El browser interpola `transform` nativamente; más liviano que Angular Animations. |
| Elemento de slide | `<img>` (no `background-image`) | `background-image` no es animable; `<img>` permite que el browser sirva AVIF automáticamente. |
| Duración | 400ms | Comparable al estándar Material (`cubic-bezier(0.4, 0, 0.2, 1)`). |
| Easing | `cubic-bezier(0.4, 0, 0.2, 1)` | Easing Material estándar; consistente con el resto del proyecto. |
| Dirección del slide | Implícita: `translateX(-currentIndex * 100%)`. Next → izquierda, prev → derecha | Sale del delta de `currentIndex`; no requiere señal adicional. |
| Reduced motion | `prefers-reduced-motion: reduce` desactiva la transición | Ya hay un bloque global en `styles.css`. Se refuerza localmente. |
| Magic bytes AVIF | Bytes 4-11 == `"ftypavif"` (ISOBMFF file type box + AVIF brand) | Estándar AVIF (ISO 23000-22). |
| AVIF en frontend | `accept="image/avif,image/webp,image/png,image/jpeg,image/gif"` en ambos `<input type="file">` | Lista explícita para que el picker del SO muestre las opciones correctas. |
| Esquema Prisma | Sin cambios | No toca DB; el servidor de estáticos ya sirve `.avif` por extensión. |

## Cambios fuera de alcance

- **No** se agrega swipe táctil (drag-to-slide). Reservado para follow-up.
- **No** se agrega infinite loop / wrap-around. La galería tiene 3-10 imágenes máx.
- **No** se agrega skeleton / loading state.
- **No** se hace conversión automática de AVIF en servidor. Browsers modernos (Chrome 85+, Firefox 93+, Safari 16+) lo soportan.
- **No** se toca el `compare.component` ni el resto de `model.component`. Sólo la sección "carousel".
- **No** se agregan tests E2E (Playwright). Se valida con specs de backend + manual QA.

## 1. Frontend

### 1.1 `apps/frontend/src/app/features/model/model.component.html`

Refactor de la sección `<section class="mb-8" data-testid="carousel">` (líneas 43-123). Mantiene:
- wrapper `relative h-[320px] md:h-[520px] overflow-hidden border border-ink bg-paper-warm group`.
- comportamiento de hover para mostrar flechas.
- counter, flechas, dots, estado vacío.

Reemplaza el único `<div>` con `background-image` por un `<div class="carousel-track">` que aloja todos los `<img>`.

```html
@if (hasGallery()) {
  <div class="carousel-track"
       [style.transform]="'translateX(' + (-currentIndex() * 100) + '%)'"
       data-testid="carousel-track">
    @for (url of galleryUrls(); track url; let i = $index) {
      <img class="carousel-slide"
           [src]="toAbsoluteUploadUrl(url)"
           [attr.alt]="'Imagen ' + (i + 1) + ' de ' + galleryUrls().length + ' del modelo'"
           [attr.aria-hidden]="i === currentIndex() ? null : 'true'"
           loading="lazy" decoding="async"
           data-testid="carousel-image" />
    }
  </div>
  <!-- counter, flechas, dots: sin cambios -->
}
```

### 1.2 `apps/frontend/src/app/features/model/model.component.css`

Adicionar al final:

```css
.carousel-track {
  display: flex;
  width: 100%;
  height: 100%;
  transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}

.carousel-slide {
  flex: 0 0 100%;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
}

@media (prefers-reduced-motion: reduce) {
  .carousel-track { transition: none; }
}
```

Las reglas `.carousel`, `.carousel-image`, `.carousel-counter` (la local, no `model-gallery-counter`), `.carousel-empty`, `.carousel-empty-icon`, `.carousel-dot-row` quedan como dead-code legacy. Se dejan para no introducir churn; pueden limpiarse en una PR separada.

### 1.3 `apps/frontend/src/app/features/model/model.component.ts`

Sin cambios. `toAbsoluteUploadUrl` ya es accesible desde el template (re-export del import). El estado (`currentIndex`, `prev`, `next`, `goTo`) es exactamente lo que el slide consume.

### 1.4 `apps/frontend/src/app/features/admin/fields/image-upload-field.component.html`

```diff
- <input type="file" accept="image/*" …>
+ <input type="file" accept="image/avif,image/webp,image/png,image/jpeg,image/gif" …>
```

### 1.5 `apps/frontend/src/app/features/admin/fields/gallery-upload-field.component.html`

Idéntico cambio.

## 2. Backend

### 2.1 `apps/backend/src/modules/uploads/uploads.controller.ts`

Agregar `"image/avif": "avif"` a `ALLOWED_MIMES` y un case en `hasValidImageSignature`:

```ts
case "image/avif": {
  if (buffer.length < 12) return false;
  return buffer.subarray(4, 12).toString("ascii") === "ftypavif";
}
```

### 2.2 `apps/backend/src/modules/uploads/uploads.controller.spec.ts`

Tres specs nuevos:

1. `200 OK` con un AVIF sintético (12 bytes `ftypavif` + padding) → archivo aceptado con `.avif`.
2. `400` con bytes JPEG pero mimetype `image/avif` → rechazado por magic bytes.
3. `400` con mimetype `application/pdf` (control existente, ya cubierto).

## 3. Verificación

```bash
# Backend
npm -w apps/backend run test -- uploads.controller.spec.ts
npm -w apps/backend run build

# Frontend
npm -w apps/frontend run check:design
npm -w apps/frontend run test
npm -w apps/frontend run build

# Manual
# 1. /modelos/<slug> → usar flechas, dots, teclado → slide debe desplazar
# 2. macOS Accesibilidad → Reduce motion → recargar → cambio instantáneo
# 3. Admin → Editar modelo → Subir .avif → backend lo acepta
# 4. Admin → Subir .txt renombrado a .avif → backend rechaza 400
```

## 4. Archivos afectados

| Archivo | Cambio |
|---|---|
| `apps/frontend/src/app/features/model/model.component.html` | Refactor bloque carousel |
| `apps/frontend/src/app/features/model/model.component.css` | Aditivo: `.carousel-track`, `.carousel-slide`, reduced-motion |
| `apps/frontend/src/app/features/admin/fields/image-upload-field.component.html` | `accept` actualizado |
| `apps/frontend/src/app/features/admin/fields/gallery-upload-field.component.html` | `accept` actualizado |
| `apps/backend/src/modules/uploads/uploads.controller.ts` | Mime `image/avif` + magic bytes |
| `apps/backend/src/modules/uploads/uploads.controller.spec.ts` | 2 specs AVIF |

Sin migraciones Prisma. Sin dependencias nuevas. Sin cambios de contrato de API (el POST ya devuelve `{ url, filename, size, mime }`).

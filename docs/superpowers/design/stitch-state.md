# cualautocompro — Stitch design system aplicado

> **Fecha:** 2026-06-30
> **Estado:** Tokens reales aplicados al frontend el 2026-06-30
> **Stitch project:** `projects/10911211152400254684`
> **Design system id:** `assets/0427c7f15271491e8415ade7ecd6dd9a` ("Transparencia Automotriz")

## Sistema aplicado

| Token | Valor | Notas |
|---|---|---|
| **Tipografía — body** | Hanken Grotesk (400, 500, 600, 700, 800) | Único typeface del sistema; headlines también |
| **Tipografía — headlines** | Hanken Grotesk (mismo) | Mapear `font-display` a la misma fuente preserva las clases existentes |
| **Color primario** | Teal `#008080` | `brand.500`, `--color-brand-600` |
| **Color primario oscuro** | `#006565` | `brand.700` |
| **Color surface-tint** | `#006a6a` | `brand.600` (hover) |
| **Color surface (background)** | `#f8fafa` | `surface.muted` |
| **Color on-surface (fg)** | `#191c1d` | `ink.DEFAULT` |
| **Color on-surface-variant (muted)** | `#3e4949` | `ink.muted` |
| **Color outline-variant** | `#bdc9c8` | `border.DEFAULT` |
| **Color outline** | `#6e7979` | `ink.subtle` / `border.strong` |
| **Color warn-light** | `#fef3c7` | fondo avisos |
| **Color warn-dark** | `#92400e` | texto avisos |
| **Roundness base (ROUND_EIGHT)** | 8px | `rounded` por defecto |
| **Roundness vehicle-cards** | 12px | `rounded-lg` |
| **Roundness M3 elevation Level 2** | `0 4px 12px rgba(0, 128, 128, 0.08)` | `shadow-e2` (teal tint) |
| **Modo** | LIGHT (v1) | Dark mode queda para v2 |
| **Color variant** | FIDELITY | Tono comercial confiable |

## Mapeo aplicado

Para no romper los 90+ usos de las clases `bg-brand-N`, `text-brand-N`, `border-brand-N`, `ink-muted`, `rounded-md`, etc., el mapeo numérico se preserva con valores ajustados a los colores Material 3 del sistema:

- `brand-50` … `brand-900` → escala teal M3 (centered en `#008080`).
- `ink.DEFAULT` / `ink.muted` / `ink.subtle` → `on-surface` / `on-surface-variant` / `outline`.
- `border.DEFAULT` / `border.strong` → `outline-variant` / `outline`.
- `surface.DEFAULT` / `surface.muted` → `surface-container-lowest` / `background`.
- `borderRadius.DEFAULT` → 0.5rem (8px). `borderRadius.lg` → 0.75rem (12px, vehicle cards).
- `font-family.sans` y `font-family.display` ambos → `Hanken Grotesk`.

## Mockups generados

| Pantalla | Screen ID | HTML local | Screenshot URL |
|---|---|---|---|
| Catálogo (explorar) | `aecc7f20999441b6a4bcbbdc67178623` | `mockups/catalog.html` | `https://lh3.googleusercontent.com/aida/AP1WRLvn20Pe3YW3A3XdzdmLi10xEnuOsqsXsqGVco-8VRG2avlA7rTVMec6N_5ctiaA1Q0jvmAznZwdthzW0zWlGdLTnFeqs-xLJ4TtLsROyb6hmBsKcMRljhJc-2XT3gf1G-Qf0ihxLKZ92nzaLMvDzvq86cW-SWlYQ4RE7f-uCRfhnLlwd6wX4EkBR6OjZBsGH3bFoHJ_loAH2uOhlMEM6XHpKTRRmW7NHlz8WPpWLJRz6WNVLyTu11FNLhmR` |
| Detalle de modelo (con carrusel) | `d1dbd05b0a4846ef8abd7f6fd052b707` | `mockups/model-detail.html` | (ver stitch project arriba) |
| Comparación (3 autos con diffs amber) | `8d7a3e212f114b3b85702b62541a1be8` | `mockups/compare.html` | (ver stitch project) |
| Login | `f77f9013bb8945b8a031fde338cf7c59` | `mockups/login.html` | (ver stitch project) |
| Registro | `537b45499a444d21bdd286a611f92cdc` | `mockups/register.html` | (ver stitch project) |
| Mi cuenta / comparaciones | `01018474086740808bd01d2a1e23d03b` | `mockups/account.html` | (ver stitch project) |
| Landing (referencia original) | `4e4e0fe806d7495a8230ef48d64a9e0f` | (no descargada) | (ver stitch project) |
| Logo | `c1aa15f83e5d4667a5f326d283fe6c0c` | (SVG en stitch) | — |

Cada HTML es descargable vía la API `htmlCode.downloadUrl` del screen correspondiente.

## Decisiones de UX (confirmadas con el mockup)

- **Catálogo**: filtros en sidebar izquierdo; cards con "Más vendido" pill top-left; botón "Comparar" full-width teal.
- **Detalle**: carrusel 4 imágenes con flechas + dots + counter; tabs Especificaciones / Versiones / Equipamiento; FAB "Guardar y compartir".
- **Comparación**: 3 cards arriba (precio destacado + 4 specs); tabla por secciones con filas amber highlight para diffs; FAB "Guardar y compartir".
- **Auth (login/register)**: centrada max-w-md; inputs con focus border teal 2px stroke; divider "o continúa sin cuenta".
- **Mis comparaciones**: lista de cards con thumbnails, slug mono + copiar URL, acciones "Ver"/"Eliminar".

## Cambios físicos en el repo

| Archivo | Cambio |
|---|---|
| `apps/frontend/tailwind.config.js` | Reescrito: paleta teal M3, Hanken Grotesk, ROUND_EIGHT, sombras e1/e2/e3 |
| `apps/frontend/src/styles.css` | Vars M3 aplicadas, fuentes Hanken, headings con la misma fuente |
| `apps/frontend/src/index.html` | Google Fonts link → Hanken Grotesk único |
| `apps/backend/prisma/schema.prisma` | Añadido `galleryUrls String[] @default([])` a Model |
| `apps/backend/prisma/migrations/20260630152918_add_gallery_urls/` | Nueva migración aplicada a dev + test DB |
| `apps/backend/prisma/catalog.ts` | Helper `galleryUrls(name)` + 4 placeholders por modelo (30 modelos) |
| `apps/backend/prisma/seed.ts` | Upsert model incluye `galleryUrls` |
| `apps/backend/src/modules/models/models.service.ts` | `enriched` incluye `galleryUrls`; `defaultVersion` fixed para strict TS |
| `apps/frontend/src/app/features/model/model.component.{ts,html,css}` | Carrusel completo: signals, template, estilos, ARIA, keyboard nav |
| `apps/frontend/src/app/features/model/model.component.spec.ts` | 7 specs unitarios del carrusel |

## Pendientes para v2

- **Imágenes reales**: reemplazar `placehold.co` por URLs de sitios oficiales (Toyota.cl, Chevrolet.cl, etc.). v1 está OK para demo.
- **Mobile swipe**: carrusel solo desktop por ahora (keyboard nav sí funciona). En mobile sin `onKey` se necesitan Hammer.js o pointer events.
- **Dark mode**: el sistema Material 3 ya contempla `--color-*` para oscuro, solo falta activar `prefers-color-scheme`.
- **i18n**: solo español chileno; v2 podría considerar inglés/portugués para mercado regional.
- **CSRF tokens**: state-changing con cookie-only auth tiene vulnerabilidad; añadir Origin header check + token cuando se incorporen más endpoints con mutaciones.
- **Mockups mobile** de las 5 pantallas (solo desktop por ahora).

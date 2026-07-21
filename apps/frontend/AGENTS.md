# Design System — Frontend

Esta guía aplica a **todo cambio en `apps/frontend/`**. Leela antes de tocar
HTML, CSS o TSX. El sistema se llama **"Pizarra Digital"** y se sostiene
sobre tokens, tipografías y un puñado de patrones reusables. Si un cambio lo
rompe, también rompe el build (ver `npm run check:design`).

## 1. Tokens (en `src/styles.css`)

Usá SIEMPRE los custom properties; nunca hex planos ni `tailwindcss/colors`.

- `--paper`         fondo casi blanco frío (#F7F9FC)
- `--paper-warm`    superficies tibias (tablas, header de cards)
- `--paper-cool`    tarjetas y campos
- `--ink`           texto principal, bordes duros
- `--ink-muted`     texto secundario
- `--graphite`      labels, dt, captions
- `--rule`          hairlines, separadores 1px
- `--engine`        acento steel-blue para CTAs y links
- `--engine-dark`   hover / estado activo
- `--caution*`      estados de error/advertencia

Tipografías:
- `--font-display`  Archivo Black (h1, h2, hero)
- `--font-sans`     IBM Plex Sans (cuerpo, botones, inputs)
- `--font-mono`     IBM Plex Mono (labels, dt, captchas)

## 2. Patrones reusables (utility classes)

Definidos en `src/styles.css`. Reusá; no reinventes.

| Patrón         | Cuándo usarlo                                  |
| -------------- | ---------------------------------------------- |
| `.stamp-label` | Etiqueta mono pequeña (n° de sección, leyenda) |
| `.ficha`       | Card "técnica" rectangular con borde ink       |
| `.ficha-head`  | Header mono con la marca dentro de la ficha    |
| `.ficha-image` | Imagen 16/9 con fondo paper-warm               |
| `.ficha-body`  | Body con padding estándar                      |
| `.ficha-name`  | Título del modelo (1.25rem)                    |
| `.ficha-segment` | Chip de segmento a la derecha del nombre     |
| `.ficha-rule`  | Hairline dashed entre título y datos           |
| `.ficha-data`  | `<dl>` con filas label / valor                |
| `.ficha-price` | Display del precio, color ink                  |
| `.ficha-unit`  | Sufijo "CLP" en mono                           |
| `.ficha-compare` | Botón rectangular ink → engine (40px)        |
| `.compare-save-bar/.compare-save-input/.compare-save-btn` | Barra "Guardar" |
| `.settings-form/.settings-input/.settings-message/.settings-btn-danger` | Formularios |
| `.ficha--static`  | Variante sin hover (formularios, settings)    |
| `.ficha--danger`  | Variante con paleta engine (zonas peligrosas)  |

## 3. Jerarquía de color de los CTAs

El sistema usa **dos colores deliberadamente**. No es una inconsistencia, es
la jerarquía visual:

- **CTA primario** = `var(--ink)` (#0F172A, casi negro slate)
  Fondo negro, texto paper, mayúsculas IBM Plex Sans 600.
  En **hover** vira a `var(--engine)`.
  Se usa para la acción principal de la pantalla: "Comparar", "Iniciar
  sesión", "Crear cuenta", "Guardar perfil", "Guardar comparación",
  "Cambiar contraseña".

- **Acento** = `var(--engine)` (#1E40AF, azul steel)
  Se usa para **cuatro cosas** y solo esas cuatro:
  1. Links inline ("Ver todos", "Ver enlace público", "Comparar autos").
  2. Hover de los CTAs primarios.
  3. Mensajes informativos (caja `bg-engine-50` con `text-engine-dark`).
  4. Sello "POPULAR" rotado sobre cards destacadas.
  5. CTAs secundarios outline (`mat-stroked-button color="primary"`,
     "Limpiar" en filtros, "Iniciar sesión" en la navbar cuando no hay
     sesión).

- **No se hace**: un CTA primario en azul steel. Eso borra la jerarquía
  porque el azul deja de ser acento y compite con el badge POPULAR y los
  links.

Para verificarlo: si abrís la app y el único azul visible en una pantalla
es un link, un sello, un mensaje o un botón secundario, el sistema está
correcto. Si un botón "Guardar" / "Comparar" / "Iniciar sesión" se ve azul
en estado normal (no en hover), hay que arreglarlo.

## 3. Lo que NO se hace

- ❌ `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full` (radio es 2px o 0)
- ❌ `shadow-lg`, `shadow-xl`, `shadow-2xl` (sombras son hairlines o 0 6px 0 -2px ink)
- ❌ `bg-blue-500`, `bg-red-500`, `text-green-700` (usar tokens engine/warn)
- ❌ `mat-flat-button color="primary"` sin override (queda azul M3 por defecto)
- ❌ `mat-fab extended` con tokens M3 (rompe el sistema)
- ❌ Fuentes externas (Archivo Black, IBM Plex) — usar siempre los tokens
- ❌ `display: flex` con `align-items: center` + `gap` para "centrar" sin contexto
- ❌ `mat-card appearance="outlined"` para layouts grandes (usar `.ficha`)

## 4. Nuevas pantallas

- Cabecera con `stamp-label` ("N° 0xx · …") + `font-display` para el h1.
- Layout principal dentro de `mx-auto max-w-7xl px-4 md:px-8`.
- Datos tabulares: `<dl class="ficha-data">` con `<div class="ficha-row"><dt/><dd/></div>`.
- Botones primarios: `.ficha-compare` con `<span>Label</span>` adentro.
- Botones de peligro: `.settings-btn-danger` (outline engine, sin relleno rojo).
- Mensajes: contenedor con `border border-engine bg-engine-50 ...` + `stamp-label` al inicio.

## 5. Validar antes de commitear

```bash
npm -w apps/frontend run build        # TypeScript + Angular build
npm -w apps/frontend run check:design # linter del design system (estricto)
npm -w apps/frontend test             # specs
```

`check:design` escanea **todo `apps/frontend/src/**`**. Si falla, el cambio
introdujo una clase prohibida (rounded-*, shadow-*, paleta Tailwind cruda,
mat-fab primary, mat-card outlined como layout). Resolvelo antes de pedir
review. Para casos legítimos (ej. una sombra custom para un toast), agregá
la excepción a `apps/frontend/scripts/check-design.mjs` con comentario
explicando por qué.

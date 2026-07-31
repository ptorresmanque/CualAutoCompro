# Design System — Frontend

Esta guía aplica a **todo cambio en `apps/frontend/`**. Leela antes de tocar
HTML, CSS o TSX. El sistema se llama **"Pizarra Digital 2.0"** y se sostiene
sobre tokens, tipografías y un puñado de patrones reusables. Si un cambio lo
rompe, también rompe el build (ver `npm run check:design`).

## 1. Tokens (en `src/styles.css`)

Usá SIEMPRE los custom properties; nunca hex planos ni `tailwindcss/colors`.
`tailwind.config.js` es un **espejo** de estos valores: si cambiás un hex acá,
cambialo allá también. El linter valida los contrastes contra el `:root` de
`styles.css`, no contra el config de Tailwind.

### Neutros

| Token           | Hex       | Uso                                      |
| --------------- | --------- | ---------------------------------------- |
| `--paper-cool`  | `#FFFFFF` | tarjetas y campos                        |
| `--paper`       | `#F5F8FC` | fondo del sitio                          |
| `--paper-warm`  | `#E9EFF6` | superficies tibias (tablas, ficha-head)  |
| `--graphite`    | `#56657A` | labels, `dt`, captions — mono 11px       |
| `--ink-muted`   | `#3D4A5C` | texto secundario                         |
| `--ink`         | `#0B1220` | texto principal, bordes duros, CTA       |
| `--rule`        | `#D8E1EC` | hairlines decorativos, separadores 1px   |
| `--rule-strong` | `#7A8CA5` | **bordes de control** (inputs, botones)  |

`--graphite` es el token más delicado del sistema: pinta mono 11px sobre
`--paper-warm`, la peor combinación que existe acá. Cualquier valor más claro
que `#56657A` cae bajo 4.5:1 y el linter lo rechaza.

`--rule` vs `--rule-strong`: el hairline decorativo no necesita contraste, pero
el borde de un control sí — WCAG 1.4.11 pide 3:1. Si el borde es la única
señal de que algo es interactivo, va `--rule-strong`.

### Acento

| Token          | Hex       | Uso                                |
| -------------- | --------- | ---------------------------------- |
| `--engine`     | `#1D4ED8` | acento steel-blue: links, sellos   |
| `--engine-dark`| `#1E3A8A` | hover / estado activo              |
| `--engine-50`  | `#EFF6FF` | fondo de mensajes informativos     |
| `--engine-100` | `#DBEAFE` | fondo de celdas / chips destacados |
| `--engine-200` | `#BFDBFE` | bordes sobre fondo `engine-50`     |

`--engine-dark` **tiene que ser más oscuro** que `--engine`: es el hover. El
linter lo verifica por luminancia, no por nombre.

### Estados semánticos

Tres colores, tres significados. No se intercambian.

| Token         | Hex       | Cuándo                                          |
| ------------- | --------- | ----------------------------------------------- |
| `--caution*`  | `#B45309` | **aviso / nota legal** — disclaimer, "sin dato" |
| `--danger*`   | `#B91C1C` | **error** — falló algo, el usuario debe actuar  |
| `--success*`  | `#15803D` | **confirmación** — la acción salió bien         |

Cada uno tiene su trío `--x` (base), `--x-light` (fondo) y `--x-dark` (texto
sobre ese fondo). En Tailwind son `caution-*`, `danger-*`, `success-*`.
`warn-*` quedó como alias histórico de `caution-*`.

El error más común acá es pintar un error en ámbar porque "es un mensaje".
Si el usuario tiene que arreglar algo, es `danger`. Si solo se le está
informando de una limitación, es `caution`.

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
| `.ficha--danger`  | Variante con paleta danger (zonas peligrosas)  |

## 3. Jerarquía de color de los CTAs

El sistema usa **dos colores deliberadamente**. No es una inconsistencia, es
la jerarquía visual:

- **CTA primario** = `var(--ink)` (#0B1220, casi negro slate)
  Fondo negro, texto paper, mayúsculas IBM Plex Sans 600.
  En **hover** vira a `var(--engine)`.
  Se usa para la acción principal de la pantalla: "Comparar", "Iniciar
  sesión", "Crear cuenta", "Guardar perfil", "Guardar comparación",
  "Cambiar contraseña".

  ⚠️ Para los botones **Material** (`mat-flat-button` / `mat-mdc-unelevated-button`)
  no alcanza con redefinir `--mdc-filled-button-container-color`: Material dejó
  de leer ese token y ahora usa **`--mat-button-filled-container-color`**, que
  por defecto apunta a `--mat-sys-primary` (azul). Hay que setear los dos, o el
  CTA sale azul silenciosamente. Ver el bloque
  `.mat-mdc-unelevated-button.mat-primary` en `styles.css`.

- **Acento** = `var(--engine)` (#1D4ED8, azul steel)
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

**El radio del sistema es `0`, `2px` o `4px`** (o sus equivalentes en `rem`:
`0.125rem` y `0.25rem`). No hay un cuarto valor.

- ❌ `rounded-xl`, `rounded-2xl`, `rounded-3xl`, `rounded-full`
- ❌ `border-radius` en CSS crudo con cualquier otro valor.
  **Excepción:** `50%` y `9999px` están permitidos. Son formas —círculo y
  píldora— dictadas por el control, no decisiones de branding: los usan los
  thumbs del range slider y un chip del admin. No la borres por "limpieza".
- ❌ `text-white`, `bg-white`. El blanco del sistema es `--paper-cool`
  (`bg-paper-cool` / `text-paper`); el de Tailwind saltea la paleta y con ella
  el chequeo de contraste.
- ❌ `shadow-lg`, `shadow-xl`, `shadow-2xl` (sombras son hairlines o 0 6px 0 -2px ink)
- ❌ `bg-blue-500`, `bg-red-500`, `text-green-700` (usar tokens engine/warn)
- ❌ Un contenedor con `role="alert"` pintado con la paleta informativa
  (`bg-engine-50`, `border-engine`, `text-engine-dark`). `engine` es
  información, `danger` es error: un error en azul pálido es indistinguible
  del banner "estás viendo una comparación guardada".
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
- Botones de peligro: `.settings-btn-danger` (outline `danger`, sin relleno).
  Es outline y no relleno rojo porque no es la acción principal de la pantalla,
  pero el color es `danger`: borrar la cuenta es "el usuario tiene que actuar",
  que es lo que §1 le reserva a esa paleta. En azul `engine` —como estuvo— una
  acción irreversible se veía igual que un mensaje informativo.
- Mensajes: contenedor + `stamp-label` al inicio. **La paleta depende de qué
  mensaje es**, y el linter la hace cumplir (regla `semantic-alert`):
  - **Informativo** (contexto, no pasó nada malo):
    `border border-engine bg-engine-50 px-4 py-3 text-sm text-engine-dark`,
    **sin** `role="alert"`. Ej.: el banner "estás viendo una comparación
    guardada" en el comparador.
  - **Error** (falló algo, el usuario tiene que actuar):
    `border border-danger bg-danger-light px-4 py-3 text-sm text-danger-dark`
    **con** `role="alert"`. Un error pintado con la paleta informativa es
    indistinguible del banner de arriba, así que `check:design` lo rechaza.
  - **Aviso / nota legal**: el trío `caution-*`.

## 5. Validar antes de commitear

```bash
npm -w apps/frontend run build        # TypeScript + Angular build
npm -w apps/frontend run check:design # linter del design system (estricto)
npm -w apps/frontend test             # specs
```

`check:design` escanea **todo `apps/frontend/src/**`**, incluido el panel de
admin. Si falla, el cambio introdujo una clase prohibida (rounded-*, shadow-*,
paleta Tailwind cruda, `text-white`/`bg-white`, un `border-radius` fuera del
sistema, mat-fab primary, mat-card outlined como layout). Resolvelo antes de
pedir review. Para casos legítimos (ej. una sombra custom para un toast),
agregá la excepción a `apps/frontend/scripts/check-design.mjs` con comentario
explicando por qué.

Reglas línea a línea que corre hoy: `rounded-soft`, `shadow-soft`,
`tailwind-palette`, `raw-white`, `raw-radius`, `mat-fab-primary`,
`mat-card-layout`. `raw-radius` evalúa `px`, `%` y `rem`, y entiende el
shorthand (`0 0 2px 2px`) y los `!important`.

Además de las reglas línea a línea, el linter corre tres chequeos que miran
más que una línea:

- **`semantic-alert`** — por cada `role="alert"` recorta la etiqueta que lo
  contiene y falla si su `class` usa la paleta informativa (`bg-engine-50`,
  `border-engine`, `text-engine-dark`) en vez de `danger`. No es línea a línea
  porque acá el `class` y el `role` casi nunca comparten línea. Existe porque
  ocho cajas de error nacieron en azul pálido y hubo que migrarlas; sin la
  regla, la novena nace igual. No se reporta si la etiqueta ya trae paleta
  `danger`/`caution`/`success` propia (ahí la mención a `engine` es otra cosa,
  típicamente un hover).

- **`undefined-token`** — junta todos los `var(--x)` de `src/**` y falla si
  alguno no está definido en el `:root` de `styles.css` y tampoco trae
  fallback. Existe porque `--engine-50`, `--engine-100` y `--engine-200`
  estuvieron usados y sin definir, y los fondos que dependían de ellos
  simplemente no se pintaban. Los `--mat-*` / `--mdc-*` quedan fuera: los
  define el prebuilt theme de Material.
- **`contrast-aa`** — una tabla `CONTRAST_PAIRS` en el script declara qué
  pares fg/bg garantiza el sistema y con qué ratio mínimo (4.5 para texto,
  3.0 para bordes de control). Si tocás un hex de la paleta y rompés un par,
  el build falla con el ratio exacto. **Si agregás un token de color que se
  combine con otro, agregá el par a esa tabla** — un par que no está
  declarado no está garantizado. La misma regla verifica que
  `--engine-dark` sea más oscuro que `--engine`.

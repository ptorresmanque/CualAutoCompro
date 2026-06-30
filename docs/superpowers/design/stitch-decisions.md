# cualautocompro — Decisiones de diseño

> **Fecha:** 2026-06-30
> **Estado:** Pendiente de regenerar con Stitch cuando el MCP esté disponible
> **Aplicado a:** `apps/frontend/tailwind.config.js` + `apps/frontend/src/styles.css` (pendiente de actualización en Task 2.1)

## Sistema planeado

| Token | Valor planeado | Justificación |
|---|---|---|
| **Tipografía — body** | Inter (400, 500, 600, 700) | Legibilidad en datos densos (fichas técnicas, tablas) |
| **Tipografía — headlines** | Manrope (600, 700, 800) | Display moderno, geométrico, sin caer en formalidad |
| **Color primario** | Teal `#0e7490` | Confianza + frescura (auto + Chile); no es el azul genérico automotriz, evita parecer un banco |
| **Color variante** | Vibrant (alto contraste) | Datos requieren jerarquía clara |
| **Modo** | Light (v1) | Dark mode queda para v2 |
| **Roundness** | 12px (ROUND_TWELVE) | Moderno, friendly, denso |
| **Estilo general** | Dashboard-like, denso en datos pero legible | Filtros + grids + tablas de comparación |

## Tokens Tailwind v3

```js
// tailwind.config.js (extracto)
colors: {
  brand: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#0ea5b7',
    600: '#0e7490', // primary
    700: '#155e75',
    800: '#164e63',
    900: '#083344',
  },
  ink: {
    DEFAULT: '#0f172a',
    muted: '#64748b',
    subtle: '#94a3b8',
  },
  warn: {
    light: '#fef3c7',
    DEFAULT: '#f59e0b',
    dark: '#92400e',
  },
  border: {
    DEFAULT: '#e2e8f0',
    strong: '#cbd5e1',
  },
  surface: {
    DEFAULT: '#ffffff',
    muted: '#f8fafc',
  },
},
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
},
borderRadius: {
  DEFAULT: '12px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  full: '9999px',
},
```

```css
/* styles.css */
:root {
  --color-brand-500: #0ea5b7;
  --color-brand-600: #0e7490;
  --color-bg: #ffffff;
  --color-fg: #0f172a;
  --color-muted: #64748b;
  --color-accent: #0e7490;
  --color-warn-bg: #fef3c7;
  --color-warn-fg: #92400e;
  --color-border: #e2e8f0;
  --radius: 12px;
}

body {
  font-family: 'Inter', system-ui, sans-serif;
  color: var(--color-fg);
  background: var(--color-bg);
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, .display {
  font-family: 'Manrope', 'Inter', system-ui, sans-serif;
  letter-spacing: -0.01em;
}
```

## Pantallas a maquetas

| Pantalla | Ruta | Notas |
|---|---|---|
| Catálogo (explorar) | `/` | Filtros laterales + grid de cards; ~24 cards visibles |
| Detalle de modelo | `/brand/:slug/model/:slug` | Hero + tabs (Especificaciones, Versiones, Equipamiento) |
| Comparación | `/compare?ids=...` | Cards arriba + tabla expandible por secciones con diffs |
| Login | `/login` | Formulario centrado, branding consistente |
| Registro | `/register` | Mismo estilo |
| Mi cuenta / comparaciones | `/account/comparisons` | Lista de comparaciones guardadas con su slug público |

## Por qué no hay mockups reales aún

El MCP de Stitch devolvió `Request contains an invalid argument` en cada llamada al intentar crear el sistema de diseño. La causa exacta no fue diagnosticable desde el cliente (error genérico); los `stitch_*` tools siguen listados pero son inutilizables en esta sesión.

**Mitigación actual:** los defaults de Tailwind del Task 2.1 reflejan los tokens planeados (paleta teal #0e7490, tipografía Inter+Manrope, radio 12px). Mockups visuales se regeneran en v2 cuando Stitch responda.

**Acción al reanudar Stitch:**
```bash
# 1. Crear el design system
curl -X POST "$STITCH_API/projects/10911211152400254684/design-system" -d @ds.json

# 2. Generar mockups de las 5 pantallas
stitch_generate_screen_from_text --projectId 10911211152400254684 --prompt "..."

# 3. Exportar a docs/superpowers/design/mockups/
```

## Decisiones de UX

- **Catálogo**: filtros en sidebar izquierdo (sticky). Cards muestran: nombre + marca + segmento + precio destacado + chip "Comparar". Al click, versión se agrega al `CompareStore` (max 3).
- **Comparación**: 3 cards con precio destacado, potencia, consumo, transmisión. Debajo, tabla con secciones expandibles (Specs, Precio/Año, Equipamiento, Mantención). Filas con valores distintos llevan fondo ámbar (`bg-warn-100`) y borde (`border-warn-300`).
- **Disclaimer** siempre visible en resultados de precios y mantención: "Precios referencia año 2026, confirmar en concesionario" / "Valor estimado referencial".
- **Empty state** en comparación cuando no hay autos seleccionados: ilustración simple + CTA "Explorar catálogo".
- **Loading states**: skeleton cards en grid; spinner en botones de submit (login, register, save comparison).
- **Errors**: mensajes en línea bajo inputs (form-validation) + toast en errores globales (auth fail, network).

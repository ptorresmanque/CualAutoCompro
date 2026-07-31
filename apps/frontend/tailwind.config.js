/**
 * cualautocompro — design tokens.
 *
 * Sistema "Pizarra Digital 2.0" — neutros slate, fondo blanco frío casi-puro,
 * acento steel-blue reservado para CTAs y estados activos. Máxima
 * legibilidad por contraste, sin el creep cálido de paletas anteriores.
 * IBM Plex (Sans + Mono) para texto, Archivo Black para display.
 *
 * Los nombres de las escalas (`engine-*`, `paper-*`, `ink-*`) se preservaron
 * para que un find/replace o un componente suelto siga funcionando con la
 * nueva paleta — solo cambian los hex.
 *
 * ESPEJO de la paleta base de `src/styles.css`. Si cambiás un hex acá,
 * cambialo allá: `scripts/check-design.mjs` valida los contrastes contra
 * el `:root` de styles.css, no contra este archivo.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,css}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F5F8FC',
          warm:    '#E9EFF6',
          cool:    '#FFFFFF',
        },
        ink: {
          DEFAULT: '#0B1220',
          muted:   '#3D4A5C',
          subtle:  '#56657A',
        },
        graphite: '#56657A',
        rule: {
          DEFAULT: '#D8E1EC',
          strong:  '#7A8CA5',
        },
        engine: {
          DEFAULT: '#1D4ED8',
          dark: '#1E3A8A',
          50:  '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        caution: {
          DEFAULT: '#B45309',
          light:   '#FEF3C7',
          dark:    '#78350F',
        },
        // Alias histórico de `caution` — se mantiene para los avisos legítimos
        // (disclaimer, nota legal). Los errores usan `danger`.
        warn: {
          light: '#FEF3C7',
          DEFAULT: '#B45309',
          dark: '#78350F',
        },
        danger: {
          DEFAULT: '#B91C1C',
          light:   '#FEE2E2',
          dark:    '#7F1D1D',
        },
        success: {
          DEFAULT: '#15803D',
          light:   '#DCFCE7',
          dark:    '#14532D',
        },
        // Acá vivían tres familias de alias —`blueprint`, `border` y `surface`—
        // que duplicaban hex ya nombrados (`engine`, `rule`, `paper`). Se
        // retiraron porque mientras existieran, `border-border` y `bg-surface`
        // seguían compilando: la migración anterior los dejó definidos y en la
        // misma rama volvió a nacer un `divide-border` nuevo. Sin la definición,
        // la clase queda sin salida CSS y el estilo se pierde de forma visible.
        // Los nombres vigentes son: `engine-*` (acento), `rule` / `rule-strong`
        // (bordes) y `paper` / `paper-warm` / `paper-cool` (superficies).
      },
      fontFamily: {
        sans:    ['"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        display: ['"Archivo Black"', '"IBM Plex Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        none: '0',
        sm:   '0.125rem',
        DEFAULT: '0.25rem',
        md:   '0.25rem',
        lg:   '0.375rem',
        xl:   '0.5rem',
        '2xl':'0.75rem',
        full: '9999px',
      },
      letterSpacing: {
        stamp: '0.08em',
      },
      boxShadow: {
        stamp:   '0 1px 0 rgba(11, 18, 32, 0.18), 0 0 0 3px rgba(29, 78, 216, 0.10)',
        'card-lift': '0 2px 0 rgba(11, 18, 32, 0.08)',
        e1: '0 1px 0 rgba(11, 18, 32, 0.08)',
        e2: '0 2px 0 rgba(11, 18, 32, 0.12)',
        e3: '0 8px 24px rgba(11, 18, 32, 0.10)',
      },
      keyframes: {
        stampIn: {
          '0%':   { transform: 'scale(0.7) rotate(-4deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.08) rotate(3deg)',  opacity: '1' },
          '100%': { transform: 'scale(1) rotate(4deg)',     opacity: '1' },
        },
        riseIn: {
          '0%':   { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',   opacity: '1' },
        },
      },
      animation: {
        'stamp-in': 'stampIn 260ms cubic-bezier(.2,.8,.3,1.2) both',
        'rise-in':  'riseIn 360ms cubic-bezier(.2,.8,.3,1) both',
      },
    },
  },
  plugins: [],
};

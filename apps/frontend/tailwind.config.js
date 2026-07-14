/**
 * cualautocompro — design tokens.
 *
 * Sistema "Carbón + Lima" — neutros zinc casi-grises, acento lima único,
 * fondo blanco roto, separadores hairline. Lectura limpia, jerarquía por
 * contraste, sin el creep cálido de la paleta ficha-técnica anterior.
 * IBM Plex (Sans + Mono) para texto, Archivo Black para display.
 *
 * Los nombres de las escalas (`engine-*`, `paper-*`, `ink-*`) se preservaron
 * para que un find/replace o un componente suelto siga funcionando con la
 * nueva paleta — solo cambian los hex.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,css}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#FAFAF9',
          warm:    '#F4F4F1',
          cool:    '#FFFFFF',
        },
        ink: {
          DEFAULT: '#18181B',
          muted:   '#3F3F46',
          subtle:  '#52525B',
        },
        graphite: '#52525B',
        rule:     '#E4E4E7',
        engine: {
          DEFAULT: '#65A30D',
          50:  '#F7FEE7',
          100: '#ECFCCB',
          200: '#D9F99D',
          300: '#BEF264',
          400: '#A3E635',
          500: '#84CC16',
          600: '#65A30D',
          700: '#4D7C0F',
          800: '#3F6212',
          900: '#365314',
        },
        blueprint: {
          DEFAULT: '#65A30D',
          light:   '#ECFCCB',
        },
        caution: {
          DEFAULT: '#A16207',
          light:   '#FEF9C3',
          dark:    '#713F12',
        },
        warn: {
          light: '#FEF9C3',
          DEFAULT: '#A16207',
          dark: '#713F12',
        },
        border: {
          DEFAULT: '#E4E4E7',
          strong: '#18181B',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted:   '#FAFAF9',
          container:   '#F4F4F1',
          'container-low': '#FAFAF9',
          'container-high': '#E4E4E7',
        },
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
        stamp:   '0 1px 0 rgba(24, 24, 27, 0.18), 0 0 0 3px rgba(101, 163, 13, 0.10)',
        'card-lift': '0 2px 0 rgba(24, 24, 27, 0.08)',
        e1: '0 1px 0 rgba(24, 24, 27, 0.08)',
        e2: '0 2px 0 rgba(24, 24, 27, 0.12)',
        e3: '0 8px 24px rgba(24, 24, 27, 0.10)',
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

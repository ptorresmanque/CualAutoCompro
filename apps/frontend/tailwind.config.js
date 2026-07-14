/**
 * cualautocompro — design tokens.
 *
 * Sistema "Pizarra Digital" — neutros slate, fondo blanco frío casi-puro,
 * acento steel-blue reservado para CTAs y estados activos. Máxima
 * legibilidad por contraste, sin el creep cálido de paletas anteriores.
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
          DEFAULT: '#F7F9FC',
          warm:    '#EEF2F7',
          cool:    '#FFFFFF',
        },
        ink: {
          DEFAULT: '#0F172A',
          muted:   '#475569',
          subtle:  '#64748B',
        },
        graphite: '#64748B',
        rule:     '#E2E8F0',
        engine: {
          DEFAULT: '#1E40AF',
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
        blueprint: {
          DEFAULT: '#1E40AF',
          light:   '#DBEAFE',
        },
        caution: {
          DEFAULT: '#B45309',
          light:   '#FEF3C7',
          dark:    '#78350F',
        },
        warn: {
          light: '#FEF3C7',
          DEFAULT: '#B45309',
          dark: '#78350F',
        },
        border: {
          DEFAULT: '#E2E8F0',
          strong: '#0F172A',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted:   '#F7F9FC',
          container:   '#EEF2F7',
          'container-low': '#F7F9FC',
          'container-high': '#E2E8F0',
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
        stamp:   '0 1px 0 rgba(15, 23, 42, 0.18), 0 0 0 3px rgba(30, 64, 175, 0.10)',
        'card-lift': '0 2px 0 rgba(15, 23, 42, 0.08)',
        e1: '0 1px 0 rgba(15, 23, 42, 0.08)',
        e2: '0 2px 0 rgba(15, 23, 42, 0.12)',
        e3: '0 8px 24px rgba(15, 23, 42, 0.10)',
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

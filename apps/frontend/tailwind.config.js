/**
 * cualautocompro — design tokens.
 *
 * Sistema "Ficha Técnica" / Plano de taller.
 * Asimétrico, papel cálido, tinta casi-negra, engine-red como acento,
 * IBM Plex (Sans + Mono) para texto, Archivo Black para display.
 *
 * Las clases `engine-*` reemplazan a `brand-*` (la paleta teal anterior).
 * Los nombres de las escalas se preservaron para que un find/replace o
 * un componente suelto siga funcionando con la nueva paleta.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,css}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F2EEE3',
          warm:    '#EBE5D6',
          cool:    '#FAFAF7',
        },
        ink: {
          DEFAULT: '#0E1116',
          muted:   '#3F4A52',
          subtle:  '#6E7984',
        },
        graphite: '#6E7984',
        rule:     '#D9D2BF',
        engine: {
          DEFAULT: '#C8341B',
          50:  '#FBE9E5',
          100: '#F4D1CA',
          200: '#E69E91',
          300: '#D86E5D',
          400: '#D04E3A',
          500: '#C8341B',
          600: '#A62713',
          700: '#7A1A0B',
          800: '#4D0E05',
          900: '#260500',
        },
        blueprint: {
          DEFAULT: '#1B4F72',
          light:   '#D4E1EB',
        },
        caution: {
          DEFAULT: '#F2C12E',
          light:   '#FBE9B0',
          dark:    '#7A5B0B',
        },
        warn: {
          light: '#FBE9B0',
          DEFAULT: '#F2C12E',
          dark: '#7A5B0B',
        },
        border: {
          DEFAULT: '#D9D2BF',
          strong: '#0E1116',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          muted:   '#F2EEE3',
          container:   '#EBE5D6',
          'container-low': '#F2EEE3',
          'container-high': '#E4DCC8',
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
        stamp:   '0 1px 0 rgba(14, 17, 22, 0.18), 0 0 0 3px rgba(200, 52, 27, 0.10)',
        'card-lift': '0 2px 0 rgba(14, 17, 22, 0.08)',
        e1: '0 1px 0 rgba(14, 17, 22, 0.08)',
        e2: '0 2px 0 rgba(14, 17, 22, 0.12)',
        e3: '0 8px 24px rgba(14, 17, 22, 0.10)',
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

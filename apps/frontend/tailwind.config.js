/**
 * cualautocompro — design tokens.
 *
 * Source of truth: Stitch project "Transparencia Automotriz" (Hanken Grotesk,
 * teal #008080 primary, ROUND_EIGHT / 8px corners, Material 3 surfaces,
 * FIDELITY color variant, LIGHT mode only).
 *
 * El mapeo a la escala `brand-50`…`brand-900` está ajustado para mantener
 * vivas las clases existentes en los templates (no se renombra nada).
 *
 * Si necesitas tokens Material 3 crudos, añádelos a `theme.extend.colors` con
 * nombres planos: `primary: '#008080'`, `surfaceContainer: '#eceeee'`, etc.
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts,css}'],
  theme: {
    extend: {
      colors: {
        // Paleta teal mapeada a escala Tailwind. Centered on Stitch primary #008080.
        brand: {
          50:  '#e0f2f2',  // tertiary-container muy claro
          100: '#c6e9e9',  // secondary-container
          200: '#93f2f2',  // primary-fixed (claro)
          300: '#76d6d5',  // primary-fixed-dim
          400: '#4ab9b9',  // step más claro antes del primario
          500: '#008080',  // = primary (M3)
          600: '#006a6a',  // = surface-tint
          700: '#006565',  // = primary (M3 oscuro)
          800: '#004f4f',  // = on-primary-fixed-variant
          900: '#002020',  // = on-primary-fixed
        },
        // M3 neutrals mapeados a "ink". Para añadir más: 'on-surface'=#191c1d,
        // 'surface-variant'=#e1e3e3, 'outline'=#6e7979, etc.
        ink: {
          DEFAULT: '#191c1d', // on-surface
          muted: '#3e4949',   // on-surface-variant
          subtle: '#6e7979',  // outline
        },
        // Semantic colors — desaturados según el brief del sistema de Stitch.
        // warn-light, DEFAULT, warn-dark se mantienen por retrocompatibilidad.
        warn: {
          light: '#fef3c7',
          DEFAULT: '#f59e0b',
          dark: '#92400e',
        },
        border: {
          DEFAULT: '#bdc9c8', // outline-variant
          strong: '#6e7979',  // outline
        },
        surface: {
          DEFAULT: '#ffffff',         // surface-container-lowest
          muted: '#f8fafa',            // background
          container: '#eceeee',       // surface-container
          'container-low': '#f2f4f4', // surface-container-low
          'container-high': '#e6e8e9',
        },
      },
      fontFamily: {
        // Stitch usa Hanken Grotesk como tipografía única para todo. Mapear
        // tanto 'sans' como 'display' a la misma fuente preserva las clases
        // existentes en los templates.
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
      },
      // ROUND_EIGHT = 8px base. Cards de vehículos usan radius más generoso
      // (12px) según designMd del sistema: "12px (0.75rem) corner radius".
      borderRadius: {
        DEFAULT: '0.5rem',  // 8px (ROUND_EIGHT)
        sm: '0.25rem',      // 4px
        md: '0.5rem',       // 8px
        lg: '0.75rem',      // 12px (vehicle cards)
        xl: '1rem',         // 16px
        '2xl': '1.5rem',    // 24px
        full: '9999px',
      },
      // Sombras alineadas con "Level 2 (Active/Hover)" del sistema:
      boxShadow: {
        e1: '0 1px 2px rgba(0, 0, 0, 0.06)',
        e2: '0 4px 12px rgba(0, 128, 128, 0.08)',
        e3: '0 12px 32px rgba(0, 0, 0, 0.10)',
      },
    },
  },
  plugins: [],
};

# cualautocompro — Mockups generados con Stitch

Este directorio contiene los HTML generados por Stitch para cada pantalla del aplicativo. Cada mockup refleja el sistema de diseño "Transparencia Automotriz" (Hanken Grotesk, teal `#008080`, ROUND_EIGHT, Material 3 surfaces).

| Pantalla | Ruta App | Mockup HTML | Stitch Screen ID | Notas |
|---|---|---|---|---|
| Catálogo | `/` | [`catalog.html`](./catalog.html) | `aecc7f20999441b6a4bcbbdc67178623` | Filtros laterales + grid 24 cards |
| Detalle de modelo | `/brand/:brandSlug/model/:modelSlug` | [`model-detail.html`](./model-detail.html) | `d1dbd05b0a4846ef8abd7f6fd052b707` | Carrusel 4 imágenes + tabs |
| Comparación | `/compare` | [`compare.html`](./compare.html) | `8d7a3e212f114b3b85702b62541a1be8` | 3 cards + tablas con diffs amber |
| Login | `/login` | [`login.html`](./login.html) | `f77f9013bb8945b8a031fde338cf7c59` | Centrado max-w-md |
| Registro | `/register` | [`register.html`](./register.html) | `537b45499a444d21bdd286a611f92cdc` | Mismo layout que Login |
| Mi cuenta / comparaciones | `/account/comparisons` | [`account.html`](./account.html) | `01018474086740808bd01d2a1e23d03b` | Lista de cards con slug + acciones |

## Cómo abrir los HTML

Cada `.html` es un archivo estático con CSS en `<style>` y SVG/markup completo. Puedes abrirlos directamente con doble clic o servirlos con un static server:

```bash
cd docs/superpowers/design/mockups
python3 -m http.server 4173
# luego abre http://localhost:4173/catalog.html
```

## Sistema de diseño

Ver [`stitch-state.md`](../stitch-state.md) para tokens, mapeo, y notas de aplicación al frontend.

/**
 * Slug URL-safe a partir de texto libre. **Debe** producir exactamente lo
 * mismo que `slugify` en `apps/backend/src/shared/slug.ts`: el backend
 * resuelve `GET /models/by-slug/:brandSlug/:modelSlug` comparando
 * `slugify(brand.name)` y `slugify(model.name)` contra los segmentos de la
 * URL. Si las dos implementaciones divergen, cualquier marca o modelo con
 * espacio o acento ("Great Wall", "Citroën") falla el lookup y la ficha cae
 * al fallback legacy de tres requests.
 *
 * Si tocás una de las dos, tocá la otra.
 */
export const slugify = (input: string): string => {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining marks (acentos)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
};

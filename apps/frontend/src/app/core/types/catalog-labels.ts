/**
 * Etiquetas legibles para los enums "abiertos" del catálogo (segmento,
 * combustible, transmisión).
 *
 * Estos campos aceptan valores nuevos desde la opción "Otro" del admin, así
 * que los mapas cubren solo los canónicos y todo lo demás cae en
 * `humanizeToken`, que convierte el token guardado (`MINI_VAN`) en algo
 * presentable (`Mini van`) en vez de mostrarlo crudo.
 *
 * Vive acá y no en cada componente porque el mapa de segmentos estaba
 * duplicado en `vehicle-card`, `model` y `compare`, y el de combustible /
 * transmisión en `landing` y `catalog`.
 */

const SEGMENT_LABELS: Record<string, string> = {
  SEDAN: 'Sedán',
  SUV: 'SUV',
  HATCHBACK: 'Hatchback',
  PICKUP: 'Pickup',
  CROSSOVER: 'Crossover',
  COMMERCIAL: 'Comercial',
};

const FUEL_LABELS: Record<string, string> = {
  BENCINA: 'Bencina',
  DIESEL: 'Diésel',
  HYBRID: 'Híbrido',
  ELECTRIC: 'Eléctrico',
};

const TRANSMISSION_LABELS: Record<string, string> = {
  MANUAL: 'Manual',
  AUTOMATIC: 'Automática',
  CVT: 'CVT',
  DCT: 'DCT',
};

/**
 * Tokens canónicos, derivados de los mapas de arriba para no mantener dos
 * listas. Sirven de fallback en la UI mientras cargan (o si falla) las
 * opciones reales que devuelve la API.
 */
export const CANONICAL_SEGMENTS = Object.keys(SEGMENT_LABELS);
export const CANONICAL_FUELS = Object.keys(FUEL_LABELS);
export const CANONICAL_TRANSMISSIONS = Object.keys(TRANSMISSION_LABELS);

/**
 * `MINI_VAN` → `Mini van`, `HIDROGENO` → `Hidrogeno`.
 *
 * Se dejan intactas las siglas (una sola palabra de hasta 4 letras: `SUV`,
 * `GLP`) y cualquier palabra con dígitos (`4X4`), donde bajar a minúsculas
 * se vería peor que el token crudo.
 */
export function humanizeToken(token: string): string {
  const words = token.split('_').filter(Boolean);
  if (words.length === 0) return '';
  const isAcronym = (word: string, i: number): boolean =>
    /\d/.test(word) || (words.length === 1 && i === 0 && word.length <= 4);
  return words
    .map((word, i) => {
      if (isAcronym(word, i)) return word;
      const lower = word.toLowerCase();
      return i === 0 ? lower.charAt(0).toUpperCase() + lower.slice(1) : lower;
    })
    .join(' ');
}

function label(map: Record<string, string>, token: string | null | undefined): string {
  if (!token) return '';
  return map[token] ?? humanizeToken(token);
}

export function segmentLabel(token: string | null | undefined): string {
  return label(SEGMENT_LABELS, token);
}

export function fuelLabel(token: string | null | undefined): string {
  return label(FUEL_LABELS, token);
}

export function transmissionLabel(token: string | null | undefined): string {
  return label(TRANSMISSION_LABELS, token);
}

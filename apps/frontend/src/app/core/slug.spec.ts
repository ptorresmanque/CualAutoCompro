import { slugify } from './slug';

// El contrato real de esta función es "producir lo mismo que
// apps/backend/src/shared/slug.ts". Los casos de abajo son los que rompían la
// ficha del modelo cuando el frontend usaba `toLowerCase()`.
describe('slugify', () => {
  it('pasa a minúsculas y reemplaza espacios por guiones', () => {
    expect(slugify('Toyota Corolla')).toBe('toyota-corolla');
    expect(slugify('Great Wall')).toBe('great-wall');
  });

  it('quita los acentos', () => {
    expect(slugify('Citroën')).toBe('citroen');
    expect(slugify('Škoda Kodiaq')).toBe('skoda-kodiaq');
  });

  it('colapsa corridas de caracteres no alfanuméricos en un solo guion', () => {
    expect(slugify('Mazda CX-5')).toBe('mazda-cx-5');
    expect(slugify('Hyundai  --  i10!!!')).toBe('hyundai-i10');
  });

  it('recorta guiones al inicio y al final', () => {
    expect(slugify('---hello---')).toBe('hello');
  });

  it('devuelve string vacío si no queda nada alfanumérico', () => {
    expect(slugify('!!!')).toBe('');
  });
});

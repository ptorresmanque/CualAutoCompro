import { fuelLabel, humanizeToken, segmentLabel, transmissionLabel } from './catalog-labels';

describe('catalog-labels', () => {
  it('traduce los tokens canónicos', () => {
    expect(segmentLabel('SEDAN')).toBe('Sedán');
    expect(fuelLabel('DIESEL')).toBe('Diésel');
    expect(transmissionLabel('AUTOMATIC')).toBe('Automática');
  });

  it('humaniza los tokens creados con "Otro" en vez de mostrarlos crudos', () => {
    expect(segmentLabel('MINI_VAN')).toBe('Mini van');
    expect(fuelLabel('HIDROGENO')).toBe('Hidrogeno');
  });

  it('deja las siglas cortas tal cual', () => {
    expect(transmissionLabel('CVT')).toBe('CVT');
    expect(segmentLabel('SUV')).toBe('SUV');
    expect(humanizeToken('4X4_LOW')).toBe('4X4 low');
  });

  it('devuelve string vacío para null/undefined', () => {
    expect(segmentLabel(null)).toBe('');
    expect(segmentLabel(undefined)).toBe('');
  });
});

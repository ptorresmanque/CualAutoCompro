import { describe, it, expect } from 'vitest';
import { ENUM_REGEX, STICKY_FIELDS, toEnumToken } from './entity-schemas';

describe('toEnumToken()', () => {
  it('normaliza acentos, espacios y mayúsculas', () => {
    expect(toEnumToken('Súper Cargado 4x4 ')).toBe('SUPER_CARGADO_4X4');
  });

  it('produce siempre un token que pasa ENUM_REGEX', () => {
    for (const raw of ['Doble embrague', 'híbrido enchufable', '4X4  con  reductora', 'CVT']) {
      expect(ENUM_REGEX.test(toEnumToken(raw))).toBe(true);
    }
  });

  it('colapsa separadores repetidos y no deja guiones en los bordes', () => {
    expect(toEnumToken('  --hola---mundo--  ')).toBe('HOLA_MUNDO');
  });

  it('deja pasar sin cambios un token que ya era válido', () => {
    expect(toEnumToken('TRACTION_AWD')).toBe('TRACTION_AWD');
  });

  it('devuelve string vacío cuando no queda nada utilizable', () => {
    expect(toEnumToken('   ')).toBe('');
    expect(toEnumToken('!!!')).toBe('');
  });
});

describe('STICKY_FIELDS', () => {
  it('conserva el contexto de una tanda de carga de versiones', () => {
    expect(STICKY_FIELDS.version).toEqual(['modelId', 'transmission', 'fuel']);
  });

  it('no marca como sticky el nombre, que identifica al registro', () => {
    for (const fields of Object.values(STICKY_FIELDS)) {
      expect(fields).not.toContain('name');
    }
  });

  it('cubre las entidades con contexto repetido', () => {
    expect(STICKY_FIELDS.model).toEqual(['brandId', 'segment']);
    expect(STICKY_FIELDS.maintenance).toEqual(['versionId']);
    expect(STICKY_FIELDS.equipment).toEqual(['category']);
    expect(STICKY_FIELDS.fuelPrice).toEqual(['unit']);
  });
});

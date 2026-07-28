/**
 * Une los valores canónicos de un enum "abierto" (Segment, Fuel, Transmission)
 * con los que existen en la DB porque se dieron de alta desde la opción "Otro"
 * del admin.
 *
 * Los canónicos van siempre aunque no tengan filas, para que el formulario y
 * los filtros no se queden vacíos en una base recién sembrada.
 *
 * La forma `{ id, name }` (ambos iguales al token) es la que consume
 * `app-select-search` en el frontend vía `optionsApi`.
 */
export interface EnumFacet {
  id: string;
  name: string;
  count: number;
}

export function mergeEnumFacets(
  canonical: readonly string[],
  counts: ReadonlyMap<string, number>,
): EnumFacet[] {
  const tokens = new Set<string>([...canonical, ...counts.keys()]);
  return [...tokens]
    .sort((a, b) => a.localeCompare(b))
    .map((token) => ({ id: token, name: token, count: counts.get(token) ?? 0 }));
}

export type SortDir = 'asc' | 'desc';

function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a).localeCompare(String(b), 'es', { numeric: true, sensitivity: 'base' });
}

export function sortItems<T>(
  items: readonly T[],
  key: string | null,
  dir: SortDir,
  getValue: (item: T, key: string) => unknown,
): T[] {
  if (!key) return [...items];
  const sign = dir === 'asc' ? 1 : -1;
  return [...items].sort((a, b) => compareValues(getValue(a, key), getValue(b, key)) * sign);
}

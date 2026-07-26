export const TRACTION_OPTIONS = [
  { value: 'TRACTION_FRONT', label: 'Delantera' },
  { value: 'TRACTION_REAR', label: 'Trasera' },
  { value: 'TRACTION_AWD', label: 'Integral' },
  { value: 'TRACTION_4X4_LOW', label: '4x4 con reductora' },
] as const;

export const ENGINE_TYPE_OPTIONS = [
  { value: 'ENGINE_NA', label: 'Aspirado' },
  { value: 'ENGINE_TURBO', label: 'Turbo' },
  { value: 'ENGINE_TWIN_TURBO', label: 'Bi Turbo' },
] as const;

const labels: Record<string, string> = Object.fromEntries(
  [...TRACTION_OPTIONS, ...ENGINE_TYPE_OPTIONS].map((option) => [option.value, option.label]),
);

export function versionFieldLabel(value: string | null | undefined): string {
  return value ? labels[value] ?? value : '—';
}

import { FormGroup } from '@angular/forms';

export interface BackendFieldError {
  path: (string | number)[];
  message: string;
}

/**
 * Applies structured backend validation errors to a reactive form.
 * Each field's path is mapped to a FormControl; the first segment of the
 * path is used as the control name. Nested paths (length > 1) are skipped
 * with a console.warn — the current admin dialog has no nested objects,
 * so this is a deliberate, conservative behavior.
 */
export function applyBackendErrors(
  form: FormGroup,
  fields: BackendFieldError[],
): void {
  for (const field of fields) {
    if (!field.path || field.path.length === 0) continue;
    const key = field.path[0];
    if (typeof key !== 'string') continue;
    const ctrl = form.get(key);
    if (!ctrl) continue;
    ctrl.setErrors({ backend: field.message });
    ctrl.markAsTouched();
  }
  // Note: nested paths (e.g. ["address", "street"]) are intentionally
  // ignored — admin dialog fields are flat. If we ever add nested object
  // editing, this helper will need to recurse.
  const nested = fields.filter((f) => f.path.length > 1);
  if (nested.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(
      'applyBackendErrors: nested paths ignored (not supported):',
      nested.map((f) => f.path.join('.')),
    );
  }
}
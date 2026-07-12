import { FormControl, FormGroup, Validators } from '@angular/forms';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { applyBackendErrors, type BackendFieldError } from './admin-form-errors';

describe('applyBackendErrors', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  function makeForm(): FormGroup {
    return new FormGroup({
      name: new FormControl('', Validators.required),
      year: new FormControl(2026, Validators.min(1990)),
      mileage: new FormControl(0),
    });
  }

  it('marks a single field with the backend error and marks it touched', () => {
    const form = makeForm();
    applyBackendErrors(form, [{ path: ['name'], message: 'Required' }]);
    expect(form.get('name')?.errors).toEqual({ backend: 'Required' });
    expect(form.get('name')?.touched).toBe(true);
  });

  it('marks multiple fields independently', () => {
    const form = makeForm();
    applyBackendErrors(form, [
      { path: ['name'], message: 'Required' },
      { path: ['year'], message: 'Out of range' },
    ]);
    expect(form.get('name')?.errors).toEqual({ backend: 'Required' });
    expect(form.get('year')?.errors).toEqual({ backend: 'Out of range' });
    expect(form.get('mileage')?.errors).toBeNull();
  });

  it('skips paths that do not match any control without throwing', () => {
    const form = makeForm();
    expect(() =>
      applyBackendErrors(form, [{ path: ['nonexistent'], message: 'x' }]),
    ).not.toThrow();
    expect(form.get('nonexistent')).toBeNull();
  });

  it('skips numeric first segments (treats as unknown)', () => {
    const form = makeForm();
    expect(() =>
      applyBackendErrors(form, [{ path: [0, 'name'], message: 'x' }]),
    ).not.toThrow();
    expect(form.get('0')).toBeNull();
  });

  it('skips empty paths', () => {
    const form = makeForm();
    expect(() =>
      applyBackendErrors(form, [{ path: [], message: 'x' }]),
    ).not.toThrow();
  });

  it('warns about nested paths but does not throw', () => {
    const form = makeForm();
    expect(() =>
      applyBackendErrors(form, [{ path: ['address', 'street'], message: 'Required' }]),
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0]?.[0]).toContain('nested paths ignored');
  });

  it('does not warn when all paths are flat', () => {
    const form = makeForm();
    applyBackendErrors(form, [
      { path: ['name'], message: 'Required' },
      { path: ['year'], message: 'Out of range' },
    ]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('handles empty fields array (no-op)', () => {
    const form = makeForm();
    expect(() => applyBackendErrors(form, [])).not.toThrow();
    // name has Validators.required and is empty, so its errors are {required: true}.
    // The point of this test is just that applyBackendErrors doesn't touch it.
    expect(form.get('name')?.errors).toEqual({ required: true });
    expect(form.get('name')?.errors?.['backend']).toBeUndefined();
  });

  it('overwrites a previous backend error on the same control', () => {
    const form = makeForm();
    applyBackendErrors(form, [{ path: ['name'], message: 'First error' }]);
    expect(form.get('name')?.errors).toEqual({ backend: 'First error' });
    applyBackendErrors(form, [{ path: ['name'], message: 'Second error' }]);
    expect(form.get('name')?.errors).toEqual({ backend: 'Second error' });
  });
});
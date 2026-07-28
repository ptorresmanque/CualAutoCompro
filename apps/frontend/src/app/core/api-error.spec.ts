import { describe, it, expect } from 'vitest';
import { HttpErrorResponse } from '@angular/common/http';
import { ApiCallError, toApiCallError, unwrap, type ApiResponse } from './api-error';

describe('unwrap()', () => {
  it('returns data when response is successful', () => {
    const response: ApiResponse<{ id: string }> = {
      data: { id: 'abc' },
      error: null,
    };
    expect(unwrap(response)).toEqual({ id: 'abc' });
  });

  it('throws ApiCallError when response has error', () => {
    const response: ApiResponse<unknown> = {
      data: null,
      error: { code: 'NOT_FOUND', message: 'No encontrado' },
    };
    expect(() => unwrap(response)).toThrow(ApiCallError);
    expect(() => unwrap(response)).toThrow('No encontrado');
  });

  it('exposes backend error and status on thrown error', () => {
    const response: ApiResponse<unknown> = {
      data: null,
      error: {
        code: 'VALIDATION',
        message: 'Datos inválidos',
        fields: [{ path: ['name'], message: 'Required' }],
      },
    };
    try {
      unwrap(response, 400);
      throw new Error('should have thrown');
    } catch (err) {
      expect(err).toBeInstanceOf(ApiCallError);
      const apiErr = err as ApiCallError;
      expect(apiErr.status).toBe(400);
      expect(apiErr.backend.code).toBe('VALIDATION');
      expect(apiErr.backend.message).toBe('Datos inválidos');
      expect(apiErr.backend.fields).toEqual([{ path: ['name'], message: 'Required' }]);
    }
  });

  it('throws when data is null even if error is null', () => {
    const response: ApiResponse<unknown> = { data: null, error: null };
    expect(() => unwrap(response)).toThrow(ApiCallError);
  });

  it('handles error with no fields array', () => {
    const response: ApiResponse<unknown> = {
      data: null,
      error: { code: 'CONFLICT', message: 'Duplicate' },
    };
    try {
      unwrap(response);
      throw new Error('should have thrown');
    } catch (err) {
      const apiErr = err as ApiCallError;
      expect(apiErr.backend.fields).toBeUndefined();
    }
  });

  it('preserves nested path arrays in fields', () => {
    const response: ApiResponse<unknown> = {
      data: null,
      error: {
        code: 'VALIDATION',
        message: 'Datos inválidos',
        fields: [
          { path: ['address', 'street'], message: 'Required' },
          { path: ['items', 0, 'name'], message: 'Required' },
        ],
      },
    };
    try {
      unwrap(response);
      throw new Error('should have thrown');
    } catch (err) {
      const apiErr = err as ApiCallError;
      expect(apiErr.backend.fields?.length).toBe(2);
      expect(apiErr.backend.fields?.[0].path).toEqual(['address', 'street']);
      expect(apiErr.backend.fields?.[1].path).toEqual(['items', 0, 'name']);
    }
  });
});

describe('toApiCallError()', () => {
  it('converts an HttpErrorResponse carrying the backend envelope', () => {
    const httpErr = new HttpErrorResponse({
      status: 400,
      error: {
        data: null,
        error: {
          code: 'VALIDATION',
          message: 'Datos inválidos',
          fields: [{ path: ['name'], message: 'Muy corto' }],
        },
      },
    });

    const converted = toApiCallError(httpErr);
    expect(converted).toBeInstanceOf(ApiCallError);
    expect(converted!.status).toBe(400);
    expect(converted!.backend.code).toBe('VALIDATION');
    expect(converted!.backend.fields).toEqual([{ path: ['name'], message: 'Muy corto' }]);
  });

  it('passes through an error that already is an ApiCallError', () => {
    const original = new ApiCallError({ code: 'CONFLICT', message: 'Duplicado' }, 409);
    expect(toApiCallError(original)).toBe(original);
  });

  it('returns null for a network failure with no backend envelope', () => {
    const httpErr = new HttpErrorResponse({ status: 0, error: new ProgressEvent('error') });
    expect(toApiCallError(httpErr)).toBeNull();
  });

  it('returns null for a plain Error', () => {
    expect(toApiCallError(new Error('boom'))).toBeNull();
  });

  it('returns null when the body has no error envelope', () => {
    const httpErr = new HttpErrorResponse({ status: 500, error: { oops: true } });
    expect(toApiCallError(httpErr)).toBeNull();
  });
});

describe('ApiCallError', () => {
  it('inherits message from backend', () => {
    const err = new ApiCallError({ code: 'X', message: 'oops' }, 500);
    expect(err.message).toBe('oops');
    expect(err.name).toBe('ApiCallError');
  });

  it('exposes status', () => {
    const err = new ApiCallError({ code: 'X', message: 'oops' }, 404);
    expect(err.status).toBe(404);
  });
});
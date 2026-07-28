import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { ENV } from './env';

describe('ApiService.put', () => {
  it('envía el body al path con credenciales y devuelve la respuesta', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(ApiService);

    const promise = api.put('/admin/equipment/version/v1', { itemIds: ['a', 'b'] });
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne(`${ENV.apiBase}/admin/equipment/version/v1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ itemIds: ['a', 'b'] });
    expect(req.request.withCredentials).toBe(true);
    req.flush({ data: { attached: 2, detached: 0 }, error: null });

    await expect(promise).resolves.toEqual({
      data: { attached: 2, detached: 0 },
      error: null,
    });
  });
});

describe('ApiService.putUnwrapped', () => {
  it('desenvuelve data y lanza ApiCallError cuando el sobre trae error', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(ApiService);

    const okPromise = api.putUnwrapped('/admin/colors/version/v1', { colorIds: [] });
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${ENV.apiBase}/admin/colors/version/v1`).flush({
      data: { attached: 0, detached: 3 },
      error: null,
    });
    await expect(okPromise).resolves.toEqual({ attached: 0, detached: 3 });

    const failPromise = api.putUnwrapped('/admin/colors/version/v2', { colorIds: [] });
    http.expectOne(`${ENV.apiBase}/admin/colors/version/v2`).flush({
      data: null,
      error: { code: 'NOT_FOUND', message: 'Versión no encontrada' },
    });
    await expect(failPromise).rejects.toThrow('Versión no encontrada');
  });
});

describe('ApiService.upload', () => {
  it('envía FormData con el archivo y devuelve la URL del backend', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const api = TestBed.inject(ApiService);
    const file = new File([new Uint8Array([1, 2, 3])], 'photo.png', {
      type: 'image/png',
    });

    const promise = api.upload(file);
    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne(`${ENV.apiBase}/admin/uploads`);
    expect(req.request.body instanceof FormData).toBe(true);
    expect(req.request.withCredentials).toBe(true);
    req.flush({
      data: {
        url: '/uploads/2026-07/abc.png',
        filename: 'abc.png',
        size: 3,
        mime: 'image/png',
      },
    });

    await expect(promise).resolves.toEqual({
      data: {
        url: '/uploads/2026-07/abc.png',
        filename: 'abc.png',
        size: 3,
        mime: 'image/png',
      },
    });
  });
});

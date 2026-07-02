import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { ENV } from './env';

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

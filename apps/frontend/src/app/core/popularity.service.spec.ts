import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { PopularityService } from './popularity.service';

describe('PopularityService', () => {
  let http: HttpTestingController;
  let svc: PopularityService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    svc = TestBed.inject(PopularityService);
  });

  afterEach(() => {
    http.verify();
  });

  it('refresh setea topIds como Set con los IDs del backend', async () => {
    const promise = svc.refresh();
    http.expectOne((r) => r.url.includes('/api/v1/popular/models')).flush({
      data: { ids: ['m1', 'm2', 'm3'] },
    });
    await promise;
    expect(svc.topIds().has('m1')).toBe(true);
    expect(svc.topIds().has('m2')).toBe(true);
    expect(svc.topIds().has('m3')).toBe(true);
    expect(svc.topIds().has('m4')).toBe(false);
  });

  it('isPopular consulta el Set', async () => {
    const promise = svc.refresh();
    http.expectOne((r) => r.url.includes('/api/v1/popular/models')).flush({
      data: { ids: ['m1'] },
    });
    await promise;
    expect(svc.isPopular('m1')).toBe(true);
    expect(svc.isPopular('m2')).toBe(false);
  });

  it('refresh vacio -> topIds vacio', async () => {
    const promise = svc.refresh();
    http.expectOne((r) => r.url.includes('/api/v1/popular/models')).flush({
      data: { ids: [] },
    });
    await promise;
    expect(svc.topIds().size).toBe(0);
  });

  it('refresh falla -> topIds se mantiene vacio (best-effort)', async () => {
    const promise = svc.refresh();
    http.expectOne((r) => r.url.includes('/api/v1/popular/models')).flush(
      { data: null, error: { code: 'INTERNAL', message: 'fail' } },
      { status: 500, statusText: 'Server Error' },
    );
    await expect(promise).resolves.toBeUndefined();
    expect(svc.topIds().size).toBe(0);
  });

  it('recordAdd envia POST /popular/events y NO falla en errores de red', () => {
    svc.recordAdd('v1');
    const req = http.expectOne((r) =>
      r.url.includes('/api/v1/popular/events') && r.method === 'POST',
    );
    expect(req.request.body).toEqual({ versionId: 'v1' });
    req.flush(
      { data: null, error: { code: 'TOO_MANY_REQUESTS', message: 'rate' } },
      { status: 429, statusText: 'Too Many Requests' },
    );
    // No esperamos excepcion: fire-and-forget
  });

  it('recordAdd no bloquea cuando el server responde 204', () => {
    svc.recordAdd('v2');
    const req = http.expectOne((r) =>
      r.url.includes('/api/v1/popular/events') && r.method === 'POST',
    );
    req.flush(null, { status: 204, statusText: 'No Content' });
  });
});

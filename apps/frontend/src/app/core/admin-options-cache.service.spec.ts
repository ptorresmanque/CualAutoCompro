import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminOptionsCacheService } from './admin-options-cache.service';
import { ENV } from './env';

function setup(): { cache: AdminOptionsCacheService; http: HttpTestingController } {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  return {
    cache: TestBed.inject(AdminOptionsCacheService),
    http: TestBed.inject(HttpTestingController),
  };
}

describe('AdminOptionsCacheService', () => {
  it('dos get() del mismo path comparten un único request', async () => {
    const { cache, http } = setup();

    const a = cache.get('/admin/colors/options');
    const b = cache.get('/admin/colors/options');

    const reqs = http.match(() => true);
    expect(reqs.length).toBe(1);
    reqs[0].flush({ data: [{ id: 'c1', name: 'Rojo' }], error: null });

    expect(await a).toEqual([{ id: 'c1', name: 'Rojo' }]);
    expect(await b).toEqual([{ id: 'c1', name: 'Rojo' }]);
  });

  it('un get() posterior tampoco vuelve a pedir', async () => {
    const { cache, http } = setup();

    const first = cache.get('/admin/colors/options');
    http.expectOne(`${ENV.apiBase}/admin/colors/options`).flush({ data: [], error: null });
    await first;

    const second = cache.get('/admin/colors/options');
    http.expectNone(() => true);
    expect(await second).toEqual([]);
  });

  it('paths distintos no se pisan', async () => {
    const { cache, http } = setup();

    const colors = cache.get('/admin/colors/options');
    const equipment = cache.get('/admin/equipment/options');

    http.expectOne(`${ENV.apiBase}/admin/colors/options`).flush({ data: [{ id: 'c1' }], error: null });
    http.expectOne(`${ENV.apiBase}/admin/equipment/options`).flush({ data: [{ id: 'e1' }], error: null });

    expect(await colors).toEqual([{ id: 'c1' }]);
    expect(await equipment).toEqual([{ id: 'e1' }]);
  });

  it('invalidate fuerza un refetch y devuelve los datos nuevos', async () => {
    const { cache, http } = setup();

    const first = cache.get('/admin/colors/options');
    http.expectOne(() => true).flush({ data: [{ id: 'c1', name: 'Rojo' }], error: null });
    await first;

    cache.invalidate('/admin/colors/options');

    const second = cache.get('/admin/colors/options');
    http.expectOne(() => true).flush({
      data: [{ id: 'c1', name: 'Rojo' }, { id: 'c2', name: 'Azul' }],
      error: null,
    });
    expect(await second).toHaveLength(2);
  });

  it('un error no queda cacheado: el siguiente intento reintenta', async () => {
    const { cache, http } = setup();

    const failing = cache.get('/admin/colors/options');
    http.expectOne(() => true).flush(
      { data: null, error: { code: 'INTERNAL', message: 'Explotó' } },
      { status: 500, statusText: 'Server Error' },
    );
    await expect(failing).rejects.toBeTruthy();

    const retry = cache.get('/admin/colors/options');
    http.expectOne(() => true).flush({ data: [{ id: 'c1' }], error: null });
    expect(await retry).toEqual([{ id: 'c1' }]);
  });
});

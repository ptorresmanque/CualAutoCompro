import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MaintenanceAdminComponent } from './maintenance-admin.component';

const dialogMock = {
  open: () => ({ afterClosed: () => of(true) }),
};

const tick = () => new Promise((r) => setTimeout(r, 0));

const paged = (data: unknown[]) => ({
  data,
  pagination: { page: 1, pageSize: 25, total: data.length, totalPages: 1 },
  error: null,
});

function setup() {
  TestBed.configureTestingModule({
    imports: [MaintenanceAdminComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: MatDialog, useValue: dialogMock },
    ],
  });
  const fixture = TestBed.createComponent(MaintenanceAdminComponent);
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController) };
}

/** El selector se alimenta del catálogo completo, no de una página. */
const flushVersionOptions = (
  http: HttpTestingController,
  versions = [
    { id: 'v1', name: 'Modelo A 1.6 (2026)' },
    { id: 'v2', name: 'Modelo B 2.0 (2026)' },
  ],
) => {
  http
    .expectOne((r) => r.url.includes('/api/v1/admin/versions/options'))
    .flush({ data: versions, error: null });
};

describe('MaintenanceAdminComponent', () => {
  it('alimenta el selector desde /admin/versions/options', async () => {
    const { fixture, http } = setup();
    // 55 versiones: antes el selector pedía /versions?pageSize=50 y las
    // últimas quedaban fuera de alcance.
    const many = Array.from({ length: 55 }, (_, i) => ({ id: `v${i}`, name: `V${i}` }));
    flushVersionOptions(http, many);
    await fixture.whenStable();
    await tick();

    expect(fixture.componentInstance.versions().length).toBe(55);
  });

  it('no consulta mantenciones hasta que se elige una versión', async () => {
    const { fixture, http } = setup();
    flushVersionOptions(http);
    await fixture.whenStable();
    await tick();

    http.expectNone((r) => r.url.includes('/admin/maintenance'));
    expect(fixture.componentInstance.crud.items()).toEqual([]);
  });

  it('al elegir una versión pide las mantenciones filtradas por versionId', async () => {
    const { fixture, http } = setup();
    flushVersionOptions(http);
    await fixture.whenStable();
    await tick();

    fixture.componentInstance.onVersionChange('v2');
    fixture.detectChanges();

    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance'));
    // El filtro se resuelve en el servidor: antes este parámetro no viajaba y
    // la tabla mostraba las mantenciones de todo el catálogo.
    expect(req.request.params.get('versionId')).toBe('v2');
    req.flush(paged([{ id: 'm2', versionId: 'v2', mileageTag: 30000, costClp: 80000 }]));

    await fixture.whenStable();
    await tick();
    expect(fixture.componentInstance.crud.items().length).toBe(1);
  });

  it('paginar y buscar conservan el filtro de versión', async () => {
    const { fixture, http } = setup();
    flushVersionOptions(http);
    await fixture.whenStable();
    await tick();

    fixture.componentInstance.onVersionChange('v1');
    http.expectOne((r) => r.url.includes('/admin/maintenance')).flush(paged([]));
    await tick();

    fixture.componentInstance.crud.onPageChange(2);
    const paginated = http.expectOne((r) => r.url.includes('/admin/maintenance'));
    expect(paginated.request.params.get('versionId')).toBe('v1');
    expect(paginated.request.params.get('page')).toBe('2');
    paginated.flush(paged([]));
    await tick();

    fixture.componentInstance.crud.onSearch('10000');
    const searched = http.expectOne((r) => r.url.includes('/admin/maintenance'));
    expect(searched.request.params.get('versionId')).toBe('v1');
    expect(searched.request.params.get('q')).toBe('10000');
    searched.flush(paged([]));
    await tick();
  });

  it('en modo edit conserva el versionId del registro, no el del dropdown', async () => {
    const { fixture, http } = setup();
    flushVersionOptions(http);
    await fixture.whenStable();
    await tick();

    fixture.componentInstance.onVersionChange('v1');
    http.expectOne((r) => r.url.includes('/admin/maintenance')).flush(paged([]));
    await tick();

    // El usuario cambia el dropdown a v2 y luego edita un registro de v1.
    fixture.componentInstance.onVersionChange('v2');
    http.expectOne((r) => r.url.includes('/admin/maintenance')).flush(paged([]));
    await tick();

    const m1 = { id: 'm1', versionId: 'v1', mileageTag: 10000, costClp: 99999 };
    fixture.componentInstance.crud.openEdit(m1 as never);

    const savePromise = fixture.componentInstance.crud.save({
      mileageTag: 11000,
      costClp: 99999,
    });

    const patch = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance/m1'));
    expect(patch.request.method).toBe('PATCH');
    expect(patch.request.body.versionId).toBe('v1');
    patch.flush({ data: { ...m1, mileageTag: 11000 }, error: null });

    await tick();
    http.expectOne((r) => r.url.includes('/admin/maintenance')).flush(paged([]));
    await savePromise;
  });

  it('en modo create inyecta el versionId del dropdown', async () => {
    const { fixture, http } = setup();
    flushVersionOptions(http);
    await fixture.whenStable();
    await tick();

    fixture.componentInstance.onVersionChange('v1');
    http.expectOne((r) => r.url.includes('/admin/maintenance')).flush(paged([]));
    await tick();

    fixture.componentInstance.crud.openCreate();
    expect(fixture.componentInstance.crud.dialogEntity()).toBeNull();

    const savePromise = fixture.componentInstance.crud.save({
      mileageTag: 15000,
      costClp: 75000,
    });

    const post = http.expectOne((r) => r.url.endsWith('/api/v1/admin/maintenance'));
    expect(post.request.method).toBe('POST');
    expect(post.request.body.versionId).toBe('v1');
    post.flush({ data: { id: 'm-new' }, error: null });

    await tick();
    http.expectOne((r) => r.url.includes('/admin/maintenance')).flush(paged([]));
    await savePromise;
  });
});

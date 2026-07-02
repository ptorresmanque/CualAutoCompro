import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MaintenanceAdminComponent } from './maintenance-admin.component';

describe('MaintenanceAdminComponent', () => {
  it('carga lista de versiones y permite crear tras seleccionar', async () => {
    TestBed.configureTestingModule({
      imports: [MaintenanceAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(MaintenanceAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) {
      r.flush({ data: { total: 1, items: [{ id: 'v1', name: 'XLI', model: { name: 'Corolla' } }], page: 1, pageSize: 50 } });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.versions().length).toBeGreaterThan(0);
    fixture.componentInstance.onVersionChange('v1');
    await fixture.whenStable();
    const mainReqs = http.match(() => true);
    for (const r of mainReqs) r.flush({ data: [] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });

  it('al cambiar de versión filtra los items por versionId', async () => {
    TestBed.configureTestingModule({
      imports: [MaintenanceAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(MaintenanceAdminComponent);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    const versionsReq = http.expectOne((r) => r.url.includes('/api/v1/versions'));
    versionsReq.flush({
      data: {
        items: [
          { id: 'v1', name: '1.6', model: { name: 'Modelo A' } },
          { id: 'v2', name: '2.0', model: { name: 'Modelo B' } },
        ],
      },
    });

    await fixture.whenStable();
    fixture.componentInstance.onVersionChange('v1');
    fixture.detectChanges();

    const adminReq = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance'));
    adminReq.flush({
      data: [
        { id: 'm1', versionId: 'v1', mileageTag: 10000, costClp: 50000 },
        { id: 'm2', versionId: 'v2', mileageTag: 30000, costClp: 80000 },
        { id: 'm3', versionId: 'v1', mileageTag: 60000, costClp: 120000 },
      ],
    });

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    const items = fixture.componentInstance.displayed();
    expect(items.length).toBe(2);
    expect(items.every((i) => i.versionId === 'v1')).toBe(true);
  });
});

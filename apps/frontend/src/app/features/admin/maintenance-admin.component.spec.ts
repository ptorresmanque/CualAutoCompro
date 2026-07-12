import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { of } from 'rxjs';
import { MaintenanceAdminComponent } from './maintenance-admin.component';

const dialogMock = {
  open: () => ({ afterClosed: () => of(true) }),
};

describe('MaintenanceAdminComponent', () => {
  it('carga lista de versiones y permite crear tras seleccionar', async () => {
    TestBed.configureTestingModule({
      imports: [MaintenanceAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
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
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
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

  it('onSave en modo edit NO sobrescribe versionId con el del dropdown', async () => {
    TestBed.configureTestingModule({
      imports: [MaintenanceAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(MaintenanceAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    const versionsReq = http.expectOne((r) => r.url.includes('/api/v1/versions'));
    versionsReq.flush({
      data: {
        items: [
          { id: 'v1', name: '1.6', model: { name: 'A' } },
          { id: 'v2', name: '2.0', model: { name: 'B' } },
        ],
      },
    });
    await fixture.whenStable();

    fixture.componentInstance.onVersionChange('v1');
    fixture.detectChanges();
    const adminReq1 = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance'));
    adminReq1.flush({
      data: [{ id: 'm1', versionId: 'v1', mileageTag: 10000, costClp: 50000 }],
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    // User switches the dropdown to v2 WHILE editing m1 (a v1 record).
    fixture.componentInstance.onVersionChange('v2');
    fixture.detectChanges();
    const adminReq2 = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance'));
    adminReq2.flush({ data: [] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    // Set dialogEntity directly to simulate the user having clicked "Editar"
    // on the m1 row. We do NOT call detectChanges() here because rendering
    // the dialog component would trigger an extra GET to
    // /admin/seed/template/maintenance that this test does not need.
    // onSave reads dialogEntity from the signal directly.
    const m1 = { id: 'm1', versionId: 'v1', mileageTag: 10000, costClp: 99999 };
    fixture.componentInstance.dialogEntity.set(m1);

    const savePromise = fixture.componentInstance.onSave({
      mileageTag: 11000,
      costClp: 99999,
    });

    const patchReq = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance/m1'));
    expect(patchReq.request.method).toBe('PATCH');
    // versionId must remain v1 (the entity's original) — NOT v2 (the dropdown)
    expect(patchReq.request.body.versionId).toBe('v1');
    patchReq.flush({ data: { ...m1, mileageTag: 11000 } });

    // Drain the PATCH microtask so the post-PATCH loadMaintenance fires its GET.
    await new Promise((r) => setTimeout(r, 0));

    // The reload GET triggered by onSave for the currently-selected version (v2).
    const reloadReq = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance'));
    reloadReq.flush({ data: [] });
    await savePromise;
    await fixture.whenStable();
  });

  it('onSave en modo create inyecta versionId desde selectedVersion cuando el form no lo trae', async () => {
    TestBed.configureTestingModule({
      imports: [MaintenanceAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: MatDialog, useValue: dialogMock }],
    });
    const fixture = TestBed.createComponent(MaintenanceAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    const versionsReq = http.expectOne((r) => r.url.includes('/api/v1/versions'));
    versionsReq.flush({
      data: { items: [{ id: 'v1', name: '1.6', model: { name: 'A' } }] },
    });
    await fixture.whenStable();

    fixture.componentInstance.onVersionChange('v1');
    fixture.detectChanges();
    const adminReq1 = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance'));
    adminReq1.flush({ data: [] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    fixture.componentInstance.dialogEntity.set(null);
    fixture.detectChanges();

    const savePromise = fixture.componentInstance.onSave({
      mileageTag: 15000,
      costClp: 75000,
    });

    const postReq = http.expectOne((r) => r.url.endsWith('/api/v1/admin/maintenance'));
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body.versionId).toBe('v1');
    postReq.flush({ data: { id: 'm-new', versionId: 'v1', mileageTag: 15000, costClp: 75000 } });

    await new Promise((r) => setTimeout(r, 0));
    const reloadReq = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance'));
    reloadReq.flush({ data: [] });
    await savePromise;
    await fixture.whenStable();
  });
});

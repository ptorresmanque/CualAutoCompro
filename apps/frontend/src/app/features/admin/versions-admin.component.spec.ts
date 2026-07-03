import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { VersionsAdminComponent } from './versions-admin.component';

describe('VersionsAdminComponent', () => {
  it('carga lista desde /admin/versions (fallback /versions en test)', async () => {
    TestBed.configureTestingModule({
      imports: [VersionsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(VersionsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) {
      if (r.request.url.includes('/models')) {
        r.flush({ data: { total: 0, items: [], page: 1, pageSize: 50 } });
      } else {
        r.flush({ data: { total: 1, items: [{ id: 'v1', name: 'XLI', year: 2024, priceClp: 15000000, model: { name: 'Corolla' } }], page: 1, pageSize: 50 } });
      }
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.items().length).toBeGreaterThan(0);
  });

  it('openEdit proyecta equipmentItems a equipment: string[] para que el form se precargue', async () => {
    TestBed.configureTestingModule({
      imports: [VersionsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(VersionsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    // Drain initial load() requests.
    for (const r of http.match(() => true)) {
      r.flush({ data: { items: [] } });
    }
    await fixture.whenStable();

    // Simulate opening edit on a version that already has equipment.
    const row = {
      id: 'v1',
      name: 'v1',
      year: 2026,
      priceClp: 0,
      model: { name: 'M' },
      equipmentItems: [
        { equipmentItem: { id: 'e1', name: 'A', category: 'C' } },
        { equipmentItem: { id: 'e2', name: 'B', category: 'C' } },
      ],
    };
    fixture.componentInstance.openEdit(row as any);

    const entity = fixture.componentInstance.dialogEntity();
    expect(entity?.equipment).toEqual(['e1', 'e2']);
    // The original equipmentItems must not be carried into the form value
    // because the dialog has a control named 'equipment', not
    // 'equipmentItems'.
    expect((entity as any)?.equipmentItems).toBeUndefined();
  });

  it('openCreate muestra dialog', async () => {
    TestBed.configureTestingModule({
      imports: [VersionsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(VersionsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    for (const r of reqs) r.flush({ data: [] });
    await fixture.whenStable();
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });

  it('edit sincroniza equipment: detach removidos, attach agregados', async () => {
    TestBed.configureTestingModule({
      imports: [VersionsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(VersionsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    // Seed initial load.
    const seedReqs = http.match(() => true);
    for (const r of seedReqs) {
      r.flush({ data: { items: [] } });
    }
    await fixture.whenStable();

    // Simulate opening edit on a version that already has equipment e1, e2.
    const existing = {
      id: 'v1',
      name: 'v1',
      year: 2026,
      priceClp: 0,
      model: { name: 'M' },
      equipmentItems: [
        { equipmentItem: { id: 'e1', name: 'A', category: 'C' } },
        { equipmentItem: { id: 'e2', name: 'B', category: 'C' } },
      ],
    };
    fixture.componentInstance.dialogEntity.set(existing as any);
    await fixture.whenStable();

    // The dialog mounts and fires /admin/seed/template/version. Flush it
    // so the form renders and the multi-select + foreign-key fields fire
    // their own option requests.
    http.expectOne((r) => r.url.includes('/admin/seed/template/version')).flush({ data: {} });
    await fixture.whenStable();

    http.expectOne(
      (r) => r.url.includes('/admin/equipment') && !r.url.includes('/attach') && !r.url.includes('/version/'),
    ).flush({ data: [] });
    http.expectOne((r) => r.url.includes('/models')).flush({ data: { items: [] } });
    await fixture.whenStable();

    // Simulate save with equipment e2 (kept) + e3 (added); e1 removed.
    const savePromise = fixture.componentInstance.onSave({
      modelId: 'm1',
      name: 'v1',
      year: 2026,
      priceClp: 0,
      transmission: 'MANUAL',
      fuel: 'BENCINA',
      engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
      consumptionCityKmL: 0, consumptionHighwayKmL: 0,
      lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
      trunkLiters: 0, airbagCount: 0,
      hasAbs: false, hasEsp: false, hasCruiseControl: false,
      equipment: ['e2', 'e3'],
    });

    // 1) PATCH version (no equipment field)
    const patchReq = http.expectOne(
      (r) => r.url.includes('/api/v1/admin/versions/v1') && r.method === 'PATCH',
    );
    expect(patchReq.request.body.equipment).toBeUndefined();
    patchReq.flush({ data: { ...existing, equipmentItems: [] } });

    // 2) DELETE e1
    await new Promise((r) => setTimeout(r, 0));
    const delReq = http.expectOne(
      (r) => r.url.includes('/api/v1/admin/equipment/version/v1/item/e1'),
    );
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({ data: { detached: true } });

    // 3) POST attach e3
    await new Promise((r) => setTimeout(r, 0));
    const attachReq = http.expectOne(
      (r) => r.url.includes('/api/v1/admin/equipment/attach'),
    );
    expect(attachReq.request.body).toEqual({ versionId: 'v1', itemId: 'e3' });
    attachReq.flush({ data: { versionId: 'v1', equipmentItemId: 'e3' } });

    // 4) reload listAll is fired by onSave AFTER the equipment sync;
    // flush it before awaiting savePromise to avoid deadlock (savePromise
    // awaits load() which awaits the reload requests).
    await new Promise((r) => setTimeout(r, 0));
    http.expectOne((r) => r.url.includes('/admin/versions')).flush({ data: { items: [] } });
    http.expectOne((r) => r.url.includes('/models')).flush({ data: { items: [] } });

    await savePromise;
    await fixture.whenStable();
  });
});
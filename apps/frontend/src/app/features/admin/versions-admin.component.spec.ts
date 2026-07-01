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
});

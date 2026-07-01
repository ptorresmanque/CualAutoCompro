import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ModelsAdminComponent } from './models-admin.component';

describe('ModelsAdminComponent', () => {
  it('carga lista desde /admin/models (fallback /models en test)', async () => {
    TestBed.configureTestingModule({
      imports: [ModelsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ModelsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) {
      if (r.request.url.includes('/brands')) r.flush({ data: [] });
      else r.flush({ data: { total: 1, items: [{ id: 'm1', name: 'Corolla', segment: 'SEDAN', brand: { name: 'Toyota' } }], page: 1, pageSize: 50 } });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.items().length).toBeGreaterThan(0);
  });

  it('openCreate muestra dialog', async () => {
    TestBed.configureTestingModule({
      imports: [ModelsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(ModelsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    for (const r of reqs) r.flush({ data: [] });
    await fixture.whenStable();
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });
});

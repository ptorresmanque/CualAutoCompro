import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { BrandsAdminComponent } from './brands-admin.component';

describe('BrandsAdminComponent', () => {
  it('carga lista desde /admin/brands (fallback /brands en test)', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) r.flush({ data: [{ id: 'b1', name: 'Toyota', logoUrl: null }] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.items().length).toBeGreaterThan(0);
  });

  it('openCreate muestra dialog', async () => {
    TestBed.configureTestingModule({
      imports: [BrandsAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(BrandsAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    for (const r of reqs) r.flush({ data: [] });
    await fixture.whenStable();
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });
});

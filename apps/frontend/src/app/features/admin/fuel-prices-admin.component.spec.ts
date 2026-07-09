import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FuelPricesAdminComponent } from './fuel-prices-admin.component';

describe('FuelPricesAdminComponent', () => {
  it('smoke: carga lista de precios y abre dialog al pulsar Nuevo', async () => {
    TestBed.configureTestingModule({
      imports: [FuelPricesAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(FuelPricesAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match((r) => r.url.includes('/api/v1/admin/fuel-prices'));
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) {
      r.flush({
        data: [
          { id: 'fp1', fuelType: 'gasoline_93', pricePerUnitClp: 1280, unit: 'litro', effectiveFrom: '2026-01-01T00:00:00.000Z' },
          { id: 'fp2', fuelType: 'diesel', pricePerUnitClp: 1190, unit: 'litro', effectiveFrom: '2026-01-01T00:00:00.000Z' },
        ],
      });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.items().length).toBe(2);
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });

  it('formatCurrency devuelve CLP con formato es-CL', () => {
    TestBed.configureTestingModule({
      imports: [FuelPricesAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(FuelPricesAdminComponent);
    const formatted = fixture.componentInstance.formatCurrency(1234567);
    expect(formatted).toContain('1.234.567');
    expect(formatted.startsWith('$')).toBe(true);
  });

  it('onSave en modo create hace POST a /admin/fuel-prices y recarga', async () => {
    TestBed.configureTestingModule({
      imports: [FuelPricesAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(FuelPricesAdminComponent);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    const initial = http.expectOne((r) => r.url.includes('/api/v1/admin/fuel-prices'));
    initial.flush({ data: [] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    fixture.componentInstance.openCreate();
    const savePromise = fixture.componentInstance.onSave({
      fuelType: 'gasoline_93',
      pricePerUnitClp: 1300,
      unit: 'litro',
      effectiveFrom: '2026-01-15',
    });

    const postReq = http.expectOne((r) => r.url.includes('/api/v1/admin/fuel-prices') && r.method === 'POST');
    expect(postReq.request.method).toBe('POST');
    postReq.flush({ data: { id: 'fp3' } });

    await new Promise((r) => setTimeout(r, 0));
    const reloadReq = http.expectOne((r) => r.url.includes('/api/v1/admin/fuel-prices') && r.method === 'GET');
    reloadReq.flush({ data: [] });
    await savePromise;
    await fixture.whenStable();
  });

  it('confirmDelete lanza DELETE a /admin/fuel-prices/:id', async () => {
    TestBed.configureTestingModule({
      imports: [FuelPricesAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(FuelPricesAdminComponent);
    fixture.detectChanges();

    const http = TestBed.inject(HttpTestingController);
    const initial = http.expectOne((r) => r.url.includes('/api/v1/admin/fuel-prices'));
    initial.flush({ data: [{ id: 'fp1', fuelType: 'gasoline_93', pricePerUnitClp: 1280, unit: 'litro', effectiveFrom: '2026-01-01' }] });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    window.confirm = () => true;

    const deletePromise = fixture.componentInstance.confirmDelete({
      id: 'fp1',
      fuelType: 'gasoline_93',
      pricePerUnitClp: 1280,
      unit: 'litro',
      effectiveFrom: '2026-01-01',
    });

    const delReq = http.expectOne((r) => r.url.includes('/api/v1/admin/fuel-prices/fp1'));
    expect(delReq.request.method).toBe('DELETE');
    delReq.flush({ data: null });

    await new Promise((r) => setTimeout(r, 0));
    const reloadReq = http.expectOne((r) => r.url.includes('/api/v1/admin/fuel-prices') && r.method === 'GET');
    reloadReq.flush({ data: [] });
    await deletePromise;
    await fixture.whenStable();
  });
});

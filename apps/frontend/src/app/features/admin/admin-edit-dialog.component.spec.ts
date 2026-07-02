import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';

describe('AdminEditDialogComponent', () => {
  function setup(entityKey: 'brand' | 'model' | 'version' | 'equipment' | 'maintenance') {
    TestBed.configureTestingModule({
      imports: [AdminEditDialogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminEditDialogComponent);
    fixture.componentRef.setInput('entityKey', entityKey);
    fixture.componentRef.setInput('apiPath', entityKey === 'maintenance' ? 'maintenance' : `${entityKey}s`);
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController) };
  }

  it('carga el template y arma el form (brand)', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    expect(fixture.componentInstance.form().contains('name')).toBe(true);
  });

  it('nunca renderiza el campo id aunque el current lo incluya', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.componentRef.setInput('entity', { id: 'abc-123', name: 'Toyota', logoUrl: null });
    fixture.detectChanges();
    await fixture.whenStable();
    const nodes = Array.from(fixture.nativeElement.querySelectorAll('label > span:first-child')) as Element[];
    const labels: string[] = nodes.map((el) => el.textContent?.trim() ?? '');
    expect(labels.some((l) => l.toLowerCase().includes('id'))).toBe(false);
  });

  it('JSON inicial no incluye id', async () => {
    const { fixture, http } = setup('brand');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/brand'));
    req.flush({ data: { name: '', logoUrl: null } });
    await fixture.whenStable();
    fixture.componentRef.setInput('entity', { id: 'abc-123', name: 'Toyota', logoUrl: null });
    fixture.detectChanges();
    await fixture.whenStable();
    const json = JSON.parse(fixture.componentInstance.jsonText());
    expect(json).not.toHaveProperty('id');
    expect(json).toEqual({ name: 'Toyota', logoUrl: null });
  });

  it('model con FK brandId renderiza app-select-search', async () => {
    const { fixture, http } = setup('model');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/model'));
    req.flush({ data: { brandId: '', name: '', segment: 'SEDAN', imageUrl: null, galleryUrls: [] } });
    await fixture.whenStable();
    fixture.detectChanges();
    const sel = fixture.nativeElement.querySelector('app-select-search');
    expect(sel).toBeTruthy();
  });

  it('version con booleans renderiza app-toggle-field', async () => {
    const { fixture, http } = setup('version');
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/seed/template/version'));
    req.flush({
      data: {
        modelId: '', name: '', year: 2026, priceClp: 0,
        transmission: 'MANUAL', fuel: 'BENCINA',
        engineDisplacementCc: 0, powerHp: 0, torqueNm: 0,
        consumptionCityKmL: 0, consumptionHighwayKmL: 0,
        lengthMm: 0, widthMm: 0, heightMm: 0, weightKg: 0,
        trunkLiters: 0, airbagCount: 0,
        hasAbs: false, hasEsp: false, hasCruiseControl: false,
      },
    });
    await fixture.whenStable();
    fixture.detectChanges();
    const toggles = fixture.nativeElement.querySelectorAll('app-toggle-field');
    expect(toggles.length).toBe(3);
  });
});

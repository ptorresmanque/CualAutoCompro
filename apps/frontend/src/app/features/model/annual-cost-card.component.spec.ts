import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AnnualCostCardComponent } from './annual-cost-card.component';

const sampleCost = {
  kmPerYear: 15000,
  fuelClp: 800000,
  maintenanceClp: 200000,
  circulationPermitClp: 250000,
  mandatoryInsuranceClp: 180000,
  voluntaryInsuranceClp: 0,
  depreciationClp: 1200000,
  totalClp: 2630000,
  meta: {
    consumptionCityKmL: 14,
    consumptionHighwayKmL: 18,
    fuelType: 'BENCINA',
    fuelUnit: 'L',
    fuelPricePerUnit: 1300,
    cityShare: 0.33,
    highwayShare: 0.67,
    maintenanceMileages: [10000],
  },
};

describe('AnnualCostCardComponent', () => {
  it('carga el desglose desde /cost/version/:id al montar', async () => {
    TestBed.configureTestingModule({
      imports: [AnnualCostCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations()],
    });
    const fixture = TestBed.createComponent(AnnualCostCardComponent);
    fixture.componentRef.setInput('versionId', 'v1');
    fixture.detectChanges();
    await fixture.whenStable();

    const http = TestBed.inject(HttpTestingController);
    const req = http.expectOne(
      (r) => r.url.includes('/cost/version/v1') && r.params.get('kmPerYear') === '15000',
    );
    req.flush({ data: sampleCost, error: null });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    expect(fixture.componentInstance.cost()?.totalClp).toBe(2_630_000);
  });

  it('actualiza el cálculo cuando se cambia km/año', async () => {
    TestBed.configureTestingModule({
      imports: [AnnualCostCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations()],
    });
    const fixture = TestBed.createComponent(AnnualCostCardComponent);
    fixture.componentRef.setInput('versionId', 'v1');
    fixture.detectChanges();
    await fixture.whenStable();

    const http = TestBed.inject(HttpTestingController);
    // First load
    http.expectOne(
      (r) => r.url.includes('/cost/version/v1') && r.params.get('kmPerYear') === '15000',
    ).flush({ data: sampleCost, error: null });
    await fixture.whenStable();

    // Trigger km change
    fixture.componentInstance.onKmChange(25000);
    await fixture.whenStable();

    const req = http.expectOne(
      (r) => r.url.includes('/cost/version/v1') && r.params.get('kmPerYear') === '25000',
    );
    expect(req).toBeTruthy();
    req.flush({ data: { ...sampleCost, kmPerYear: 25000 }, error: null });
    await fixture.whenStable();
  });

  it('clamp km/año al rango [0, 200000]', async () => {
    TestBed.configureTestingModule({
      imports: [AnnualCostCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations()],
    });
    const fixture = TestBed.createComponent(AnnualCostCardComponent);
    fixture.componentInstance.onKmChange(-50);
    expect(fixture.componentInstance.km()).toBe(0);
    fixture.componentInstance.onKmChange(500_000);
    expect(fixture.componentInstance.km()).toBe(200_000);
    fixture.componentInstance.onKmChange(15000);
    expect(fixture.componentInstance.km()).toBe(15_000);
  });

  it('muestra error del backend en pantalla', async () => {
    TestBed.configureTestingModule({
      imports: [AnnualCostCardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideAnimations()],
    });
    const fixture = TestBed.createComponent(AnnualCostCardComponent);
    fixture.componentRef.setInput('versionId', 'v1');
    fixture.detectChanges();
    await fixture.whenStable();

    const http = TestBed.inject(HttpTestingController);
    http.expectOne(
      (r) => r.url.includes('/cost/version/v1'),
    ).flush({
      data: null,
      error: { code: 'NOT_FOUND', message: 'Versión no encontrada' },
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    expect(fixture.componentInstance.error()).toBe('Versión no encontrada');
  });
});

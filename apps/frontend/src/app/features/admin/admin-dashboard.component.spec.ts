import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';

const summary = {
  brands: 10,
  models: 20,
  versions: 30,
  equipment: 40,
  maintenance: 3,
  dealers: 60,
  fuelPrices: 70,
};

function setup() {
  TestBed.configureTestingModule({
    imports: [AdminDashboardComponent],
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
  });
  const fixture = TestBed.createComponent(AdminDashboardComponent);
  fixture.detectChanges();
  return { fixture, http: TestBed.inject(HttpTestingController) };
}

describe('AdminDashboardComponent', () => {
  it('resuelve los 7 contadores con un único GET /admin/summary', async () => {
    const { fixture, http } = setup();

    const reqs = http.match(() => true);
    expect(reqs.length).toBe(1);
    expect(reqs[0].request.url).toContain('/api/v1/admin/summary');
    reqs[0].flush({ data: summary, error: null });

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    const cards = fixture.componentInstance.cards();
    expect(cards.length).toBe(7);
    expect(cards.every((c) => !c.loading)).toBe(true);
    expect(cards.find((c) => c.path === '/admin/maintenance')?.count).toBe(3);
    expect(cards.find((c) => c.path === '/admin/fuel-prices')?.count).toBe(70);
  });

  it('si el summary falla deja los contadores en null y sin loading', async () => {
    const { fixture, http } = setup();

    http.expectOne((r) => r.url.includes('/admin/summary')).flush(
      { data: null, error: { code: 'INTERNAL', message: 'Explotó' } },
      { status: 500, statusText: 'Server Error' },
    );

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));

    const cards = fixture.componentInstance.cards();
    expect(cards.every((c) => c.count === null && !c.loading)).toBe(true);
  });
});

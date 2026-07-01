import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  it('carga conteos desde los endpoints públicos', async () => {
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const requests = http.match(() => true);
    expect(requests.length).toBeGreaterThan(0);
    for (const r of requests) r.flush({ data: [] });
    fixture.detectChanges();
  });

  it('llama a los 5 endpoints correctos', async () => {
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [{ id: 'b1', name: 'Toyota' }] });
    http
      .expectOne((r) => r.url.includes('/api/v1/models?pageSize=1'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 1 } });
    http
      .expectOne((r) => r.url.includes('/api/v1/versions?pageSize=1'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 1 } });
    http
      .expectOne((r) => r.url.includes('/api/v1/equipment'))
      .flush({ data: [{ id: 'e1', name: 'Climatizador' }] });
    http
      .expectOne((r) => r.url.includes('/api/v1/maintenance/version/__none__'))
      .flush({ data: [] });

    await fixture.whenStable();
    fixture.detectChanges();
    http.verify();
  });
});

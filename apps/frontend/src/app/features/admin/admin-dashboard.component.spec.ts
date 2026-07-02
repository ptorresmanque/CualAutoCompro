import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  it('carga las 5 cards y la de Mantención llama a /admin/maintenance', async () => {
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);

    const maintReq = http.expectOne((r) => r.url.includes('/api/v1/admin/maintenance'));
    maintReq.flush({ data: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }] });

    for (const r of http.match(() => true)) r.flush({ data: [] });

    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    const cards = fixture.componentInstance.cards();
    const maint = cards.find((c) => c.path === '/admin/maintenance');
    expect(maint?.count).toBe(3);
  });
});
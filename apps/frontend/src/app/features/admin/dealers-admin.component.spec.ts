import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DealersAdminComponent } from './dealers-admin.component';

describe('DealersAdminComponent', () => {
  it('carga lista desde /admin/dealers (fallback /dealers en test)', async () => {
    TestBed.configureTestingModule({
      imports: [DealersAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(DealersAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    expect(reqs.length).toBeGreaterThan(0);
    for (const r of reqs) {
      r.flush({
        data: [
          { id: 'd1', name: 'AutoMax', url: 'https://automax.example', logoUrl: null },
        ],
      });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    expect(fixture.componentInstance.items().length).toBeGreaterThan(0);
    expect(fixture.componentInstance.items()[0].url).toBe('https://automax.example');
  });

  it('openCreate muestra dialog', async () => {
    TestBed.configureTestingModule({
      imports: [DealersAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(DealersAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    const reqs = http.match(() => true);
    for (const r of reqs) r.flush({ data: [] });
    await fixture.whenStable();
    fixture.componentInstance.openCreate();
    expect(fixture.componentInstance.dialogEntity()).toBeNull();
  });

  it('ordena por nombre asc/desc', async () => {
    TestBed.configureTestingModule({
      imports: [DealersAdminComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(DealersAdminComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const r of http.match(() => true)) {
      r.flush({
        data: [
          { id: 'd1', name: 'Zoe Motors', url: 'https://zoe.example', logoUrl: null },
          { id: 'd2', name: 'Audi Dealer', url: 'https://audi.example', logoUrl: null },
          { id: 'd3', name: 'Mazda Store', url: 'https://mazda.example', logoUrl: null },
        ],
      });
    }
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    const cmp = fixture.componentInstance;
    expect(cmp.sortKey()).toBeNull();
    expect(cmp.displayed().map((d) => d.name)).toEqual(['Zoe Motors', 'Audi Dealer', 'Mazda Store']);

    cmp.toggleSort('name');
    expect(cmp.sortKey()).toBe('name');
    expect(cmp.sortDir()).toBe('asc');
    expect(cmp.displayed().map((d) => d.name)).toEqual(['Audi Dealer', 'Mazda Store', 'Zoe Motors']);

    cmp.toggleSort('name');
    expect(cmp.sortDir()).toBe('desc');
    expect(cmp.displayed().map((d) => d.name)).toEqual(['Zoe Motors', 'Mazda Store', 'Audi Dealer']);
  });
});
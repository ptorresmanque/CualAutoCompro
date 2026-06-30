import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { CatalogComponent } from './catalog.component';
import { CompareStore } from '../../core/compare-store.service';

describe('CatalogComponent', () => {
  let http: HttpTestingController;
  let store: CompareStore;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  function flushItems(req: TestRequest, items: unknown[]) {
    req.flush({ data: { total: items.length, items, page: 1, pageSize: 20 } });
  }

  it('carga modelos al init', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url.includes('/api/v1/models'));
    flushItems(req, [
      {
        id: 'm1',
        name: 'Yaris',
        brand: { name: 'Toyota' },
        minPrice: 14000000,
        segment: 'HATCHBACK',
      },
    ]);
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Yaris');
    expect(fixture.nativeElement.textContent).toContain('Toyota');
  });

  it('updateFilter refetch con params mergeados', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushItems(
      http.expectOne((r) => r.url.includes('/api/v1/models')),
      [],
    );
    await fixture.componentInstance.initialLoad;

    const loadPromise = fixture.componentInstance.updateFilter({
      segment: 'SUV',
    });
    const req = http.expectOne(
      (r) =>
        r.url.includes('/api/v1/models') &&
        r.params.get('segment') === 'SUV',
    );
    flushItems(req, [
      {
        id: 'm2',
        name: 'CX-5',
        brand: { name: 'Mazda' },
        minPrice: 23000000,
        segment: 'SUV',
      },
    ]);
    await loadPromise;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('CX-5');
    expect(fixture.nativeElement.textContent).toContain('Mazda');
  });

  it('botón Comparar agrega defaultVersion.id (no model.id) a CompareStore', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushItems(
      http.expectOne((r) => r.url.includes('/api/v1/models')),
      [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          minPrice: 14000000,
          segment: 'HATCHBACK',
          defaultVersion: {
            id: 'v1',
            name: 'XLS',
            priceClp: 14990000,
            year: 2026,
          },
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const btn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button[data-testid="compare"]');
    expect(btn).not.toBeNull();
    btn!.click();

    expect(store.ids()).toEqual(['v1']);
  });

  it('muestra el nombre+año de la versión elegida junto al botón Comparar', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushItems(
      http.expectOne((r) => r.url.includes('/api/v1/models')),
      [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          minPrice: 14000000,
          segment: 'HATCHBACK',
          defaultVersion: {
            id: 'v1',
            name: 'XLS',
            priceClp: 14990000,
            year: 2026,
          },
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('XLS 2026');
  });

  it('deshabilita el botón Comparar cuando el modelo no tiene versiones', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushItems(
      http.expectOne((r) => r.url.includes('/api/v1/models')),
      [
        {
          id: 'm2',
          name: 'CX-5',
          brand: { name: 'Mazda' },
          minPrice: null,
          segment: 'SUV',
          defaultVersion: null,
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const btn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button[data-testid="compare"]');
    expect(btn).not.toBeNull();
    expect(btn!.disabled).toBe(true);
  });

  it('muestra mensaje vacío cuando no hay resultados', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushItems(
      http.expectOne((r) => r.url.includes('/api/v1/models')),
      [],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      'No se encontraron modelos',
    );
  });
});

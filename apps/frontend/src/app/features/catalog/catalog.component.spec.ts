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
        versions: [
          { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
        ],
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
        versions: [
          { id: 'v1', name: 'Sport', priceClp: 23000000, year: 2026 },
        ],
      },
    ]);
    await loadPromise;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('CX-5');
    expect(fixture.nativeElement.textContent).toContain('Mazda');
  });

  it('botón Comparar agrega version por defaultVersion (no model.id) a CompareStore', async () => {
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
          versions: [
            { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
            { id: 'v2', name: 'Sport', priceClp: 11500000, year: 2025 },
          ],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const btn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button[data-testid="compare-m1"]');
    expect(btn).not.toBeNull();
    expect(btn!.getAttribute('data-state')).toBe('available');
    expect(btn!.getAttribute('data-selected-version')).toBe('v1');
    btn!.click();

    expect(store.ids()).toEqual(['v1']);
  });

  it('botón Comparar agrega la versión SELECCIONADA vía chip, no la default', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushItems(
      http.expectOne((r) => r.url.includes('/api/v1/models')),
      [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          minPrice: 11500000,
          segment: 'HATCHBACK',
          defaultVersion: {
            id: 'v1',
            name: 'XLS',
            priceClp: 14990000,
            year: 2026,
          },
          versions: [
            { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
            { id: 'v2', name: 'Sport', priceClp: 11500000, year: 2025 },
          ],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    // Click "Sport" chip
    const sportChip = fixture.nativeElement.querySelector(
      'button[data-testid="version-chip-v2"]',
    ) as HTMLButtonElement;
    sportChip.click();
    fixture.detectChanges();

    // Compare button now uses v2
    const btn = fixture.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(btn.getAttribute('data-selected-version')).toBe('v2');
    btn.click();

    expect(store.ids()).toEqual(['v2']);
  });

  it('botón Comparar toggle: segunda pulsación quita la versión', async () => {
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
          defaultVersion: { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
          versions: [{ id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 }],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('data-state')).toBe('added');

    btn.click();
    fixture.detectChanges();
    expect(btn.getAttribute('data-state')).toBe('available');
    expect(store.ids()).toEqual([]);
  });

  it('muestra sticky selection-bar con contador cuando hay versiones seleccionadas', async () => {
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
          defaultVersion: { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
          versions: [{ id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 }],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="selection-bar"]')).toBeNull();

    const btn = fixture.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();

    const bar = fixture.nativeElement.querySelector('[data-testid="selection-bar"]');
    expect(bar).not.toBeNull();
    expect(bar.textContent).toContain('1 versión seleccionada');
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="selection-bar-compare"]') as HTMLAnchorElement,
    ).toBeTruthy();
  });

  it('botón "Limpiar" vacía CompareStore y oculta la sticky bar', async () => {
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
          defaultVersion: { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
          versions: [{ id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 }],
        },
        {
          id: 'm2',
          name: 'Corolla',
          brand: { name: 'Toyota' },
          minPrice: 16990000,
          segment: 'SEDAN',
          defaultVersion: { id: 'v2', name: 'XLI', priceClp: 16990000, year: 2024 },
          versions: [{ id: 'v2', name: 'XLI', priceClp: 16990000, year: 2024 }],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const btns = fixture.nativeElement.querySelectorAll(
      'button[data-testid^="compare-"]',
    );
    (btns[0] as HTMLButtonElement).click();
    (btns[1] as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(store.ids().length).toBe(2);

    const clearBtn = fixture.nativeElement.querySelector(
      '[data-testid="selection-bar-clear"]',
    ) as HTMLButtonElement;
    expect(clearBtn).not.toBeNull();
    clearBtn.click();
    fixture.detectChanges();

    expect(store.ids()).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="selection-bar"]'),
    ).toBeNull();
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
          versions: [
            { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
          ],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(btn.getAttribute('data-selected-version')).toBe('v1');
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
          versions: [],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const btn: HTMLButtonElement | null =
      fixture.nativeElement.querySelector('button[data-testid="compare-m2"]');
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

  it('botones "Ver comparación" tienen routerLink generado (no <a> sin href)', async () => {
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
          defaultVersion: { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
          versions: [{ id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 }],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const heroCompare = fixture.nativeElement.querySelector(
      '[data-testid="hero-compare"]',
    ) as HTMLAnchorElement;
    expect(heroCompare.getAttribute('href')).toBe('/compare');
    expect(heroCompare.getAttribute('href')).not.toBeNull();
  });

  it('muestra chips de versión solo cuando hay > 1 versión', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushItems(
      http.expectOne((r) => r.url.includes('/api/v1/models')),
      [
        {
          id: 'm1',
          name: 'Single',
          brand: { name: 'Toyota' },
          minPrice: 14000000,
          segment: 'HATCHBACK',
          defaultVersion: { id: 'v1', name: 'Base', priceClp: 14000000, year: 2026 },
          versions: [{ id: 'v1', name: 'Base', priceClp: 14000000, year: 2026 }],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="version-chips"]'),
    ).toBeNull();

    const loadPromise = fixture.componentInstance.updateFilter({});
    flushItems(
      http.expectOne((r) => r.url.includes('/api/v1/models')),
      [
        {
          id: 'm2',
          name: 'Multi',
          brand: { name: 'Toyota' },
          minPrice: 14000000,
          segment: 'HATCHBACK',
          defaultVersion: { id: 'v1', name: 'A', priceClp: 14000000, year: 2026 },
          versions: [
            { id: 'v1', name: 'A', priceClp: 14000000, year: 2026 },
            { id: 'v2', name: 'B', priceClp: 15000000, year: 2026 },
          ],
        },
      ],
    );
    await loadPromise;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="version-chips"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelectorAll('button[data-testid^="version-chip-"]')
        .length,
    ).toBe(2);
  });
});

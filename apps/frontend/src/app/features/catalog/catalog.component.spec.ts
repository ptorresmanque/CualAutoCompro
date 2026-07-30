import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { convertToParamMap, provideRouter } from '@angular/router';
import { CatalogComponent } from './catalog.component';
import { CompareStore } from '../../core/compare-store.service';
import { FavoritesStore } from '../../core/favorites-store.service';

class FavoritesStoreStub {
  isFavorite(): boolean { return false; }
  async toggle(): Promise<void> { /* noop */ }
  load(): Promise<void> { return Promise.resolve(); }
}

import { PopularityService } from '../../core/popularity.service';

class PopularityServiceStub {
  topIds = signal<ReadonlySet<string>>(new Set<string>());
  loading = signal(false);
  refresh = async () => { /* noop */ };
  isPopular = (id: string): boolean => this.topIds().has(id);
  recordAdd = (_versionId: string): void => { /* noop */ };
}

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
        { provide: FavoritesStore, useClass: FavoritesStoreStub },
        { provide: PopularityService, useClass: PopularityServiceStub },
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

  /**
   * Las opciones de segmento / transmisión / combustible se piden a la API
   * porque el admin puede crear valores nuevos con "Otro". Los tests no
   * dependen de ellas (el componente arranca con los canónicos), pero hay que
   * responder los requests para que `initialLoad` resuelva y `verify()` pase.
   */
  function flushFacets() {
    for (const path of ['/models/segments', '/versions/transmissions', '/versions/fuels']) {
      http.match((r) => r.url.endsWith(path)).forEach((r) => r.flush({ data: [] }));
    }
  }

  it('carga modelos al init', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [{ id: 'toyota', name: 'Toyota' }] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
      [
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
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Yaris');
    expect(fixture.nativeElement.textContent).toContain('Toyota');
  });

  it('updateFilter refetch con params mergeados', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
      [],
    );
    await fixture.componentInstance.initialLoad;

    const loadPromise = fixture.componentInstance.updateFilter({
      segment: ['SUV'],
    });
    const req = http.expectOne(
      (r) =>
        r.url.endsWith('/api/v1/models') &&
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
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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

    const sportChip = fixture.nativeElement.querySelector(
      'button[data-testid="version-chip-v2"]',
    ) as HTMLButtonElement;
    sportChip.click();
    fixture.detectChanges();

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
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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

    (fixture.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement).click();
    fixture.detectChanges();

    const stickyCompare = fixture.nativeElement.querySelector(
      '[data-testid="selection-bar-compare"]',
    ) as HTMLAnchorElement;
    expect(stickyCompare).not.toBeNull();
    expect(stickyCompare.getAttribute('href')).toBe('/compare');
  });

  it('muestra chips de versión solo cuando hay > 1 versión', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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
      http.expectOne((r) => r.url.endsWith('/api/v1/models')),
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

  it('aplica filtro transmission=AUTOMATIC y se ve en request', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.updateFilter({ transmission: ['AUTOMATIC'] });
    const req = http.expectOne(
      (r) =>
        r.url.endsWith('/api/v1/models') &&
        r.params.get('transmission') === 'AUTOMATIC',
    );
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('cambia sort a minPrice y se ve en request', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.updateFilter({ sort: 'minPrice' });
    const req = http.expectOne(
      (r) =>
        r.url.endsWith('/api/v1/models') &&
        r.params.get('sort') === 'minPrice',
    );
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('clearFilters resetea sort y order a defaults', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p1 = fixture.componentInstance.updateFilter({ sort: 'minPrice', order: 'desc' });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p1;

    const p2 = fixture.componentInstance.clearFilters();
    const req = http.expectOne(
      (r) =>
        r.url.endsWith('/api/v1/models') &&
        r.params.get('sort') === 'name' &&
        r.params.get('order') === 'asc',
    );
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p2;
  });

  it('sort-select es un <mat-select> (no <select> nativo)', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector(
      '[data-testid="sort-select"]',
    );
    expect(el).not.toBeNull();
    expect(el.tagName.toLowerCase()).toBe('mat-select');
  });

  it('clearFilters también resetea selectedVersions (I8)', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await fixture.componentInstance.initialLoad;

    // El usuario seleccionó una versión alternativa
    fixture.componentInstance.onVersionSelected(
      { id: 'm1' } as never,
      { id: 'v-alt', name: 'X', priceClp: 1, year: 2025 } as never,
    );
    expect(fixture.componentInstance.selectedVersions()).toEqual({ m1: 'v-alt' });

    const p = fixture.componentInstance.clearFilters();
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await p;

    expect(fixture.componentInstance.selectedVersions()).toEqual({});
  });

  it('sliders existen: filtro de año NO existe; precio tiene doble thumb; hay sliders de potencia, consumo ciudad y consumo carretera', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[data-testid="filter-year"]')).toBeNull();

    expect(
      fixture.nativeElement.querySelector('[data-testid="filter-price-low"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="filter-price-high"]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('[data-testid="filter-powerMin-low"]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('[data-testid="filter-consumptionMinKmL-low"]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('[data-testid="filter-consumptionHighwayMinKmL-low"]'),
    ).not.toBeNull();
  });

  it('priceMin slider omite el query param cuando está en el bound mínimo', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.onPriceMinChange(0);
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.has('priceMin')).toBe(false);
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('priceMax slider omite el query param cuando está en el bound máximo', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.onPriceMaxChange(
      fixture.componentInstance.priceBounds.max,
    );
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.has('priceMax')).toBe(false);
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('price range slider envía priceMin/priceMax cuando están dentro del rango', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const pMin = fixture.componentInstance.onPriceMinChange(5_000_000);
    const req1 = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req1.request.params.get('priceMin')).toBe('5000000');
    req1.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await pMin;

    const pMax = fixture.componentInstance.onPriceMaxChange(20_000_000);
    const req2 = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req2.request.params.get('priceMax')).toBe('20000000');
    req2.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await pMax;
  });

  it('powerMin slider envía powerMin solo cuando v > bound mínimo', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.onPowerMinChange(150);
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('powerMin')).toBe('150');
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('slider de rendimiento ciudad envía consumptionMinKmL cuando v > bound mínimo', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.onConsumptionMinChange(15);
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('consumptionMinKmL')).toBe('15');
    // El filtro es 'al menos 15 km/L', no 'a lo sumo': el param viejo
    // (`consumptionMax`, lte) descartaba justo los autos eficientes.
    expect(req.request.params.has('consumptionMax')).toBe(false);
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('slider de rendimiento carretera envía consumptionHighwayMinKmL', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.onConsumptionHighwayMinChange(18);
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('consumptionHighwayMinKmL')).toBe('18');
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('slider de rendimiento omite el query param en el bound mínimo', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.onConsumptionMinChange(
      fixture.componentInstance.consumptionBounds.min,
    );
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.has('consumptionMinKmL')).toBe(false);
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('powerMin slider omite el query param cuando está en el bound mínimo', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [] });
    http
      .expectOne((r) => r.url.endsWith('/api/v1/models'))
      .flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.onPowerMinChange(
      fixture.componentInstance.powerBounds.min,
    );
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.has('powerMin')).toBe(false);
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('ofrece como filtro los segmentos creados desde el admin con "Otro"', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    http
      .match((r) => r.url.endsWith('/models/segments'))
      .forEach((r) => r.flush({ data: [{ id: 'SUV' }, { id: 'MINI_VAN' }] }));
    http
      .match((r) => r.url.endsWith('/versions/transmissions') || r.url.endsWith('/versions/fuels'))
      .forEach((r) => r.flush({ data: [] }));
    http.expectOne((r) => r.url.includes('/api/v1/brands')).flush({ data: [] });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    expect(fixture.componentInstance.segments()).toEqual([
      { value: 'SUV', label: 'SUV' },
      { value: 'MINI_VAN', label: 'Mini van' },
    ]);
    expect(fixture.nativeElement.textContent).toContain('Mini van');
  });

  it('mantiene los segmentos canónicos si la API de facetas falla', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    http
      .match((r) => r.url.endsWith('/models/segments'))
      .forEach((r) => r.flush({ data: null }, { status: 500, statusText: 'Server Error' }));
    http
      .match((r) => r.url.endsWith('/versions/transmissions') || r.url.endsWith('/versions/fuels'))
      .forEach((r) => r.flush({ data: [] }));
    http.expectOne((r) => r.url.includes('/api/v1/brands')).flush({ data: [] });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    expect(fixture.componentInstance.segments().map((s) => s.value)).toContain('SEDAN');
  });
  // ---------------------------------------------------------------------------
  // Búsqueda por texto (`q`). La API la soportaba desde siempre; el catálogo no
  // tenía campo y la navbar solo mostraba el buscador en ≥1280px.
  // ---------------------------------------------------------------------------

  /** Monta el catálogo con la carga inicial ya resuelta. */
  async function mountCatalog() {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.componentInstance.searchDebounceMs = 0;
    fixture.detectChanges();
    flushFacets();
    http.expectOne((r) => r.url.includes('/api/v1/brands')).flush({ data: [] });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();
    return fixture;
  }

  it('renderiza el campo de búsqueda', async () => {
    const fixture = await mountCatalog();
    expect(
      fixture.nativeElement.querySelector('[data-testid="catalog-search"]'),
    ).not.toBeNull();
  });

  it('buscar envía q y lo refleja en el campo', async () => {
    const fixture = await mountCatalog();

    fixture.componentInstance.onSearchInput('yaris');
    await new Promise((r) => setTimeout(r, 0));

    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('q')).toBe('yaris');
    flushItems(req, []);
    fixture.detectChanges();

    expect(fixture.componentInstance.searchTerm()).toBe('yaris');
  });

  it('recorta el término y omite q cuando queda vacío', async () => {
    const fixture = await mountCatalog();

    fixture.componentInstance.onSearchInput('  corolla  ');
    await new Promise((r) => setTimeout(r, 0));
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('q')).toBe('corolla');
    flushItems(req, []);

    fixture.componentInstance.onSearchInput('   ');
    await new Promise((r) => setTimeout(r, 0));
    const cleared = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(cleared.request.params.has('q')).toBe(false);
    flushItems(cleared, []);
  });

  it('no repite el request si el término no cambió', async () => {
    const fixture = await mountCatalog();

    fixture.componentInstance.onSearchInput('kia');
    await new Promise((r) => setTimeout(r, 0));
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);

    // Mismo término (con espacios): no debe salir otro request.
    fixture.componentInstance.onSearchInput('kia ');
    await new Promise((r) => setTimeout(r, 0));
    http.expectNone((r) => r.url.endsWith('/api/v1/models'));
  });

  it('una ráfaga de tecleo produce un solo request con el término final', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.componentInstance.searchDebounceMs = 20;
    fixture.detectChanges();
    flushFacets();
    http.expectOne((r) => r.url.includes('/api/v1/brands')).flush({ data: [] });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await fixture.componentInstance.initialLoad;

    for (const term of ['y', 'ya', 'yar', 'yari', 'yaris']) {
      fixture.componentInstance.onSearchInput(term);
    }
    await new Promise((r) => setTimeout(r, 40));

    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('q')).toBe('yaris');
    flushItems(req, []);
  });

  it('limpiar filtros vacía el campo de búsqueda', async () => {
    const fixture = await mountCatalog();

    fixture.componentInstance.onSearchInput('mazda');
    await new Promise((r) => setTimeout(r, 0));
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);

    const p = fixture.componentInstance.clearFilters();
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await p;

    expect(fixture.componentInstance.searchTerm()).toBe('');
    expect(fixture.componentInstance.filters().q).toBeUndefined();
  });
  // ---------------------------------------------------------------------------
  // Orden por rendimiento. El criterio "Rendimiento" tiene que mostrar primero
  // el auto que MÁS rinde: con `sort=minConsumption&order=asc` (lo que hacía
  // antes) salía primero el que más gasta.
  // ---------------------------------------------------------------------------

  it('elegir Rendimiento manda sort=efficiency con order=desc', async () => {
    const fixture = await mountCatalog();

    const p = fixture.componentInstance.onSortChange('efficiency');
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('sort')).toBe('efficiency');
    expect(req.request.params.get('order')).toBe('desc');
    flushItems(req, []);
    await p;
  });

  it('elegir Precio vuelve a order=asc (más barato primero)', async () => {
    const fixture = await mountCatalog();

    const eff = fixture.componentInstance.onSortChange('efficiency');
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await eff;

    const p = fixture.componentInstance.onSortChange('minPrice');
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('sort')).toBe('minPrice');
    expect(req.request.params.get('order')).toBe('asc');
    flushItems(req, []);
    await p;
  });

  it('el usuario puede invertir la dirección después de elegir el criterio', async () => {
    const fixture = await mountCatalog();

    const eff = fixture.componentInstance.onSortChange('efficiency');
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await eff;

    const p = fixture.componentInstance.updateFilter({ order: 'asc' });
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('sort')).toBe('efficiency');
    expect(req.request.params.get('order')).toBe('asc');
    flushItems(req, []);
    await p;
  });

  it('ya no ofrece el criterio minConsumption', async () => {
    const fixture = await mountCatalog();
    expect(
      fixture.componentInstance.sortOptions.map((o) => o.value),
    ).not.toContain('minConsumption');
    expect(fixture.componentInstance.sortOptions.map((o) => o.value)).toContain(
      'efficiency',
    );
  });
  // ---------------------------------------------------------------------------
  // Chips de filtros activos
  // ---------------------------------------------------------------------------

  it('no muestra chips cuando no hay filtros', async () => {
    const fixture = await mountCatalog();
    expect(
      fixture.nativeElement.querySelector('[data-testid="active-filters"]'),
    ).toBeNull();
  });

  it('muestra un chip por filtro activo con etiqueta legible', async () => {
    const fixture = await mountCatalog();

    const p = fixture.componentInstance.updateFilter({
      segment: ['SUV'],
      priceMin: 15_000_000,
      consumptionMinKmL: 12,
    });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await p;
    fixture.detectChanges();

    const chips = fixture.componentInstance.activeFilters();
    expect(chips.map((c) => c.key)).toEqual([
      'segment',
      'priceMin',
      'consumptionMinKmL',
    ]);
    expect(chips[0].label).toBe('SUV');
    expect(chips[1].label).toContain('Desde');
    expect(chips[2].label).toBe('Ciudad 12 km/L+');

    expect(
      fixture.nativeElement.querySelector('[data-testid="active-filter-segment:SUV"]'),
    ).not.toBeNull();
  });

  it('el chip de marca usa el nombre, no el id', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.componentInstance.searchDebounceMs = 0;
    fixture.detectChanges();
    flushFacets();
    http
      .expectOne((r) => r.url.includes('/api/v1/brands'))
      .flush({ data: [{ id: 'b1', name: 'Toyota' }] });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await fixture.componentInstance.initialLoad;

    const p = fixture.componentInstance.updateFilter({ brand: 'b1' });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await p;

    expect(fixture.componentInstance.activeFilters()[0].label).toBe('Toyota');
  });

  it('quitar un chip elimina solo ese filtro', async () => {
    const fixture = await mountCatalog();

    const p = fixture.componentInstance.updateFilter({
      segment: ['SUV'],
      fuel: ['HYBRID'],
    });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await p;

    const removal = fixture.componentInstance.removeFilter('segment');
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.has('segment')).toBe(false);
    expect(req.request.params.get('fuel')).toBe('HYBRID');
    flushItems(req, []);
    await removal;

    expect(fixture.componentInstance.activeFilters().map((c) => c.key)).toEqual([
      'fuel',
    ]);
  });

  it('quitar el chip de búsqueda también vacía el campo', async () => {
    const fixture = await mountCatalog();

    fixture.componentInstance.onSearchInput('yaris');
    await new Promise((r) => setTimeout(r, 0));
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    expect(fixture.componentInstance.searchTerm()).toBe('yaris');

    const removal = fixture.componentInstance.removeFilter('q');
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.has('q')).toBe(false);
    flushItems(req, []);
    await removal;

    expect(fixture.componentInstance.searchTerm()).toBe('');
  });

  it('el contador de resultados es una región live', async () => {
    const fixture = await mountCatalog();
    const el = fixture.nativeElement.querySelector('[data-testid="results-count"]');
    expect(el).not.toBeNull();
    expect(el.getAttribute('aria-live')).toBe('polite');
    expect(el.getAttribute('role')).toBe('status');
  });

  it('el contador usa singular con un solo resultado', async () => {
    const fixture = TestBed.createComponent(CatalogComponent);
    fixture.detectChanges();
    flushFacets();
    http.expectOne((r) => r.url.includes('/api/v1/brands')).flush({ data: [] });
    http.expectOne((r) => r.url.endsWith('/api/v1/models')).flush({
      data: { total: 1, items: [], page: 1, pageSize: 20 },
    });
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('[data-testid="results-count"]');
    expect(el.textContent).toContain('1 modelo');
    expect(el.textContent).not.toContain('modelos');
  });

  // ---------------------------------------------------------------------------
  // Multi-selección: "SUV o Crossover" era imposible con radio buttons.
  // ---------------------------------------------------------------------------

  it('marcar dos segmentos manda los dos como CSV', async () => {
    const fixture = await mountCatalog();

    const first = fixture.componentInstance.toggleMulti('segment', 'SUV');
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await first;

    const second = fixture.componentInstance.toggleMulti('segment', 'CROSSOVER');
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('segment')).toBe('SUV,CROSSOVER');
    flushItems(req, []);
    await second;

    expect(fixture.componentInstance.filters().segment).toEqual([
      'SUV',
      'CROSSOVER',
    ]);
  });

  it('desmarcar el último valor quita el param', async () => {
    const fixture = await mountCatalog();

    const on = fixture.componentInstance.toggleMulti('fuel', 'HYBRID');
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await on;

    const off = fixture.componentInstance.toggleMulti('fuel', 'HYBRID');
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.has('fuel')).toBe(false);
    flushItems(req, []);
    await off;

    expect(fixture.componentInstance.filters().fuel).toBeUndefined();
  });

  it('isMultiSelected refleja el estado de cada checkbox', async () => {
    const fixture = await mountCatalog();

    const p = fixture.componentInstance.updateFilter({
      transmission: ['MANUAL', 'CVT'],
    });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await p;

    expect(fixture.componentInstance.isMultiSelected('transmission', 'MANUAL')).toBe(true);
    expect(fixture.componentInstance.isMultiSelected('transmission', 'CVT')).toBe(true);
    expect(fixture.componentInstance.isMultiSelected('transmission', 'DCT')).toBe(false);
  });

  it('genera un chip por valor y quitar uno deja el otro', async () => {
    const fixture = await mountCatalog();

    const p = fixture.componentInstance.updateFilter({
      segment: ['SUV', 'CROSSOVER'],
    });
    flushItems(http.expectOne((r) => r.url.endsWith('/api/v1/models')), []);
    await p;
    fixture.detectChanges();

    expect(fixture.componentInstance.activeFilters().map((c) => c.id)).toEqual([
      'segment:SUV',
      'segment:CROSSOVER',
    ]);

    const removal = fixture.componentInstance.removeFilter('segment', 'SUV');
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('segment')).toBe('CROSSOVER');
    flushItems(req, []);
    await removal;

    expect(fixture.componentInstance.filters().segment).toEqual(['CROSSOVER']);
  });

  it('renderiza checkboxes, no radios, para los filtros multi-valor', async () => {
    const fixture = await mountCatalog();
    expect(
      fixture.nativeElement.querySelectorAll('mat-radio-button').length,
    ).toBe(0);
    expect(
      fixture.nativeElement.querySelector('[data-testid="filter-segment-SUV"]'),
    ).not.toBeNull();
  });

  it('un link con un solo valor (formato viejo) sigue funcionando', async () => {
    // `?segment=SUV` es la forma histórica del param: tiene que seguir
    // hidratando el filtro, ahora como array de un elemento.
    const fixture = await mountCatalog();
    const parsed = fixture.componentInstance['filtersFromParams'](
      convertToParamMap({ segment: 'SUV' }),
    );
    expect(parsed.segment).toEqual(['SUV']);

    const multi = fixture.componentInstance['filtersFromParams'](
      convertToParamMap({ segment: 'SUV,CROSSOVER' }),
    );
    expect(multi.segment).toEqual(['SUV', 'CROSSOVER']);
  });
});

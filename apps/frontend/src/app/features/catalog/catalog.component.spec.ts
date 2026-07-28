import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
  TestRequest,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
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
      segment: 'SUV',
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

    const p = fixture.componentInstance.updateFilter({ transmission: 'AUTOMATIC' });
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
      fixture.nativeElement.querySelector('[data-testid="filter-consumptionMax-low"]'),
    ).not.toBeNull();

    expect(
      fixture.nativeElement.querySelector('[data-testid="filter-consumptionHighwayMax-low"]'),
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

  it('consumptionMax slider envía consumptionMax cuando v < bound máximo', async () => {
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

    const p = fixture.componentInstance.onConsumptionMaxChange(15);
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('consumptionMax')).toBe('15');
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('consumptionHighwayMax slider envía consumptionHighwayMax cuando v < bound máximo', async () => {
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

    const p = fixture.componentInstance.onConsumptionHighwayMaxChange(18);
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.get('consumptionHighwayMax')).toBe('18');
    req.flush({ data: { total: 0, items: [], page: 1, pageSize: 20 } });
    await p;
  });

  it('consumptionMax slider omite el query param cuando está en el bound máximo', async () => {
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

    const p = fixture.componentInstance.onConsumptionMaxChange(
      fixture.componentInstance.consumptionBounds.max,
    );
    const req = http.expectOne((r) => r.url.endsWith('/api/v1/models'));
    expect(req.request.params.has('consumptionMax')).toBe(false);
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
});

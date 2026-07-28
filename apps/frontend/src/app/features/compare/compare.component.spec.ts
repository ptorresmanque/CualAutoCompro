import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { CompareComponent } from './compare.component';
import { CompareStore } from '../../core/compare-store.service';
import { AuthService, type User } from '../../core/auth.service';

class AuthServiceStub {
  currentUser = signal<User | null>(null);
}

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [CompareComponent],
  template: `<app-compare />`,
})
class TestHostComponent {}

describe('CompareComponent', () => {
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
    TestBed.inject(AuthService).currentUser.set(null);
  });

  afterEach(() => {
    http.verify();
    TestBed.inject(AuthService).currentUser.set(null);
    localStorage.clear();
  });

  it('muestra estado vacío cuando no hay autos seleccionados', async () => {
    const fixture = TestBed.createComponent(CompareComponent);
    await fixture.componentInstance.ready;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toMatch(/no has seleccionado/i);
  });

  it('muestra 3 cards cuando hay 3 versiones', async () => {
    store.hydrateFromUrl('a,b,c');
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    const req = http.expectOne((r) => r.url.includes('/api/v1/compare'));
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ versionIds: ['a', 'b', 'c'] });
    req.flush({
      data: {
        versions: [
          { id: 'a', name: 'A', model: { name: 'M', brand: { name: 'T' } } },
          { id: 'b', name: 'B' },
          { id: 'c', name: 'C' },
        ],
        diffHighlights: { priceClp: true },
      },
    });
    await ready;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="card"]').length,
    ).toBe(3);
  });

  it('resalta con .row-diff solo las celdas de los atributos que difieren', async () => {
    store.hydrateFromUrl('a,b');
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    const req = http.expectOne((r) => r.url.includes('/api/v1/compare'));
    req.flush({
      data: {
        versions: [
          { id: 'a', name: 'A', priceClp: 10500000, year: 2025 },
          { id: 'b', name: 'B', priceClp: 11500000, year: 2025 },
        ],
        diffHighlights: { priceClp: true },
      },
    });
    await ready;
    fixture.detectChanges();

    const priceCells: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="row-priceClp"] td'),
    );
    expect(priceCells.length).toBe(2);
    for (const cell of priceCells) {
      expect(cell.classList.contains('row-diff')).toBe(true);
      // el binding no debe pisar las clases estáticas de la celda
      expect(cell.classList.contains('px-4')).toBe(true);
    }

    const yearCells: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="row-year"] td'),
    );
    expect(yearCells.length).toBe(2);
    for (const cell of yearCells) {
      expect(cell.classList.contains('row-diff')).toBe(false);
    }
  });

  it('usa GET /compare?ids= cuando hay query param en URL', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'ids' ? 'a,b,c' : null),
                has: (key: string) => key === 'ids',
                keys: ['ids'],
              },
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);

    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    const req = http.expectOne(
      (r) =>
        r.url.includes('/api/v1/compare') &&
        r.params.get('ids') === 'a,b,c',
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: {
        versions: [
          { id: 'a', name: 'A' },
          { id: 'b', name: 'B' },
          { id: 'c', name: 'C' },
        ],
        diffHighlights: {},
      },
    });
    await ready;
    fixture.detectChanges();
    expect(store.ids()).toEqual(['a', 'b', 'c']);
  });

  it('carga comparación guardada vía GET /comparisons/:slug cuando hay query param slug', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'slug' ? 'abc12345' : null),
                has: (key: string) => key === 'slug',
                keys: ['slug'],
              },
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);

    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    const req = http.expectOne(
      (r) => r.url.includes('/api/v1/comparisons/abc12345'),
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: {
        id: 'cmp-1',
        slug: 'abc12345',
        userId: 'user-1',
        createdAt: '2026-06-15T12:00:00.000Z',
        items: [
          {
            versionId: 'v1',
            position: 1,
            version: {
              id: 'v1',
              name: 'XLS',
              priceClp: 14990000,
              year: 2026,
              model: { name: 'Yaris', brand: { name: 'Toyota' } },
            },
          },
          {
            versionId: 'v2',
            position: 2,
            version: {
              id: 'v2',
              name: 'Sport',
              priceClp: 11500000,
              year: 2025,
              model: { name: 'Yaris', brand: { name: 'Toyota' } },
            },
          },
        ],
      },
    });
    await ready;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="card"]').length,
    ).toBe(2);
    expect(fixture.nativeElement.textContent).toMatch(/guardada/i);
  });

  it('muestra estado de error con CTA a / cuando el slug no existe', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => (key === 'slug' ? 'noexiste' : null),
                has: (key: string) => key === 'slug',
                keys: ['slug'],
              },
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);

    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    const req = http.expectOne(
      (r) => r.url.includes('/api/v1/comparisons/noexiste'),
    );
    req.flush(
      { data: null, error: { code: 'NOT_FOUND', message: 'Comparación no encontrada' } },
      { status: 404, statusText: 'Not Found' },
    );
    await ready;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toMatch(/no encontr/i);
    const cta: HTMLAnchorElement | null =
      fixture.nativeElement.querySelector('a[data-testid="back-home"]');
    expect(cta).not.toBeNull();
    expect(cta!.getAttribute('href') || cta!.getAttribute('routerLink')).toBeTruthy();
  });

  it('swap de versión: al elegir otra, reemplaza id en store y re-fetcha', async () => {
    store.hydrateFromUrl('a,b');
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    const initialReq = http.expectOne((r) => r.url.includes('/api/v1/compare'));
    expect(initialReq.request.body).toEqual({ versionIds: ['a', 'b'] });
    initialReq.flush({
      data: {
        versions: [
          {
            id: 'a',
            name: 'XLS',
            priceClp: 14990000,
            year: 2026,
            model: {
              id: 'm1',
              name: 'Yaris',
              brand: { name: 'Toyota' },
              availableVersions: [
                { id: 'a', name: 'XLS', year: 2026, priceClp: 14990000 },
                { id: 'a2', name: 'Sport', year: 2025, priceClp: 11500000 },
              ],
            },
          },
          {
            id: 'b',
            name: 'Base',
            model: { name: 'CX-5', brand: { name: 'Mazda' } },
          },
        ],
        diffHighlights: { priceClp: true },
      },
    });
    await ready;
    fixture.detectChanges();

    // Open swap popover on card "a"
    const swapBtn = fixture.nativeElement.querySelector(
      'button[data-testid="swap-button-a"]',
    ) as HTMLButtonElement;
    swapBtn.click();
    fixture.detectChanges();

    const popover = fixture.nativeElement.querySelector(
      '[data-testid="swap-popover-a"]',
    );
    expect(popover).not.toBeNull();
    const a2Option = fixture.nativeElement.querySelector(
      'button[data-testid="swap-option-a2"]',
    ) as HTMLButtonElement;
    expect(a2Option).not.toBeNull();

    // Click Sport option — should fire swapVersion → setIds(['a2', 'b']) + reload POST
    a2Option.click();
    const reloadReq = http.expectOne((r) => r.url.includes('/api/v1/compare'));
    expect(reloadReq.request.body).toEqual({ versionIds: ['a2', 'b'] });
    reloadReq.flush({
      data: {
        versions: [
          { id: 'a2', name: 'Sport', priceClp: 11500000, year: 2025,
            model: { name: 'Yaris', brand: { name: 'Toyota' } } },
          { id: 'b', name: 'Base', model: { name: 'CX-5', brand: { name: 'Mazda' } } },
        ],
        diffHighlights: { priceClp: true },
      },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();

    expect(store.ids()).toEqual(['a2', 'b']);
    // Popover should be closed after swap
    expect(
      fixture.nativeElement.querySelector('[data-testid="swap-popover-a"]'),
    ).toBeNull();
  });

  it('saveComparison con 409 muestra "Ya guardada" + link al slug', async () => {
    store.hydrateFromUrl('a,b');
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    http.expectOne((r) => r.url.includes('/api/v1/compare')).flush({
      data: { versions: [{ id: 'a' }, { id: 'b' }], diffHighlights: {} },
    });
    await ready;
    fixture.detectChanges();

    const p = fixture.componentInstance.saveComparison();
    const saveReq = http.expectOne((r) => r.url.includes('/api/v1/me/comparisons'));
    saveReq.flush(
      { data: null, error: { code: 'COMPARISON_DUPLICATE', slug: 'abc12345', message: 'dup' } },
      { status: 409, statusText: 'Conflict' },
    );
    await p;
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[data-testid="saved-link"]');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Ya tenés esta comparación guardada');
  });

  it('saveComparison con error no-409 muestra banner y NO re-throws (C3)', async () => {
    store.hydrateFromUrl('a,b');
    TestBed.inject(AuthService).currentUser.set({
      id: 'u1',
      email: 'u@test.cl',
      name: 'U',
      role: 'USER',
    });
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    http.expectOne((r) => r.url.includes('/api/v1/compare')).flush({
      data: { versions: [{ id: 'a' }, { id: 'b' }], diffHighlights: {} },
    });
    await ready;
    TestBed.flushEffects();
    // effect dispara /me/favorites/models porque hay user; flusheamos
    http
      .expectOne((r) => r.url.includes('/me/favorites/models'))
      .flush({ data: [] });
    fixture.detectChanges();

    const p = fixture.componentInstance.saveComparison();
    const saveReq = http.expectOne(
      (r) => r.url.includes('/api/v1/me/comparisons'),
    );
    saveReq.flush(
      { data: null, error: { code: 'INTERNAL', message: 'fail' } },
      { status: 500, statusText: 'Server Error' },
    );
    // No debe lanzar (antes re-throw rompía el flujo)
    await expect(p).resolves.toBeUndefined();
    fixture.detectChanges();

    // Error ahora se notifica via MatSnackBar en lugar de banner inline,
    // así que verificamos el signal `error()` y que el DOM no muestre ya el
    // banner legacy.
    expect(fixture.componentInstance.saveError()).toContain(
      'No pudimos guardar la comparación',
    );
    const banner = fixture.nativeElement.querySelector(
      '[data-testid="save-error"]',
    );
    expect(banner).toBeNull();
    // savedSlug NO se setea en error no-409
    expect(fixture.componentInstance.savedSlug()).toBeNull();
  });

  it('compareStore: setIds() reemplaza la lista y persiste en localStorage', () => {
    store.setIds(['x', 'y', 'z']);
    expect(store.ids()).toEqual(['x', 'y', 'z']);
    expect(localStorage.getItem('cualautocompro:selectedVersionIds')).toBe(
      JSON.stringify(['x', 'y', 'z']),
    );
    // Cap a 3
    store.setIds(['a', 'b', 'c', 'd', 'e']);
    expect(store.ids()).toEqual(['a', 'b', 'c']);
  });

  it('carrusel de favoritos aparece cuando hay user y favoritos', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    store.hydrateFromUrl('x');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
                has: () => false,
                keys: [],
              },
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);

    const auth = TestBed.inject(AuthService);
    auth.currentUser.set({ id: 'u1', email: 'u@test.cl', name: 'U', role: 'USER' });

    const fixture = TestBed.createComponent(CompareComponent);
    fixture.autoDetectChanges(true);
    const ready = fixture.componentInstance.ready;
    const compareReq = http.expectOne((r) =>
      r.url.includes('/api/v1/compare'),
    );
    expect(compareReq.request.method).toBe('POST');
    compareReq.flush({
      data: {
        versions: [
          {
            id: 'x',
            name: 'Base',
            priceClp: 10000000,
            year: 2025,
            model: {
              id: 'm0',
              name: 'Corolla',
              brand: { name: 'Toyota' },
              availableVersions: [
                { id: 'x', name: 'Base', year: 2025, priceClp: 10000000 },
              ],
            },
          },
        ],
        diffHighlights: {},
      },
    });
    await ready;
    const favReq = http.expectOne((r) =>
      r.url.includes('/me/favorites/models'),
    );
    expect(favReq.request.method).toBe('GET');
    favReq.flush({
      data: [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          segment: 'HATCHBACK',
          minPrice: 14000000,
          imageUrl: 'https://example.com/yaris.jpg',
          versions: [
            { id: 'v1', name: 'XLS', year: 2026, priceClp: 14990000 },
            { id: 'v2', name: 'Sport', year: 2025, priceClp: 11500000 },
          ],
        },
      ],
    });
    await fixture.whenStable();

    const carousel = fixture.nativeElement.querySelector(
      '[data-testid="favorites-carousel"]',
    );
    expect(carousel).not.toBeNull();
    const item = fixture.nativeElement.querySelector(
      '[data-testid="favorite-carousel-item-m1"]',
    );
    expect(item).not.toBeNull();
    expect(item.textContent).toContain('Yaris');
    expect(item.textContent).toContain('Toyota');
    const ficha = item.querySelector('article.ficha.ficha--compact');
    expect(ficha).not.toBeNull();
    expect(ficha.querySelector('.ficha-brand')?.textContent).toContain('Toyota');
    expect(ficha.querySelector('.ficha-segment')?.textContent).toContain('Hatchback');
    expect(ficha.querySelector('.ficha-price')?.textContent).toContain('14.000.000');
    expect(ficha.querySelector('.ficha-unit')?.textContent).toContain('CLP');
    const compareBtn = item.querySelector(
      '[data-testid="favorite-carousel-btn-m1"]',
    );
    expect(compareBtn).not.toBeNull();
    expect(compareBtn.classList.contains('ficha-compare')).toBe(true);
  });

  it('carrusel oculta modelos cuyas versiones ya están en compare', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    store.hydrateFromUrl('v1');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
                has: () => false,
                keys: [],
              },
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);

    const auth = TestBed.inject(AuthService);
    auth.currentUser.set({ id: 'u1', email: 'u@test.cl', name: 'U', role: 'USER' });

    const fixture = TestBed.createComponent(CompareComponent);
    fixture.autoDetectChanges(true);
    const ready = fixture.componentInstance.ready;
    // initial /compare POST for store ids [v1]
    const compareReq = http.expectOne((r) => r.url.includes('/api/v1/compare'));
    compareReq.flush({
      data: {
        versions: [
          {
            id: 'v1',
            name: 'XLS',
            priceClp: 14990000,
            year: 2026,
            model: {
              id: 'm1',
              name: 'Yaris',
              brand: { name: 'Toyota' },
              availableVersions: [
                { id: 'v1', name: 'XLS', year: 2026, priceClp: 14990000 },
              ],
            },
          },
        ],
        diffHighlights: {},
      },
    });
    await ready;
    const favReq = http.expectOne((r) =>
      r.url.includes('/me/favorites/models'),
    );
    favReq.flush({
      data: [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          segment: 'HATCHBACK',
          minPrice: 14000000,
          versions: [{ id: 'v1', name: 'XLS', year: 2026, priceClp: 14990000 }],
        },
        {
          id: 'm2',
          name: 'Corolla',
          brand: { name: 'Toyota' },
          segment: 'SEDAN',
          minPrice: 17000000,
          versions: [{ id: 'v3', name: 'Hybrid', year: 2026, priceClp: 18990000 }],
        },
      ],
    });
    await fixture.whenStable();

    // m1 (whose version v1 is in store) should be hidden

    // m1 (whose version v1 is in store) should be hidden
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="favorite-carousel-item-m1"]',
      ),
    ).toBeNull();
    // m2 should still appear
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="favorite-carousel-item-m2"]',
      ),
    ).not.toBeNull();
  });

  it('carrusel: click en "Agregar versión" abre popover; click fuera cierra', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    store.hydrateFromUrl('x');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
                has: () => false,
                keys: [],
              },
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);

    const auth = TestBed.inject(AuthService);
    auth.currentUser.set({ id: 'u1', email: 'u@test.cl', name: 'U', role: 'USER' });

    const fixture = TestBed.createComponent(CompareComponent);
    fixture.autoDetectChanges(true);
    const ready = fixture.componentInstance.ready;
    http.expectOne((r) => r.url.includes('/api/v1/compare')).flush({
      data: {
        versions: [
          {
            id: 'x',
            name: 'Base',
            priceClp: 10000000,
            year: 2025,
            model: {
              id: 'm0',
              name: 'Corolla',
              brand: { name: 'Toyota' },
              availableVersions: [
                { id: 'x', name: 'Base', year: 2025, priceClp: 10000000 },
              ],
            },
          },
        ],
        diffHighlights: {},
      },
    });
    await ready;
    const favReq = http.expectOne((r) =>
      r.url.includes('/me/favorites/models'),
    );
    favReq.flush({
      data: [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          segment: 'HATCHBACK',
          minPrice: 14000000,
          versions: [
            { id: 'v1', name: 'XLS', year: 2026, priceClp: 14990000 },
          ],
        },
      ],
    });
    await fixture.whenStable();

    const btn = fixture.nativeElement.querySelector(
      '[data-testid="favorite-carousel-btn-m1"]',
    ) as HTMLButtonElement;
    btn.click();
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="favorite-carousel-popover-m1"]',
      ),
    ).not.toBeNull();

    // click outside the popover
    const outsideClick = new MouseEvent('click', { bubbles: true });
    document.body.dispatchEvent(outsideClick);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector(
        '[data-testid="favorite-carousel-popover-m1"]',
      ),
    ).toBeNull();
  });

  it('carrusel: carga favoritos reactivo cuando el user hace login después de mount (C2)', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: () => null,
                has: () => false,
                keys: [],
              },
            },
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);
    const auth = TestBed.inject(AuthService);
    auth.currentUser.set(null);

    // Mount sin usuario: NO debe dispararse /me/favorites/models todavía.
    const fixture = TestBed.createComponent(CompareComponent);
    fixture.autoDetectChanges(true);
    const ready = fixture.componentInstance.ready;
    await ready;
    http.expectNone((r) => r.url.includes('/me/favorites/models'));

    // Ahora el usuario hace login en otra parte de la app.
    auth.currentUser.set({ id: 'u1', email: 'u@test.cl', name: 'U', role: 'USER' });
    TestBed.flushEffects();
    const favReq = http.expectOne((r) =>
      r.url.includes('/me/favorites/models'),
    );
    expect(favReq.request.method).toBe('GET');
    favReq.flush({ data: [] });
    await fixture.whenStable();
  });

  it('sección "Costos" se renderiza con 5 filas (mantenimiento + 4 simples)', async () => {
    store.hydrateFromUrl('a,b');
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    http.expectOne((r) => r.url.includes('/api/v1/compare')).flush({
      data: {
        versions: [
          {
            id: 'a',
            name: 'XLS',
            priceClp: 14990000,
            year: 2026,
            circulationPermitClp: 220000,
            mandatoryInsuranceClp: 95000,
            voluntaryInsuranceClp: 380000,
            computedFillCostClp: 75000,
            maintenanceCosts: [
              { mileageTag: 10000, costClp: 180000 },
              { mileageTag: 20000, costClp: 250000 },
            ],
            model: { name: 'Yaris', brand: { name: 'Toyota' } },
          },
          {
            id: 'b',
            name: 'Base',
            priceClp: 11500000,
            year: 2025,
            circulationPermitClp: 200000,
            mandatoryInsuranceClp: 90000,
            voluntaryInsuranceClp: 350000,
            computedFillCostClp: 70000,
            model: { name: 'Yaris', brand: { name: 'Toyota' } },
          },
        ],
        diffHighlights: {},
      },
    });
    await ready;
    fixture.detectChanges();

    const sectionEl = fixture.nativeElement.querySelector('[data-testid="section-costos"]');
    expect(sectionEl).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="row-maintenance-breakdown"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="row-circulationPermitClp"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="row-mandatoryInsuranceClp"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="row-voluntaryInsuranceClp"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="row-computedFillCostClp"]'),
    ).not.toBeNull();
  });

  it('sub-tabla de mantención se expande al click', async () => {
    store.hydrateFromUrl('a,b');
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    http.expectOne((r) => r.url.includes('/api/v1/compare')).flush({
      data: {
        versions: [
          {
            id: 'a',
            name: 'XLS',
            priceClp: 14990000,
            maintenanceCosts: [
              { mileageTag: 10000, costClp: 180000 },
              { mileageTag: 20000, costClp: 250000 },
            ],
            model: { name: 'Yaris', brand: { name: 'Toyota' } },
          },
          {
            id: 'b',
            name: 'Base',
            priceClp: 11500000,
            maintenanceCosts: [{ mileageTag: 10000, costClp: 160000 }],
            model: { name: 'Yaris', brand: { name: 'Toyota' } },
          },
        ],
        diffHighlights: {},
      },
    });
    await ready;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="maint-popover-panel-a"]'),
    ).toBeNull();

    const btn = fixture.nativeElement.querySelector(
      '[data-testid="maint-popover-btn-a"]',
    ) as HTMLButtonElement;
    expect(btn).not.toBeNull();
    btn.click();
    fixture.detectChanges();

    const panel = fixture.nativeElement.querySelector(
      '[data-testid="maint-popover-panel-a"]',
    );
    expect(panel).not.toBeNull();
    expect(panel.textContent).toContain('10,000 km');
    expect(panel.textContent).toContain('20,000 km');
  });

  it('recall badge aparece si v.hasRecall=true', async () => {
    store.hydrateFromUrl('a,b');
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    http.expectOne((r) => r.url.includes('/api/v1/compare')).flush({
      data: {
        versions: [
          {
            id: 'a',
            name: 'RecallVersion',
            priceClp: 14990000,
            hasRecall: true,
            recallUrl: 'https://example.com/recall/a',
            model: { name: 'Yaris', brand: { name: 'Toyota' } },
          },
          {
            id: 'b',
            name: 'SafeVersion',
            priceClp: 11500000,
            hasRecall: false,
            model: { name: 'Yaris', brand: { name: 'Toyota' } },
          },
        ],
        diffHighlights: {},
      },
    });
    await ready;
    fixture.detectChanges();

    const recallBadge = fixture.nativeElement.querySelector(
      '[data-testid="recall-card-a"]',
    );
    expect(recallBadge).not.toBeNull();
    expect(recallBadge.getAttribute('href')).toBe('https://example.com/recall/a');
    expect(recallBadge.getAttribute('target')).toBe('_blank');

    expect(
      fixture.nativeElement.querySelector('[data-testid="recall-card-b"]'),
    ).toBeNull();
  });
});

describe('CompareComponent carrusel — estilo ficha', () => {
  it('renderiza cada favorito con la misma estructura de "ficha" del catálogo', () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    const auth = new AuthServiceStub();
    auth.currentUser.set({ id: 'u1', email: 'u@test.cl', name: 'U', role: 'USER' });
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        { provide: AuthService, useValue: auth },
      ],
    });
    const localHttp = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    // Responder la llamada a favoritos disparada por el effect
    const pending = localHttp.match(
      (r: { url: string }) => r.url.includes('/me/favorites/models'),
    );
    pending.forEach((req) => req.flush({ data: [] } as unknown as object));
    fixture.detectChanges();

    const comp = fixture.debugElement.children[0].componentInstance as CompareComponent;
    comp.favoriteModels.set([
      {
        id: 'm1',
        name: 'Yaris',
        brand: { name: 'Toyota' },
        segment: 'HATCHBACK',
        minPrice: 14000000,
        imageUrl: 'https://example.com/yaris.jpg',
        versions: [
          {
            id: 'v1',
            name: 'XLS',
            year: 2026,
            priceClp: 14990000,
            transmission: 'AUTOMATIC',
            fuel: 'BENCINA',
          },
        ],
      },
    ]);
    fixture.detectChanges();

    const item = fixture.nativeElement.querySelector(
      '[data-testid="favorite-carousel-item-m1"]',
    );
    expect(item).not.toBeNull();
    const ficha = item.querySelector('article.ficha.ficha--compact');
    expect(ficha).not.toBeNull();
    // Header mono con la marca (sin chip de segmento)
    expect(ficha.querySelector('.ficha-head .ficha-brand')?.textContent).toContain('Toyota');
    // Corazón de favoritos en la esquina de la imagen
    const fav = ficha.querySelector('[data-testid="favorite-carousel-fav-m1"]');
    expect(fav).not.toBeNull();
    // Fila de nombre con el chip de segmento a la derecha
    const nameRow = ficha.querySelector('.ficha-name-row');
    expect(nameRow).not.toBeNull();
    expect(nameRow.querySelector('.ficha-name')?.textContent).toContain('Yaris');
    expect(nameRow.querySelector('.ficha-segment')?.textContent).toContain('Hatchback');
    // Datos tabulares: precio + año + combustible + transmisión
    const dataRows = ficha.querySelectorAll('.ficha-data .ficha-row');
    expect(dataRows.length).toBe(4);
    const labels = Array.from(dataRows as unknown as Element[]).map((row) =>
      row.querySelector('dt')?.textContent?.trim(),
    );
    expect(labels).toEqual(['Precio', 'Año', 'Combustible', 'Transmisión']);
    expect(dataRows[0].querySelector('.ficha-price')?.textContent).toContain('14.000.000');
    expect(dataRows[0].querySelector('.ficha-unit')?.textContent).toContain('CLP');
    expect(dataRows[1].querySelector('.ficha-row-value')?.textContent).toContain('2026');
    expect(dataRows[2].querySelector('.ficha-row-value')?.textContent).toContain('BENCINA');
    expect(dataRows[3].querySelector('.ficha-row-value')?.textContent).toContain('AUTOMATIC');
    // Botón rectangular con la misma clase que la ficha del catálogo
    const btn = item.querySelector('[data-testid="favorite-carousel-btn-m1"]');
    expect(btn).not.toBeNull();
    expect(btn.classList.contains('ficha-compare')).toBe(true);
  });
});

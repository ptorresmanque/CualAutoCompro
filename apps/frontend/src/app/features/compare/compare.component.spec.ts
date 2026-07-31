import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
  RouterOutlet,
} from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { OverlayContainer } from '@angular/cdk/overlay';
import { CompareComponent } from './compare.component';
import { CompareStore } from '../../core/compare-store.service';
import { AuthService, type User } from '../../core/auth.service';
import {
  COMPARE_DEFAULT_META,
  PageMetaService,
} from '../../core/page-meta.service';

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

/**
 * Mock de ActivatedRoute con `snapshot` **y** observables: el componente se
 * suscribe a `queryParamMap` / `paramMap` para reaccionar cuando la URL cambia
 * sin que se recree el componente (ej. "Ver enlace público"). `of()` emite
 * sincrónicamente igual que el ActivatedRoute real.
 */
function routeStub(
  queryParams: Record<string, string> = {},
  params: Record<string, string> = {},
) {
  const queryParamMap = convertToParamMap(queryParams);
  const paramMap = convertToParamMap(params);
  return {
    snapshot: { paramMap, queryParamMap },
    paramMap: of(paramMap),
    queryParamMap: of(queryParamMap),
  };
}

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
          useValue: routeStub({ ids: 'a,b,c' }),
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
          useValue: routeStub({ slug: 'abc12345' }),
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

    // El POST sale en el microtask siguiente al flush del GET.
    await new Promise((r) => setTimeout(r, 0));

    // `/comparisons/:slug` trae la versión pelada y sin diffHighlights, así que
    // el componente pide el payload completo a `/compare` con los ids del slug:
    // sin esto, la comparación compartida se veía degradada (sin equipamiento,
    // sin mantención y sin diferencias resaltadas) respecto de la original.
    const fullReq = http.expectOne(
      (r) => r.url.includes('/api/v1/compare') && r.method === 'POST',
    );
    expect(fullReq.request.body).toEqual({ versionIds: ['v1', 'v2'] });
    fullReq.flush({
      data: {
        versions: [
          {
            id: 'v1',
            name: 'XLS',
            priceClp: 14990000,
            year: 2026,
            model: { name: 'Yaris', brand: { name: 'Toyota' } },
          },
          {
            id: 'v2',
            name: 'Sport',
            priceClp: 11500000,
            year: 2025,
            model: { name: 'Yaris', brand: { name: 'Toyota' } },
          },
        ],
        diffHighlights: { priceClp: true },
      },
    });
    await ready;
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="card"]').length,
    ).toBe(2);
    expect(fixture.nativeElement.textContent).toMatch(/guardada/i);

    // Las diferencias siguen resaltadas en la vista compartida.
    const priceCells: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('[data-testid="row-priceClp"] td'),
    );
    expect(priceCells.length).toBe(2);
    for (const cell of priceCells) {
      expect(cell.classList.contains('row-diff')).toBe(true);
    }
  });

  it('si /compare falla, la comparación guardada cae a las versiones del slug', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        { provide: ActivatedRoute, useValue: routeStub({ slug: 'abc12345' }) },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);

    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    http.expectOne((r) => r.url.includes('/api/v1/comparisons/abc12345')).flush({
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
              model: { name: 'Yaris', brand: { name: 'Toyota' } },
            },
          },
        ],
      },
    });
    await new Promise((r) => setTimeout(r, 0));
    http
      .expectOne((r) => r.url.includes('/api/v1/compare') && r.method === 'POST')
      .error(new ProgressEvent('error'), { status: 500, statusText: 'Boom' });
    await ready;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="card"]').length,
    ).toBe(1);
    expect(fixture.componentInstance.loadError()).toBeNull();
  });

  // Bug real: "Ver enlace público" navega a /compare?slug=xxx estando ya en
  // /compare. Angular no recrea el componente, así que leyendo solo
  // `route.snapshot` la URL cambiaba y la vista se quedaba igual.
  it('recarga cuando cambia el query param slug sin recrear el componente', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    const queryParams = new BehaviorSubject(convertToParamMap({}));
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
              paramMap: convertToParamMap({}),
              queryParamMap: queryParams.value,
            },
            paramMap: of(convertToParamMap({})),
            queryParamMap: queryParams.asObservable(),
          },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);

    const fixture = TestBed.createComponent(CompareComponent);
    await fixture.componentInstance.ready;
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toMatch(/no has seleccionado/i);

    // Llega el slug por la URL, sin recrear el componente.
    queryParams.next(convertToParamMap({ slug: 'abc12345' }));
    http.expectOne((r) => r.url.includes('/api/v1/comparisons/abc12345')).flush({
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
              model: { name: 'Yaris', brand: { name: 'Toyota' } },
            },
          },
        ],
      },
    });
    await new Promise((r) => setTimeout(r, 0));
    http
      .expectOne((r) => r.url.includes('/api/v1/compare') && r.method === 'POST')
      .flush({
        data: {
          versions: [
            {
              id: 'v1',
              name: 'XLS',
              model: { name: 'Yaris', brand: { name: 'Toyota' } },
            },
          ],
          diffHighlights: {},
        },
      });
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelectorAll('[data-testid="card"]').length,
    ).toBe(1);
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
          useValue: routeStub({ slug: 'noexiste' }),
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
    expect(banner.textContent).toContain('Ya tienes esta comparación guardada');
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
          useValue: routeStub({}),
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
          useValue: routeStub({}),
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

  it('carrusel: click en "Agregar versión" abre el menú de versiones; click fuera cierra', async () => {
    TestBed.resetTestingModule();
    localStorage.clear();
    store.hydrateFromUrl('x');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideNoopAnimations(),
        CompareStore,
        AuthService,
        {
          provide: ActivatedRoute,
          useValue: routeStub({}),
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
    await fixture.whenStable();

    // El botón es un `matMenuTriggerFor`: el panel se monta en el overlay del
    // CDK (fuera de `fixture.nativeElement`), no dentro del componente.
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    expect(overlay.querySelector('.mat-mdc-menu-panel')).not.toBeNull();
    expect(btn.getAttribute('aria-expanded')).toBe('true');
    // Lo propio del componente: el menú lista las versiones de ESE favorito.
    expect(overlay.querySelector('[data-testid="favorite-carousel-opt-v1"]')).not.toBeNull();

    // El cierre por click afuera lo maneja el backdrop del overlay.
    const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement;
    expect(backdrop).not.toBeNull();
    backdrop.click();
    fixture.detectChanges();
    await fixture.whenStable();

    // Se asserta `aria-expanded` y no la desaparición del panel: el overlay se
    // desmonta recién en el callback de la animación de cierre, que en este
    // entorno de test no corre. `aria-expanded` refleja el estado real del
    // trigger y además es el contrato de accesibilidad del botón.
    expect(btn.getAttribute('aria-expanded')).toBe('false');
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
          useValue: routeStub({}),
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
  // ---------------------------------------------------------------------------
  // Mejor valor por fila. La tabla mostraba datos pero no ayudaba a decidir:
  // había que comparar números a ojo y saber de memoria si en km/L conviene
  // más o menos.
  // ---------------------------------------------------------------------------

  /** Monta el comparador con las versiones dadas ya cargadas. */
  async function mountWith(versions: unknown[], diffHighlights: Record<string, boolean> = {}) {
    store.hydrateFromUrl(versions.map((v) => (v as { id: string }).id).join(','));
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    http
      .expectOne((r) => r.url.includes('/api/v1/compare'))
      .flush({ data: { versions, diffHighlights } });
    await ready;
    fixture.detectChanges();
    return fixture;
  }

  it('marca el precio más bajo y la potencia más alta', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A', priceClp: 15_000_000, powerHp: 100 },
      { id: 'b', name: 'B', priceClp: 12_000_000, powerHp: 150 },
    ]);

    // Precio: gana el más barato (b). Potencia: gana el más potente (b).
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-priceClp-b"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-priceClp-a"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-powerHp-b"]'),
    ).not.toBeNull();
  });

  it('marca el mayor rendimiento en km/L, no el menor', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A', consumptionCityKmL: 10 },
      { id: 'b', name: 'B', consumptionCityKmL: 21 },
    ]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-consumptionCityKmL-b"]'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-consumptionCityKmL-a"]'),
    ).toBeNull();
  });

  // Decir que un auto "gana" en maletero porque al otro no le cargaron el dato
  // sería mentirle al usuario.
  it('no marca nada si a alguna versión le falta el dato', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A', trunkLiters: 400 },
      { id: 'b', name: 'B' },
    ]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-trunkLiters-a"]'),
    ).toBeNull();
  });

  it('no marca nada si todas empatan (no hay nada que decidir)', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A', priceClp: 12_000_000 },
      { id: 'b', name: 'B', priceClp: 12_000_000 },
    ]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-priceClp-a"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-priceClp-b"]'),
    ).toBeNull();
  });

  it('marca empate cuando dos comparten el mejor valor y una tercera no', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A', priceClp: 12_000_000 },
      { id: 'b', name: 'B', priceClp: 12_000_000 },
      { id: 'c', name: 'C', priceClp: 18_000_000 },
    ]);
    const a = fixture.nativeElement.querySelector('[data-testid="winner-priceClp-a"]');
    const b = fixture.nativeElement.querySelector('[data-testid="winner-priceClp-b"]');
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    expect(a.textContent.trim()).toBe('Empate');
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-priceClp-c"]'),
    ).toBeNull();
  });

  it('no marca ganador en atributos sin dirección mejor (año, transmisión)', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A', year: 2024, transmission: 'MANUAL' },
      { id: 'b', name: 'B', year: 2026, transmission: 'CVT' },
    ]);
    expect(fixture.nativeElement.querySelector('[data-testid="winner-year-b"]')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="winner-transmission-b"]'),
    ).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Toggle "Solo diferencias"
  // ---------------------------------------------------------------------------

  it('el toggle deja solo las filas que difieren', async () => {
    const fixture = await mountWith(
      [
        { id: 'a', name: 'A', priceClp: 15_000_000, year: 2026 },
        { id: 'b', name: 'B', priceClp: 12_000_000, year: 2026 },
      ],
      { priceClp: true },
    );

    expect(
      fixture.nativeElement.querySelector('[data-testid="row-year"]'),
    ).not.toBeNull();

    fixture.componentInstance.toggleOnlyDiffs();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="row-priceClp"]'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="row-year"]')).toBeNull();
    expect(fixture.componentInstance.hiddenRowCount()).toBeGreaterThan(0);
  });

  it('el toggle informa cuántas filas escondió', async () => {
    const fixture = await mountWith(
      [
        { id: 'a', name: 'A', priceClp: 15_000_000 },
        { id: 'b', name: 'B', priceClp: 12_000_000 },
      ],
      { priceClp: true },
    );

    fixture.componentInstance.toggleOnlyDiffs();
    fixture.detectChanges();

    const hint = fixture.nativeElement.querySelector('[data-testid="only-diffs-hint"]');
    expect(hint).not.toBeNull();
    expect(hint.textContent).toMatch(/filas? ocultas?/i);
  });

  it('avisa cuando las versiones coinciden en todo', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A', priceClp: 12_000_000 },
      { id: 'b', name: 'B', priceClp: 12_000_000 },
    ]);

    fixture.componentInstance.toggleOnlyDiffs();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="only-diffs-empty"]'),
    ).not.toBeNull();
  });

  it('el equipamiento entra en "solo diferencias" si difiere', async () => {
    const eq = (name: string) => ({
      equipmentItem: { id: name, name, category: 'Seguridad' },
    });
    const fixture = await mountWith([
      { id: 'a', name: 'A', equipmentItems: [eq('Airbags')] },
      { id: 'b', name: 'B', equipmentItems: [eq('Airbags'), eq('ABS')] },
    ]);

    fixture.componentInstance.toggleOnlyDiffs();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="row-equipment-Seguridad"]'),
    ).not.toBeNull();
  });

  it('el equipamiento idéntico se oculta con "solo diferencias"', async () => {
    const eq = { equipmentItem: { id: 'ab', name: 'Airbags', category: 'Seguridad' } };
    const fixture = await mountWith([
      { id: 'a', name: 'A', equipmentItems: [eq] },
      { id: 'b', name: 'B', equipmentItems: [eq] },
    ]);

    fixture.componentInstance.toggleOnlyDiffs();
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="row-equipment-Seguridad"]'),
    ).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Costo anual de uso y salidas del comparador
  // ---------------------------------------------------------------------------

  const costFixture = (total: number) => ({
    kmPerYear: 15000,
    fuelClp: total * 0.4,
    maintenanceClp: total * 0.1,
    circulationPermitClp: total * 0.1,
    mandatoryInsuranceClp: total * 0.05,
    voluntaryInsuranceClp: total * 0.1,
    depreciationClp: total * 0.25,
    totalClp: total,
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
  });

  it('no pide el costo anual hasta que se abre la sección', async () => {
    await mountWith([
      { id: 'a', name: 'A', priceClp: 15_000_000 },
      { id: 'b', name: 'B', priceClp: 12_000_000 },
    ]);
    // Sin abrir la sección no debería haber ningún request de costo: son hasta
    // 3 y no se pagan si el usuario no mira esa sección.
    http.expectNone((r) => r.url.includes('/cost/version/'));
  });

  it('al abrir la sección calcula el costo de cada versión y marca el más barato', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A', priceClp: 15_000_000 },
      { id: 'b', name: 'B', priceClp: 12_000_000 },
    ]);

    fixture.componentInstance.onCostsPanelOpened();
    await new Promise((r) => setTimeout(r, 0));

    http
      .expectOne((r) => r.url.includes('/cost/version/a'))
      .flush({ data: costFixture(3_000_000), error: null });
    http
      .expectOne((r) => r.url.includes('/cost/version/b'))
      .flush({ data: costFixture(2_000_000), error: null });
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(fixture.componentInstance.costFor('a')?.totalClp).toBe(3_000_000);
    expect(fixture.componentInstance.isCheapestToOwn('b')).toBe(true);
    expect(fixture.componentInstance.isCheapestToOwn('a')).toBe(false);
    expect(
      fixture.nativeElement.querySelector('[data-testid="cheapest-b"]'),
    ).not.toBeNull();
  });

  it('no marca el más barato si a alguna versión le falta el cálculo', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);

    fixture.componentInstance.onCostsPanelOpened();
    await new Promise((r) => setTimeout(r, 0));

    http
      .expectOne((r) => r.url.includes('/cost/version/a'))
      .flush({ data: costFixture(3_000_000), error: null });
    http
      .expectOne((r) => r.url.includes('/cost/version/b'))
      .error(new ProgressEvent('error'), { status: 500, statusText: 'Boom' });
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    // La versión que sí calculó se muestra; el sello no aparece para nadie.
    expect(fixture.componentInstance.costFor('a')).not.toBeNull();
    expect(fixture.componentInstance.isCheapestToOwn('a')).toBe(false);
  });

  // El backend devuelve 0 tanto para "no aplica" como para "no hay dato", así
  // que un auto sin combustible ni seguros cargados terminaba con un total que
  // era casi pura depreciación y se llevaba el sello de "más barato".
  it('no corona al más barato si a una versión le faltan componentes del costo', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);

    fixture.componentInstance.onCostsPanelOpened();
    await new Promise((r) => setTimeout(r, 0));

    const completo = costFixture(3_000_000);
    // A B solo le calculamos depreciación: sin combustible, mantención,
    // permiso ni seguros. Su total sale más bajo por falta de datos.
    const incompleto = {
      ...costFixture(1_000_000),
      fuelClp: 0,
      maintenanceClp: 0,
      circulationPermitClp: 0,
      mandatoryInsuranceClp: 0,
      voluntaryInsuranceClp: 0,
      depreciationClp: 1_000_000,
      totalClp: 1_000_000,
    };
    http
      .expectOne((r) => r.url.includes('/cost/version/a'))
      .flush({ data: completo, error: null });
    http
      .expectOne((r) => r.url.includes('/cost/version/b'))
      .flush({ data: incompleto, error: null });
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(fixture.componentInstance.costsComparable()).toBe(false);
    expect(fixture.componentInstance.isCheapestToOwn('b')).toBe(false);
    expect(
      fixture.nativeElement.querySelector('[data-testid^="cheapest-"]'),
    ).toBeNull();

    // Y se dice por qué.
    const aviso = fixture.nativeElement.querySelector('[data-testid="costs-incomplete"]');
    expect(aviso).not.toBeNull();
    expect(aviso.textContent).toMatch(/no marcamos cuál sale más barato/i);
    // El otro mensaje —el de "faltan los mismos datos en todas"— no puede
    // aparecer acá: los desgloses justamente no son comparables.
    expect(aviso.textContent).not.toMatch(/por igual/i);
  });

  // `costsMissing()` y `costsComparable()` pueden ser verdaderos a la vez, y el
  // caso es común: a ninguna de las versiones le cargaron el seguro voluntario.
  // Ahí el sello "Más barato" SÍ aparece, así que el aviso no puede decir que
  // los totales "no son comparables entre sí" — sería coronar a un ganador y
  // desmentirlo en la misma pantalla.
  it('con los mismos datos faltantes en todas, corona al más barato y lo explica sin contradecirse', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);

    fixture.componentInstance.onCostsPanelOpened();
    await new Promise((r) => setTimeout(r, 0));

    // Misma firma de desglose en las dos: a las dos les falta el mismo ítem.
    const sinSeguro = (total: number) => ({
      ...costFixture(total),
      voluntaryInsuranceClp: 0,
      totalClp: total,
    });
    http
      .expectOne((r) => r.url.includes('/cost/version/a'))
      .flush({ data: sinSeguro(3_000_000), error: null });
    http
      .expectOne((r) => r.url.includes('/cost/version/b'))
      .flush({ data: sinSeguro(2_000_000), error: null });
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(fixture.componentInstance.costsComparable()).toBe(true);
    expect(fixture.componentInstance.costsMissing()).toEqual(['Seguro automotriz']);

    // El sello aparece…
    expect(
      fixture.nativeElement.querySelector('[data-testid="cheapest-b"]'),
    ).not.toBeNull();

    // …y el aviso dice la verdad que corresponde a ese estado.
    const aviso = fixture.nativeElement.querySelector('[data-testid="costs-incomplete"]');
    expect(aviso).not.toBeNull();
    expect(aviso.textContent).toMatch(/seguro automotriz/i);
    expect(aviso.textContent).toMatch(/por igual/i);
    expect(aviso.textContent).not.toMatch(/no son comparables entre sí/i);
    expect(aviso.textContent).not.toMatch(/no marcamos cuál sale más barato/i);
  });

  it('muestra "sin dato" en vez de $0 en los componentes sin información', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);

    fixture.componentInstance.onCostsPanelOpened();
    await new Promise((r) => setTimeout(r, 0));
    const sinCombustible = { ...costFixture(2_000_000), fuelClp: 0 };
    http.match((r) => r.url.includes('/cost/version/')).forEach((r) =>
      r.flush({ data: sinCombustible, error: null }),
    );
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    const fila = fixture.nativeElement.querySelector('[data-testid="cost-row-Combustible"]');
    expect(fila.textContent).toContain('Sin dato');
    expect(fila.textContent).not.toContain('$0');
  });

  it('cambiar km/año recalcula con el nuevo supuesto', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    fixture.componentInstance.costDebounceMs = 0;

    fixture.componentInstance.onCostsPanelOpened();
    await new Promise((r) => setTimeout(r, 0));
    http.match((r) => r.url.includes('/cost/version/')).forEach((r) =>
      r.flush({ data: costFixture(3_000_000), error: null }),
    );
    await new Promise((r) => setTimeout(r, 0));

    fixture.componentInstance.onKmPerYearChange(30000);
    await new Promise((r) => setTimeout(r, 0));

    const reqs = http.match((r) => r.url.includes('/cost/version/'));
    expect(reqs.length).toBe(2);
    expect(reqs[0].request.params.get('kmPerYear')).toBe('30000');
    reqs.forEach((r) => r.flush({ data: costFixture(4_000_000), error: null }));
    await new Promise((r) => setTimeout(r, 0));
  });

  it('el título de la tarjeta linkea a la ficha del modelo', async () => {
    const fixture = await mountWith([
      {
        id: 'a',
        name: 'XLS',
        model: { name: 'C3 Aircross', brand: { name: 'Citroën' } },
      },
      { id: 'b', name: 'B', model: { name: 'Yaris', brand: { name: 'Toyota' } } },
    ]);

    const link = fixture.nativeElement.querySelector('[data-testid="model-link-a"]');
    expect(link).not.toBeNull();
    // Mismo slug que espera el backend (ver core/slug.ts).
    expect(link.getAttribute('href')).toBe('/brand/citroen/model/c3-aircross');
  });

  it('no arma link si falta la marca o el modelo', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="model-link-a"]'),
    ).toBeNull();
  });

  it('ofrece agregar otro auto mientras haya menos de 3', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);
    const slot = fixture.nativeElement.querySelector('[data-testid="add-slot"]');
    expect(slot).not.toBeNull();
    expect(slot.getAttribute('href')).toBe('/catalogo');
    expect(slot.textContent).toContain('Queda 1 lugar');
  });

  it('no ofrece agregar cuando ya hay 3', async () => {
    const fixture = await mountWith([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
      { id: 'c', name: 'C' },
    ]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="add-slot"]'),
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
    // Etiquetas legibles, no el token crudo de la DB (BENCINA / AUTOMATIC).
    expect(dataRows[2].querySelector('.ficha-row-value')?.textContent).toContain('Bencina');
    expect(dataRows[3].querySelector('.ficha-row-value')?.textContent).toContain('Automática');
    // Botón rectangular con la misma clase que la ficha del catálogo
    const btn = item.querySelector('[data-testid="favorite-carousel-btn-m1"]');
    expect(btn).not.toBeNull();
    expect(btn.classList.contains('ficha-compare')).toBe(true);
  });
});

@Component({
  selector: 'app-meta-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class MetaRootComponent {}

/**
 * Metadata para compartir.
 *
 * Todo acá pasa por el router de verdad: las rutas se registran con su
 * `data.meta`, se llama `applyRouteDefaults()` y se entra navegando, así que el
 * default llega por el `NavigationEnd` real. Si el test escribiera el default a
 * mano, pasaría igual con `applyRouteDefaults()` borrado, con la suscripción
 * desconectada o con el orden invertido — que es justamente lo que hay que
 * demostrar.
 */
describe('CompareComponent — metadata para compartir', () => {
  let http: HttpTestingController;

  interface Car {
    id: string;
    version: string;
    brand: string;
    model: string;
  }

  function title(): string {
    return document.title;
  }

  function metaContent(selector: string): string | null {
    return (
      document.head
        .querySelector<HTMLMetaElement>(selector)
        ?.getAttribute('content') ?? null
    );
  }

  async function mount(url: string) {
    TestBed.resetTestingModule();
    localStorage.clear();
    for (const el of Array.from(
      document.head.querySelectorAll(
        'link[rel="canonical"], meta[name="description"], meta[name="robots"], meta[property="og:title"]',
      ),
    )) {
      el.remove();
    }
    // Marca para poder afirmar que el título lo escribió la navegación y no
    // quedó de un test anterior.
    document.title = '(sin metadata)';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([
          {
            path: 'compare',
            component: CompareComponent,
            data: { meta: COMPARE_DEFAULT_META },
          },
          {
            path: 'c/:slug',
            component: CompareComponent,
            data: { meta: COMPARE_DEFAULT_META },
          },
        ]),
        CompareStore,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(AuthService).currentUser.set(null);
    TestBed.inject(PageMetaService).applyRouteDefaults();

    const fixture = TestBed.createComponent(MetaRootComponent);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl(url);
    fixture.detectChanges();
    return fixture;
  }

  function compareCmp(
    fixture: ComponentFixture<MetaRootComponent>,
  ): CompareComponent {
    return fixture.debugElement.query(By.directive(CompareComponent))
      .componentInstance as CompareComponent;
  }

  /** Responde los dos requests de /c/:slug: el GET del slug y el POST full. */
  async function flushSlugLoad(slug: string, cars: Car[]): Promise<void> {
    http
      .expectOne((r) => r.url.includes(`/api/v1/comparisons/${slug}`))
      .flush({
        data: {
          id: `cmp-${slug}`,
          slug,
          userId: 'u1',
          createdAt: '2026-07-01T00:00:00.000Z',
          items: cars.map((c, i) => ({
            versionId: c.id,
            position: i,
            version: { id: c.id, name: c.version },
          })),
        },
      });
    await new Promise((r) => setTimeout(r, 0));
    http
      .expectOne((r) => r.method === 'POST' && r.url.includes('/api/v1/compare'))
      .flush({
        data: {
          versions: cars.map((c) => ({
            id: c.id,
            name: c.version,
            model: { name: c.model, brand: { name: c.brand } },
          })),
          diffHighlights: {},
        },
      });
    await new Promise((r) => setTimeout(r, 0));
  }

  afterEach(() => {
    for (const req of http.match(() => true)) req.flush({ data: null });
    localStorage.clear();
  });

  it('entrando por /c/:slug el default llega por NavigationEnd y el componente lo sobreescribe', async () => {
    const fixture = await mount('/c/abc123');

    // Estado intermedio: navegó, el meta de la ruta ya se aplicó, el HTTP
    // todavía no resolvió. Si `applyRouteDefaults()` no estuviera enganchado,
    // acá seguiría diciendo "(sin metadata)".
    expect(title()).toBe(COMPARE_DEFAULT_META.title);

    await flushSlugLoad('abc123', [
      { id: 'a', version: 'XLI', brand: 'Toyota', model: 'Corolla' },
      { id: 'b', version: 'EX', brand: 'Kia', model: 'Rio' },
    ]);
    fixture.detectChanges();

    expect(title()).toBe(
      'Toyota Corolla XLI vs Kia Rio EX — comparación | cualautocompro',
    );
    expect(metaContent('meta[name="description"]')).toBe(
      'Comparación lado a lado de Toyota Corolla XLI vs Kia Rio EX: precio, rendimiento, equipamiento y costo anual estimado.',
    );
    expect(metaContent('meta[property="og:title"]')).toBe(
      'Toyota Corolla XLI vs Kia Rio EX — comparación | cualautocompro',
    );
    // Las comparaciones se comparten por link, pero no se indexan.
    expect(metaContent('meta[name="robots"]')).toBe('noindex, nofollow');
  });

  it('una segunda navegación con el componente montado no deja el título del auto anterior', async () => {
    const fixture = await mount('/c/abc123');
    await flushSlugLoad('abc123', [
      { id: 'a', version: 'XLI', brand: 'Toyota', model: 'Corolla' },
      { id: 'b', version: 'EX', brand: 'Kia', model: 'Rio' },
    ]);
    fixture.detectChanges();
    expect(title()).toBe(
      'Toyota Corolla XLI vs Kia Rio EX — comparación | cualautocompro',
    );

    // /c/abc123 -> /c/def456: misma configuración de ruta, así que el router
    // reusa el componente. El NavigationEnd llega DESPUÉS de que el effect ya
    // escribió el título dinámico.
    await TestBed.inject(Router).navigateByUrl('/c/def456');
    fixture.detectChanges();

    // Mientras carga la comparación nueva se anuncia el genérico, no el par
    // de autos viejo.
    expect(title()).toBe(COMPARE_DEFAULT_META.title);

    await flushSlugLoad('def456', [
      { id: 'c', version: 'GLX', brand: 'Suzuki', model: 'Swift' },
      { id: 'd', version: 'Dynamic', brand: 'Peugeot', model: '208' },
    ]);
    fixture.detectChanges();

    expect(title()).toBe(
      'Suzuki Swift GLX vs Peugeot 208 Dynamic — comparación | cualautocompro',
    );
  });

  it('quitar un auto sin navegar devuelve el título al default del comparador', async () => {
    const fixture = await mount('/c/abc123');
    await flushSlugLoad('abc123', [
      { id: 'a', version: 'XLI', brand: 'Toyota', model: 'Corolla' },
      { id: 'b', version: 'EX', brand: 'Kia', model: 'Rio' },
    ]);
    fixture.detectChanges();
    expect(title()).toBe(
      'Toyota Corolla XLI vs Kia Rio EX — comparación | cualautocompro',
    );

    // El botón "quitar" de cada columna: muta las versiones y no navega, así
    // que nadie más va a corregir la metadata.
    compareCmp(fixture).removeFromCompare('b');
    fixture.detectChanges();

    expect(title()).toBe(COMPARE_DEFAULT_META.title);
    expect(metaContent('meta[property="og:title"]')).toBe(
      COMPARE_DEFAULT_META.title,
    );
    expect(metaContent('meta[name="description"]')).toBe(
      COMPARE_DEFAULT_META.description,
    );
    expect(metaContent('meta[name="robots"]')).toBe('noindex, nofollow');
  });

  it('con una sola versión cargada se queda en el default del comparador', async () => {
    const fixture = await mount('/compare?ids=a');

    http
      .expectOne((r) => r.method === 'GET' && r.url.includes('/api/v1/compare'))
      .flush({
        data: {
          versions: [
            {
              id: 'a',
              name: 'XLI',
              model: { name: 'Corolla', brand: { name: 'Toyota' } },
            },
          ],
          diffHighlights: {},
        },
      });
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(title()).toBe(COMPARE_DEFAULT_META.title);
  });
});

// ---------------------------------------------------------------------------
// Aviso de privacidad ANTES de guardar.
//
// El disclaimer largo vive en /account/comparisons, dentro de un `@if
// (hasItems())`: se lee después de guardar, o sea después de haber decidido.
// En el momento de decidir —el botón "Guardar" del comparador— no había
// ninguna señal de que el enlace resultante abre sin sesión.
// ---------------------------------------------------------------------------
describe('CompareComponent — aviso antes de guardar', () => {
  const mountLogged = async (versions: unknown[] | null) => {
    TestBed.resetTestingModule();
    localStorage.clear();
    const auth = new AuthServiceStub();
    auth.currentUser.set({ id: 'u1', email: 'u@test.cl', name: 'U', role: 'USER' });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        CompareStore,
        { provide: AuthService, useValue: auth },
        { provide: ActivatedRoute, useValue: routeStub({}) },
      ],
    });
    const localHttp = TestBed.inject(HttpTestingController);
    const store = TestBed.inject(CompareStore);
    if (versions) {
      store.hydrateFromUrl(versions.map((v) => (v as { id: string }).id).join(','));
    }
    const fixture = TestBed.createComponent(CompareComponent);
    const ready = fixture.componentInstance.ready;
    if (versions) {
      localHttp
        .expectOne((r) => r.url.includes('/api/v1/compare'))
        .flush({ data: { versions, diffHighlights: {} } });
    }
    await ready;
    fixture.detectChanges();
    localHttp
      .match((r) => r.url.includes('/me/favorites/models'))
      .forEach((r) => r.flush({ data: [] }));
    fixture.detectChanges();
    return { fixture, localHttp };
  };

  afterEach(() => {
    localStorage.clear();
  });

  it('el aviso aparece junto a la barra de guardar', async () => {
    const { fixture, localHttp } = await mountLogged([
      { id: 'a', name: 'A' },
      { id: 'b', name: 'B' },
    ]);

    const bar = fixture.nativeElement.querySelector('[data-testid="save-bar"]');
    const nota = fixture.nativeElement.querySelector(
      '[data-testid="save-privacy-note"]',
    );
    expect(bar).not.toBeNull();
    expect(nota).not.toBeNull();
    // "Junto a": mismo contenedor, no en otra parte de la página.
    expect(nota.parentElement).toBe(bar.parentElement);
    // El hecho central, sin repetir los tres del disclaimer largo.
    expect(nota.textContent).toMatch(/sin iniciar sesión/i);
    expect(nota.textContent).toMatch(/enlace/i);
    // Es aviso, no error: nada de role="alert".
    expect(nota.getAttribute('role')).toBe('note');

    localHttp.verify();
  });

  it('sin comparación no hay barra ni aviso', async () => {
    const { fixture, localHttp } = await mountLogged(null);

    expect(
      fixture.nativeElement.querySelector('[data-testid="save-bar"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="save-privacy-note"]'),
    ).toBeNull();

    localHttp.verify();
  });
});

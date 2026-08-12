import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';
import { AuthService, type User } from '../../core/auth.service';
import { FavoritesStore } from '../../core/favorites-store.service';
import { CompareStore } from '../../core/compare-store.service';

class AuthServiceStub {
  currentUser = signal<User | null>(null);
}

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
  isPopular = (modelId: string): boolean => this.topIds().has(modelId);
  recordAdd = (_versionId: string): void => { /* noop */ };
}

describe('LandingComponent', () => {
  let http: HttpTestingController;
  let compare: CompareStore;
  let auth: AuthServiceStub;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: FavoritesStore, useClass: FavoritesStoreStub },
        { provide: PopularityService, useClass: PopularityServiceStub },
      ],
    });
    http = TestBed.inject(HttpTestingController);
    compare = TestBed.inject(CompareStore);
    auth = TestBed.inject(AuthService) as unknown as AuthServiceStub;
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('renderiza hero con H1 y dos CTAs', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: {
        total: 0,
        items: [],
        page: 1,
        pageSize: 30,
      },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Compara autos en Chile');
    const explore = html.querySelector('[data-testid="hero-explore"]');
    const compare = html.querySelector('[data-testid="hero-compare"]');
    expect(explore).not.toBeNull();
    expect(compare).not.toBeNull();
  });

  it('hero-explore apunta a /catalogo', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: { total: 0, items: [], page: 1, pageSize: 30 },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();
    const explore = fixture.nativeElement.querySelector(
      '[data-testid="hero-explore"]',
    ) as HTMLAnchorElement;
    expect(explore.getAttribute('href')).toBe('/catalogo');
  });

  it('muestra 3 value cards (data-testid value-card-1/2/3)', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: { total: 0, items: [], page: 1, pageSize: 30 },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();
    const html = fixture.nativeElement as HTMLElement;
    expect(html.querySelector('[data-testid="value-card-1"]')).not.toBeNull();
    expect(html.querySelector('[data-testid="value-card-2"]')).not.toBeNull();
    expect(html.querySelector('[data-testid="value-card-3"]')).not.toBeNull();
  });

  it('arma la comparación en vivo con modelos y versiones del backend', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: {
        total: 2,
        items: [
          {
            id: 'm1',
            name: 'Rio',
            brand: { name: 'Kia' },
            segment: 'HATCHBACK',
            minPrice: 14990000,
            versions: [{
              id: 'v1',
              name: 'EX',
              year: 2025,
              priceClp: 14990000,
              transmission: 'AUTOMATIC',
              fuel: 'BENCINA',
              engineDisplacementCc: 1400,
              powerHp: 100,
              consumptionCityKmL: 12.5,
            }],
          },
          {
            id: 'm2',
            name: 'Swift',
            brand: { name: 'Suzuki' },
            segment: 'HATCHBACK',
            minPrice: 12990000,
            versions: [{
              id: 'v2',
              name: 'GLX',
              year: 2026,
              priceClp: 12990000,
              transmission: 'CVT',
              fuel: 'HYBRID',
              engineDisplacementCc: 1200,
              powerHp: 82,
              consumptionCityKmL: 18.2,
            }],
          },
        ],
        page: 1,
        pageSize: 30,
      },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();

    const preview = fixture.nativeElement.querySelector(
      '[data-testid="live-comparison"]',
    ) as HTMLElement;
    expect(preview.textContent).toContain('Kia Rio');
    expect(preview.textContent).toContain('Suzuki Swift');
    expect(preview.textContent).toContain('$ 14.990.000');
    expect(preview.textContent).toContain('$ 12.990.000');
    expect(preview.textContent).toContain('$ 2.000.000');
    expect(preview.textContent).not.toContain('Toyota Corolla');

    const link = preview.querySelector(
      '[data-testid="live-comparison-link"]',
    ) as HTMLAnchorElement;
    const href = link.getAttribute('href') ?? '';
    expect(href.startsWith('/compare?ids=')).toBe(true);
    expect(href).toContain('v1');
    expect(href).toContain('v2');

    // Regresión: el backend mandaba un `defaultVersion` sin motor ni consumo y
    // la preview rendía los fallbacks aunque el dato viniera cargado.
    expect(preview.textContent).toContain('1,4 L');
    expect(preview.textContent).toContain('100 HP');
    expect(preview.textContent).toContain('18,2 km/l ciudad');
    expect(preview.textContent).not.toContain('Motor por confirmar');
    expect(preview.textContent).not.toContain('Consumo por confirmar');
  });

  it('arma una pareja por segmento y los dots cambian la comparación visible', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    const version = (id: string, priceClp: number) => ({
      id,
      name: 'Base',
      year: 2026,
      priceClp,
      transmission: 'AUTOMATIC',
      fuel: 'BENCINA',
      powerHp: 100,
    });
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: {
        total: 4,
        items: [
          { id: 'm1', name: 'Rio', brand: { name: 'Kia' }, segment: 'HATCHBACK', minPrice: 14000000, versions: [version('v1', 14000000)] },
          { id: 'm2', name: 'Tucson', brand: { name: 'Hyundai' }, segment: 'SUV', minPrice: 30000000, versions: [version('v2', 30000000)] },
          { id: 'm3', name: 'Swift', brand: { name: 'Suzuki' }, segment: 'HATCHBACK', minPrice: 12000000, versions: [version('v3', 12000000)] },
          { id: 'm4', name: 'CX-5', brand: { name: 'Mazda' }, segment: 'SUV', minPrice: 28000000, versions: [version('v4', 28000000)] },
        ],
        page: 1,
        pageSize: 30,
      },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();

    const html = fixture.nativeElement as HTMLElement;
    // Dos parejas: una por segmento. Nadie compara un SUV con un city car.
    expect(fixture.componentInstance.pairs().length).toBe(2);
    const pairA = html.querySelector('[data-testid="live-pair-0"]') as HTMLElement;
    const pairB = html.querySelector('[data-testid="live-pair-1"]') as HTMLElement;
    expect(pairA.textContent).toContain('Suzuki Swift');
    expect(pairA.textContent).toContain('Kia Rio');
    expect(pairB.textContent).toContain('Mazda CX-5');
    expect(pairB.textContent).toContain('Hyundai Tucson');

    // Solo la pareja activa es navegable; la otra queda inerte.
    expect(pairA.hasAttribute('inert')).toBe(false);
    expect(pairB.hasAttribute('inert')).toBe(true);

    const dot = html.querySelector(
      '[data-testid="live-comparison-dot-1"]',
    ) as HTMLButtonElement;
    dot.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.activePairIndex()).toBe(1);
    expect(
      (html.querySelector('[data-testid="live-pair-1"]') as HTMLElement).hasAttribute('inert'),
    ).toBe(false);
  });

  it('oculta la invitación a crear cuenta cuando el usuario inicia sesión', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: { total: 0, items: [], page: 1, pageSize: 30 },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="guest-register-section"]'),
    ).not.toBeNull();

    auth.currentUser.set({
      id: 'u1',
      email: 'persona@test.cl',
      name: 'Persona',
      role: 'USER',
    });
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="guest-register-section"]'),
    ).toBeNull();
  });

  it('stats strip se muestra con totales del backend', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: {
        total: 12,
        items: [
          { id: 'a', name: 'Corolla', brand: { name: 'Toyota' }, segment: 'SEDAN', versions: [{ id: 'a1' }, { id: 'a2' }] },
          { id: 'b', name: 'Hilux', brand: { name: 'Toyota' }, segment: 'PICKUP', versions: [{ id: 'b1' }] },
          { id: 'c', name: 'Onix', brand: { name: 'Chevrolet' }, segment: 'HATCHBACK', versions: [{ id: 'c1' }] },
        ],
        page: 1,
        pageSize: 30,
      },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();
    const strip = fixture.nativeElement.querySelector(
      '[data-testid="stats-strip"]',
    );
    expect(strip).not.toBeNull();
    expect(strip?.textContent).toContain('12'); // total models
    expect(strip?.textContent).toContain('2'); // 2 brands (Toyota, Chevrolet)
    expect(strip?.textContent).toContain('4'); // 2+1+1=4 versions
  });

  it('muestra el featured-grid sólo con los modelos populares segun PopularityService', async () => {
    const pop = TestBed.inject(PopularityService) as unknown as PopularityServiceStub;
    pop.topIds.set(new Set(['a', 'b', 'c']));
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: {
        total: 4,
        items: [
          { id: 'a', name: 'Corolla', brand: { name: 'Toyota' }, segment: 'SEDAN', versions: [{ id: 'a1' }] },
          { id: 'b', name: 'Tucson', brand: { name: 'Hyundai' }, segment: 'SUV', versions: [{ id: 'b1' }] },
          { id: 'c', name: 'CX-5', brand: { name: 'Mazda' }, segment: 'SUV', versions: [{ id: 'c1' }] },
          { id: 'd', name: 'Yaris', brand: { name: 'Toyota' }, segment: 'HATCHBACK', versions: [{ id: 'd1' }] },
        ],
        page: 1,
        pageSize: 30,
      },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector(
      '[data-testid="featured-grid"]',
    );
    expect(grid).not.toBeNull();
    expect(grid?.querySelectorAll('app-vehicle-card').length).toBe(3);
    // El id 'd' (Yaris) NO es popular -> debe quedar fuera
    const cards = grid?.querySelectorAll('app-vehicle-card');
    expect(cards?.[0]?.textContent).toContain('Corolla');
  });

  it('featured-grid queda vacio si PopularityService.topIds esta vacio', async () => {
    const pop = TestBed.inject(PopularityService) as unknown as PopularityServiceStub;
    pop.topIds.set(new Set()); // sin populares
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: {
        total: 1,
        items: [
          { id: 'a', name: 'Corolla', brand: { name: 'Toyota' }, segment: 'SEDAN', versions: [{ id: 'a1' }] },
        ],
        page: 1,
        pageSize: 30,
      },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector('[data-testid="featured-grid"]');
    expect(grid).toBeNull();
  });

  it('agrega a comparación la versión seleccionada desde fichas del mes', async () => {
    // El featured-grid depende de PopularityService.topIds; seteamos 'm1'
    // para que el modelo se muestre y la version-chip-v2 exista en el DOM.
    const pop = TestBed.inject(PopularityService) as unknown as PopularityServiceStub;
    pop.topIds.set(new Set(['m1']));
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: {
        total: 1,
        items: [
          {
            id: 'm1',
            name: 'Corolla',
            brand: { name: 'Toyota' },
            segment: 'SEDAN',
            minPrice: 10000000,
            versions: [
              { id: 'v1', name: 'Base', year: 2026, priceClp: 10000000 },
              { id: 'v2', name: 'Sport', year: 2026, priceClp: 12000000 },
            ],
          },
        ],
        page: 1,
        pageSize: 30,
      },
    });
    await fixture.componentInstance.ready;
    fixture.detectChanges();

    const version = fixture.nativeElement.querySelector(
      '[data-testid="version-chip-v2"]',
    ) as HTMLButtonElement;
    version.click();
    fixture.detectChanges();

    const compareButton = fixture.nativeElement.querySelector(
      '[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    compareButton.click();

    expect(compare.ids()).toEqual(['v2']);
  });

  it('muestra error si el backend falla', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url.includes('/api/v1/models'))
      .flush(
        { data: null, error: { code: 'INTERNAL', message: 'fail' } },
        { status: 500, statusText: 'Server Error' },
      );
    await fixture.componentInstance.ready;
    fixture.detectChanges();
    const err = fixture.nativeElement.querySelector('[data-testid="error"]');
    expect(err).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[data-testid="stats-strip"]')).toBeNull();
  });
});

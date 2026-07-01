import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { LandingComponent } from './landing.component';
import { AuthService, type User } from '../../core/auth.service';
import { FavoritesStore } from '../../core/favorites-store.service';

class AuthServiceStub {
  currentUser = signal<User | null>(null);
}

class FavoritesStoreStub {
  isFavorite(): boolean { return false; }
  async toggle(): Promise<void> { /* noop */ }
  load(): Promise<void> { return Promise.resolve(); }
}

describe('LandingComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: FavoritesStore, useClass: FavoritesStoreStub },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
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

  it('muestra el featured-grid sólo con modelos de la lista FEATURED_ON_LANDING', async () => {
    const fixture = TestBed.createComponent(LandingComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/api/v1/models')).flush({
      data: {
        total: 3,
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

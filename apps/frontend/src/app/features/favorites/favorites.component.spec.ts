import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { FavoritesComponent } from './favorites.component';
import { AuthService, type User } from '../../core/auth.service';
import { CompareStore } from '../../core/compare-store.service';
import { FavoritesStore } from '../../core/favorites-store.service';

class AuthServiceStub {
  currentUser = signal<User | null>({ id: 'u1', email: 'u@test.cl', name: 'U' });
}
class FavoritesStoreStub {
  isFavorite(): boolean { return true; }
  async toggle(): Promise<void> {}
  load(): Promise<void> { return Promise.resolve(); }
}

describe('FavoritesComponent', () => {
  let http: HttpTestingController;
  let store: CompareStore;

  beforeEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'compare', children: [] },
          { path: 'catalogo', children: [] },
        ]),
        { provide: AuthService, useClass: AuthServiceStub },
        { provide: FavoritesStore, useClass: FavoritesStoreStub },
        CompareStore,
        FavoritesComponent,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    store = TestBed.inject(CompareStore);
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('carga inicial llama GET /me/favorites/models', async () => {
    const fixture = TestBed.createComponent(FavoritesComponent);
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url.includes('/me/favorites/models'));
    req.flush({
      data: [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          segment: 'HATCHBACK',
          minPrice: 14000000,
          defaultVersion: { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
          versions: [{ id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 }],
        },
      ],
    });
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();
    const grid = fixture.nativeElement.querySelector(
      '[data-testid="favorites-grid"]',
    );
    expect(grid).not.toBeNull();
  });

  it('muestra empty state cuando no hay favoritos', async () => {
    const fixture = TestBed.createComponent(FavoritesComponent);
    fixture.detectChanges();
    http
      .expectOne((r) => r.url.includes('/me/favorites/models'))
      .flush({ data: [] });
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();
    const empty = fixture.nativeElement.querySelector('[data-testid="empty"]');
    expect(empty).not.toBeNull();
  });

  it('click Comparar agrega defaultVersion al store y navega', async () => {
    const fixture = TestBed.createComponent(FavoritesComponent);
    fixture.detectChanges();
    http.expectOne((r) => r.url.includes('/me/favorites/models')).flush({
      data: [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          segment: 'HATCHBACK',
          minPrice: 14000000,
          defaultVersion: { id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 },
          versions: [{ id: 'v1', name: 'XLS', priceClp: 14990000, year: 2026 }],
        },
      ],
    });
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="compare-one-m1"]',
    );
    btn.click();
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    expect(store.ids()).toEqual(['v1']);
  });
});
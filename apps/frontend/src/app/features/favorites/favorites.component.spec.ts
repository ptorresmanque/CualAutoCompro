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
  toggled: Array<{ modelId: string; versionId: string }> = [];
  changes: Array<{ currentVersionId: string; modelId: string; newVersionId: string }> = [];
  async toggle(args: { modelId: string; versionId: string }): Promise<void> {
    this.toggled.push(args);
  }
  async changeVersion(args: {
    currentVersionId: string;
    modelId: string;
    newVersionId: string;
  }): Promise<void> {
    this.changes.push(args);
  }
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

  function flushFavorites(req: unknown, payload: unknown[]) {
    (req as { flush: (data: unknown) => void }).flush({
      data: payload.map((m) => ({
        versionId: 'v1',
        ...((m as object) || {}),
      })),
    });
  }

  it('carga inicial llama GET /me/favorites/models', async () => {
    const fixture = TestBed.createComponent(FavoritesComponent);
    fixture.detectChanges();
    const req = http.expectOne((r) => r.url.includes('/me/favorites/models'));
    flushFavorites(req, [
      {
        id: 'm1',
        name: 'Yaris',
        brand: { name: 'Toyota' },
        segment: 'HATCHBACK',
        minPrice: 14000000,
        versions: [{ id: 'v1', modelId: 'm1', name: 'XLS', priceClp: 14990000, year: 2026 }],
      },
    ]);
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

  it('click Agregar a comparación agrega versionId al store y navega', async () => {
    const fixture = TestBed.createComponent(FavoritesComponent);
    fixture.detectChanges();
    flushFavorites(
      http.expectOne((r) => r.url.includes('/me/favorites/models')),
      [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          segment: 'HATCHBACK',
          minPrice: 14000000,
          versions: [{ id: 'v1', modelId: 'm1', name: 'XLS', priceClp: 14990000, year: 2026 }],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
      '[data-testid="compare-m1"]',
    );
    expect(btn).not.toBeNull();
    expect(btn.textContent).toContain('Agregar a comparación');
    btn.click();
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    expect(store.ids()).toEqual(['v1']);
  });

  it('click en corazón llama favorites.toggle con modelId+versionId y remueve el modelo del grid', async () => {
    const favStub = TestBed.inject(FavoritesStore) as unknown as FavoritesStoreStub;
    const fixture = TestBed.createComponent(FavoritesComponent);
    fixture.detectChanges();
    flushFavorites(
      http.expectOne((r) => r.url.includes('/me/favorites/models')),
      [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          segment: 'HATCHBACK',
          minPrice: 14000000,
          versions: [{ id: 'v1', modelId: 'm1', name: 'XLS', priceClp: 14990000, year: 2026 }],
        },
        {
          id: 'm2',
          name: 'Corolla',
          brand: { name: 'Toyota' },
          segment: 'SEDAN',
          minPrice: 17000000,
          versions: [{ id: 'v2', modelId: 'm2', name: 'XLI', priceClp: 16990000, year: 2024 }],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    expect(
      fixture.nativeElement.querySelector('[data-testid="favorite-m1"]'),
    ).not.toBeNull();

    const heartBtn = fixture.nativeElement.querySelector(
      '[data-testid="favorite-m1"]',
    ) as HTMLButtonElement;
    heartBtn.click();
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(favStub.toggled).toEqual([{ modelId: 'm1', versionId: 'v1' }]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="favorite-m1"]'),
    ).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[data-testid="favorite-m2"]'),
    ).not.toBeNull();
  });

  it('seleccionar otra versión llama favorites.changeVersion y actualiza versionId del card', async () => {
    const favStub = TestBed.inject(FavoritesStore) as unknown as FavoritesStoreStub;
    const fixture = TestBed.createComponent(FavoritesComponent);
    fixture.detectChanges();
    flushFavorites(
      http.expectOne((r) => r.url.includes('/me/favorites/models')),
      [
        {
          id: 'm1',
          name: 'Yaris',
          brand: { name: 'Toyota' },
          segment: 'HATCHBACK',
          minPrice: 14000000,
          versions: [
            { id: 'v1', modelId: 'm1', name: 'XLS', priceClp: 14990000, year: 2026 },
            { id: 'v2', modelId: 'm1', name: 'Sport', priceClp: 11990000, year: 2025 },
          ],
        },
      ],
    );
    await fixture.componentInstance.initialLoad;
    fixture.detectChanges();

    const sportChip = fixture.nativeElement.querySelector(
      '[data-testid="version-chip-v2"]',
    ) as HTMLButtonElement;
    sportChip.click();
    fixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    fixture.detectChanges();

    expect(favStub.changes).toEqual([
      { currentVersionId: 'v1', modelId: 'm1', newVersionId: 'v2' },
    ]);
  });
});
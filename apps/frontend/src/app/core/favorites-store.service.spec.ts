import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { signal } from '@angular/core';
import { FavoritesStore } from './favorites-store.service';
import { AuthService, type User } from './auth.service';

class AuthServiceStub {
  private _user = signal<User | null>(null);
  currentUser = this._user.asReadonly();
  setUser(u: User | null) { this._user.set(u); }
}

describe('FavoritesStore', () => {
  let http: HttpTestingController;
  let store: FavoritesStore;
  let authStub: AuthServiceStub;

  beforeEach(() => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useClass: AuthServiceStub },
        FavoritesStore,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    authStub = TestBed.inject(AuthService) as unknown as AuthServiceStub;
    store = TestBed.inject(FavoritesStore);
  });

  afterEach(() => {
    http.verify();
  });

  it('toggle sin user lanza UNAUTHORIZED', async () => {
    await expect(store.toggle('m1')).rejects.toThrow('UNAUTHORIZED');
  });

  async function flushMicrotasks(times = 5): Promise<void> {
    for (let i = 0; i < times; i++) {
      await Promise.resolve();
    }
  }

  it('toggle con user llama POST y agrega al set', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    const getReq = http.expectOne((r) => r.url.includes('/me/favorites'));
    getReq.flush({ data: { modelIds: [] } });
    await flushMicrotasks();

    const p = store.toggle('m1');
    const postReq = http.expectOne((r) => r.url.includes('/me/favorites') && r.method === 'POST');
    postReq.flush({ data: { modelId: 'm1', created: true } });
    await p;

    expect(store.isFavorite('m1')).toBe(true);
    expect(store.count()).toBe(1);
  });

  it('toggle cuando ya es favorito llama DELETE y remueve', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    http.expectOne((r) => r.url.includes('/me/favorites')).flush({ data: { modelIds: ['m1'] } });
    await flushMicrotasks();

    const p = store.toggle('m1');
    const delReq = http.expectOne((r) => r.url.includes('/me/favorites/m1') && r.method === 'DELETE');
    delReq.flush({ data: { removed: true } });
    await p;

    expect(store.isFavorite('m1')).toBe(false);
    expect(store.count()).toBe(0);
  });

  it('logout limpia el set', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    http.expectOne((r) => r.url.includes('/me/favorites')).flush({ data: { modelIds: ['m1', 'm2'] } });
    await flushMicrotasks();
    expect(store.count()).toBe(2);

    authStub.setUser(null);
    TestBed.flushEffects();
    expect(store.count()).toBe(0);
    expect(store.isFavorite('m1')).toBe(false);
  });

  it('load() en vuelo se descarta si el usuario cambió antes de resolver (C4)', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    const getReq = http.expectOne((r) => r.url.includes('/me/favorites'));
    // Simulamos logout mientras el GET está en vuelo
    authStub.setUser(null);
    TestBed.flushEffects();
    // Al flushear, load() debe detectar que el user cambió y NO popular _ids
    getReq.flush({ data: { modelIds: ['m1', 'm2'] } });
    await flushMicrotasks();
    expect(store.count()).toBe(0);
    expect(store.loaded()).toBe(false);
  });
});

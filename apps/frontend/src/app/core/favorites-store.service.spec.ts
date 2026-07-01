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

  async function flushMicrotasks(times = 5): Promise<void> {
    for (let i = 0; i < times; i++) {
      await Promise.resolve();
    }
  }

  it('toggle sin user lanza UNAUTHORIZED', async () => {
    await expect(
      store.toggle({ modelId: 'm1', versionId: 'v1' }),
    ).rejects.toThrow('UNAUTHORIZED');
  });

  it('toggle con user llama POST y agrega al set', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    const getReq = http.expectOne((r) => r.url.includes('/me/favorites'));
    getReq.flush({ data: { versionIds: [] } });
    await flushMicrotasks();

    const p = store.toggle({ modelId: 'm1', versionId: 'v1' });
    const postReq = http.expectOne((r) => r.url.includes('/me/favorites') && r.method === 'POST');
    expect(postReq.request.body).toEqual({ modelId: 'm1', versionId: 'v1' });
    postReq.flush({ data: { versionId: 'v1', created: true } });
    await p;

    expect(store.isFavorite('v1')).toBe(true);
    expect(store.count()).toBe(1);
  });

  it('toggle cuando ya es favorito llama DELETE y remueve', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    http.expectOne((r) => r.url.includes('/me/favorites')).flush({ data: { versionIds: ['v1'] } });
    await flushMicrotasks();

    const p = store.toggle({ modelId: 'm1', versionId: 'v1' });
    const delReq = http.expectOne((r) => r.url.includes('/me/favorites/v1') && r.method === 'DELETE');
    delReq.flush({ data: { removed: true } });
    await p;

    expect(store.isFavorite('v1')).toBe(false);
    expect(store.count()).toBe(0);
  });

  it('logout limpia el set', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    http.expectOne((r) => r.url.includes('/me/favorites')).flush({ data: { versionIds: ['v1', 'v2'] } });
    await flushMicrotasks();
    expect(store.count()).toBe(2);

    authStub.setUser(null);
    TestBed.flushEffects();
    expect(store.count()).toBe(0);
    expect(store.isFavorite('v1')).toBe(false);
  });

  it('load() en vuelo se descarta si el usuario cambió antes de resolver (C4)', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    const getReq = http.expectOne((r) => r.url.includes('/me/favorites'));
    authStub.setUser(null);
    TestBed.flushEffects();
    getReq.flush({ data: { versionIds: ['v1', 'v2'] } });
    await flushMicrotasks();
    expect(store.count()).toBe(0);
    expect(store.loaded()).toBe(false);
  });

  it('changeVersion hace PATCH y reemplaza la versionId en el set', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    http.expectOne((r) => r.url.includes('/me/favorites')).flush({ data: { versionIds: ['v1'] } });
    await flushMicrotasks();

    const p = store.changeVersion({ currentVersionId: 'v1', modelId: 'm1', newVersionId: 'v2' });
    const patchReq = http.expectOne((r) => r.url.includes('/me/favorites/v1') && r.method === 'PATCH');
    expect(patchReq.request.body).toEqual({ modelId: 'm1', newVersionId: 'v2' });
    patchReq.flush({ data: { versionId: 'v2', updated: true } });
    await p;

    expect(store.isFavorite('v1')).toBe(false);
    expect(store.isFavorite('v2')).toBe(true);
    expect(store.count()).toBe(1);
  });

  it('changeVersion es noop si currentVersionId === newVersionId', async () => {
    authStub.setUser({ id: 'u1', email: 'u@test.cl', name: 'U' });
    TestBed.flushEffects();
    http.expectOne((r) => r.url.includes('/me/favorites')).flush({ data: { versionIds: ['v1'] } });
    await flushMicrotasks();

    await store.changeVersion({ currentVersionId: 'v1', modelId: 'm1', newVersionId: 'v1' });
    // No PATCH request should have been made
    http.expectNone((r) => r.method === 'PATCH');
    expect(store.isFavorite('v1')).toBe(true);
  });

  it('changeVersion sin user lanza UNAUTHORIZED', async () => {
    await expect(
      store.changeVersion({ currentVersionId: 'v1', modelId: 'm1', newVersionId: 'v2' }),
    ).rejects.toThrow('UNAUTHORIZED');
  });
});
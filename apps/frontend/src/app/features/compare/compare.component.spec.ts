import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { CompareComponent } from './compare.component';
import { CompareStore } from '../../core/compare-store.service';

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
  });

  afterEach(() => {
    http.verify();
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
});

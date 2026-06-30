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
});

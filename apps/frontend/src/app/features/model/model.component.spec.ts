import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  ParamMap,
  provideRouter,
  Router,
  RouterOutlet,
} from '@angular/router';
import { of } from 'rxjs';
import { ModelComponent } from './model.component';
import {
  PageMetaService,
  SITE_DEFAULT_META,
} from '../../core/page-meta.service';

/**
 * Carrusel spec — tests the carousel logic by manually stubbing the model
 * signal on the ModelComponent instance and avoiding the full async bootstrap.
 */
describe('ModelComponent — carrusel', () => {
  const GALLERY = [
    'https://placehold.co/1280x720/008080/ffffff?text=Frontal',
    'https://placehold.co/1280x720/006565/ffffff?text=Lateral',
    'https://placehold.co/1280x720/93f2f2/006565?text=Interior',
    'https://placehold.co/1280x720/c6e9e9/006565?text=Posterior',
  ];

  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    const paramMap: ParamMap = convertToParamMap({
      brandSlug: 'toyota',
      modelSlug: 'corolla',
    });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(paramMap), snapshot: { paramMap } },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    for (const req of http.match(() => true)) {
      req.flush({ data: [] });
    }
  });

  function createWithGallery(galleryUrls: string[]) {
    const fixture = TestBed.createComponent(ModelComponent);
    const cmp = fixture.componentInstance as ModelComponent;
    (cmp as any).model.set({
      id: 'm1',
      name: 'Corolla',
      segment: 'SEDAN',
      brand: { name: 'Toyota' },
      versions: [],
      galleryUrls,
    });
    return { fixture, cmp };
  }

  it('hasGallery true cuando hay al menos 1 URL', () => {
    const { cmp } = createWithGallery(GALLERY);
    expect(cmp.hasGallery()).toBe(true);
    expect(cmp.galleryUrls().length).toBe(4);
  });

  it('hasGallery false cuando galleryUrls vacío', () => {
    const { cmp } = createWithGallery([]);
    expect(cmp.hasGallery()).toBe(false);
    expect(cmp.galleryUrls().length).toBe(0);
  });

  it('currentIndex() inicia en 0 y currentUrl en la primera imagen', () => {
    const { cmp } = createWithGallery(GALLERY);
    expect(cmp.currentIndex()).toBe(0);
    expect(cmp.currentUrl()).toBe(GALLERY[0]);
  });

  it('currentUrl resuelve URLs relativas /uploads/ al origen del backend (regression 404 en dev)', () => {
    // Regression: when the API returns a relative URL like
    // '/uploads/2026-07/abc.png' the browser would resolve it against the
    // current page (frontend origin :4200) and 404 in dev. currentUrl
    // now prepends the backend origin via toAbsoluteUploadUrl so the
    // browser hits the correct server.
    const RELATIVE_GALLERY = [
      '/uploads/2026-07/abc.png',
      '/uploads/2026-07/def.jpg',
    ];
    const { cmp } = createWithGallery(RELATIVE_GALLERY);
    expect(cmp.currentUrl()).toBe('http://localhost:3000/uploads/2026-07/abc.png');
    cmp.next();
    expect(cmp.currentUrl()).toBe('http://localhost:3000/uploads/2026-07/def.jpg');
  });

  it('next() avanza circularmente y envuelve al final', () => {
    const { cmp } = createWithGallery(GALLERY);
    cmp.next();
    expect(cmp.currentIndex()).toBe(1);
    expect(cmp.currentUrl()).toBe(GALLERY[1]);
    cmp.next();
    cmp.next();
    expect(cmp.currentIndex()).toBe(3);
    cmp.next();
    expect(cmp.currentIndex()).toBe(0);
  });

  it('prev() retrocede circularmente y envuelve al inicio', () => {
    const { cmp } = createWithGallery(GALLERY);
    cmp.prev();
    expect(cmp.currentIndex()).toBe(3);
    expect(cmp.currentUrl()).toBe(GALLERY[3]);
    cmp.prev();
    expect(cmp.currentIndex()).toBe(2);
  });

  it('goTo(i) navega a un slide específico', () => {
    const { cmp } = createWithGallery(GALLERY);
    cmp.goTo(2);
    expect(cmp.currentIndex()).toBe(2);
    expect(cmp.currentUrl()).toBe(GALLERY[2]);
    cmp.goTo(0);
    expect(cmp.currentIndex()).toBe(0);
  });

  it('goTo con índice fuera de rango no cambia nada', () => {
    const { cmp } = createWithGallery(GALLERY);
    cmp.goTo(-1);
    expect(cmp.currentIndex()).toBe(0);
    cmp.goTo(99);
    expect(cmp.currentIndex()).toBe(0);
  });
});

describe('ModelComponent — recall badge + dealers', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.resetTestingModule();
    const paramMap: ParamMap = convertToParamMap({
      brandSlug: 'toyota',
      modelSlug: 'corolla',
    });
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(paramMap), snapshot: { paramMap } },
        },
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    for (const req of http.match(() => true)) {
      req.flush({ data: [] });
    }
  });

  function createWithVersions(versions: any[]) {
    const fixture = TestBed.createComponent(ModelComponent);
    const cmp = fixture.componentInstance as ModelComponent;
    (cmp as any).model.set({
      id: 'm1',
      name: 'Corolla',
      segment: 'SEDAN',
      brand: { name: 'Toyota' },
      versions,
      galleryUrls: [],
    });
    fixture.detectChanges();
    return { fixture, cmp };
  }

  it('muestra recall badge si v.hasRecall=true', () => {
    const { fixture } = createWithVersions([
      {
        id: 'v1',
        name: 'XEI',
        priceClp: 19990000,
        year: 2026,
        fuel: 'Gasolina',
        transmission: 'Automática',
        hasRecall: true,
        recallUrl: 'https://example.com/recall/v1',
      },
    ]);
    const badge = fixture.nativeElement.querySelector(
      '[data-testid="recall-v1"]',
    );
    expect(badge).not.toBeNull();
    expect(badge.getAttribute('href')).toBe('https://example.com/recall/v1');
    expect(badge.getAttribute('target')).toBe('_blank');
    expect(badge.textContent).toContain('Recall publicado');
  });

  it('no muestra recall badge si v.hasRecall=false', () => {
    const { fixture } = createWithVersions([
      {
        id: 'v2',
        name: 'XLI',
        priceClp: 17990000,
        year: 2026,
        fuel: 'Gasolina',
        transmission: 'Mecánica',
        hasRecall: false,
      },
    ]);
    expect(
      fixture.nativeElement.querySelector('[data-testid="recall-v2"]'),
    ).toBeNull();
  });

  it('carga dealers de la marca y renderiza la sección', async () => {
    const { cmp, fixture } = createWithVersions([]);
    (cmp as any).brand.set({ id: 'b1', name: 'Toyota', logoUrl: null });

    const promise = cmp.loadBrandDealers('b1');
    http
      .expectOne((r) => r.url.includes('/api/v1/brands/b1/dealers'))
      .flush({
        data: [
          { id: 'd1', name: 'Derco', url: 'https://derco.cl', logoUrl: null },
          {
            id: 'd2',
            name: 'Salazar Israel',
            url: 'https://salazar.cl',
            logoUrl: 'https://cdn.example.com/salazar.png',
          },
        ],
      });
    await promise;

    expect(cmp.dealers().length).toBe(2);
    fixture.detectChanges();
    const aside = fixture.nativeElement.querySelector(
      '[data-testid="brand-dealers"]',
    );
    expect(aside).not.toBeNull();
    expect(aside.textContent).toContain('Concesionarios oficiales');
    expect(aside.textContent).toContain('Derco');
    expect(aside.textContent).toContain('Salazar Israel');
  });

  it('no renderiza sección de dealers si la respuesta falla', async () => {
    const { cmp, fixture } = createWithVersions([]);
    (cmp as any).brand.set({ id: 'b2', name: 'Toyota', logoUrl: null });

    const promise = cmp.loadBrandDealers('b2');
    http
      .expectOne((r) => r.url.includes('/api/v1/brands/b2/dealers'))
      .flush({ message: 'error' }, { status: 500, statusText: 'Server Error' });
    await promise;

    expect(cmp.dealers().length).toBe(0);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('[data-testid="brand-dealers"]'),
    ).toBeNull();
  });


  // ---------------------------------------------------------------------------
  // Equipamiento agrupado. Antes cada fila era `label = nombre / value =
  // categoría` y se leía "Airbags | Seguridad", como si la categoría fuera el
  // valor del ítem.
  // ---------------------------------------------------------------------------

  it('agrupa el equipamiento por categoría, con los ítems como valor', () => {
    const { cmp } = createWithVersions([
      {
        ...{ id: 'v1', name: 'Sport', year: 2025, priceClp: 15000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 150, engineDisplacementCc: 2000, torqueNm: 200, consumptionCityKmL: 12, consumptionHighwayKmL: 16, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450 },
        equipmentItems: [
          { equipmentItem: { name: 'Airbags', category: 'Seguridad' } },
          { equipmentItem: { name: 'ABS', category: 'Seguridad' } },
          { equipmentItem: { name: 'Apple CarPlay', category: 'Conectividad' } },
        ],
      },
    ]);

    const equipo = cmp
      .specGroupsFor('v1')
      .find((g) => g.title === 'Equipamiento');
    expect(equipo).toBeDefined();
    // Una fila por categoría, ordenadas alfabéticamente.
    expect(equipo!.rows.map((r) => r.label)).toEqual([
      'Conectividad',
      'Seguridad',
    ]);
    // Y el valor son los ítems de esa categoría, no la categoría repetida.
    expect(equipo!.rows[0].value).toBe('Apple CarPlay');
    expect(equipo!.rows[1].value).toBe('ABS, Airbags');
  });

  it('manda a "Otros" el equipamiento sin categoría', () => {
    const { cmp } = createWithVersions([
      {
        ...{ id: 'v1', name: 'Sport', year: 2025, priceClp: 15000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 150, engineDisplacementCc: 2000, torqueNm: 200, consumptionCityKmL: 12, consumptionHighwayKmL: 16, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450 },
        equipmentItems: [{ equipmentItem: { name: 'Extra', category: '' } }],
      },
    ]);
    const equipo = cmp.specGroupsFor('v1').find((g) => g.title === 'Equipamiento');
    expect(equipo!.rows[0].label).toBe('Otros');
    expect(equipo!.rows[0].value).toBe('Extra');
  });

  it('usa km/L y lo llama rendimiento, igual que el catálogo y el comparador', () => {
    const { cmp } = createWithVersions([{ id: 'v1', name: 'Sport', year: 2025, priceClp: 15000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 150, engineDisplacementCc: 2000, torqueNm: 200, consumptionCityKmL: 12, consumptionHighwayKmL: 16, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450 }]);
    const motor = cmp.specGroupsFor('v1').find((g) => g.title === 'Motorización');
    const fila = motor!.rows.find((r) => r.label.startsWith('Rendimiento'));
    expect(fila).toBeDefined();
    expect(fila!.value).toBe('12 / 16 km/L');
  });

  it('specGroupsFor devuelve la misma referencia mientras no cambien las versiones', () => {
    const { cmp } = createWithVersions([{ id: 'v1', name: 'Sport', year: 2025, priceClp: 15000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 150, engineDisplacementCc: 2000, torqueNm: 200, consumptionCityKmL: 12, consumptionHighwayKmL: 16, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450 }]);
    // Era un método llamado desde el template: se re-ejecutaba en cada
    // detección de cambios y recreaba todos los arrays.
    expect(cmp.specGroupsFor('v1')).toBe(cmp.specGroupsFor('v1'));
  });

  // ---------------------------------------------------------------------------
  // Selector de versión: antes repetía marca, modelo, transmisión, combustible
  // y potencia, todo lo que ya está en la tabla de la tab.
  // ---------------------------------------------------------------------------

  it('elegir una versión en el aside cambia la tab activa', () => {
    const { cmp, fixture } = createWithVersions([{ id: 'v1', name: 'Sport', year: 2025, priceClp: 15000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 150, engineDisplacementCc: 2000, torqueNm: 200, consumptionCityKmL: 12, consumptionHighwayKmL: 16, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450 }, { id: 'v2', name: 'Limited', year: 2025, priceClp: 18000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 180, engineDisplacementCc: 2500, torqueNm: 250, consumptionCityKmL: 11, consumptionHighwayKmL: 15, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450 }]);
    fixture.detectChanges();

    expect(cmp.activeTabIndex()).toBe(0);
    expect(cmp.activeVersion()?.id).toBe('v1');

    fixture.nativeElement
      .querySelector('[data-testid="version-select-v2"]')
      .click();
    fixture.detectChanges();

    expect(cmp.activeTabIndex()).toBe(1);
    expect(cmp.activeVersion()?.id).toBe('v2');
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="version-v2"]')
        .getAttribute('data-active'),
    ).toBe('true');
    expect(
      fixture.nativeElement
        .querySelector('[data-testid="version-v1"]')
        .getAttribute('data-active'),
    ).toBe('false');
  });

  it('el aside no repite los datos que ya muestra la ficha técnica', () => {
    const { fixture } = createWithVersions([{ id: 'v1', name: 'Sport', year: 2025, priceClp: 15000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 150, engineDisplacementCc: 2000, torqueNm: 200, consumptionCityKmL: 12, consumptionHighwayKmL: 16, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450 }]);
    fixture.detectChanges();

    const aside = fixture.nativeElement.querySelector('[data-testid="versions"]');
    // Nombre y precio sí; marca, transmisión, combustible y potencia no.
    expect(aside.textContent).toContain('Sport');
    expect(aside.textContent).toContain('15.000.000');
    expect(aside.textContent).not.toContain('Toyota');
    expect(aside.textContent).not.toContain('Automática');
    expect(aside.textContent).not.toContain('Bencina');
    expect(aside.textContent).not.toContain('150');
  });

  it('crea una tab por versión con su contenido independiente', () => {
    const { cmp, fixture } = createWithVersions([
      { id: 'v1', name: 'Sport', year: 2025, priceClp: 15000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 150, engineDisplacementCc: 2000, torqueNm: 200, consumptionCityKmL: 12, consumptionHighwayKmL: 16, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450 },
      { id: 'v2', name: 'Limited', year: 2025, priceClp: 18000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 180, engineDisplacementCc: 2500, torqueNm: 250, consumptionCityKmL: 11, consumptionHighwayKmL: 15, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450 },
    ]);
    fixture.detectChanges();
    const tabs = fixture.nativeElement.querySelectorAll('[data-testid^="tab-version-"]');
    expect(tabs.length).toBe(2);
    expect(tabs[0].getAttribute('data-testid')).toBe('tab-version-v1');
    expect(tabs[1].getAttribute('data-testid')).toBe('tab-version-v2');

    const motorV1 = fixture.nativeElement.querySelector('[data-testid="spec-group-v1-Motorización"]');
    expect(motorV1).not.toBeNull();
    expect(motorV1?.textContent).toContain('150 HP');

    const groupsV1 = cmp.buildSpecGroups(cmp.versions()[0]);
    const groupsV2 = cmp.buildSpecGroups(cmp.versions()[1]);
    const motorV1FromMethod = groupsV1.find((g) => g.title === 'Motorización');
    const motorV2FromMethod = groupsV2.find((g) => g.title === 'Motorización');
    expect(motorV1FromMethod?.rows.find((r) => r.label === 'Potencia')?.value).toBe('150 HP');
    expect(motorV2FromMethod?.rows.find((r) => r.label === 'Potencia')?.value).toBe('180 HP');
  });

  it('incluye el grupo Equipamiento en cada versión que tenga items', () => {
    const { fixture } = createWithVersions([
      { id: 'v1', name: 'Sport', year: 2025, priceClp: 15000000, transmission: 'AUTOMATIC', fuel: 'BENCINA', powerHp: 150, engineDisplacementCc: 2000, torqueNm: 200, consumptionCityKmL: 12, consumptionHighwayKmL: 16, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450, equipmentItems: [{ equipmentItem: { name: 'Apple CarPlay', category: 'Conectividad' } }, { equipmentItem: { name: 'Cámara 360°', category: 'Seguridad' } }] },
      { id: 'v2', name: 'Base', year: 2025, priceClp: 12000000, transmission: 'MANUAL', fuel: 'BENCINA', powerHp: 120, engineDisplacementCc: 1600, torqueNm: 160, consumptionCityKmL: 14, consumptionHighwayKmL: 18, lengthMm: 4500, widthMm: 1800, heightMm: 1450, weightKg: 1300, trunkLiters: 450, equipmentItems: [] },
    ]);
    fixture.detectChanges();
    const equipV1 = fixture.nativeElement.querySelector('[data-testid="spec-group-v1-Equipamiento"]');
    expect(equipV1).not.toBeNull();
    const rows = equipV1?.querySelectorAll('[data-testid^="spec-row-v1-Equipamiento-"]') ?? [];
    expect(rows.length).toBe(2);
    const equipV2 = fixture.nativeElement.querySelector('[data-testid="spec-group-v2-Equipamiento"]');
    expect(equipV2).toBeNull();
  });
});

@Component({
  selector: 'app-meta-root',
  imports: [RouterOutlet],
  template: '<router-outlet />',
})
class MetaRootComponent {}

/**
 * Metadata para compartir. Lo que se demuestra acá es el **orden**, y por eso
 * todo pasa por el router de verdad: se registra la ruta de la ficha —que a
 * propósito no declara `data.meta`, igual que en `app.routes.ts`—, se llama
 * `applyRouteDefaults()` y se entra navegando. Primero llega el default
 * genérico del sitio por el `NavigationEnd` real; recién cuando resuelve el
 * HTTP el `effect()` de la ficha lo sobreescribe. Si el orden fuera el
 * inverso, compartir una ficha mandaría el título genérico.
 */
describe('ModelComponent — metadata para compartir', () => {
  let http: HttpTestingController;

  afterEach(() => {
    for (const req of http.match(() => true)) {
      req.flush({ data: [] });
    }
  });

  it('el default de la ruta llega primero y el modelo cargado lo sobreescribe', async () => {
    TestBed.resetTestingModule();
    for (const el of Array.from(
      document.head.querySelectorAll(
        'link[rel="canonical"], meta[name="description"], meta[property="og:image"]',
      ),
    )) {
      el.remove();
    }
    document.title = '(sin metadata)';

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          {
            // Sin `data.meta`, igual que la ruta real: la metadata la pone el
            // componente cuando llegan los datos.
            path: 'brand/:brandSlug/model/:modelSlug',
            component: ModelComponent,
          },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(PageMetaService).applyRouteDefaults();

    const fixture = TestBed.createComponent(MetaRootComponent);
    fixture.detectChanges();
    await TestBed.inject(Router).navigateByUrl('/brand/great-wall/model/poer');
    fixture.detectChanges();

    // Ninguna ruta de la cadena declara meta, así que mientras carga se
    // anuncia el default genérico del sitio.
    expect(document.title).toBe(SITE_DEFAULT_META.title);

    http
      .expectOne((r) =>
        r.url.includes('/api/v1/models/by-slug/great-wall/poer'),
      )
      .flush({
        data: {
          id: 'm1',
          name: 'Poer',
          segment: 'PICKUP',
          brandId: 'b1',
          brandName: 'Great Wall',
          brand: { name: 'Great Wall' },
          galleryUrls: ['https://cdn.example.cl/poer-frontal.png'],
          versions: [
            { id: 'v1', name: 'Cabina doble 4x2', priceClp: 21990000, year: 2026 },
            { id: 'v2', name: 'Cabina doble 4x4', priceClp: 24990000, year: 2026 },
          ],
        },
        error: null,
      });
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();

    expect(document.title).toBe(
      'Great Wall Poer — ficha técnica y precios en Chile',
    );
    expect(
      document.head
        .querySelector('meta[name="description"]')
        ?.getAttribute('content'),
    ).toBe(
      'Ficha técnica del Great Wall Poer: 2 versiones, precios desde $21.990.000, equipamiento y costo anual estimado.',
    );
    // `slugify`, no `toLowerCase()`: "Great Wall" tiene que quedar great-wall.
    expect(
      document.head
        .querySelector('link[rel="canonical"]')
        ?.getAttribute('href'),
    ).toBe('https://cualautocompro.cl/brand/great-wall/model/poer');
    expect(
      document.head
        .querySelector('meta[property="og:image"]')
        ?.getAttribute('content'),
    ).toBe('https://cdn.example.cl/poer-frontal.png');
  });
});

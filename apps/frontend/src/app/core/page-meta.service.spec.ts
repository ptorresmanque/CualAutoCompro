import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { PageMetaService, SITE_DEFAULT_META } from './page-meta.service';

const SITE = 'https://cualautocompro.cl';

@Component({ selector: 'app-blank', template: '' })
class BlankComponent {}

/** Todos los tags que administra el servicio, para poder limpiarlos entre tests. */
const MANAGED_SELECTORS = [
  'meta[name="description"]',
  'meta[name="robots"]',
  'meta[name="twitter:card"]',
  'meta[name="twitter:title"]',
  'meta[name="twitter:description"]',
  'meta[name="twitter:image"]',
  'meta[property="og:title"]',
  'meta[property="og:description"]',
  'meta[property="og:image"]',
  'meta[property="og:url"]',
  'meta[property="og:type"]',
  'meta[property="og:site_name"]',
  'meta[property="og:locale"]',
  'link[rel="canonical"]',
];

function cleanHead(): void {
  for (const selector of MANAGED_SELECTORS) {
    for (const el of Array.from(document.head.querySelectorAll(selector))) {
      el.remove();
    }
  }
}

function content(selector: string): string | null {
  return (
    document.head
      .querySelector<HTMLMetaElement>(selector)
      ?.getAttribute('content') ?? null
  );
}

function canonical(): string | null {
  return (
    document.head
      .querySelector<HTMLLinkElement>('link[rel="canonical"]')
      ?.getAttribute('href') ?? null
  );
}

function count(selector: string): number {
  return document.head.querySelectorAll(selector).length;
}

describe('PageMetaService', () => {
  let service: PageMetaService;

  beforeEach(() => {
    TestBed.resetTestingModule();
    cleanHead();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: '', component: BlankComponent },
          {
            path: 'catalogo',
            component: BlankComponent,
            data: {
              meta: {
                title: 'Catálogo de autos nuevos en Chile — cualautocompro',
                description: 'Busca entre los autos nuevos disponibles en Chile.',
              },
            },
          },
          {
            path: 'favoritos',
            component: BlankComponent,
            data: {
              meta: {
                title: 'Tus favoritos — cualautocompro',
                description: 'Los autos que guardaste para revisar después.',
                noindex: true,
              },
            },
          },
          {
            path: 'admin',
            component: BlankComponent,
            data: {
              meta: {
                title: 'Administración — cualautocompro',
                description: 'Panel interno.',
                noindex: true,
              },
            },
            children: [{ path: 'brands', component: BlankComponent }],
          },
          { path: 'brand/:brandSlug/model/:modelSlug', component: BlankComponent },
        ]),
      ],
    });
    service = TestBed.inject(PageMetaService);
  });

  afterEach(() => {
    cleanHead();
  });

  it('escribe title, description, og:*, twitter:* y el canonical', () => {
    service.set({
      title: 'Catálogo de autos nuevos en Chile — cualautocompro',
      description: 'Busca entre los autos nuevos disponibles en Chile.',
      path: '/catalogo',
    });

    expect(document.title).toBe(
      'Catálogo de autos nuevos en Chile — cualautocompro',
    );
    expect(content('meta[name="description"]')).toBe(
      'Busca entre los autos nuevos disponibles en Chile.',
    );

    expect(content('meta[property="og:title"]')).toBe(
      'Catálogo de autos nuevos en Chile — cualautocompro',
    );
    expect(content('meta[property="og:description"]')).toBe(
      'Busca entre los autos nuevos disponibles en Chile.',
    );
    expect(content('meta[property="og:url"]')).toBe(`${SITE}/catalogo`);
    expect(content('meta[property="og:image"]')).toBe(
      `${SITE}/android-chrome-512x512.png`,
    );
    expect(content('meta[property="og:type"]')).toBe('website');
    expect(content('meta[property="og:site_name"]')).toBe('cualautocompro');
    expect(content('meta[property="og:locale"]')).toBe('es_CL');

    expect(content('meta[name="twitter:card"]')).toBe('summary_large_image');
    expect(content('meta[name="twitter:title"]')).toBe(
      'Catálogo de autos nuevos en Chile — cualautocompro',
    );
    expect(content('meta[name="twitter:description"]')).toBe(
      'Busca entre los autos nuevos disponibles en Chile.',
    );
    expect(content('meta[name="twitter:image"]')).toBe(
      `${SITE}/android-chrome-512x512.png`,
    );

    expect(canonical()).toBe(`${SITE}/catalogo`);
  });

  it('llamar set() dos veces no duplica tags ni deja dos canonical', () => {
    service.set({ title: 'Uno', description: 'Primera', path: '/uno' });
    service.set({ title: 'Dos', description: 'Segunda', path: '/dos' });

    expect(count('link[rel="canonical"]')).toBe(1);
    expect(count('meta[name="description"]')).toBe(1);
    expect(count('meta[property="og:title"]')).toBe(1);
    expect(count('meta[property="og:url"]')).toBe(1);
    expect(count('meta[name="twitter:image"]')).toBe(1);

    // Y el que queda es el de la última llamada, no el primero.
    expect(document.title).toBe('Dos');
    expect(content('meta[property="og:title"]')).toBe('Dos');
    expect(canonical()).toBe(`${SITE}/dos`);
  });

  it('noindex agrega robots y la llamada siguiente sin noindex lo quita', () => {
    service.set({
      title: 'Tus favoritos — cualautocompro',
      description: 'Los autos que guardaste.',
      path: '/favoritos',
      noindex: true,
    });
    expect(content('meta[name="robots"]')).toBe('noindex, nofollow');

    // Navegar de /favoritos a /catalogo no debe dejar el catálogo desindexado.
    service.set({
      title: 'Catálogo — cualautocompro',
      description: 'Autos nuevos.',
      path: '/catalogo',
    });
    expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
  });

  it('resuelve la image relativa contra el sitio y respeta la absoluta', () => {
    service.set({
      title: 'Relativa',
      description: 'x',
      path: '/a',
      image: '/uploads/2026-07/corolla.png',
    });
    expect(content('meta[property="og:image"]')).toBe(
      `${SITE}/uploads/2026-07/corolla.png`,
    );
    expect(content('meta[name="twitter:image"]')).toBe(
      `${SITE}/uploads/2026-07/corolla.png`,
    );

    service.set({
      title: 'Absoluta',
      description: 'x',
      path: '/a',
      image: 'https://api.cualautocompro.cl/uploads/2026-07/corolla.png',
    });
    expect(content('meta[property="og:image"]')).toBe(
      'https://api.cualautocompro.cl/uploads/2026-07/corolla.png',
    );
  });

  it('el path por defecto es la URL actual sin query string', async () => {
    const router = TestBed.inject(Router);
    await router.navigateByUrl('/catalogo?segment=SUV&maxPrice=20000000');

    service.set({ title: 'Catálogo', description: 'x' });

    expect(canonical()).toBe(`${SITE}/catalogo`);
    expect(content('meta[property="og:url"]')).toBe(`${SITE}/catalogo`);
  });

  describe('applyRouteDefaults()', () => {
    it('aplica el meta declarado en la ruta al navegar', async () => {
      service.applyRouteDefaults();
      const router = TestBed.inject(Router);

      await router.navigateByUrl('/catalogo');
      expect(document.title).toBe(
        'Catálogo de autos nuevos en Chile — cualautocompro',
      );
      expect(canonical()).toBe(`${SITE}/catalogo`);
      expect(document.head.querySelector('meta[name="robots"]')).toBeNull();

      await router.navigateByUrl('/favoritos');
      expect(document.title).toBe('Tus favoritos — cualautocompro');
      expect(content('meta[name="robots"]')).toBe('noindex, nofollow');

      // El robots de /favoritos no se arrastra a la ruta siguiente.
      await router.navigateByUrl('/catalogo');
      expect(document.head.querySelector('meta[name="robots"]')).toBeNull();
    });

    it('una hija sin meta hereda el de la ruta padre', async () => {
      service.applyRouteDefaults();
      const router = TestBed.inject(Router);

      await router.navigateByUrl('/admin/brands');
      expect(document.title).toBe('Administración — cualautocompro');
      expect(content('meta[name="robots"]')).toBe('noindex, nofollow');
    });

    it('cae al default del sitio cuando ninguna ruta declara meta', async () => {
      service.applyRouteDefaults();
      const router = TestBed.inject(Router);

      await router.navigateByUrl('/brand/toyota/model/corolla');
      expect(document.title).toBe(SITE_DEFAULT_META.title);
      expect(content('meta[name="description"]')).toBe(
        SITE_DEFAULT_META.description,
      );
      expect(canonical()).toBe(`${SITE}/brand/toyota/model/corolla`);
    });
  });
});

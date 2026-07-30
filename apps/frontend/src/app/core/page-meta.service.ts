import { DestroyRef, DOCUMENT, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Meta, Title } from '@angular/platform-browser';
import {
  ActivatedRouteSnapshot,
  NavigationEnd,
  Router,
} from '@angular/router';
import { filter } from 'rxjs';
import { ENV } from './env';

/**
 * Metadata de una página: lo que se ve en la pestaña del navegador, en el
 * resultado de Google y en la tarjeta que arma WhatsApp cuando alguien pega el
 * link.
 */
export interface PageMeta {
  /** El `<title>` completo, tal cual va a mostrarse. */
  title: string;
  description: string;
  /** URL absoluta o path relativo al sitio. */
  image?: string;
  /** Path canónico; por defecto, la URL actual sin query string. */
  path?: string;
  noindex?: boolean;
}

/** Imagen por defecto para las previsualizaciones (la del favicon grande). */
const DEFAULT_IMAGE_PATH = '/android-chrome-512x512.png';

/**
 * Default genérico del sitio. Se aplica cuando ninguna ruta de la cadena
 * activada declara `data.meta`, para que nunca quede el título de la pantalla
 * anterior colgado.
 */
export const SITE_DEFAULT_META: PageMeta = {
  title: 'cualautocompro — compara autos nuevos en Chile',
  description:
    'Explora el catálogo de autos nuevos en Chile, filtra por lo que necesitas y compara modelos de distintas marcas antes de decidir.',
};

/**
 * Único punto que escribe `<title>`, `<meta>` y `<link rel="canonical">`.
 *
 * La app es una SPA sin SSR: los crawlers modernos ejecutan JS, así que estos
 * tags dinámicos sirven para compartir links. El SSR queda para más adelante.
 */
@Injectable({ providedIn: 'root' })
export class PageMetaService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);

  readonly siteUrl = ENV.siteUrl;

  /** Para que `applyRouteDefaults()` sea idempotente si se llama dos veces. */
  private routeDefaultsWired = false;

  /**
   * Escribe toda la metadata de una vez.
   *
   * Siempre usa `updateTag` (nunca `addTag`) y reutiliza el `<link
   * rel="canonical">` existente: llamar `set()` en cada navegación no debe
   * dejar el `<head>` lleno de duplicados.
   */
  set(meta: PageMeta): void {
    const path = this.normalizePath(
      meta.path ?? this.router.url.split('?')[0],
    );
    const url = `${this.siteUrl}${path}`;
    const image = this.absoluteUrl(meta.image) ?? `${this.siteUrl}${DEFAULT_IMAGE_PATH}`;

    this.title.setTitle(meta.title);

    this.meta.updateTag({ name: 'description', content: meta.description });

    this.meta.updateTag({ property: 'og:title', content: meta.title });
    this.meta.updateTag({
      property: 'og:description',
      content: meta.description,
    });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({ property: 'og:site_name', content: 'cualautocompro' });
    this.meta.updateTag({ property: 'og:locale', content: 'es_CL' });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: meta.title });
    this.meta.updateTag({
      name: 'twitter:description',
      content: meta.description,
    });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setCanonical(url);

    // El `robots` se limpia cuando la página nueva no lo pide. Sin esto,
    // navegar de /favoritos (noindex) a /catalogo dejaba el catálogo
    // desindexado hasta el próximo full reload.
    if (meta.noindex) {
      this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    } else {
      this.meta.removeTag('name="robots"');
    }
  }

  /**
   * Aplica en cada `NavigationEnd` el `data.meta` de la ruta activada más
   * profunda que lo declare (así `admin` lo hereda a sus hijas).
   *
   * Se llama una sola vez desde el componente raíz `App`, no desde
   * `app.config.ts`: en un `provideAppInitializer` el router todavía no navegó.
   */
  applyRouteDefaults(): void {
    if (this.routeDefaultsWired) return;
    this.routeDefaultsWired = true;

    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.set(this.routeMeta() ?? SITE_DEFAULT_META);
      });
  }

  /** El `data.meta` declarado más abajo en la cadena de rutas activadas. */
  private routeMeta(): PageMeta | null {
    let node: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    let found: PageMeta | null = null;
    while (node) {
      const declared = node.data['meta'] as PageMeta | undefined;
      if (declared) found = declared;
      node = node.firstChild;
    }
    return found;
  }

  /** Path canónico normalizado: siempre con `/` inicial y sin query. */
  private normalizePath(path: string): string {
    const clean = path.split('?')[0].split('#')[0];
    if (!clean) return '/';
    return clean.startsWith('/') ? clean : `/${clean}`;
  }

  /** `undefined` si no hay imagen; absoluta tal cual; relativa contra el sitio. */
  private absoluteUrl(image: string | undefined): string | undefined {
    if (!image) return undefined;
    if (/^https?:\/\//i.test(image)) return image;
    return `${this.siteUrl}${image.startsWith('/') ? '' : '/'}${image}`;
  }

  /**
   * Reutiliza el `<link rel="canonical">` si ya está en el `<head>`; solo lo
   * crea la primera vez.
   */
  private setCanonical(url: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'canonical');
      head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}

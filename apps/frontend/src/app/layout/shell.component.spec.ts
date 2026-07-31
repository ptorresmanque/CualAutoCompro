import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { ShellComponent } from './shell.component';
import { AuthService, type User } from '../core/auth.service';
import { CompareStore } from '../core/compare-store.service';
import { PopularityService } from '../core/popularity.service';
import { appConfig } from '../app.config';

class AuthServiceStub {
  currentUser = signal<User | null>(null);
  logout = async () => {};
}

class CompareStoreStub {
  ids = () => [] as string[];
}

/** Mismo criterio que usa el navegador para armar el orden de tabulación. */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]),' +
  ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function createShell() {
  TestBed.resetTestingModule();
  TestBed.configureTestingModule({
    imports: [ShellComponent],
    providers: [
      provideRouter([]),
      provideNoopAnimations(),
      { provide: AuthService, useClass: AuthServiceStub },
      { provide: CompareStore, useClass: CompareStoreStub },
    ],
  });
  const fixture = TestBed.createComponent(ShellComponent);
  fixture.detectChanges();
  return fixture;
}

describe('ShellComponent — skip link', () => {
  it('expone un skip link que apunta a #main y es el primer elemento enfocable', () => {
    const host = createShell().nativeElement as HTMLElement;

    const skip = host.querySelector<HTMLAnchorElement>('.skip-link');
    expect(skip).not.toBeNull();
    expect(skip!.textContent?.trim()).toBe('Saltar al contenido');
    expect(skip!.getAttribute('href')).toBe('#main');

    const focusables = Array.from(host.querySelectorAll<HTMLElement>(FOCUSABLE));
    expect(focusables[0]).toBe(skip);
  });

  // Que el skip link siga siendo enfocable (o sea, que nadie lo esconda con
  // `display: none` ni `visibility: hidden`) NO se puede afirmar acá: el
  // TestBed no carga `styles.css`, así que `getComputedStyle` devuelve siempre
  // los defaults y la aserción pasaría hiciera lo que hiciera el CSS. Ese
  // requisito vive en `e2e/tests/skip-link.spec.ts`, donde el CSS sí se aplica.

  it('el <main> tiene id="main" y tabindex="-1" para recibir el foco', () => {
    const host = createShell().nativeElement as HTMLElement;

    const main = host.querySelector<HTMLElement>('main');
    expect(main).not.toBeNull();
    expect(main!.id).toBe('main');
    expect(main!.getAttribute('tabindex')).toBe('-1');
  });

  it('al activarlo mueve el foco al <main> y cancela la navegación del navegador', () => {
    const fixture = createShell();
    const host = fixture.nativeElement as HTMLElement;
    // El foco solo se mueve de verdad si el elemento está en el documento.
    document.body.appendChild(host);

    const main = host.querySelector<HTMLElement>('main')!;
    const skip = host.querySelector<HTMLAnchorElement>('.skip-link')!;

    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    skip.dispatchEvent(event);

    // Sin `preventDefault` el navegador resolvería `#main` contra el
    // `<base href="/">` y se iría a la home en vez de saltar al contenido.
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(main);

    host.remove();
  });
});

/**
 * El token que `withInMemoryScrolling` usa para registrar el scroller no es
 * público (`ROUTER_CONFIGURATION` NO lleva estas opciones: viajan en el
 * closure del feature). Lo recuperamos por identidad llamando al mismo
 * factory público, sin depender de strings internos de Angular.
 */
function routerScrollerToken(): unknown {
  const feature = withInMemoryScrolling({}) as unknown as {
    ɵproviders: { provide: unknown }[];
  };
  return feature.ɵproviders[0].provide;
}

describe('appConfig — restauración de scroll', () => {
  it('configura el router con scrollPositionRestoration y anchorScrolling en "enabled"', () => {
    // `appConfig` es la config de arranque real: instanciar su injector corre
    // los `provideAppInitializer`, y con `provideHttpClient(withFetch())` de
    // verdad eso significa GET /auth/me y GET /popular/models contra el backend
    // local, con promesas vivas después del teardown. Los dos servicios se
    // tragan el error, así que nunca se ponía rojo. El spy deja el hecho a la
    // vista en vez de confiar en que los stubs alcanzan.
    const fetchSpy = vi.fn();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy as unknown as typeof globalThis.fetch;

    try {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ...appConfig.providers,
          // Van después para ganarle al `providedIn: 'root'` de cada servicio.
          { provide: AuthService, useValue: { bootstrap: async () => {} } },
          { provide: PopularityService, useValue: { refresh: async () => {} } },
        ],
      });

      const scroller = TestBed.inject(routerScrollerToken() as never) as unknown as {
        options: { scrollPositionRestoration?: string; anchorScrolling?: string };
      };

      expect(scroller).toBeTruthy();
      expect(scroller.options.scrollPositionRestoration).toBe('enabled');
      expect(scroller.options.anchorScrolling).toBe('enabled');
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});

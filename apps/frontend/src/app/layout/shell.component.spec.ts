import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { ShellComponent } from './shell.component';
import { AuthService, type User } from '../core/auth.service';
import { CompareStore } from '../core/compare-store.service';
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

  it('no oculta el skip link con display/visibility (lo sacaría del tab order)', () => {
    const host = createShell().nativeElement as HTMLElement;
    const skip = host.querySelector<HTMLElement>('.skip-link')!;

    // `styles.css` no se carga en el TestBed, así que el chequeo va sobre los
    // estilos inline del elemento: nadie debe apagarlo desde el template.
    expect(skip.style.display).not.toBe('none');
    expect(skip.style.visibility).not.toBe('hidden');
    expect(skip.hasAttribute('hidden')).toBe(false);
  });

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
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [...appConfig.providers] });

    const scroller = TestBed.inject(
      routerScrollerToken() as never,
    ) as unknown as { options: { scrollPositionRestoration?: string; anchorScrolling?: string } };

    expect(scroller).toBeTruthy();
    expect(scroller.options.scrollPositionRestoration).toBe('enabled');
    expect(scroller.options.anchorScrolling).toBe('enabled');
  });
});

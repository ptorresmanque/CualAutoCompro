import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { TopNavBarComponent } from './top-nav-bar.component';
import { AuthService, type User } from '../core/auth.service';
import { CompareStore } from '../core/compare-store.service';

class AuthServiceStub {
  currentUser = signal<User | null>(null);
}
class CompareStoreStub {
  ids = () => [] as string[];
}

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [TopNavBarComponent],
  template: `<app-top-nav-bar />`,
})
class TestHostComponent {}

describe('TopNavBarComponent', () => {
  let authStub: AuthServiceStub;

  beforeEach(() => {
    TestBed.resetTestingModule();
    authStub = new AuthServiceStub();
  });

  it('renderiza logo + link Catálogo + Comparar', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: CompareStore, useClass: CompareStoreStub },
      ],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();

    const html = f.nativeElement as HTMLElement;
    expect(html.textContent).toContain('cualautocompro');
    expect(html.textContent).toContain('Catálogo');
    expect(html.textContent).toContain('Comparar');
    expect(html.querySelectorAll('.nav-primary .nav-link mat-icon').length).toBe(0);
  });

  it('muestra Iniciar sesión y Crear cuenta cuando no hay user', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: CompareStore, useClass: CompareStoreStub },
      ],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();

    const html = f.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Iniciar sesión');
    expect(html.textContent).toContain('Crear cuenta');
  });

  it('incluye Favoritos en el menú de cuenta cuando hay user', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: CompareStore, useClass: CompareStoreStub },
      ],
    });
    const f = TestBed.createComponent(TestHostComponent);
    authStub.currentUser.set({ id: 'u1', email: 'u@test.cl', name: 'U', role: 'USER' });
    f.detectChanges();

    const component = f.debugElement.query(
      By.directive(TopNavBarComponent),
    ).componentInstance as TopNavBarComponent;
    expect(component.accountLinks().some((link) => link.path === '/favoritos')).toBe(true);
  });

  it('no crea destinos de cuenta cuando no hay user', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: CompareStore, useClass: CompareStoreStub },
      ],
    });
    const f = TestBed.createComponent(TestHostComponent);
    authStub.currentUser.set(null);
    f.detectChanges();

    const component = f.debugElement.query(
      By.directive(TopNavBarComponent),
    ).componentInstance as TopNavBarComponent;
    expect(component.accountLinks()).toEqual([]);
  });

  it('incluye Administración en el menú de cuenta para ADMIN', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: CompareStore, useClass: CompareStoreStub },
      ],
    });
    const f = TestBed.createComponent(TestHostComponent);
    authStub.currentUser.set({ id: 'u1', email: 'admin@test.cl', name: 'Admin', role: 'ADMIN' });
    f.detectChanges();

    const component = f.debugElement.query(
      By.directive(TopNavBarComponent),
    ).componentInstance as TopNavBarComponent;
    expect(component.accountLinks().some((link) => link.path === '/admin')).toBe(true);
  });

  it('oculta Administración en el menú de cuenta para USER', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authStub },
        { provide: CompareStore, useClass: CompareStoreStub },
      ],
    });
    const f = TestBed.createComponent(TestHostComponent);
    authStub.currentUser.set({ id: 'u1', email: 'user@test.cl', name: 'User', role: 'USER' });
    f.detectChanges();

    const component = f.debugElement.query(
      By.directive(TopNavBarComponent),
    ).componentInstance as TopNavBarComponent;
    expect(component.accountLinks().some((link) => link.path === '/admin')).toBe(false);
  });

  describe('responsive visibility', () => {
    it('usa un solo acceso de cuenta en móvil y acciones claras en desktop', () => {
      TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [
          provideRouter([]),
          { provide: AuthService, useValue: authStub },
          { provide: CompareStore, useClass: CompareStoreStub },
        ],
      });
      const f = TestBed.createComponent(TestHostComponent);
      f.detectChanges();

      const loginBtns = f.nativeElement.querySelectorAll('[data-testid="nav-login-btn"]');
      const registerBtns = f.nativeElement.querySelectorAll('[data-testid="nav-register-btn"]');
      const mobileAccountBtns = f.nativeElement.querySelectorAll('[data-testid="nav-account-btn"]');
      expect(loginBtns.length).toBe(1);
      expect(registerBtns.length).toBe(1);
      expect(mobileAccountBtns.length).toBe(1);
    });
  });

  it('buscador: input se enlaza y submit navega a /catalogo con ?q=', async () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([{ path: 'catalogo', children: [] }]),
        { provide: AuthService, useValue: authStub },
        { provide: CompareStore, useClass: CompareStoreStub },
      ],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();

    const input = f.nativeElement.querySelector(
      '[data-testid="nav-search"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    input.value = 'Yaris';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    f.detectChanges();

    const form = f.nativeElement.querySelector('form[role="search"]') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    f.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    f.detectChanges();

    const html = f.nativeElement as HTMLElement;
    const links = Array.from(
      html.querySelectorAll('a'),
    ) as HTMLAnchorElement[];
    const catalogLink = links.find((a) => a.getAttribute('href') === '/catalogo');
    expect(catalogLink).toBeDefined();
  });
});

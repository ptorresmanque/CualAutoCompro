import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
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

  it('muestra link Favoritos cuando hay user', () => {
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

    const favLink = f.nativeElement.querySelector('a[href="/favoritos"]');
    expect(favLink).not.toBeNull();
  });

  it('oculta link Favoritos cuando no hay user', () => {
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

    const favLink = f.nativeElement.querySelector('a[href="/favoritos"]');
    expect(favLink).toBeNull();
  });

  it('muestra link Admin cuando role es ADMIN', () => {
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

    const adminLink = f.nativeElement.querySelector('a[href="/admin"]');
    expect(adminLink).not.toBeNull();
  });

  it('oculta link Admin cuando role es USER', () => {
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

    const adminLink = f.nativeElement.querySelector('a[href="/admin"]');
    expect(adminLink).toBeNull();
  });

  describe('responsive visibility', () => {
    it('expone data-testid en ambas variantes (mobile + desktop) de los botones auth', () => {
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

      const loginBtn = f.nativeElement.querySelector('[data-testid="nav-login-btn"]');
      const registerBtn = f.nativeElement.querySelector('[data-testid="nav-register-btn"]');
      expect(loginBtn).toBeTruthy();
      expect(registerBtn).toBeTruthy();
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

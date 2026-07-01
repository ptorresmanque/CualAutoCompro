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
    authStub.currentUser.set({ id: 'u1', email: 'u@test.cl', name: 'U' });
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
});

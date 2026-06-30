import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TopNavBarComponent } from './top-nav-bar.component';

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [TopNavBarComponent],
  template: `<app-top-nav-bar />`,
})
class TestHostComponent {}

describe('TopNavBarComponent', () => {
  it('renderiza logo + link Catálogo + Comparar', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
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
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.detectChanges();

    const html = f.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Iniciar sesión');
    expect(html.textContent).toContain('Crear cuenta');
  });
});

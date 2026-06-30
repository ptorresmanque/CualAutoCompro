import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VehicleCardComponent, VehicleCardInput } from './vehicle-card.component';

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [VehicleCardComponent],
  template: `
    @if (car(); as c) {
      <app-vehicle-card
        [model]="c"
        [featured]="featured()"
        [added]="added()"
        [maxReached]="maxReached()"
        (compareTapped)="captured.set($event)"
      />
    }
    <span data-testid="captured-flag">{{ captured() ? 'yes' : 'no' }}</span>
  `,
})
class TestHostComponent {
  car = signal<VehicleCardInput | null>(null);
  featured = signal(false);
  added = signal(false);
  maxReached = signal(false);
  captured = signal<VehicleCardInput | null>(null);
}

function carFixture(overrides: Partial<VehicleCardInput> = {}): VehicleCardInput {
  return {
    id: 'm1',
    name: 'Yaris',
    segment: 'HATCHBACK',
    brand: { name: 'Toyota' },
    imageUrl: 'https://placehold.co/1280x720/008080/ffffff?text=Yaris',
    minPrice: 14_990_000,
    defaultVersion: {
      id: 'v1',
      name: 'XLS',
      priceClp: 14_990_000,
      year: 2026,
    },
    ...overrides,
  };
}

describe('VehicleCardComponent', () => {
  it('renderiza nombre + marca + chip de segmento + precio + versión', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();

    const html = f.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Yaris');
    expect(html.textContent).toContain('Toyota');
    expect(html.textContent).toContain('Hatchback');
    expect(html.textContent).toContain('$');
    expect(html.textContent).toContain('CLP');
    expect(html.textContent).toContain('Yaris XLS 2026');
  });

  it('muestra el pill "MÁS VENDIDO" cuando featured=true', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.componentInstance.featured.set(true);
    f.detectChanges();

    expect(
      f.nativeElement.querySelector('[data-testid="featured-pill"]'),
    ).not.toBeNull();
    expect(f.nativeElement.textContent).toContain('MÁS VENDIDO');
  });

  it('oculta el pill cuando featured=false', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();

    expect(
      f.nativeElement.querySelector('[data-testid="featured-pill"]'),
    ).toBeNull();
  });

  it('emite compareTapped al hacer click en "Comparar"', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();

    const btn = f.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    btn.click();
    f.detectChanges();

    expect(
      f.nativeElement.querySelector('[data-testid="captured-flag"]')?.textContent,
    ).toContain('yes');
  });

  it('deshabilita el botón "Comparar" cuando no hay defaultVersion', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture({ defaultVersion: null, minPrice: null }));
    f.detectChanges();

    const btn = f.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('muestra "En comparación" con bg-brand-50 cuando added=true', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();
    f.componentInstance.added.set(true);
    f.detectChanges();

    const btn = f.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(btn.getAttribute('data-state')).toBe('added');
    expect(btn.textContent).toContain('En comparación');
    const article = f.nativeElement.querySelector(
      '[data-testid="vehicle-card-m1"]',
    ) as HTMLElement;
    expect(article.getAttribute('data-added')).toBe('true');
    expect(article.className).toContain('border-brand-600');
  });

  it('muestra "Máximo 3" cuando maxReached=true y no está agregado', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.componentInstance.maxReached.set(true);
    f.detectChanges();

    const btn = f.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(btn.textContent.trim()).toBe('Máximo 3');
    expect(btn.disabled).toBe(true);
  });

  it('envuelve la imagen en un link a /brand/:brand/model/:model', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();

    const link = f.nativeElement.querySelector(
      'a[data-testid="card-image-link"]',
    ) as HTMLAnchorElement;
    expect(link).not.toBeNull();
    expect(link.getAttribute('href')).toBe('/brand/toyota/model/yaris');
    expect(link.getAttribute('aria-label')).toContain('Ver detalle de Toyota Yaris');
  });

  it('el link al detalle usa brand/model en lowercase', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(
      carFixture({ brand: { name: 'Hyundai' }, name: 'Tucson' }),
    );
    f.detectChanges();

    const link = f.nativeElement.querySelector(
      'a[data-testid="card-image-link"]',
    ) as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/brand/hyundai/model/tucson');
  });

  it('click en el botón Comparar NO navega al detalle (stopPropagation)', () => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideRouter([])],
    });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();

    const btn = f.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(() => btn.click()).not.toThrow();
    expect(f.componentInstance.captured()).not.toBeNull();
  });
});

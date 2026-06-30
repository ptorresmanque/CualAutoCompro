import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { VehicleCardComponent, VehicleCardInput } from './vehicle-card.component';

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [VehicleCardComponent],
  template: `
    @if (car(); as c) {
      <app-vehicle-card [model]="c" [featured]="featured()" (compareTapped)="captured.set($event)" />
    }
    <span data-testid="captured-flag">{{ captured() ? 'yes' : 'no' }}</span>
  `,
})
class TestHostComponent {
  car = signal<VehicleCardInput | null>(null);
  featured = signal(false);
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
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
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
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
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
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();

    expect(
      f.nativeElement.querySelector('[data-testid="featured-pill"]'),
    ).toBeNull();
  });

  it('emite compareTapped al hacer click en "Comparar"', () => {
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
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
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture({ defaultVersion: null, minPrice: null }));
    f.detectChanges();

    const btn = f.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });
});

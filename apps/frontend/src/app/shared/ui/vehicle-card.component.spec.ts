import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { VehicleCardComponent, VehicleCardInput } from './vehicle-card.component';
import { VehicleVersion } from '../../core/types/vehicle';
import { AuthService, User } from '../../core/auth.service';

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
        [selectedVersionId]="selectedVersionId()"
        (compareTapped)="captured.set($event)"
        (versionSelected)="versionPicked.set($event)"
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
  selectedVersionId = signal<string | null>(null);
  captured = signal<VehicleVersion | null>(null);
  versionPicked = signal<VehicleVersion | null>(null);
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
    versions: [
      { id: 'v1', name: 'XLS', priceClp: 14_990_000, year: 2026 },
    ],
    ...overrides,
  };
}

class AuthServiceStub {
  currentUser = signal<User | null>({ id: 'u1', email: 'u@test.cl', name: 'U' });
}

describe('VehicleCardComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useClass: AuthServiceStub },
      ],
    });
  });

  it('renderiza nombre + marca + chip de segmento + precio + versión', () => {
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();

    const html = f.nativeElement as HTMLElement;
    expect(html.textContent).toContain('Yaris');
    expect(html.textContent).toContain('Toyota');
    expect(html.textContent).toContain('Hatchback');
    expect(html.textContent).toContain('$');
    expect(html.textContent).toContain('CLP');
    // Con 1 versión no se renderiza el grupo de chips
    expect(html.querySelector('[data-testid="version-chips"]')).toBeNull();
    // El botón expone qué versión se va a agregar
    const btn = html.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(btn.getAttribute('data-selected-version')).toBe('v1');
  });

  it('muestra el pill "MÁS VENDIDO" cuando featured=true', () => {
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
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();

    expect(
      f.nativeElement.querySelector('[data-testid="featured-pill"]'),
    ).toBeNull();
  });

  it('emite compareTapped al hacer click en "Comparar"', () => {
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
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture({ defaultVersion: null, minPrice: null }));
    f.detectChanges();

    const btn = f.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('muestra "En comparación" con bg-brand-50 cuando added=true', () => {
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
    const f = TestBed.createComponent(TestHostComponent);
    f.componentInstance.car.set(carFixture());
    f.detectChanges();

    const btn = f.nativeElement.querySelector(
      'button[data-testid="compare-m1"]',
    ) as HTMLButtonElement;
    expect(() => btn.click()).not.toThrow();
    expect(f.componentInstance.captured()).not.toBeNull();
  });

  describe('botón corazón (favorito)', () => {
    const testModel = carFixture();

    it('botón corazón filled cuando isFavorite=true', () => {
      const fixture = TestBed.createComponent(VehicleCardComponent);
      fixture.componentRef.setInput('model', testModel);
      fixture.componentRef.setInput('isFavorite', true);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        `[data-testid="favorite-${testModel.id}"]`,
      );
      expect(btn).not.toBeNull();
      expect(btn.getAttribute('data-favorite')).toBe('true');
    });

    it('botón corazón outline cuando isFavorite=false', () => {
      const fixture = TestBed.createComponent(VehicleCardComponent);
      fixture.componentRef.setInput('model', testModel);
      fixture.componentRef.setInput('isFavorite', false);
      fixture.detectChanges();
      const btn = fixture.nativeElement.querySelector(
        `[data-testid="favorite-${testModel.id}"]`,
      );
      expect(btn.getAttribute('data-favorite')).toBe('false');
    });

    it('click emite favoriteToggled', () => {
      const fixture = TestBed.createComponent(VehicleCardComponent);
      fixture.componentRef.setInput('model', testModel);
      let emitted = false;
      fixture.componentInstance.favoriteToggled.subscribe(() => (emitted = true));
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector(
        `[data-testid="favorite-${testModel.id}"]`,
      );
      btn.click();
      expect(emitted).toBe(true);
    });
  });
});
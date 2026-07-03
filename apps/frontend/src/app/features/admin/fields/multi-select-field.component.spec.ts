import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MultiSelectFieldComponent } from './multi-select-field.component';

interface EqFixture { fixture: ComponentFixture<MultiSelectFieldComponent>; ctrl: FormControl<string[] | null>; http: HttpTestingController; }

describe('MultiSelectFieldComponent', () => {
  function setup(initial: string[] | null = null): EqFixture {
    TestBed.configureTestingModule({
      imports: [MultiSelectFieldComponent, ReactiveFormsModule],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const fixture = TestBed.createComponent(MultiSelectFieldComponent);
    const ctrl = new FormControl<string[] | null>(initial);
    fixture.componentRef.setInput('control', ctrl);
    fixture.componentRef.setInput('optionsApi', '/admin/equipment');
    fixture.componentRef.setInput('optionLabel', 'name');
    fixture.detectChanges();
    return { fixture, ctrl, http: TestBed.inject(HttpTestingController) };
  }

  async function settle(http: HttpTestingController, fixture: ComponentFixture<MultiSelectFieldComponent>) {
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/equipment'));
    req.flush({
      data: [
        { id: 'e1', name: 'Aire acondicionado' },
        { id: 'e2', name: 'Bluetooth' },
      ],
    });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('renderiza un chip por cada id seleccionado', async () => {
    const { fixture, http } = setup(['e1', 'e2']);
    await settle(http, fixture);

    const chips = fixture.nativeElement.querySelectorAll('[data-testid="ms-chip"]');
    expect(chips.length).toBe(2);
    expect(chips[0].textContent).toContain('Aire acondicionado');
  });

  it('renderiza TODOS los chips cuando hay muchos items (no se trunca)', async () => {
    const ids = Array.from({ length: 20 }, (_, i) => `e${i + 1}`);
    const { fixture, http } = setup(ids);
    const req = http.expectOne((r) => r.url.includes('/api/v1/admin/equipment'));
    req.flush({ data: ids.map((id) => ({ id, name: id })) });
    await fixture.whenStable();
    await new Promise((r) => setTimeout(r, 0));
    await fixture.whenStable();
    fixture.detectChanges();

    const chips = fixture.nativeElement.querySelectorAll('[data-testid="ms-chip"]');
    expect(chips.length).toBe(20);
    expect(chips[0].textContent).toContain('e1');
    expect(chips[19].textContent).toContain('e20');
  });

  it('carga opciones via optionsApi y filtra al tipear', async () => {
    const { fixture, http } = setup();
    await settle(http, fixture);

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="ms-input"]',
    );
    input.value = 'Blue';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('[data-testid="ms-option"]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Bluetooth');
  });

  it('click en opción agrega al control y marca dirty', async () => {
    const { fixture, ctrl, http } = setup();
    await settle(http, fixture);

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="ms-input"]',
    );
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('[data-testid="ms-option"]');
    expect(items.length).toBe(2);
    (items[0] as HTMLElement).click();
    fixture.detectChanges();
    expect(ctrl.value).toEqual(['e1']);
    expect(ctrl.dirty).toBe(true);
  });

  it('click en X de chip quita del control', async () => {
    const { fixture, ctrl, http } = setup(['e1', 'e2']);
    await settle(http, fixture);

    const removeButtons = fixture.nativeElement.querySelectorAll(
      '[data-testid="ms-chip-remove"]',
    );
    expect(removeButtons.length).toBe(2);
    (removeButtons[0] as HTMLElement).click();
    fixture.detectChanges();
    expect(ctrl.value).toEqual(['e2']);
    expect(ctrl.dirty).toBe(true);
  });

  it('excluye opciones ya seleccionadas del dropdown', async () => {
    const { fixture, http } = setup(['e1']);
    await settle(http, fixture);

    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '[data-testid="ms-input"]',
    );
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('[data-testid="ms-option"]');
    expect(items.length).toBe(1);
    expect(items[0].textContent).toContain('Bluetooth');
  });
});

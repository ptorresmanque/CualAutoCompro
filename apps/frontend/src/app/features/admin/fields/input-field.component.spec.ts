import { TestBed } from '@angular/core/testing';
import { FormControl } from '@angular/forms';
import { InputFieldComponent } from './input-field.component';

function setup(thousands: boolean, initial: number | null = null) {
  TestBed.configureTestingModule({ imports: [InputFieldComponent] });
  const fixture = TestBed.createComponent(InputFieldComponent);
  const control = new FormControl<string | number | null>(initial);
  fixture.componentRef.setInput('control', control);
  fixture.componentRef.setInput('type', 'number');
  fixture.componentRef.setInput('thousands', thousands);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { fixture, control, input };
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('InputFieldComponent con separador de miles', () => {
  it('formatea mientras se escribe y deja el control con el número limpio', () => {
    const { fixture, control, input } = setup(true);
    type(input, '14990000');
    fixture.detectChanges();

    expect(input.value).toBe('14.990.000');
    expect(control.value).toBe(14990000);
    expect(control.dirty).toBe(true);
  });

  it('ignora lo que no sea dígito en vez de dejarlo en pantalla', () => {
    const { fixture, control, input } = setup(true);
    type(input, '1234a');
    fixture.detectChanges();

    expect(input.value).toBe('1.234');
    expect(control.value).toBe(1234);
  });

  it('vaciar el campo deja el control en null y no en 0', () => {
    const { fixture, control, input } = setup(true, 15000000);
    type(input, '');
    fixture.detectChanges();

    expect(control.value).toBeNull();
  });

  it('muestra formateado el valor que llega desde afuera (prefill al editar)', async () => {
    const { fixture, control, input } = setup(true);
    control.setValue(15000000);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('15.000.000');
  });

  it('sin la marca queda como input numérico plano', () => {
    const { input } = setup(false, 15000000);
    expect(input.type).toBe('number');
    expect(input.value).toBe('15000000');
  });
});

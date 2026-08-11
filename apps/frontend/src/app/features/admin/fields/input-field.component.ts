import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { startWith, switchMap } from 'rxjs';

const CLP = new Intl.NumberFormat('es-CL');

/**
 * Input de texto o número del diálogo admin.
 *
 * Era un componente por tipo (`app-text-field` / `app-number-field`), idénticos
 * salvo el `type` del input: el control ya llega como `$any()` desde el
 * diálogo, así que el tipo del FormControl no aportaba nada.
 */
@Component({
  selector: 'app-input-field',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './input-field.component.html',
  styleUrl: './input-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputFieldComponent {
  readonly control = input.required<FormControl<string | number | null>>();
  readonly type = input<'text' | 'number'>('text');
  readonly multiline = input<boolean>(false);
  readonly required = input<boolean>(false);
  /**
   * Formatea con separador de miles mientras se escribe. Va en un input de
   * texto y no `type="number"`: un number input rechaza "14.990.000" como
   * valor y muestra el campo vacío.
   */
  readonly thousands = input<boolean>(false);

  /**
   * Valor del control como signal, para reflejar en el input las escrituras
   * que no vienen de tipear (prefill al editar, "Guardar y crear otro", JSON).
   * El `switchMap` es porque el diálogo puede reconstruir el FormGroup.
   */
  private readonly value = toSignal(
    toObservable(this.control).pipe(switchMap((c) => c.valueChanges.pipe(startWith(c.value)))),
  );

  readonly display = computed(() => {
    const v = this.value();
    return v === null || v === undefined || v === '' ? '' : CLP.format(Number(v));
  });

  onThousandsInput(el: HTMLInputElement): void {
    const digits = el.value.replace(/\D/g, '');
    // Se reescribe el input a mano y no solo vía `[value]`: si lo tipeado
    // normaliza al mismo número (un "1.234a"), el binding no detecta cambio y
    // el caracter inválido quedaría en pantalla.
    // ponytail: reformatear en cada tecla manda el cursor al final si se edita
    // al medio; alcanza para un campo de monto del admin.
    el.value = digits ? CLP.format(Number(digits)) : '';
    const ctrl = this.control();
    ctrl.markAsDirty();
    ctrl.setValue(digits ? Number(digits) : null);
  }
}

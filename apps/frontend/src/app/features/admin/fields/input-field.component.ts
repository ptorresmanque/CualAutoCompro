import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

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
}

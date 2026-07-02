import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-number-field',
  imports: [ReactiveFormsModule],
  templateUrl: './number-field.component.html',
  styleUrl: './number-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberFieldComponent {
  readonly control = input.required<FormControl<number | null>>();
}
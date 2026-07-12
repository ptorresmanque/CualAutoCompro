import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-number-field',
  imports: [ReactiveFormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './number-field.component.html',
  styleUrl: './number-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberFieldComponent {
  readonly control = input.required<FormControl<number | null>>();
  readonly required = input<boolean>(false);
}

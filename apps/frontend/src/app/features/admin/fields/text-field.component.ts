import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule],
  templateUrl: './text-field.component.html',
  styleUrl: './text-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextFieldComponent {
  readonly control = input.required<FormControl<string | null>>();
  readonly multiline = input<boolean>(false);
}
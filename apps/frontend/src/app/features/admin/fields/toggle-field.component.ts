import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-toggle-field',
  imports: [ReactiveFormsModule],
  templateUrl: './toggle-field.component.html',
  styleUrl: './toggle-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleFieldComponent {
  readonly control = input.required<FormControl<boolean>>();

  toggle(): void {
    const c = this.control();
    c.setValue(!c.value);
    c.markAsDirty();
  }
}

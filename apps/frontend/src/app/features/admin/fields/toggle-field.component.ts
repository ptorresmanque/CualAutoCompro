import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

@Component({
  selector: 'app-toggle-field',
  imports: [ReactiveFormsModule, MatSlideToggleModule],
  templateUrl: './toggle-field.component.html',
  styleUrl: './toggle-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleFieldComponent {
  readonly control = input.required<FormControl<boolean>>();

  onChange(checked: boolean): void {
    const c = this.control();
    c.setValue(checked);
    c.markAsDirty();
  }
}

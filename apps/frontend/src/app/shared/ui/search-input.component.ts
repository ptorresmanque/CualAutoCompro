import { ChangeDetectionStrategy, Component, input, model, output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  imports: [],
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchInputComponent {
  readonly value = model<string>('');
  readonly placeholder = input<string>('Buscar…');
  readonly changed = output<string>();

  clear(): void {
    this.value.set('');
    this.changed.emit('');
  }

  onInput(v: string): void {
    this.value.set(v);
    this.changed.emit(v);
  }
}
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../../core/api.service';

interface OptionItem { id: string; [k: string]: unknown; }

@Component({
  selector: 'app-multi-select-field',
  imports: [ReactiveFormsModule],
  templateUrl: './multi-select-field.component.html',
  styleUrl: './multi-select-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectFieldComponent implements OnInit {
  private api = inject(ApiService);
  private el = inject(ElementRef<HTMLElement>);

  readonly control = input.required<FormControl<string[] | null>>();
  readonly optionsApi = input<string | null>(null);
  readonly optionLabel = input<string>('name');
  readonly placeholder = input<string>('Buscar…');

  readonly query = signal('');
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly remoteOptions = signal<OptionItem[]>([]);

  readonly selectedIds = (): string[] => {
    const v = this.control().value;
    return Array.isArray(v) ? v : [];
  };

  // Read each time the template re-renders (similar pattern to gallery-upload-field).
  // OnPush CD runs on click events so this picks up the current control value.
  available(): OptionItem[] {
    const q = this.query().toLowerCase();
    const selected = new Set(this.selectedIds());
    const all = this.remoteOptions().filter((o) => !selected.has(o.id));
    return q ? all.filter((o) => String(o[this.optionLabel()] ?? '').toLowerCase().includes(q)) : all;
  }

  labelOf(id: string): string {
    const opt = this.remoteOptions().find((o) => o.id === id);
    return String(opt?.[this.optionLabel()] ?? id);
  }

  ngOnInit(): void {
    if (this.optionsApi()) {
      void this.load();
    }
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.get<{ data: OptionItem[] }>(this.optionsApi()!);
      this.remoteOptions.set(res.data);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  onInput(v: string): void {
    this.query.set(v);
    this.open.set(true);
  }

  pick(item: OptionItem): void {
    const current = this.selectedIds();
    if (current.includes(item.id)) return;
    const next = [...current, item.id];
    this.control().setValue(next);
    this.control().markAsDirty();
    this.query.set('');
    this.open.set(false);
  }

  removeAt(id: string): void {
    const next = this.selectedIds().filter((x) => x !== id);
    this.control().setValue(next);
    this.control().markAsDirty();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}
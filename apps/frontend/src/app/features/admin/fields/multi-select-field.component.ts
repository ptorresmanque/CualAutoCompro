import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private destroyRef = inject(DestroyRef);

  readonly control = input.required<FormControl<string[] | null>>();
  readonly optionsApi = input<string | null>(null);
  readonly optionLabel = input<string>('name');
  readonly placeholder = input<string>('Buscar…');

  readonly query = signal('');
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly remoteOptions = signal<OptionItem[]>([]);

  // Internal writable signal that mirrors control.value. We can't use a
  // computed because FormControl.value is NOT a signal — `this.control()`
  // returns the same FormControl instance across writes, so a computed
  // depending on it would never invalidate when setValue is called
  // externally (e.g., the dialog's effect 3 preloading the form).
  // We subscribe to valueChanges (auto-cleaned via takeUntilDestroyed)
  // and write the latest value to this signal so the template re-renders
  // on every change.
  private readonly _ids = signal<string[]>([]);
  readonly selectedIds = this._ids.asReadonly();

  available(): OptionItem[] {
    const q = this.query().toLowerCase();
    const selected = new Set(this._ids());
    const all = this.remoteOptions().filter((o) => !selected.has(o.id));
    return q ? all.filter((o) => String(o[this.optionLabel()] ?? '').toLowerCase().includes(q)) : all;
  }

  labelOf(id: string): string {
    const opt = this.remoteOptions().find((o) => o.id === id);
    return String(opt?.[this.optionLabel()] ?? id);
  }

  ngOnInit(): void {
    // Initial sync: the control may already have a value (e.g., when the
    // dialog preloads the form from the entity being edited).
    this._ids.set(this.readIds());

    // React to value changes (e.g., dialog's effect 3 setting the form).
    this.control()
      .valueChanges.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        this._ids.set(Array.isArray(v) ? v : []);
      });

    if (this.optionsApi()) {
      void this.load();
    }
  }

  private readIds(): string[] {
    const v = this.control().value;
    return Array.isArray(v) ? v : [];
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
    const current = this._ids();
    if (current.includes(item.id)) return;
    const next = [...current, item.id];
    this.control().setValue(next);
    this.control().markAsDirty();
    this.query.set('');
    this.open.set(false);
  }

  removeAt(id: string): void {
    const next = this._ids().filter((x) => x !== id);
    this.control().setValue(next);
    this.control().markAsDirty();
  }

  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    if (!this.el.nativeElement.contains(e.target as Node)) this.open.set(false);
  }
}

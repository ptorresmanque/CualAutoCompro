import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { AdminOptionsCacheService } from '../../../core/admin-options-cache.service';

interface OptionItem { id: string; [k: string]: unknown; }

@Component({
  selector: 'app-multi-select-field',
  imports: [
    ReactiveFormsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
  ],
  templateUrl: './multi-select-field.component.html',
  styleUrl: './multi-select-field.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiSelectFieldComponent implements OnInit {
  private optionsCache = inject(AdminOptionsCacheService);
  private destroyRef = inject(DestroyRef);

  readonly control = input.required<FormControl<string[] | null>>();
  readonly optionsApi = input<string | null>(null);
  readonly optionLabel = input<string>('name');
  readonly placeholder = input<string>('Buscar…');
  /**
   * `id → motivo`, p. ej. `{ 'eq1': 'Heredado de la marca Toyota' }`. Los chips
   * anotados se marcan con un ícono y el motivo como tooltip. Sirve para
   * distinguir lo que la entidad trae por herencia de lo que es propio: sin
   * esto, quitar un chip heredado parece un borrado y no una excepción.
   */
  readonly annotations = input<Record<string, string>>({});

  annotationOf(id: string): string | null {
    return this.annotations()[id] ?? null;
  }

  readonly query = signal('');
  readonly open = signal(false);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly remoteOptions = signal<OptionItem[]>([]);

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
    this._ids.set(this.readIds());

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
      this.remoteOptions.set(await this.optionsCache.get<OptionItem>(this.optionsApi()!));
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
}

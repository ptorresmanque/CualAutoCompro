import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
  untracked,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, takeUntil } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { ENV } from '../../core/env';
import {
  entitySchemaByKey,
  FIELD_METAS,
  type EntityKey,
  type FieldMeta,
} from './entity-schemas';
import { TextFieldComponent } from './fields/text-field.component';
import { NumberFieldComponent } from './fields/number-field.component';
import { ToggleFieldComponent } from './fields/toggle-field.component';
import { SelectSearchComponent } from './fields/select-search.component';
import { ImageUploadFieldComponent } from './fields/image-upload-field.component';

type Tab = 'form' | 'json';
const HIDDEN_KEYS = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);

function sanitize(value: Record<string, unknown> | null): Record<string, unknown> {
  if (!value) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value)) {
    if (HIDDEN_KEYS.has(k)) continue;
    out[k] = v;
  }
  return out;
}

@Component({
  selector: 'app-admin-edit-dialog',
  imports: [
    ReactiveFormsModule,
    TextFieldComponent,
    NumberFieldComponent,
    ToggleFieldComponent,
    SelectSearchComponent,
    ImageUploadFieldComponent,
  ],
  templateUrl: './admin-edit-dialog.component.html',
  styleUrl: './admin-edit-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEditDialogComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);

  readonly entityKey = input.required<EntityKey>();
  readonly entity = input<Record<string, unknown> | null>(null);
  readonly apiPath = input.required<string>();

  @Output() save = new EventEmitter<Record<string, unknown>>();
  @Output() cancel = new EventEmitter<void>();

  readonly tab = signal<Tab>('form');
  readonly jsonText = signal<string>('{}');
  readonly jsonError = signal<string | null>(null);
  readonly emptyTemplate = signal<Record<string, unknown>>({});
  readonly loadError = signal<string | null>(null);
  readonly loading = signal(true);
  readonly form = signal<FormGroup>(this.fb.group({}));
  readonly isEdit = signal(false);

  readonly fieldMetas = computed<FieldMeta[]>(() => {
    const key = this.entityKey();
    const tpl = this.emptyTemplate();
    const all = FIELD_METAS[key] ?? [];
    const known = new Set(all.map((m) => m.field));
    const extras: FieldMeta[] = [];
    for (const k of Object.keys(tpl)) {
      if (!known.has(k) && !HIDDEN_KEYS.has(k)) {
        extras.push({ field: k, label: k, kind: 'text' });
      }
    }
    return [...all, ...extras];
  });

  private fetchAbort = new Subject<void>();

  constructor() {
    effect(() => {
      const key = this.entityKey();
      untracked(() => {
        if (Object.keys(this.form().controls).length === 0) {
          this.form.set(this.fb.group(this.buildInitialControls(key)));
        }
      });
    });

    effect(() => {
      const key = this.entityKey();
      this.fetchAbort.next();
      untracked(() => {
        this.loading.set(true);
        this.loadError.set(null);
        this.http
          .get<{ data: Record<string, unknown> }>(`${ENV.apiBase}/admin/seed/template/${key}`)
          .pipe(takeUntil(this.fetchAbort))
          .subscribe({
            next: (res) => {
              untracked(() => {
                this.emptyTemplate.set(res.data);
                this.loading.set(false);
              });
            },
            error: (err: Error) => {
              untracked(() => {
                this.loadError.set(`No se pudo cargar la plantilla: ${err.message}`);
                this.loading.set(false);
              });
            },
          });
      });
    });

    effect(() => {
      const tpl = this.emptyTemplate();
      const e = this.entity();
      untracked(() => {
        this.isEdit.set(e !== null);
        if (Object.keys(tpl).length === 0) return;
        const form = this.form();
        const existing = new Set(Object.keys(form.controls));
        for (const k of Object.keys(tpl)) {
          if (!existing.has(k) && !HIDDEN_KEYS.has(k)) {
            form.addControl(k, new FormControl(tpl[k]));
          }
        }
        const value = sanitize(e) ?? tpl;
        for (const [k, v] of Object.entries(value)) {
          if (HIDDEN_KEYS.has(k)) continue;
          form.get(k)?.setValue(v);
        }
        this.jsonText.set(JSON.stringify(value, null, 2));
      });
    });
  }

  private buildInitialControls(key: EntityKey): Record<string, FormControl> {
    const metas = FIELD_METAS[key] ?? [];
    const controls: Record<string, FormControl> = {};
    for (const meta of metas) {
      const ctrl = new FormControl(null);
      if (meta.kind !== 'foreignKey' && meta.kind !== 'imageUrl' && meta.kind !== 'array') {
        ctrl.addValidators([Validators.required]);
      }
      controls[meta.field] = ctrl;
    }
    return controls;
  }

  controlFor(field: string): FormControl {
    return this.form().get(field) as FormControl;
  }

  switchTab(t: Tab): void {
    this.tab.set(t);
    this.jsonError.set(null);
  }

  loadJson(): void {
    try {
      const parsed = JSON.parse(this.jsonText()) as Record<string, unknown>;
      const schema = entitySchemaByKey[this.entityKey()];
      const result = schema.safeParse(parsed);
      if (!result.success) {
        this.jsonError.set(result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '));
        return;
      }
      this.jsonError.set(null);
      const form = this.form();
      const value = sanitize(parsed);
      for (const [k, v] of Object.entries(value)) {
        if (HIDDEN_KEYS.has(k)) continue;
        form.get(k)?.setValue(v);
      }
      this.tab.set('form');
    } catch (e) {
      this.jsonError.set(`JSON inválido: ${(e as Error).message}`);
    }
  }

  onSubmit(): void {
    const form = this.form();
    if (form.invalid) {
      form.markAllAsTouched();
      return;
    }
    this.save.emit(form.getRawValue() as Record<string, unknown>);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

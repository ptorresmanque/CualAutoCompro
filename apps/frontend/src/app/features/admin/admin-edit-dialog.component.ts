import {
  ChangeDetectionStrategy,
  Component,
  effect,
  EventEmitter,
  inject,
  input,
  Output,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { KeyValuePipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import {
  entitySchemaByKey,
  type EntityKey,
} from './entity-schemas';

type Tab = 'form' | 'json';

@Component({
  selector: 'app-admin-edit-dialog',
  imports: [ReactiveFormsModule, KeyValuePipe],
  templateUrl: './admin-edit-dialog.component.html',
  styleUrl: './admin-edit-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEditDialogComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);

  readonly entityKey = input.required<EntityKey>();
  readonly entity = input<Record<string, unknown> | null>(null);
  readonly apiPath = input.required<string>();

  @Output() save = new EventEmitter<Record<string, unknown>>();
  @Output() cancel = new EventEmitter<void>();

  readonly tab = signal<Tab>('form');
  readonly Array = Array;
  readonly jsonText = signal<string>('{}');
  readonly jsonError = signal<string | null>(null);
  readonly emptyTemplate = signal<Record<string, unknown>>({});
  readonly loadError = signal<string | null>(null);
  readonly loading = signal(true);

  readonly form = signal<FormGroup>(this.fb.group({}));
  readonly isEdit = signal(false);

  constructor() {
    effect(() => {
      const key = this.entityKey();
      const e = this.entity();
      this.isEdit.set(e !== null);
      void this.loadAndBuild(key, e);
    });
  }

  private async loadAndBuild(key: EntityKey, current: Record<string, unknown> | null): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    try {
      const res = await this.api.get<{ data: Record<string, unknown> }>(
        `/admin/seed/template/${key}`,
      );
      const tpl = res.data;
      this.emptyTemplate.set(tpl);
      this.form.set(this.buildFormGroup(tpl, current));
      this.jsonText.set(JSON.stringify(current ?? tpl, null, 2));
    } catch (err) {
      this.loadError.set(`No se pudo cargar la plantilla: ${(err as Error).message}`);
    } finally {
      this.loading.set(false);
    }
  }

  private buildFormGroup(tpl: Record<string, unknown>, current: Record<string, unknown> | null): FormGroup {
    const value = current ?? tpl;
    const controls: Record<string, FormControl> = {};
    for (const [k, v] of Object.entries(tpl)) {
      const initial = (value as Record<string, unknown>)[k] ?? v;
      const ctrl = new FormControl(initial);
      if (k !== 'brandId' && k !== 'modelId' && k !== 'versionId') {
        ctrl.addValidators([Validators.required]);
      }
      controls[k] = ctrl;
    }
    return this.fb.group(controls);
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
      this.form.set(this.buildFormGroup(this.emptyTemplate(), result.data));
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

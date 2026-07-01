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
  readonly form: FormGroup = this.fb.group({});

  readonly isEdit = computed(() => this.entity() !== null);

  constructor() {
    effect(async () => {
      const key = this.entityKey();
      const e = this.entity();
      const res = await this.api.get<{ data: Record<string, unknown> }>(
        `/admin/seed/template/${key}`,
      );
      const tpl = res.data;
      this.emptyTemplate.set(tpl);
      this.buildForm(tpl, e);
      this.jsonText.set(JSON.stringify(e ?? tpl, null, 2));
    });
  }

  private buildForm(tpl: Record<string, unknown>, current: Record<string, unknown> | null): void {
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
    while (Object.keys(this.form.controls).length > 0) {
      this.form.removeControl(Object.keys(this.form.controls)[0]!);
    }
    for (const [k, c] of Object.entries(controls)) this.form.addControl(k, c);
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
      this.buildForm(this.emptyTemplate(), result.data);
      this.tab.set('form');
    } catch (e) {
      this.jsonError.set(`JSON inválido: ${(e as Error).message}`);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.save.emit(this.form.getRawValue() as Record<string, unknown>);
  }

  onCancel(): void {
    this.cancel.emit();
  }
}

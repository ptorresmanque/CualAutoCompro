import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  input,
  OnDestroy,
  Output,
  signal,
  untracked,
  viewChild,
  viewChildren,
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
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatError } from '@angular/material/form-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ENV } from '../../core/env';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { applyBackendErrors, type BackendFieldError } from '../../shared/ui/admin-form-errors';
import { entitySchemaByKey, FIELD_METAS, isFieldRequired, type EntityKey, type FieldMeta } from './entity-schemas';
import { TextFieldComponent } from './fields/text-field.component';
import { NumberFieldComponent } from './fields/number-field.component';
import { ToggleFieldComponent } from './fields/toggle-field.component';
import { SelectSearchComponent } from './fields/select-search.component';
import { ImageUploadFieldComponent } from './fields/image-upload-field.component';
import { GalleryUploadFieldComponent } from './fields/gallery-upload-field.component';
import { MultiSelectFieldComponent } from './fields/multi-select-field.component';

type Tab = 'form' | 'json';
const HIDDEN_KEYS = new Set(['id', 'createdAt', 'updatedAt', 'deletedAt']);

interface Section {
  id: string;
  label: string;
  fields: FieldMeta[];
}

function sectionId(label: string): string {
  if (!label) return 'general';
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

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
    MatButtonModule,
    MatButtonToggleModule,
    MatCardModule,
    MatError,
    MatFormFieldModule,
    MatIconModule,
    MatToolbarModule,
    TextFieldComponent,
    NumberFieldComponent,
    ToggleFieldComponent,
    SelectSearchComponent,
    ImageUploadFieldComponent,
    GalleryUploadFieldComponent,
    MultiSelectFieldComponent,
  ],
  host: {
    '[class.with-nav]': 'sections().length >= 3',
  },
  templateUrl: './admin-edit-dialog.component.html',
  styleUrl: './admin-edit-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEditDialogComponent implements AfterViewInit, OnDestroy {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private dialog = inject(MatDialog);

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

  readonly fieldMetas = computed<FieldMeta[]>(() => {
    const key = this.entityKey();
    const tpl = this.emptyTemplate();
    const all = (FIELD_METAS[key] ?? []).filter((m) => !m.hidden);
    const known = new Set(all.map((m) => m.field));
    const hiddenNames = new Set(
      (FIELD_METAS[key] ?? []).filter((m) => m.hidden).map((m) => m.field),
    );
    const extras: FieldMeta[] = [];
    for (const k of Object.keys(tpl)) {
      if (!known.has(k) && !HIDDEN_KEYS.has(k) && !hiddenNames.has(k)) {
        extras.push({ field: k, label: k, kind: 'text' });
      }
    }
    return [...all, ...extras];
  });

  readonly firstField = viewChild<ElementRef<HTMLElement>>('firstField');

  readonly sectionElements = viewChildren<ElementRef<HTMLElement>>('sectionEl');

  readonly sections = computed<Section[]>(() => {
    const map = new Map<string, FieldMeta[]>();
    const order: string[] = [];
    for (const meta of this.fieldMetas()) {
      const g = meta.group ?? '';
      if (!map.has(g)) {
        map.set(g, []);
        order.push(g);
      }
      map.get(g)!.push(meta);
    }
    return order.map((g) => ({
      id: sectionId(g),
      label: g,
      fields: map.get(g)!,
    }));
  });

  private readonly activeSectionId = signal<string | null>(null);
  readonly activeSection = computed(() => this.activeSectionId());

  private intersectionObserver?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (typeof IntersectionObserver === 'undefined') return;
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.target.id) {
            this.activeSectionId.set(entry.target.id);
          }
        }
      },
      { rootMargin: '-20% 0px -60% 0px', threshold: 0 },
    );
    for (const ref of this.sectionElements()) {
      this.intersectionObserver.observe(ref.nativeElement);
    }
  }

  ngOnDestroy(): void {
    this.intersectionObserver?.disconnect();
  }

  scrollToSection(id: string): void {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private fetchAbort = new Subject<void>();
  private autofocusDone = false;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.fetchAbort.next();
      this.fetchAbort.complete();
    });

    effect(() => {
      const key = this.entityKey();
      untracked(() => {
        if (Object.keys(this.form().controls).length === 0) {
          this.form.set(this.fb.group(this.buildInitialControls(key)));
        }
      });
    });

    effect(() => {
      if (this.autofocusDone) return;
      if (this.loading()) return;
      const wrapper = this.firstField()?.nativeElement;
      if (!wrapper) return;
      this.autofocusDone = true;
      queueMicrotask(() => {
        if (!wrapper.isConnected) return;
        const focusable = wrapper.querySelector<HTMLElement>(
          'input, textarea, select, [tabindex]:not([tabindex="-1"]), button',
        );
        (focusable ?? wrapper).focus();
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
        if (Object.keys(tpl).length === 0) return;
        const form = this.form();
        const hiddenNames = new Set(
          (FIELD_METAS[this.entityKey()] ?? [])
            .filter((m) => m.hidden)
            .map((m) => m.field),
        );
        const existing = new Set(Object.keys(form.controls));
        for (const k of Object.keys(tpl)) {
          if (!existing.has(k) && !HIDDEN_KEYS.has(k) && !hiddenNames.has(k)) {
            form.addControl(k, new FormControl(tpl[k]));
          }
        }
        const value = sanitize(e) ?? tpl;
        for (const [k, v] of Object.entries(value)) {
          if (HIDDEN_KEYS.has(k) || hiddenNames.has(k)) continue;
          const ctrl = form.get(k);
          if (!ctrl) continue;
          if (
            Array.isArray(v) &&
            Array.isArray(ctrl.value) &&
            (ctrl.value as unknown[]).length > 0
          ) {
            const merged = Array.from(
              new Set([...(ctrl.value as string[]), ...(v as string[])]),
            );
            ctrl.setValue(merged);
          } else {
            ctrl.setValue(v);
          }
        }
        form.markAsPristine();
        this.jsonText.set(JSON.stringify(value, null, 2));
      });
    });
  }

  private buildInitialControls(key: EntityKey): Record<string, FormControl> {
    const metas = (FIELD_METAS[key] ?? []).filter((m) => !m.hidden);
    const controls: Record<string, FormControl> = {};
    for (const meta of metas) {
      let initial: unknown = null;
      if (meta.kind === 'gallery' || meta.kind === 'multiSelect') {
        initial = [];
      } else if (meta.kind === 'boolean' && meta.optional) {
        initial = false;
      }
      const ctrl = new FormControl(initial);
      const isExemptKind =
        meta.kind === 'foreignKey' ||
        meta.kind === 'imageUrl' ||
        meta.kind === 'array' ||
        meta.kind === 'gallery' ||
        meta.kind === 'multiSelect';
      if (!meta.optional && !isExemptKind) {
        ctrl.addValidators([Validators.required]);
      }
      controls[meta.field] = ctrl;
    }
    return controls;
  }

  controlFor(field: string): FormControl {
    return this.form().get(field) as FormControl;
  }

  isFieldRequired(meta: FieldMeta): boolean {
    return isFieldRequired(meta);
  }

  /**
   * Public method invoked by the parent admin component when the backend
   * returns a VALIDATION error. Applies each field's error to the
   * corresponding FormControl.
   */
  applyBackendErrors(fields: BackendFieldError[]): void {
    applyBackendErrors(this.form(), fields);
  }

  errorMessage(field: string): string {
    const ctrl = this.controlFor(field);
    const errors = ctrl.errors;
    if (!errors) return '';
    if (typeof errors['backend'] === 'string') return errors['backend'];
    if (errors['required']) return 'Este campo es requerido';
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['pattern']) return 'Formato inválido';
    return 'Valor inválido';
  }

  switchTab(t: Tab): void {
    this.tab.set(t);
    this.jsonError.set(null);
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEsc(event: Event): void {
    event.preventDefault();
    void this.onCancel();
  }

  closeX(): void {
    void this.onCancel();
  }

  loadJson(): void {
    try {
      const parsed = JSON.parse(this.jsonText()) as Record<string, unknown>;
      const schema = entitySchemaByKey[this.entityKey()];
      const result = schema.safeParse(parsed);
      if (!result.success) {
        this.jsonError.set(
          result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
        );
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

  onCancel(): Promise<void> {
    if (!this.form().dirty) {
      this.cancel.emit();
      return Promise.resolve();
    }
    const ref = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: 'Descartar cambios',
        message: 'Tienes cambios sin guardar. ¿Cerrar de todas formas?',
        confirmLabel: 'Descartar',
        cancelLabel: 'Seguir editando',
        danger: true,
      },
    });
    return new Promise<void>((resolve) => {
      ref.afterClosed().subscribe((ok) => {
        if (ok) this.cancel.emit();
        resolve();
      });
    });
  }
}

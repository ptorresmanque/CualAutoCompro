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
import { BehaviorSubject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatError } from '@angular/material/form-field';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AdminOptionsCacheService } from '../../core/admin-options-cache.service';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { applyBackendErrors, type BackendFieldError } from '../../shared/ui/admin-form-errors';
import { entitySchemaByKey, FIELD_METAS, isFieldRequired, type EntityKey, type FieldMeta } from './entity-schemas';
import { InputFieldComponent } from './fields/input-field.component';
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
  /** True cuando todos sus campos son opcionales: puede arrancar plegada. */
  collapsible: boolean;
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

/**
 * Una sección se puede plegar solo si **todos** sus campos están marcados
 * `optional` de forma explícita y ninguno depende del combustible.
 *
 * No alcanza con `!isFieldRequired`: los multiSelect (Equipamiento, Colores)
 * también dan false ahí, pero por un motivo técnico —el backend los recibe
 * aparte— y esconderlos entorpecería la carga en vez de agilizarla. Los campos
 * con `showWhenFuels` ya se muestran solo cuando aplican, así que plegarlos
 * sería una segunda capa de ocultamiento.
 */
function isCollapsibleGroup(fields: FieldMeta[]): boolean {
  return fields.every((f) => f.optional === true && !f.showWhenFuels);
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
    InputFieldComponent,
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
  private dialog = inject(MatDialog);
  private optionsCache = inject(AdminOptionsCacheService);

  readonly entityKey = input.required<EntityKey>();
  readonly entity = input<Record<string, unknown> | null>(null);
  readonly apiPath = input.required<string>();
  /**
   * 'create' habilita "Guardar y crear otro". No se puede deducir de `entity`,
   * porque al duplicar hay prefill pero el alta es nueva.
   */
  readonly mode = input<'create' | 'edit'>('create');

  @Output() save = new EventEmitter<Record<string, unknown>>();
  @Output() saveAndNew = new EventEmitter<Record<string, unknown>>();
  @Output() cancel = new EventEmitter<void>();

  readonly tab = signal<Tab>('form');
  readonly jsonText = signal<string>('{}');
  readonly jsonError = signal<string | null>(null);
  readonly emptyTemplate = signal<Record<string, unknown>>({});
  readonly loadError = signal<string | null>(null);
  readonly loading = signal(true);
  readonly form = signal<FormGroup>(this.fb.group({}));

  /**
   * Emite el valor actual del control `fuel` del form. Inicia en undefined
   * y se reemplaza cuando el form se construye (ver effect() abajo).
   * `isFieldVisible` trata undefined como "mostrar todo" para no romper el
   * render inicial antes de cargar la plantilla.
   */
  private readonly fuelSubject = new BehaviorSubject<string | undefined>(undefined);
  readonly currentFuel = toSignal<string | undefined>(this.fuelSubject, {
    initialValue: undefined,
  });

  readonly fieldMetas = computed<FieldMeta[]>(() => {
    const key = this.entityKey();
    const tpl = this.emptyTemplate();
    const fuel = this.currentFuel();
    const all = (FIELD_METAS[key] ?? [])
      .filter((m) => !m.hidden)
      .filter((m) => this.isFieldVisible(m, fuel));
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

  private isFieldVisible(meta: FieldMeta, fuel: string | undefined): boolean {
    if (!meta.showWhenFuels || meta.showWhenFuels.length === 0) return true;
    if (!fuel) return true;
    return meta.showWhenFuels.includes(fuel);
  }

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
    return order.map((g) => {
      const fields = map.get(g)!;
      return {
        id: sectionId(g),
        label: g,
        fields,
        collapsible: g !== '' && isCollapsibleGroup(fields),
      };
    });
  });

  /**
   * Secciones plegables actualmente abiertas. Una plegable arranca cerrada
   * salvo que la entidad cargada traiga datos en alguno de sus campos: editar
   * nunca debe esconder información existente.
   */
  private readonly expandedSections = signal<ReadonlySet<string>>(new Set());

  isSectionOpen(section: Section): boolean {
    if (!section.collapsible) return true;
    return this.expandedSections().has(section.id);
  }

  toggleSection(section: Section): void {
    if (!section.collapsible) return;
    this.expandedSections.update((current) => {
      const next = new Set(current);
      if (next.has(section.id)) next.delete(section.id);
      else next.add(section.id);
      return next;
    });
  }

  private hasData(value: unknown): boolean {
    if (value === null || value === undefined || value === '') return false;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'boolean') return value;
    return true;
  }

  /** Abre las secciones plegables que ya traen datos en la entidad cargada. */
  private syncExpandedSections(): void {
    const entity = this.entity() ?? {};
    const open = new Set<string>();
    for (const section of this.sections()) {
      if (!section.collapsible) continue;
      if (section.fields.some((f) => this.hasData(entity[f.field]))) open.add(section.id);
    }
    this.expandedSections.set(open);
  }

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

  private destroyRef = inject(DestroyRef);
  /** Valor de `autofocusRequest` ya atendido; -1 = todavía ninguno. */
  private autofocusDone = -1;
  /**
   * Última entidad aplicada al form, para detectar un prefill nuevo. Arranca
   * en `null` —el mismo valor por defecto del input— para que el primer render
   * no dispare un reset: el form recién construido ya está limpio, y resetear
   * ahí borraría lo que el usuario haya tipeado mientras cargaba la plantilla.
   */
  private lastAppliedEntity: Record<string, unknown> | null = null;
  /**
   * Se incrementa cuando llega un prefill nuevo. Es un signal —y no un
   * booleano— porque el effect de foco tiene que volver a correr después de
   * "Guardar y crear otro".
   */
  private readonly autofocusRequest = signal(0);

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
      // Re-suscribir el fuelSubject cada vez que el form (re-)construye controles.
      const f = this.form();
      const fuelCtrl = f.get('fuel');
      if (!fuelCtrl) {
        this.fuelSubject.next(undefined);
        return;
      }
      this.fuelSubject.next(fuelCtrl.value ?? undefined);
      fuelCtrl.valueChanges
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe((v: unknown) => {
          const fuel = typeof v === 'string' ? v : undefined;
          this.fuelSubject.next(fuel);
          if (fuel === 'ELECTRIC') this.form().get('engineType')?.setValue(null);
        });
    });

    effect(() => {
      // Se re-dispara con cada prefill nuevo (ver autofocusRequest).
      const request = this.autofocusRequest();
      if (this.autofocusDone === request) return;
      const wrapper = this.firstField()?.nativeElement;
      if (!wrapper) return;
      this.autofocusDone = request;
      queueMicrotask(() => {
        if (!wrapper.isConnected) return;
        const focusable = wrapper.querySelector<HTMLElement>(
          'input, textarea, select, [tabindex]:not([tabindex="-1"]), button',
        );
        (focusable ?? wrapper).focus();
      });
    });

    /**
     * La plantilla solo aporta campos "extra" que el backend conoce y
     * FIELD_METAS no. El formulario se renderiza de inmediato desde
     * FIELD_METAS y esto lo completa cuando llega; va por caché, así que a
     * partir de la segunda apertura resuelve sin red.
     */
    effect(() => {
      const key = this.entityKey();
      untracked(() => {
        this.loading.set(true);
        this.loadError.set(null);
        // `get` memoiza por path y tipa el resultado como lista; la plantilla
        // del seed es un objeto, de ahí el cast.
        (
          this.optionsCache.get(`/admin/seed/template/${key}`) as unknown as Promise<
            Record<string, unknown>
          >
        )
          .then((tpl) => {
            this.emptyTemplate.set(tpl);
            this.loading.set(false);
          })
          .catch((err: Error) => {
            this.loadError.set(`No se pudo cargar la plantilla: ${err.message}`);
            this.loading.set(false);
          });
      });
    });

effect(() => {
      const tpl = this.emptyTemplate();
      const e = this.entity();
      untracked(() => {
        // Sin `return` temprano si la plantilla aún no llegó: los controles ya
        // existen (vienen de FIELD_METAS), así que los valores de la entidad se
        // aplican de inmediato y la plantilla solo suma los campos extra.
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

        // Al volver de "Guardar y crear otro" el prefill trae solo los campos
        // sticky; el resto debe quedar en blanco y no con lo recién guardado.
        //
        // Solo cuando cambia la entidad: este effect también corre al llegar
        // la plantilla, y ahí resetear pisaría lo que el usuario ya tipeó
        // mientras el request estaba en vuelo.
        const entityChanged = e !== this.lastAppliedEntity;
        this.lastAppliedEntity = e;
        if (entityChanged) {
          this.resetControlsNotIn(form, value);
          this.autofocusRequest.update((n) => n + 1);
        }

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
        this.syncExpandedSections();
        this.jsonText.set(JSON.stringify(value, null, 2));
      });
    });
  }

  /** Valor con el que arranca un control según el tipo de campo. */
  private initialValueFor(meta: FieldMeta): unknown {
    if (meta.kind === 'gallery' || meta.kind === 'multiSelect') return [];
    if (meta.kind === 'boolean' && meta.optional) return false;
    return null;
  }

  private resetControlsNotIn(form: FormGroup, value: Record<string, unknown>): void {
    const metaByField = new Map(
      (FIELD_METAS[this.entityKey()] ?? []).map((m) => [m.field, m]),
    );
    for (const name of Object.keys(form.controls)) {
      if (name in value) continue;
      const meta = metaByField.get(name);
      form.get(name)?.setValue(meta ? this.initialValueFor(meta) : null);
    }
  }

  private buildInitialControls(key: EntityKey): Record<string, FormControl> {
    const metas = (FIELD_METAS[key] ?? []).filter((m) => !m.hidden);
    const controls: Record<string, FormControl> = {};
    for (const meta of metas) {
      const initial = this.initialValueFor(meta);
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

  /**
   * Anotaciones por opción para los `multiSelect` que declaran
   * `annotationsFrom`. La entidad las trae ya armadas (ver
   * `versions-admin.component.ts`); acá solo se leen.
   */
  annotationsFor(meta: FieldMeta): Record<string, string> {
    if (!meta.annotationsFrom) return {};
    const raw = this.entity()?.[meta.annotationsFrom];
    return raw && typeof raw === 'object' ? (raw as Record<string, string>) : {};
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
    this.expandSectionsWithErrors();
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
    const value = this.validatedValue();
    if (!value) return;
    this.save.emit(value);
  }

  onSubmitAndNew(): void {
    const value = this.validatedValue();
    if (!value) return;
    this.saveAndNew.emit(value);
  }

  /**
   * Devuelve el valor del form si es válido; si no, marca todo como tocado y
   * abre las secciones plegadas que contengan el error — sin esto el usuario
   * ve el guardado fallar sin ninguna pista visible.
   */
  private validatedValue(): Record<string, unknown> | null {
    const form = this.form();
    if (form.invalid) {
      form.markAllAsTouched();
      this.expandSectionsWithErrors();
      return null;
    }
    return form.getRawValue() as Record<string, unknown>;
  }

  private expandSectionsWithErrors(): void {
    const form = this.form();
    const withErrors = this.sections()
      .filter((s) => s.collapsible && s.fields.some((f) => form.get(f.field)?.invalid))
      .map((s) => s.id);
    if (withErrors.length === 0) return;
    this.expandedSections.update((current) => new Set([...current, ...withErrors]));
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

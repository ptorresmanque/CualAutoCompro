import { computed, inject, signal, type Signal } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { AdminOptionsCacheService } from '../../core/admin-options-cache.service';
import { ApiService } from '../../core/api.service';
import { toApiCallError } from '../../core/api-error';
import { sortItems, type SortDir } from '../../features/admin/sort-utils';
import { ConfirmDialogComponent } from './confirm-dialog.component';
import type { BackendFieldError } from './admin-form-errors';
import type { PageMeta, PagedResponse } from './pagination.types';

type DialogMode = 'closed' | 'create' | 'edit';

/** Claves que nunca viajan en un prefill de "duplicar". */
const NON_CLONABLE_KEYS = ['id', 'createdAt', 'updatedAt', 'deletedAt'] as const;

export interface AdminCrudConfig<TRow extends { id: string }> {
  /** Path base del recurso admin, sin barra final. Ej: '/admin/models'. */
  apiPath: string;
  /** Etiquetas para los toasts y la confirmación de borrado. */
  label: { singular: string; created: string; updated: string; deleted: string };
  /** Texto identificatorio de una fila, para toasts y confirmaciones. */
  rowName: (row: TRow) => string;
  /** Campos por los que filtra el buscador en cliente. Omitir = sin filtro local. */
  searchFields?: (row: TRow) => Array<string | number | null | undefined>;
  /** Traduce una sortKey a un valor comparable. */
  sortAccessor?: (row: TRow, key: string) => unknown;
  /** Orden inicial de la tabla. Sin esto arranca sin ordenar. */
  initialSort?: { key: string; dir: SortDir };
  /** Query params extra en cada load (ej. versionId en mantenciones). */
  extraParams?: () => Record<string, string | number>;
  /** Proyecta la fila al shape que espera el diálogo (ej. dealerIds, equipment). */
  toDialogEntity?: (row: TRow) => Record<string, unknown>;
  /** Quita del payload los campos que no van al endpoint principal. */
  beforeSave?: (value: Record<string, unknown>, mode: DialogMode) => Record<string, unknown>;
  /** Efectos post-guardado con el id resultante (ej. sync de relaciones). */
  afterSave?: (ctx: {
    id: string;
    value: Record<string, unknown>;
    previous: TRow | null;
  }) => Promise<void>;
  /** Paths de /options a invalidar en la caché tras guardar o borrar. */
  invalidates?: string[];
  /** Campos que se conservan al usar "Guardar y crear otro". */
  stickyFields?: string[];
  /** Recibe los errores por campo del backend (el componente los pasa al diálogo). */
  onValidationError?: (fields: BackendFieldError[]) => void;
}

/**
 * Estado y operaciones CRUD de una lista del panel admin.
 *
 * Se instancia como campo de componente (`readonly crud = new AdminCrudStore({…})`),
 * que corre en contexto de inyección: por eso puede usar `inject()` acá dentro.
 * No es un servicio `providedIn: 'root'` — cada lista necesita su propia instancia.
 */
export class AdminCrudStore<TRow extends { id: string }> {
  private api = inject(ApiService);
  private feedback = inject(AdminFeedbackService);
  private dialog = inject(MatDialog);
  private optionsCache = inject(AdminOptionsCacheService);

  private readonly _items = signal<TRow[]>([]);
  private readonly _pagination = signal<PageMeta>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });
  private readonly _page = signal(1);
  private readonly _pageSize = signal(25);
  private readonly _search = signal('');
  private readonly _loading = signal(false);
  private readonly _saving = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _sortKey = signal<string | null>(null);
  private readonly _sortDir = signal<SortDir>('asc');
  private readonly _dialogMode = signal<DialogMode>('closed');
  private readonly _dialogEntity = signal<Record<string, unknown> | null>(null);
  private readonly _editingRow = signal<TRow | null>(null);

  readonly items: Signal<TRow[]> = this._items.asReadonly();
  readonly pagination: Signal<PageMeta> = this._pagination.asReadonly();
  readonly page: Signal<number> = this._page.asReadonly();
  readonly pageSize: Signal<number> = this._pageSize.asReadonly();
  readonly search: Signal<string> = this._search.asReadonly();
  readonly loading: Signal<boolean> = this._loading.asReadonly();
  readonly saving: Signal<boolean> = this._saving.asReadonly();
  readonly error: Signal<string | null> = this._error.asReadonly();
  readonly sortKey: Signal<string | null> = this._sortKey.asReadonly();
  readonly sortDir: Signal<SortDir> = this._sortDir.asReadonly();
  readonly dialogMode: Signal<DialogMode> = this._dialogMode.asReadonly();
  readonly dialogEntity: Signal<Record<string, unknown> | null> = this._dialogEntity.asReadonly();
  readonly editingRow: Signal<TRow | null> = this._editingRow.asReadonly();

  readonly displayed = computed<TRow[]>(() => {
    const q = this._search().trim().toLowerCase();
    const fields = this.config.searchFields;
    const filtered =
      q && fields
        ? this._items().filter((row) =>
            fields(row).some((v) => v != null && String(v).toLowerCase().includes(q)),
          )
        : this._items();
    return sortItems(
      filtered,
      this._sortKey(),
      this._sortDir(),
      this.config.sortAccessor ?? ((row, key) => (row as Record<string, unknown>)[key]),
    );
  });

  constructor(private readonly config: AdminCrudConfig<TRow>) {
    if (config.initialSort) {
      this._sortKey.set(config.initialSort.key);
      this._sortDir.set(config.initialSort.dir);
    }
  }

  async load(): Promise<void> {
    this._loading.set(true);
    try {
      const params: Record<string, string | number> = {
        page: this._page(),
        pageSize: this._pageSize(),
        ...(this.config.extraParams?.() ?? {}),
      };
      const q = this._search().trim();
      if (q.length > 0) params['q'] = q;

      const res = await this.api.get<PagedResponse<TRow[]>>(this.config.apiPath, params);
      this._items.set(res.data);
      this._pagination.set(res.pagination);
    } catch (err) {
      this._error.set(this.messageOf(err));
    } finally {
      this._loading.set(false);
    }
  }

  retry(): void {
    this._error.set(null);
    void this.load();
  }

  openCreate(): void {
    this._editingRow.set(null);
    this._dialogEntity.set(null);
    this._dialogMode.set('create');
  }

  openEdit(row: TRow): void {
    this._editingRow.set(row);
    this._dialogEntity.set(this.project(row));
    this._dialogMode.set('edit');
  }

  /**
   * Abre el diálogo precargado con los datos de `row` pero como alta nueva:
   * sin `id`, así el guardado hace POST y la fila original queda intacta.
   */
  openDuplicate(row: TRow): void {
    const prefill = { ...this.project(row) };
    for (const key of NON_CLONABLE_KEYS) delete prefill[key];
    this._editingRow.set(null);
    this._dialogEntity.set(prefill);
    this._dialogMode.set('create');
  }

  closeDialog(): void {
    this._dialogMode.set('closed');
    this._dialogEntity.set(null);
    this._editingRow.set(null);
  }

  save(value: Record<string, unknown>): Promise<void> {
    return this.persist(value, { keepOpen: false });
  }

  /**
   * Guarda como alta y deja el diálogo abierto para la siguiente, conservando
   * los `stickyFields` (marca, año, etc.) para no re-tipear el contexto.
   */
  saveAndNew(value: Record<string, unknown>): Promise<void> {
    return this.persist(value, { keepOpen: true });
  }

  private async persist(
    value: Record<string, unknown>,
    opts: { keepOpen: boolean },
  ): Promise<void> {
    const mode = this._dialogMode();
    const previous = this._editingRow();
    const payload = this.config.beforeSave?.(value, mode) ?? value;
    const name = this.config.rowName({ ...(previous ?? {}), ...value } as TRow);

    this._saving.set(true);
    try {
      let id: string;
      if (previous) {
        await this.api.patch(`${this.config.apiPath}/${previous.id}`, payload);
        id = previous.id;
        this.feedback.success(`${this.config.label.singular} "${name}" ${this.config.label.updated}`);
      } else {
        const created = await this.api.post<{ data: { id: string } }>(
          this.config.apiPath,
          payload,
        );
        id = created.data.id;
        this.feedback.success(`${this.config.label.singular} "${name}" ${this.config.label.created}`);
      }

      await this.config.afterSave?.({ id, value, previous });
      this.invalidateOptions();

      if (opts.keepOpen) {
        this._editingRow.set(null);
        this._dialogEntity.set(this.pickSticky(value));
        this._dialogMode.set('create');
      } else {
        this.closeDialog();
      }
      await this.load();
    } catch (err) {
      this.handleMutationError(err);
    } finally {
      this._saving.set(false);
    }
  }

  async confirmDelete(row: TRow): Promise<void> {
    const name = this.config.rowName(row);
    const ref = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: `Eliminar ${this.config.label.singular.toLowerCase()}`,
        message: `¿Eliminar ${this.config.label.singular.toLowerCase()} "${name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      },
    });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;

    try {
      await this.api.delete(`${this.config.apiPath}/${row.id}`);
      this.feedback.success(`${this.config.label.singular} "${name}" ${this.config.label.deleted}`);
      this.invalidateOptions();
      await this.load();
    } catch (err) {
      this.handleMutationError(err);
    }
  }

  /** Cambia el texto de búsqueda sin ir al servidor (filtro local). */
  setSearchText(value: string): void {
    this._search.set(value);
  }

  onSearch(value: string): void {
    this._search.set(value);
    this._page.set(1);
    void this.load();
  }

  onPageChange(page: number): void {
    this._page.set(page);
    void this.load();
  }

  onPageSizeChange(pageSize: number): void {
    this._pageSize.set(pageSize);
    this._page.set(1);
    void this.load();
  }

  toggleSort(key: string): void {
    if (this._sortKey() === key) {
      this._sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this._sortKey.set(key);
      this._sortDir.set('asc');
    }
  }

  private project(row: TRow): Record<string, unknown> {
    return this.config.toDialogEntity?.(row) ?? { ...(row as Record<string, unknown>) };
  }

  private pickSticky(value: Record<string, unknown>): Record<string, unknown> {
    const keep: Record<string, unknown> = {};
    for (const field of this.config.stickyFields ?? []) {
      if (field in value) keep[field] = value[field];
    }
    return keep;
  }

  private invalidateOptions(): void {
    for (const path of this.config.invalidates ?? []) {
      this.optionsCache.invalidate(path);
    }
  }

  /**
   * Los errores de validación por campo se delegan al diálogo, que los pinta
   * junto al input; el resto se muestra como mensaje general. En ambos casos
   * el diálogo queda abierto para que el usuario corrija sin re-tipear.
   */
  private handleMutationError(err: unknown): void {
    const apiErr = toApiCallError(err);
    if (apiErr?.backend.code === 'VALIDATION' && apiErr.backend.fields) {
      this.config.onValidationError?.(apiErr.backend.fields);
      return;
    }
    const msg = this.messageOf(err);
    this._error.set(msg);
    this.feedback.error(msg);
  }

  private messageOf(err: unknown): string {
    return toApiCallError(err)?.backend.message ?? (err as Error).message;
  }
}

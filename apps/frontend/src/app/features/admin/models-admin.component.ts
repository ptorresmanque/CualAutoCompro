import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { ApiCallError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import type { PagedResponse } from '../../shared/ui/pagination.types';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface ModelRow { id: string; name: string; segment: string; brand: { name: string } | null; }
interface BrandOption { id: string; name: string; }
type SortKey = 'name' | 'segment' | 'brandName';

@Component({
  selector: 'app-models-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './models-admin.component.html',
  styleUrl: './models-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsAdminComponent {
  private api = inject(ApiService);
  private feedback = inject(AdminFeedbackService);
  private dialog = inject(MatDialog);

  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly items = signal<ModelRow[]>([]);
  readonly brands = signal<BrandOption[]>([]);
  readonly search = signal('');
  readonly pagination = signal({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly dialogEntity = signal<ModelRow | null | undefined>(undefined);
  readonly dialogMode = computed(() => (this.dialogEntity() === undefined ? 'closed' : 'open'));
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly sortKey = signal<SortKey | null>(null);
  readonly sortDir = signal<SortDir>('asc');

  readonly displayed = computed<ModelRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const filtered = q
      ? this.items().filter((m) => {
          const brandName = m.brand?.name ?? '';
          return (
            m.name.toLowerCase().includes(q) ||
            m.segment.toLowerCase().includes(q) ||
            brandName.toLowerCase().includes(q)
          );
        })
      : this.items();
    return sortItems(filtered, this.sortKey(), this.sortDir(), (m, k) => {
      if (k === 'brandName') return m.brand?.name ?? '';
      return m[k as Exclude<SortKey, 'brandName'>];
    });
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const params: Record<string, string | number> = { page: this.page(), pageSize: this.pageSize() };
      const q = this.search().trim();
      if (q.length > 0) params['q'] = q;
      const [itemsRes, brandsRes] = await Promise.all([
        this.api.get<PagedResponse<ModelRow[]>>('/admin/models', params),
        this.api.get<{ data: BrandOption[] }>('/brands').catch(() => ({ data: [] as BrandOption[] })),
      ]);
      this.items.set(itemsRes.data);
      this.pagination.set(itemsRes.pagination);
      this.brands.set(brandsRes.data);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.dialogEntity.set(null);
  }
  openEdit(row: ModelRow): void {
    this.dialogEntity.set(row);
  }
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    try {
      if (e) {
        await this.api.patch(`/admin/models/${e.id}`, value);
        this.feedback.success(`Modelo "${value['name']}" actualizado`);
      } else {
        await this.api.post(`/admin/models`, value);
        this.feedback.success(`Modelo "${value['name']}" creado`);
      }
      this.dialogEntity.set(undefined);
      await this.load();
    } catch (err) {
      if (err instanceof ApiCallError && err.backend.code === 'VALIDATION' && err.backend.fields) {
        this.editDialog()?.applyBackendErrors(err.backend.fields);
        return;
      }
      const msg = (err as Error).message;
      this.error.set(msg);
      this.feedback.error(msg);
    }
  }

  async confirmDelete(row: ModelRow): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: 'Eliminar modelo',
        message: `¿Eliminar modelo "${row.name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      },
    });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    try {
      await this.api.delete(`/admin/models/${row.id}`);
      this.feedback.success(`Modelo "${row.name}" eliminado`);
      await this.load();
    } catch (err) {
      const msg = (err as Error).message;
      this.error.set(msg);
      this.feedback.error(msg);
    }
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    void this.load();
  }

  onPageChange(page: number): void {
    this.page.set(page);
    void this.load();
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.page.set(1);
    void this.load();
  }

  retry(): void {
    this.error.set(null);
    void this.load();
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }
}

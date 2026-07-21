import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { ApiCallError, unwrap } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import type { PageMeta, PagedResponse } from '../../shared/ui/pagination.types';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface BrandRow {
  id: string;
  name: string;
  logoUrl: string | null;
  dealers?: { dealer: { id: string } }[];
  dealerIds?: string[];
}
type SortKey = 'name';

@Component({
  selector: 'app-brands-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './brands-admin.component.html',
  styleUrl: './brands-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsAdminComponent {
  private api = inject(ApiService);
  private feedback = inject(AdminFeedbackService);
  private dialog = inject(MatDialog);

  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly items = signal<BrandRow[]>([]);
  readonly pagination = signal<PageMeta>({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  readonly search = signal('');
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly dialogEntity = signal<BrandRow | null | undefined>(undefined);
  readonly dialogMode = computed(() => (this.dialogEntity() === undefined ? 'closed' : 'open'));
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly sortKey = signal<SortKey | null>(null);
  readonly sortDir = signal<SortDir>('asc');

  readonly displayed = computed<BrandRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const filtered = q ? this.items().filter((b) => b.name.toLowerCase().includes(q)) : this.items();
    return sortItems(filtered, this.sortKey(), this.sortDir(), (b, k) => b[k as SortKey]);
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const params: Record<string, string | number> = {
        page: this.page(),
        pageSize: this.pageSize(),
      };
      const q = this.search().trim();
      if (q.length > 0) params['q'] = q;
      const res = await this.api.get<PagedResponse<BrandRow[]>>('/admin/brands', params);
      this.items.set(res.data);
      this.pagination.set(res.pagination);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.dialogEntity.set(null);
  }
  openEdit(row: BrandRow): void {
    const dealerIds = row.dealers?.map((d) => d.dealer.id) ?? [];
    this.dialogEntity.set({ ...row, dealerIds });
  }
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    try {
      if (e) {
        await this.api.patch(`/admin/brands/${e.id}`, value);
        this.feedback.success(`Marca "${value['name']}" actualizada`);
      } else {
        const { dealerIds: _ignore, ...createPayload } = value;
        await this.api.post(`/admin/brands`, createPayload);
        this.feedback.success(`Marca "${createPayload['name']}" creada`);
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

  async confirmDelete(row: BrandRow): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: 'Eliminar marca',
        message: `¿Eliminar marca "${row.name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      },
    });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    try {
      await this.api.delete(`/admin/brands/${row.id}`);
      this.feedback.success(`Marca "${row.name}" eliminada`);
      await this.load();
    } catch (err) {
      const msg = (err as Error).message;
      this.error.set(msg);
      this.feedback.error(msg);
    }
  }

  onSearch(q: string): void {
    this.search.set(q);
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

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  retry(): void {
    this.error.set(null);
    void this.load();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private _unwrap = unwrap;
}

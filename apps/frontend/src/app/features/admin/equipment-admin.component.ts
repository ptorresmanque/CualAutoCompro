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

interface EquipmentRow { id: string; name: string; category: string; }
type SortKey = 'name' | 'category';

@Component({
  selector: 'app-equipment-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './equipment-admin.component.html',
  styleUrl: './equipment-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentAdminComponent {
  private api = inject(ApiService);
  private feedback = inject(AdminFeedbackService);
  private dialog = inject(MatDialog);

  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly items = signal<EquipmentRow[]>([]);
  readonly search = signal('');
  readonly pagination = signal({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly dialogEntity = signal<EquipmentRow | null | undefined>(undefined);
  readonly dialogMode = computed(() => (this.dialogEntity() === undefined ? 'closed' : 'open'));
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly sortKey = signal<SortKey | null>(null);
  readonly sortDir = signal<SortDir>('asc');

  readonly displayed = computed<EquipmentRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const filtered = q
      ? this.items().filter(
          (e) => e.name.toLowerCase().includes(q) || e.category.toLowerCase().includes(q),
        )
      : this.items();
    return sortItems(filtered, this.sortKey(), this.sortDir(), (e, k) => e[k as SortKey]);
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
      const res = await this.api.get<PagedResponse<EquipmentRow[]>>('/admin/equipment', params);
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
  openEdit(row: EquipmentRow): void {
    this.dialogEntity.set(row);
  }
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    try {
      if (e) {
        await this.api.patch(`/admin/equipment/${e.id}`, value);
        this.feedback.success(`Equipo "${value['name']}" actualizado`);
      } else {
        await this.api.post(`/admin/equipment`, value);
        this.feedback.success(`Equipo "${value['name']}" creado`);
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

  async confirmDelete(row: EquipmentRow): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: 'Eliminar equipamiento',
        message: `¿Eliminar equipamiento "${row.name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      },
    });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    try {
      await this.api.delete(`/admin/equipment/${row.id}`);
      this.feedback.success(`Equipo "${row.name}" eliminado`);
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

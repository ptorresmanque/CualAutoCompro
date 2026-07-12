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
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface EquipmentRow { id: string; name: string; category: string; }
type SortKey = 'name' | 'category';

@Component({
  selector: 'app-equipment-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, MatButtonModule, MatIconModule],
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
      const res = await this.api.get<{ data: EquipmentRow[] }>('/admin/equipment').catch(async () => {
        const pub = await this.api.get<{ data: EquipmentRow[] }>('/equipment');
        return pub;
      });
      this.items.set(res.data);
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

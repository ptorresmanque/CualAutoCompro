import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
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
      } else {
        await this.api.post(`/admin/equipment`, value);
      }
      this.dialogEntity.set(undefined);
      await this.load();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  async confirmDelete(row: EquipmentRow): Promise<void> {
    if (!confirm(`¿Eliminar equipamiento "${row.name}"?`)) return;
    try {
      await this.api.delete(`/admin/equipment/${row.id}`);
      await this.load();
    } catch (err) {
      this.error.set((err as Error).message);
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

import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface BrandRow { id: string; name: string; logoUrl: string | null; }
type SortKey = 'name';

@Component({
  selector: 'app-brands-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent],
  templateUrl: './brands-admin.component.html',
  styleUrl: './brands-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsAdminComponent {
  private api = inject(ApiService);

  readonly items = signal<BrandRow[]>([]);
  readonly search = signal('');
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
      const res = await this.api.get<{ data: BrandRow[] }>('/admin/brands').catch(async () => {
        const pub = await this.api.get<{ data: BrandRow[] }>('/brands');
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
  openEdit(row: BrandRow): void {
    this.dialogEntity.set(row);
  }
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    try {
      if (e) {
        await this.api.patch(`/admin/brands/${e.id}`, value);
      } else {
        await this.api.post(`/admin/brands`, value);
      }
      this.dialogEntity.set(undefined);
      await this.load();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  async confirmDelete(row: BrandRow): Promise<void> {
    if (!confirm(`¿Eliminar marca "${row.name}"?`)) return;
    try {
      await this.api.delete(`/admin/brands/${row.id}`);
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

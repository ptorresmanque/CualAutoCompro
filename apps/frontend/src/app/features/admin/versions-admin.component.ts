import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface VersionRow { id: string; name: string; year: number; priceClp: number; model: { name: string } | null; }
interface ModelOption { id: string; name: string; }
type SortKey = 'name' | 'year' | 'priceClp' | 'modelName';

@Component({
  selector: 'app-versions-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent],
  templateUrl: './versions-admin.component.html',
  styleUrl: './versions-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionsAdminComponent {
  private api = inject(ApiService);

  readonly items = signal<VersionRow[]>([]);
  readonly models = signal<ModelOption[]>([]);
  readonly search = signal('');
  readonly dialogEntity = signal<VersionRow | null | undefined>(undefined);
  readonly dialogMode = computed(() => (this.dialogEntity() === undefined ? 'closed' : 'open'));
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly sortKey = signal<SortKey | null>(null);
  readonly sortDir = signal<SortDir>('asc');

  readonly displayed = computed<VersionRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const filtered = q
      ? this.items().filter((v) => {
          const modelName = v.model?.name ?? '';
          return (
            v.name.toLowerCase().includes(q) ||
            modelName.toLowerCase().includes(q) ||
            String(v.year).includes(q)
          );
        })
      : this.items();
    return sortItems(filtered, this.sortKey(), this.sortDir(), (v, k) => {
      if (k === 'modelName') return v.model?.name ?? '';
      return v[k as Exclude<SortKey, 'modelName'>];
    });
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const [itemsRes, modelsRes] = await Promise.all([
        this.api
          .get<{ data: VersionRow[] | { items: VersionRow[] } }>('/admin/versions')
          .catch(async () => {
            const pub = await this.api.get<{ data: { items: VersionRow[] } }>(
              '/versions',
              { pageSize: 50 },
            );
            return pub;
          }),
        this.api.get<{ data: { items: ModelOption[] } }>('/models', { pageSize: 50 }).catch(() => ({
          data: { items: [] as ModelOption[] },
        })),
      ]);
      const data = itemsRes.data;
      this.items.set(Array.isArray(data) ? data : data.items);
      this.models.set(modelsRes.data.items);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.dialogEntity.set(null);
  }
  openEdit(row: VersionRow): void {
    this.dialogEntity.set(row);
  }
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    try {
      if (e) {
        await this.api.patch(`/admin/versions/${e.id}`, value);
      } else {
        await this.api.post(`/admin/versions`, value);
      }
      this.dialogEntity.set(undefined);
      await this.load();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  async confirmDelete(row: VersionRow): Promise<void> {
    if (!confirm(`¿Eliminar versión "${row.name}"?`)) return;
    try {
      await this.api.delete(`/admin/versions/${row.id}`);
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

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CL').format(value);
  }
}

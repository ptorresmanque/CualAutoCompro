import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { ApiService } from '../../core/api.service';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface ModelRow { id: string; name: string; segment: string; brand: { name: string } | null; }
interface BrandOption { id: string; name: string; }
type SortKey = 'name' | 'segment' | 'brandName';

@Component({
  selector: 'app-models-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, MatButtonModule, MatIconModule],
  templateUrl: './models-admin.component.html',
  styleUrl: './models-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsAdminComponent {
  private api = inject(ApiService);
  private feedback = inject(AdminFeedbackService);

  readonly items = signal<ModelRow[]>([]);
  readonly brands = signal<BrandOption[]>([]);
  readonly search = signal('');
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
      const [itemsRes, brandsRes] = await Promise.all([
        this.api
          .get<{ data: ModelRow[] | { items: ModelRow[] } }>('/admin/models')
          .catch(async () => {
            const pub = await this.api.get<{ data: { items: ModelRow[] } }>(
              '/models',
              { pageSize: 50 },
            );
            return pub;
          }),
        this.api.get<{ data: BrandOption[] }>('/brands').catch(() => ({ data: [] as BrandOption[] })),
      ]);
      const data = itemsRes.data;
      this.items.set(Array.isArray(data) ? data : data.items);
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
      const msg = (err as Error).message;
      this.error.set(msg);
      this.feedback.error(msg);
    }
  }

  async confirmDelete(row: ModelRow): Promise<void> {
    if (!confirm(`¿Eliminar modelo "${row.name}"?`)) return;
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

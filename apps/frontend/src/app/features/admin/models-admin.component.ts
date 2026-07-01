import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';

interface ModelRow { id: string; name: string; segment: string; brand: { name: string } | null; }
interface BrandOption { id: string; name: string; }

@Component({
  selector: 'app-models-admin',
  imports: [AdminEditDialogComponent],
  templateUrl: './models-admin.component.html',
  styleUrl: './models-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsAdminComponent {
  private api = inject(ApiService);

  readonly items = signal<ModelRow[]>([]);
  readonly brands = signal<BrandOption[]>([]);
  readonly search = signal('');
  readonly dialogEntity = signal<ModelRow | null | undefined>(undefined);
  readonly dialogMode = computed(() => (this.dialogEntity() === undefined ? 'closed' : 'open'));
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly filtered = computed(() => {
    const q = this.search().trim().toLowerCase();
    if (!q) return this.items();
    return this.items().filter((m) => {
      const brandName = m.brand?.name ?? '';
      return (
        m.name.toLowerCase().includes(q) ||
        m.segment.toLowerCase().includes(q) ||
        brandName.toLowerCase().includes(q)
      );
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
      } else {
        await this.api.post(`/admin/models`, value);
      }
      this.dialogEntity.set(undefined);
      await this.load();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  async confirmDelete(row: ModelRow): Promise<void> {
    if (!confirm(`¿Eliminar modelo "${row.name}"?`)) return;
    try {
      await this.api.delete(`/admin/models/${row.id}`);
      await this.load();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  onSearch(value: string): void {
    this.search.set(value);
  }
}

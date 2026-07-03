import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ApiService } from '../../core/api.service';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface VersionRow {
  id: string;
  name: string;
  year: number;
  priceClp: number;
  model: { name: string } | null;
  equipmentItems?: { equipmentItem: { id: string; name: string; category: string } }[];
  // Projected from equipmentItems by openEdit so the dialog's multi-select
  // control named 'equipment' can be preloaded. Read by computeEquipmentDiff.
  equipment?: string[];
}
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
    // Project equipmentItems[].equipmentItem.id -> equipment: string[] so the
    // dialog's multiSelect control named 'equipment' gets preloaded. Without
    // this projection, the dialog's effect iterates Object.entries(entity) and
    // calls form.get('equipmentItems')?.setValue(...), which is a no-op because
    // the form control is named 'equipment'. The control would stay at [],
    // and any save would detach every existing item (data loss).
    //
    // IMPORTANT: keep `equipmentItems` on the entity too. The onSave diff
    // uses e.equipmentItems to compute toAdd/toRemove against the user's
    // new equipment selection. If equipmentItems is dropped, oldIds is [],
    // and the diff tries to attach every selected item — including the ones
    // already attached — which the backend rejects with 409 Conflict.
    const { equipmentItems, ...rest } = row;
    const equipment = equipmentItems?.map((ei) => ei.equipmentItem.id) ?? [];
    this.dialogEntity.set({ ...rest, equipment, equipmentItems } as VersionRow);
  }
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    const newEquipmentIds = (value['equipment'] as string[] | null) ?? [];
    const { toAdd, toRemove } = this.computeEquipmentDiff(e, newEquipmentIds);

    // 1) Save the version (without the equipment field).
    const { equipment: _ignore, ...versionPayload } = value;
    let versionId: string;
    try {
      if (e) {
        versionId = e.id;
        await this.api.patch(`/admin/versions/${versionId}`, versionPayload);
      } else {
        const created = await this.api.post<{ data: { id: string } }>(
          `/admin/versions`,
          versionPayload,
        );
        versionId = created.data.id;
      }

      // 2) Sync equipment relations.
      for (const itemId of toRemove) {
        await this.api.delete(`/admin/equipment/version/${versionId}/item/${itemId}`);
      }
      for (const itemId of toAdd) {
        await this.api.post(`/admin/equipment/attach`, { versionId, itemId });
      }

      this.dialogEntity.set(undefined);
      await this.load();
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  private computeEquipmentDiff(
    e: VersionRow | null | undefined,
    newIds: string[],
  ): { toAdd: string[]; toRemove: string[] } {
    const oldIds = (e?.equipmentItems ?? []).map((ei) => ei.equipmentItem.id);
    const toAdd = newIds.filter((id) => !oldIds.includes(id));
    const toRemove = oldIds.filter((id) => !newIds.includes(id));
    return { toAdd, toRemove };
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

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

interface VersionRow {
  id: string;
  name: string;
  year: number;
  priceClp: number;
  model: { name: string } | null;
  equipmentItems?: { equipmentItem: { id: string; name: string; category: string } }[];
  colorItems?: { color: { id: string; name: string; hex: string | null } }[];
  // Projected from *Items by openEdit so the dialog's multi-select controls
  // can be preloaded. Read by computeEquipmentDiff / computeColorDiff.
  equipment?: string[];
  colors?: string[];
}
interface ModelOption { id: string; name: string; }
type SortKey = 'name' | 'year' | 'priceClp' | 'modelName';

@Component({
  selector: 'app-versions-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './versions-admin.component.html',
  styleUrl: './versions-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionsAdminComponent {
  private api = inject(ApiService);
  private feedback = inject(AdminFeedbackService);
  private dialog = inject(MatDialog);

  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly items = signal<VersionRow[]>([]);
  readonly models = signal<ModelOption[]>([]);
  readonly search = signal('');
  readonly pagination = signal({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  readonly page = signal(1);
  readonly pageSize = signal(25);
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
      const params: Record<string, string | number> = { page: this.page(), pageSize: this.pageSize() };
      const q = this.search().trim();
      if (q.length > 0) params['q'] = q;
      const [itemsRes, modelsRes] = await Promise.all([
        this.api.get<PagedResponse<VersionRow[]>>('/admin/versions', params),
        this.api.get<{ data: { items: ModelOption[] } }>('/models', { pageSize: 50 }).catch(() => ({
          data: { items: [] as ModelOption[] },
        })),
      ]);
      this.items.set(itemsRes.data);
      this.pagination.set(itemsRes.pagination);
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
    const { equipmentItems, colorItems, ...rest } = row;
    const equipment = equipmentItems?.map((ei) => ei.equipmentItem.id) ?? [];
    const colors = colorItems?.map((ci) => ci.color.id) ?? [];
    this.dialogEntity.set({ ...rest, equipment, colors, equipmentItems, colorItems } as VersionRow);
  }
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    const newEquipmentIds = (value['equipment'] as string[] | null) ?? [];
    const newColorIds = (value['colors'] as string[] | null) ?? [];
    const { toAdd: eqAdd, toRemove: eqRemove } = this.computeEquipmentDiff(e, newEquipmentIds);
    const { toAdd: coAdd, toRemove: coRemove } = this.computeColorDiff(e, newColorIds);

    // 1) Save the version (without the multi-select fields).
    const { equipment: _eqIgnore, colors: _coIgnore, ...versionPayload } = value;
    const versionName = String(versionPayload['name'] ?? '');
    let versionId: string;
    try {
      if (e) {
        versionId = e.id;
        await this.api.patch(`/admin/versions/${versionId}`, versionPayload);
        this.feedback.success(`Versión "${versionName}" actualizada`);
      } else {
        const created = await this.api.post<{ data: { id: string } }>(
          `/admin/versions`,
          versionPayload,
        );
        versionId = created.data.id;
        this.feedback.success(`Versión "${versionName}" creada`);
      }

      // 2) Sync equipment + color relations.
      for (const itemId of eqRemove) {
        await this.api.delete(`/admin/equipment/version/${versionId}/item/${itemId}`);
      }
      for (const itemId of eqAdd) {
        await this.api.post(`/admin/equipment/attach`, { versionId, itemId });
      }
      for (const colorId of coRemove) {
        await this.api.delete(`/admin/colors/version/${versionId}/color/${colorId}`);
      }
      for (const colorId of coAdd) {
        await this.api.post(`/admin/colors/attach`, { versionId, colorId });
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

  private computeEquipmentDiff(
    e: VersionRow | null | undefined,
    newIds: string[],
  ): { toAdd: string[]; toRemove: string[] } {
    const oldIds = (e?.equipmentItems ?? []).map((ei) => ei.equipmentItem.id);
    const toAdd = newIds.filter((id) => !oldIds.includes(id));
    const toRemove = oldIds.filter((id) => !newIds.includes(id));
    return { toAdd, toRemove };
  }

  private computeColorDiff(
    e: VersionRow | null | undefined,
    newIds: string[],
  ): { toAdd: string[]; toRemove: string[] } {
    const oldIds = (e?.colorItems ?? []).map((ci) => ci.color.id);
    const toAdd = newIds.filter((id) => !oldIds.includes(id));
    const toRemove = oldIds.filter((id) => !newIds.includes(id));
    return { toAdd, toRemove };
  }

  async confirmDelete(row: VersionRow): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: 'Eliminar versión',
        message: `¿Eliminar versión "${row.name}"?`,
        confirmLabel: 'Eliminar',
        danger: true,
      },
    });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    try {
      await this.api.delete(`/admin/versions/${row.id}`);
      this.feedback.success(`Versión "${row.name}" eliminada`);
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

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CL').format(value);
  }
}

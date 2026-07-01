import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ApiService } from '../../core/api.service';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface MaintenanceRow { id: string; versionId: string; mileageTag: number; costClp: number; }
interface VersionOption { id: string; name: string; model?: { name: string } | null; }
type SortKey = 'versionId' | 'mileageTag' | 'costClp';

@Component({
  selector: 'app-maintenance-admin',
  imports: [AdminEditDialogComponent, DecimalPipe],
  templateUrl: './maintenance-admin.component.html',
  styleUrl: './maintenance-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceAdminComponent {
  private api = inject(ApiService);

  readonly versions = signal<VersionOption[]>([]);
  readonly selectedVersion = signal<string>('');
  readonly items = signal<MaintenanceRow[]>([]);
  readonly dialogEntity = signal<MaintenanceRow | null | undefined>(undefined);
  readonly dialogMode = computed(() => (this.dialogEntity() === undefined ? 'closed' : 'open'));
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly sortKey = signal<SortKey | null>('mileageTag');
  readonly sortDir = signal<SortDir>('asc');

  readonly displayed = computed<MaintenanceRow[]>(() =>
    sortItems(this.items(), this.sortKey(), this.sortDir(), (m, k) => m[k as SortKey]),
  );

  constructor() {
    void this.loadVersions();
  }

  private async loadVersions(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.get<{ data: { items: VersionOption[] } | VersionOption[] }>(
        '/versions',
        { pageSize: 50 },
      );
      const data = res.data;
      this.versions.set(Array.isArray(data) ? data : data.items);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadMaintenance(versionId: string): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api
        .get<{ data: MaintenanceRow[] }>(`/admin/maintenance`)
        .catch(async () => {
          const pub = await this.api.get<{ data: MaintenanceRow[] }>(
            `/maintenance/version/${versionId}`,
          );
          return pub;
        });
      this.items.set(res.data);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  onVersionChange(versionId: string): void {
    this.selectedVersion.set(versionId);
    this.items.set([]);
    if (versionId) {
      void this.loadMaintenance(versionId);
    }
  }

  openCreate(): void {
    this.dialogEntity.set(null);
  }
  openEdit(row: MaintenanceRow): void {
    this.dialogEntity.set(row);
  }
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    const payload: Record<string, unknown> = { ...value, versionId: this.selectedVersion() };
    try {
      if (e) {
        await this.api.patch(`/admin/maintenance/${e.id}`, payload);
      } else {
        await this.api.post(`/admin/maintenance`, payload);
      }
      this.dialogEntity.set(undefined);
      await this.loadMaintenance(this.selectedVersion());
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  async confirmDelete(row: MaintenanceRow): Promise<void> {
    if (!confirm(`¿Eliminar registro de mantenimiento?`)) return;
    try {
      await this.api.delete(`/admin/maintenance/${row.id}`);
      await this.loadMaintenance(this.selectedVersion());
    } catch (err) {
      this.error.set((err as Error).message);
    }
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  formatPrice(clp: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(clp);
  }
}

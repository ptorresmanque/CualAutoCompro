import { ChangeDetectionStrategy, Component, computed, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { firstValueFrom } from 'rxjs';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { ApiCallError } from '../../core/api-error';
import { ApiService } from '../../core/api.service';
import { ConfirmDialogComponent } from '../../shared/ui/confirm-dialog.component';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import type { PagedResponse } from '../../shared/ui/pagination.types';
import { sortItems, type SortDir } from './sort-utils';

interface MaintenanceRow { id: string; versionId: string; mileageTag: number; costClp: number; }
interface VersionOption { id: string; name: string; model?: { name: string } | null; }
type SortKey = 'versionId' | 'mileageTag' | 'costClp';

@Component({
  selector: 'app-maintenance-admin',
  imports: [
    AdminEditDialogComponent,
    DecimalPipe,
    PaginationComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './maintenance-admin.component.html',
  styleUrl: './maintenance-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceAdminComponent {
  private api = inject(ApiService);
  private feedback = inject(AdminFeedbackService);
  private dialog = inject(MatDialog);

  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly versions = signal<VersionOption[]>([]);
  readonly selectedVersion = signal<string>('');
  readonly items = signal<MaintenanceRow[]>([]);
  readonly pagination = signal({ page: 1, pageSize: 25, total: 0, totalPages: 1 });
  readonly page = signal(1);
  readonly pageSize = signal(25);
  readonly search = signal('');
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
      const params: Record<string, string | number> = { page: this.page(), pageSize: this.pageSize() };
      const q = this.search().trim();
      if (q.length > 0) params['q'] = q;
      const res = await this.api.get<PagedResponse<MaintenanceRow[]>>('/admin/maintenance', params);
      this.items.set(res.data);
      this.pagination.set(res.pagination);
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
    const versionId = e ? e.versionId : this.selectedVersion();
    const payload: Record<string, unknown> = { ...value, versionId };
    const mileage = payload['mileageTag'];
    const mileageLabel = mileage !== undefined ? `${mileage} km` : '';
    try {
      if (e) {
        await this.api.patch(`/admin/maintenance/${e.id}`, payload);
        this.feedback.success(`Mantención ${mileageLabel} actualizada`);
      } else {
        await this.api.post(`/admin/maintenance`, payload);
        this.feedback.success(`Mantención ${mileageLabel} creada`);
      }
      this.dialogEntity.set(undefined);
      await this.loadMaintenance(this.selectedVersion());
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

  async confirmDelete(row: MaintenanceRow): Promise<void> {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      disableClose: true,
      data: {
        title: 'Eliminar mantención',
        message: `¿Eliminar el registro de mantención a los ${row.mileageTag} km?`,
        confirmLabel: 'Eliminar',
        danger: true,
      },
    });
    const ok = await firstValueFrom(ref.afterClosed());
    if (!ok) return;
    try {
      await this.api.delete(`/admin/maintenance/${row.id}`);
      this.feedback.success(`Mantención ${row.mileageTag} km eliminada`);
      await this.loadMaintenance(this.selectedVersion());
    } catch (err) {
      const msg = (err as Error).message;
      this.error.set(msg);
      this.feedback.error(msg);
    }
  }

  onSearch(value: string): void {
    this.search.set(value);
    this.page.set(1);
    if (this.selectedVersion()) void this.loadMaintenance(this.selectedVersion());
  }

  onPageChange(page: number): void {
    this.page.set(page);
    if (this.selectedVersion()) void this.loadMaintenance(this.selectedVersion());
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.page.set(1);
    if (this.selectedVersion()) void this.loadMaintenance(this.selectedVersion());
  }

  retry(): void {
    this.error.set(null);
    if (this.selectedVersion()) void this.loadMaintenance(this.selectedVersion());
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

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { DatePipe } from '@angular/common';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { ApiService } from '../../core/api.service';

type TrashRow =
  | { id: string; name: string; deletedAt: string }
  | { id: string; fuelType: string; unit?: string; deletedAt: string }
  | { id: string; mileageTag: number; costClp: number; deletedAt: string }
  | { id: string; deletedAt: string; [key: string]: unknown };
interface TrashGroup { key: string; label: string; rows: TrashRow[]; }

const GROUPS: Array<{ key: string; label: string }> = [
  { key: 'brands', label: 'Marcas' },
  { key: 'models', label: 'Modelos' },
  { key: 'versions', label: 'Versiones' },
  { key: 'equipment', label: 'Equipamiento' },
  { key: 'maintenance', label: 'Mantención' },
  { key: 'dealers', label: 'Concesionarios' },
  { key: 'fuelPrices', label: 'Precios de combustible' },
];

@Component({
  selector: 'app-trash-admin',
  imports: [DatePipe, MatButtonModule],
  templateUrl: './trash-admin.component.html',
  styleUrl: './trash-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrashAdminComponent {
  private readonly api = inject(ApiService);
  private readonly feedback = inject(AdminFeedbackService);
  readonly groups = signal<TrashGroup[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly working = signal<string | null>(null);

  constructor() { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await this.api.get<{ data: Record<string, TrashRow[]> }>('/admin/trash');
      this.groups.set(GROUPS.map((group) => ({ ...group, rows: res.data[group.key] ?? [] })));
    } catch {
      this.error.set('No se pudo cargar la papelera.');
    } finally {
      this.loading.set(false);
    }
  }

  displayName(row: TrashRow): string {
    const r = row as Record<string, unknown>;
    if (typeof r['name'] === 'string' && r['name']) return r['name'] as string;
    if (typeof r['fuelType'] === 'string') {
      return `${r['fuelType']}${typeof r['unit'] === 'string' ? ' · ' + (r['unit'] as string) : ''}`;
    }
    if (typeof r['mileageTag'] === 'number') {
      return `${r['mileageTag']} km · ${typeof r['costClp'] === 'number' ? r['costClp'] : 0} CLP`;
    }
    return row.id;
  }

  async restore(group: TrashGroup, row: TrashRow): Promise<void> {
    const key = `${group.key}:${row.id}`;
    this.working.set(key);
    try {
      await this.api.post(`/admin/trash/${group.key}/${row.id}/restore`, {});
      this.feedback.success(`Registro restaurado en ${group.label}`);
      await this.load();
    } catch (error) {
      this.feedback.error((error as Error).message);
    } finally {
      this.working.set(null);
    }
  }
}

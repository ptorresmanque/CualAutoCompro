import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { ApiService } from '../../core/api.service';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface FuelPriceRow {
  id: string;
  fuelType: string;
  pricePerUnitClp: number;
  unit: string;
  effectiveFrom: string;
}
type SortKey = 'fuelType' | 'pricePerUnitClp' | 'effectiveFrom';

@Component({
  selector: 'app-fuel-prices-admin',
  imports: [
    AdminEditDialogComponent,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    SearchInputComponent,
  ],
  templateUrl: './fuel-prices-admin.component.html',
  styleUrl: './fuel-prices-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FuelPricesAdminComponent {
  private api = inject(ApiService);
  private feedback = inject(AdminFeedbackService);

  readonly items = signal<FuelPriceRow[]>([]);
  readonly search = signal('');
  readonly dialogEntity = signal<FuelPriceRow | null | undefined>(undefined);
  readonly dialogMode = computed(() => (this.dialogEntity() === undefined ? 'closed' : 'open'));
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly sortKey = signal<SortKey | null>('effectiveFrom');
  readonly sortDir = signal<SortDir>('desc');

  readonly displayed = computed<FuelPriceRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const filtered = q ? this.items().filter((fp) => fp.fuelType.toLowerCase().includes(q)) : this.items();
    return sortItems(filtered, this.sortKey(), this.sortDir(), (fp, k) => fp[k as SortKey]);
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.get<{ data: FuelPriceRow[] }>('/admin/fuel-prices');
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
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    try {
      if (e) {
        await this.api.patch(`/admin/fuel-prices/${e.id}`, value);
        this.feedback.success(`Precio ${value['fuelType']} (${value['unit']}) actualizado`);
      } else {
        await this.api.post(`/admin/fuel-prices`, value);
        this.feedback.success(`Precio ${value['fuelType']} (${value['unit']}) creado`);
      }
      this.dialogEntity.set(undefined);
      await this.load();
    } catch (err) {
      const msg = (err as Error).message;
      this.error.set(msg);
      this.feedback.error(msg);
    }
  }

  async confirmDelete(row: FuelPriceRow): Promise<void> {
    if (!confirm(`¿Eliminar precio de ${row.fuelType}?`)) return;
    try {
      await this.api.delete(`/admin/fuel-prices/${row.id}`);
      this.feedback.success(`Precio ${row.fuelType} (${row.unit}) eliminado`);
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

  formatCurrency(value: number): string {
    return '$' + new Intl.NumberFormat('es-CL').format(value);
  }
}

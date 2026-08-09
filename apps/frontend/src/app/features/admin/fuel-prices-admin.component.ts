import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface FuelPriceRow {
  id: string;
  fuelType: string;
  pricePerUnitClp: number;
  unit: string;
  effectiveFrom: string;
}

@Component({
  selector: 'app-fuel-prices-admin',
  imports: [
    AdminEditDialogComponent,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    SearchInputComponent,
    PaginationComponent,
  ],
  templateUrl: './fuel-prices-admin.component.html',
  styleUrl: './admin-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FuelPricesAdminComponent {
  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly crud = new AdminCrudStore<FuelPriceRow>({
    apiPath: '/admin/fuel-prices',
    label: { singular: 'Precio', created: 'creado', updated: 'actualizado', deleted: 'eliminado' },
    rowName: (row) => `${row.fuelType} (${row.unit})`,
    searchFields: (row) => [row.fuelType, row.unit],
    sortAccessor: (row, key) => row[key as 'fuelType' | 'pricePerUnitClp' | 'effectiveFrom'],
    initialSort: { key: 'effectiveFrom', dir: 'desc' },
    stickyFields: STICKY_FIELDS.fuelPrice,
    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.crud.load();
  }

  formatCurrency(value: number): string {
    return '$' + new Intl.NumberFormat('es-CL').format(value);
  }
}

import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface BrandRow {
  id: string;
  name: string;
  logoUrl: string | null;
  dealers?: { dealer: { id: string } }[];
  dealerIds?: string[];
}

@Component({
  selector: 'app-brands-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './brands-admin.component.html',
  styleUrl: './brands-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsAdminComponent {
  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly crud = new AdminCrudStore<BrandRow>({
    apiPath: '/admin/brands',
    label: { singular: 'Marca', created: 'creada', updated: 'actualizada', deleted: 'eliminada' },
    rowName: (row) => row.name,
    searchFields: (row) => [row.name],
    sortAccessor: (row, key) => row[key as 'name'],
    // Proyecta la relación a los ids que espera el multi-select del diálogo.
    toDialogEntity: (row) => ({ ...row, dealerIds: row.dealers?.map((d) => d.dealer.id) ?? [] }),
    // POST /admin/brands no acepta dealerIds; la relación se asigna editando.
    beforeSave: (value, mode) => {
      if (mode !== 'create') return value;
      const { dealerIds: _ignore, ...rest } = value;
      return rest;
    },
    stickyFields: STICKY_FIELDS.brand,
    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.crud.load();
  }
}

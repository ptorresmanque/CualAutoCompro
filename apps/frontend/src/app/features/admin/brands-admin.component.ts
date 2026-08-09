import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
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
  equipmentItems?: { equipmentItem: { id: string; name: string; category: string } }[];
}

@Component({
  selector: 'app-brands-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './brands-admin.component.html',
  styleUrl: './admin-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BrandsAdminComponent {
  private api = inject(ApiService);

  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly crud = new AdminCrudStore<BrandRow>({
    apiPath: '/admin/brands',
    label: { singular: 'Marca', created: 'creada', updated: 'actualizada', deleted: 'eliminada' },
    rowName: (row) => row.name,
    searchFields: (row) => [row.name],
    sortAccessor: (row, key) => row[key as 'name'],
    // Proyecta las relaciones a los ids que esperan los multi-select del diálogo.
    toDialogEntity: (row) => ({
      ...row,
      dealerIds: row.dealers?.map((d) => d.dealer.id) ?? [],
      equipment: row.equipmentItems?.map((ei) => ei.equipmentItem.id) ?? [],
    }),
    // POST /admin/brands no acepta dealerIds; la relación se asigna editando.
    // `equipment` nunca va en el payload de la marca: se sincroniza en afterSave.
    beforeSave: (value, mode) => {
      const { equipment: _eq, equipmentItems: _ei, ...withoutEquipment } = value;
      if (mode !== 'create') return withoutEquipment;
      const { dealerIds: _ignore, ...rest } = withoutEquipment;
      return rest;
    },
    // El equipamiento de serie de la marca lo heredan todas sus versiones; el
    // backend calcula el diff con la selección completa.
    afterSave: async ({ id, value }) => {
      await this.api.put(`/admin/equipment/brand/${id}`, {
        itemIds: (value['equipment'] as string[] | null) ?? [],
      });
    },
    stickyFields: STICKY_FIELDS.brand,
    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.crud.load();
  }
}

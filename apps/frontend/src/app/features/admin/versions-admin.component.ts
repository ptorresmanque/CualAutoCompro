import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface VersionRow {
  id: string;
  name: string;
  year: number;
  priceClp: number;
  model: { name: string } | null;
  equipmentItems?: { equipmentItem: { id: string; name: string; category: string } }[];
  colorItems?: { color: { id: string; name: string; hex: string | null } }[];
}

@Component({
  selector: 'app-versions-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './versions-admin.component.html',
  styleUrl: './versions-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VersionsAdminComponent {
  private api = inject(ApiService);

  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly crud = new AdminCrudStore<VersionRow>({
    apiPath: '/admin/versions',
    label: { singular: 'Versión', created: 'creada', updated: 'actualizada', deleted: 'eliminada' },
    rowName: (row) => row.name,
    searchFields: (row) => [row.name, row.model?.name, row.year],
    sortAccessor: (row, key) =>
      key === 'modelName' ? (row.model?.name ?? '') : row[key as 'name' | 'year' | 'priceClp'],
    invalidates: ['/admin/versions/options'],
    stickyFields: STICKY_FIELDS.version,

    // Proyecta las relaciones a los ids que esperan los multi-select del
    // diálogo (`equipment` y `colors`). Sin esto los controles quedan vacíos
    // y guardar desasociaría todo.
    toDialogEntity: (row) => ({
      ...row,
      equipment: row.equipmentItems?.map((ei) => ei.equipmentItem.id) ?? [],
      colors: row.colorItems?.map((ci) => ci.color.id) ?? [],
    }),

    // Esos dos campos no van al endpoint de la versión: se sincronizan aparte.
    beforeSave: (value) => {
      const { equipment: _eq, colors: _co, equipmentItems: _ei, colorItems: _ci, ...rest } = value;
      return rest;
    },

    // Un PUT por relación con la selección completa; el backend calcula el
    // diff en una transacción. Antes acá había un request por ítem, en serie.
    afterSave: async ({ id, value }) => {
      await Promise.all([
        this.api.put(`/admin/equipment/version/${id}`, {
          itemIds: (value['equipment'] as string[] | null) ?? [],
        }),
        this.api.put(`/admin/colors/version/${id}`, {
          colorIds: (value['colors'] as string[] | null) ?? [],
        }),
      ]);
    },

    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.crud.load();
  }

  formatPrice(value: number): string {
    return new Intl.NumberFormat('es-CL').format(value);
  }
}

import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface ModelRow {
  id: string;
  name: string;
  segment: string;
  imageUrl: string | null;
  galleryUrls?: string[];
  brand: { name: string } | null;
  comment?: string | null;
  equipmentItems?: { equipmentItem: { id: string; name: string; category: string } }[];
}

@Component({
  selector: 'app-models-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './models-admin.component.html',
  styleUrl: './admin-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsAdminComponent {
  private api = inject(ApiService);

  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly crud = new AdminCrudStore<ModelRow>({
    apiPath: '/admin/models',
    label: { singular: 'Modelo', created: 'creado', updated: 'actualizado', deleted: 'eliminado' },
    rowName: (row) => row.name,
    searchFields: (row) => [row.name, row.segment, row.brand?.name],
    sortAccessor: (row, key) =>
      key === 'brandName' ? (row.brand?.name ?? '') : row[key as 'name' | 'segment'],
    // `/models/segments` para que un segmento creado con "Otro" aparezca en el
    // selector del siguiente alta sin recargar la página.
    invalidates: ['/admin/models/options', '/models/segments'],
    stickyFields: STICKY_FIELDS.model,

    // Proyecta la relación a los ids que espera el multi-select del diálogo.
    toDialogEntity: (row) => ({
      ...row,
      equipment: row.equipmentItems?.map((ei) => ei.equipmentItem.id) ?? [],
    }),

    // `equipment` no va al endpoint del modelo: se sincroniza aparte.
    beforeSave: (value) => {
      const { equipment: _eq, equipmentItems: _ei, ...rest } = value;
      return rest;
    },

    // El equipamiento de serie del modelo lo heredan todas sus versiones; el
    // backend calcula el diff con la selección completa.
    afterSave: async ({ id, value }) => {
      await this.api.put(`/admin/equipment/model/${id}`, {
        itemIds: (value['equipment'] as string[] | null) ?? [],
      });
    },

    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.crud.load();
  }

  /** `galleryUrls` llega como array del backend, pero puede faltar en filas viejas. */
  galleryCount(row: ModelRow): number {
    return row.galleryUrls?.length ?? 0;
  }
}

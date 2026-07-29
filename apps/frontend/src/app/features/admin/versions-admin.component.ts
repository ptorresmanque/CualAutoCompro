import { ChangeDetectionStrategy, Component, inject, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/api.service';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface EquipmentEntry {
  equipmentItem: { id: string; name: string; category: string };
  /** De dónde sale el ítem: propio de la versión, o heredado del modelo/marca. */
  source?: 'VERSION' | 'MODEL' | 'BRAND';
  /** Nombre de la marca o del modelo del que se hereda. */
  sourceName?: string | null;
}

interface VersionRow {
  id: string;
  name: string;
  year: number;
  priceClp: number;
  model: { name: string } | null;
  equipmentItems?: EquipmentEntry[];
  colorItems?: { color: { id: string; name: string; hex: string | null } }[];
}

/** Motivo que se muestra en el chip de un ítem heredado, o null si es propio. */
function inheritedReason(entry: EquipmentEntry): string | null {
  if (entry.source === 'BRAND') return `Heredado de la marca ${entry.sourceName ?? ''}`.trim();
  if (entry.source === 'MODEL') return `Heredado del modelo ${entry.sourceName ?? ''}`.trim();
  return null;
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
    // Los dos últimos: para que un combustible o transmisión creado con "Otro"
    // aparezca en el selector del siguiente alta sin recargar la página.
    invalidates: ['/admin/versions/options', '/versions/fuels', '/versions/transmissions'],
    stickyFields: STICKY_FIELDS.version,

    // Proyecta las relaciones a los ids que esperan los multi-select del
    // diálogo (`equipment` y `colors`). Sin esto los controles quedan vacíos
    // y guardar desasociaría todo.
    //
    // `equipment` es el equipamiento **efectivo**: incluye lo que la versión
    // hereda de su modelo y su marca. `equipmentInherited` marca cuáles son
    // esos en el chip, para que quitarlos se lea como una excepción de esta
    // versión y no como borrar el ítem del origen.
    toDialogEntity: (row) => ({
      ...row,
      equipment: row.equipmentItems?.map((ei) => ei.equipmentItem.id) ?? [],
      equipmentInherited: Object.fromEntries(
        (row.equipmentItems ?? [])
          .map((ei) => [ei.equipmentItem.id, inheritedReason(ei)] as const)
          .filter((pair): pair is readonly [string, string] => pair[1] !== null),
      ),
      colors: row.colorItems?.map((ci) => ci.color.id) ?? [],
    }),

    // Esos campos no van al endpoint de la versión: se sincronizan aparte.
    beforeSave: (value) => {
      const {
        equipment: _eq,
        equipmentInherited: _eqi,
        colors: _co,
        equipmentItems: _ei,
        colorItems: _ci,
        ...rest
      } = value;
      return rest;
    },

    // Un PUT por relación con la selección completa; el backend calcula el
    // diff en una transacción. Antes acá había un request por ítem, en serie.
    // Para equipamiento el backend deriva de esa selección qué queda como
    // propio y qué pasa a ser una exclusión de lo heredado.
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

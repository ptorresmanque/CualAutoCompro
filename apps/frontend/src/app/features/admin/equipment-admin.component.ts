import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface EquipmentRow { id: string; name: string; category: string; }

@Component({
  selector: 'app-equipment-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './equipment-admin.component.html',
  styleUrl: './equipment-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EquipmentAdminComponent {
  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly crud = new AdminCrudStore<EquipmentRow>({
    apiPath: '/admin/equipment',
    label: { singular: 'Equipo', created: 'creado', updated: 'actualizado', deleted: 'eliminado' },
    rowName: (row) => row.name,
    searchFields: (row) => [row.name, row.category],
    sortAccessor: (row, key) => row[key as 'name' | 'category'],
    invalidates: ['/admin/equipment/options', '/admin/equipment/categories'],
    stickyFields: STICKY_FIELDS.equipment,
    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.crud.load();
  }
}

import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface ModelRow { id: string; name: string; segment: string; brand: { name: string } | null; }

@Component({
  selector: 'app-models-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './models-admin.component.html',
  styleUrl: './models-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelsAdminComponent {
  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly crud = new AdminCrudStore<ModelRow>({
    apiPath: '/admin/models',
    label: { singular: 'Modelo', created: 'creado', updated: 'actualizado', deleted: 'eliminado' },
    rowName: (row) => row.name,
    searchFields: (row) => [row.name, row.segment, row.brand?.name],
    sortAccessor: (row, key) =>
      key === 'brandName' ? (row.brand?.name ?? '') : row[key as 'name' | 'segment'],
    invalidates: ['/admin/models/options'],
    stickyFields: STICKY_FIELDS.model,
    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.crud.load();
  }
}

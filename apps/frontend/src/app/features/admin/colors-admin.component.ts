import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface ColorRow { id: string; name: string; hex: string | null; }

@Component({
  selector: 'app-colors-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './colors-admin.component.html',
  styleUrl: './colors-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorsAdminComponent {
  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly crud = new AdminCrudStore<ColorRow>({
    apiPath: '/admin/colors',
    label: { singular: 'Color', created: 'creado', updated: 'actualizado', deleted: 'eliminado' },
    rowName: (row) => row.name,
    searchFields: (row) => [row.name, row.hex],
    sortAccessor: (row, key) => row[key as 'name'],
    invalidates: ['/admin/colors/options'],
    stickyFields: STICKY_FIELDS.color,
    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.crud.load();
  }
}

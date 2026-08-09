import { ChangeDetectionStrategy, Component, viewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { toAbsoluteUploadUrl } from '../../core/upload-url';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface DealerRow { id: string; name: string; url: string; logoUrl: string | null; }

@Component({
  selector: 'app-dealers-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, PaginationComponent, MatButtonModule, MatIconModule],
  templateUrl: './dealers-admin.component.html',
  styleUrl: './admin-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DealersAdminComponent {
  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly crud = new AdminCrudStore<DealerRow>({
    apiPath: '/admin/dealers',
    label: { singular: 'Concesionario', created: 'creado', updated: 'actualizado', deleted: 'eliminado' },
    rowName: (row) => row.name,
    searchFields: (row) => [row.name, row.url],
    sortAccessor: (row, key) => row[key as 'name'],
    invalidates: ['/admin/dealers/options'],
    stickyFields: STICKY_FIELDS.dealer,
    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.crud.load();
  }

  logoSrc(url: string | null | undefined): string | null {
    return toAbsoluteUploadUrl(url);
  }
}

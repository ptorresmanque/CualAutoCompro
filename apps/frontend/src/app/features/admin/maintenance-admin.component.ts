import { ChangeDetectionStrategy, Component, inject, signal, viewChild } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { AdminOptionsCacheService } from '../../core/admin-options-cache.service';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { PaginationComponent } from '../../shared/ui/pagination.component';
import { AdminCrudStore } from '../../shared/ui/admin-crud.store';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { STICKY_FIELDS } from './entity-schemas';

interface MaintenanceRow { id: string; versionId: string; mileageTag: number; costClp: number; }
interface VersionOption { id: string; name: string; }

@Component({
  selector: 'app-maintenance-admin',
  imports: [
    AdminEditDialogComponent,
    DecimalPipe,
    PaginationComponent,
    SearchInputComponent,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatSelectModule,
  ],
  templateUrl: './maintenance-admin.component.html',
  styleUrl: './admin-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceAdminComponent {
  private optionsCache = inject(AdminOptionsCacheService);

  readonly editDialog = viewChild<AdminEditDialogComponent>(AdminEditDialogComponent);

  readonly versions = signal<VersionOption[]>([]);
  readonly selectedVersion = signal<string>('');
  readonly optionsError = signal<string | null>(null);

  // Anotación explícita: `beforeSave` lee `this.crud`, y sin el tipo declarado
  // TypeScript no puede resolver la referencia circular del inicializador.
  readonly crud: AdminCrudStore<MaintenanceRow> = new AdminCrudStore<MaintenanceRow>({
    apiPath: '/admin/maintenance',
    label: { singular: 'Mantención', created: 'creada', updated: 'actualizada', deleted: 'eliminada' },
    rowName: (row) => `${row.mileageTag} km`,
    sortAccessor: (row, key) => row[key as 'mileageTag' | 'costClp'],
    initialSort: { key: 'mileageTag', dir: 'asc' },
    // El filtro por versión se resuelve en el servidor.
    extraParams: (): Record<string, string | number> =>
      this.selectedVersion() ? { versionId: this.selectedVersion() } : {},
    // El diálogo no muestra versionId (está oculto): se inyecta al guardar.
    beforeSave: (value) => ({
      ...value,
      versionId: this.crud.editingRow()?.versionId ?? this.selectedVersion(),
    }),
    stickyFields: STICKY_FIELDS.maintenance,
    onValidationError: (fields) => this.editDialog()?.applyBackendErrors(fields),
  });

  constructor() {
    void this.loadVersions();
  }

  /**
   * Usa `/admin/versions/options`, que devuelve el catálogo completo. Antes esto
   * pedía `/versions?pageSize=50` y las versiones más allá de la 50 no se podían
   * seleccionar.
   */
  private async loadVersions(): Promise<void> {
    try {
      this.versions.set(await this.optionsCache.get<VersionOption>('/admin/versions/options'));
    } catch (e) {
      this.optionsError.set((e as Error).message);
    }
  }

  onVersionChange(versionId: string): void {
    this.selectedVersion.set(versionId);
    if (versionId) {
      this.crud.onSearch(this.crud.search());
    }
  }

  formatPrice(clp: number): string {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      maximumFractionDigits: 0,
    }).format(clp);
  }
}

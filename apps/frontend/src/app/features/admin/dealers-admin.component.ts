import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AdminFeedbackService } from '../../core/admin-feedback.service';
import { ApiService } from '../../core/api.service';
import { toAbsoluteUploadUrl } from '../../core/upload-url';
import { SearchInputComponent } from '../../shared/ui/search-input.component';
import { AdminEditDialogComponent } from './admin-edit-dialog.component';
import { sortItems, type SortDir } from './sort-utils';

interface DealerRow { id: string; name: string; url: string; logoUrl: string | null; }
type SortKey = 'name';

@Component({
  selector: 'app-dealers-admin',
  imports: [AdminEditDialogComponent, SearchInputComponent, MatButtonModule, MatIconModule],
  templateUrl: './dealers-admin.component.html',
  styleUrl: './dealers-admin.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DealersAdminComponent {
  private api = inject(ApiService);
  private feedback = inject(AdminFeedbackService);

  readonly items = signal<DealerRow[]>([]);
  readonly search = signal('');
  readonly dialogEntity = signal<DealerRow | null | undefined>(undefined);
  readonly dialogMode = computed(() => (this.dialogEntity() === undefined ? 'closed' : 'open'));
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly sortKey = signal<SortKey | null>(null);
  readonly sortDir = signal<SortDir>('asc');

  readonly displayed = computed<DealerRow[]>(() => {
    const q = this.search().trim().toLowerCase();
    const filtered = q ? this.items().filter((d) => d.name.toLowerCase().includes(q)) : this.items();
    return sortItems(filtered, this.sortKey(), this.sortDir(), (d, k) => d[k as SortKey]);
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await this.api.get<{ data: DealerRow[] }>('/admin/dealers').catch(async () => {
        const pub = await this.api.get<{ data: DealerRow[] }>('/dealers');
        return pub;
      });
      this.items.set(res.data);
    } catch (e) {
      this.error.set((e as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  openCreate(): void {
    this.dialogEntity.set(null);
  }
  openEdit(row: DealerRow): void {
    this.dialogEntity.set(row);
  }
  closeDialog(): void {
    this.dialogEntity.set(undefined);
  }

  async onSave(value: Record<string, unknown>): Promise<void> {
    const e = this.dialogEntity();
    try {
      if (e) {
        await this.api.patch(`/admin/dealers/${e.id}`, value);
        this.feedback.success(`Concesionario "${value['name']}" actualizado`);
      } else {
        await this.api.post(`/admin/dealers`, value);
        this.feedback.success(`Concesionario "${value['name']}" creado`);
      }
      this.dialogEntity.set(undefined);
      await this.load();
    } catch (err) {
      const msg = (err as Error).message;
      this.error.set(msg);
      this.feedback.error(msg);
    }
  }

  async confirmDelete(row: DealerRow): Promise<void> {
    if (!confirm(`¿Eliminar concesionario "${row.name}"?`)) return;
    try {
      await this.api.delete(`/admin/dealers/${row.id}`);
      this.feedback.success(`Concesionario "${row.name}" eliminado`);
      await this.load();
    } catch (err) {
      const msg = (err as Error).message;
      this.error.set(msg);
      this.feedback.error(msg);
    }
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  toggleSort(key: SortKey): void {
    if (this.sortKey() === key) {
      this.sortDir.update((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      this.sortKey.set(key);
      this.sortDir.set('asc');
    }
  }

  logoSrc(url: string | null | undefined): string | null {
    return toAbsoluteUploadUrl(url);
  }
}
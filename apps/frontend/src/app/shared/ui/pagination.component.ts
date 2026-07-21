import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

@Component({
  selector: 'app-pagination',
  imports: [MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="flex flex-wrap items-center justify-between gap-3 py-2 text-sm" aria-label="Paginación">
      <p class="text-ink-muted">
        Página {{ meta().page }} de {{ meta().totalPages }} · {{ meta().total }} resultados
      </p>
      <div class="flex items-center gap-2">
        <label class="flex items-center gap-1">
          <span class="text-ink-muted">Por página:</span>
          <select
            class="page-size-select"
            [value]="meta().pageSize"
            (change)="onPageSizeChange($event)"
          >
            @for (opt of pageSizeOptions; track opt) {
              <option [value]="opt">{{ opt }}</option>
            }
          </select>
        </label>
        <button
          mat-icon-button
          type="button"
          [disabled]="meta().page <= 1 || loading()"
          (click)="prevPage()"
          aria-label="Página anterior"
        >
          <mat-icon>chevron_left</mat-icon>
        </button>
        <button
          mat-icon-button
          type="button"
          [disabled]="meta().page >= meta().totalPages || loading()"
          (click)="nextPage()"
          aria-label="Página siguiente"
        >
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
    </nav>
  `,
  styles: [
    `
      .page-size-select {
        background: transparent;
        border: 1px solid var(--c-border, #cbd5e1);
        border-radius: 6px;
        padding: 2px 6px;
        font-size: 0.875rem;
      }
    `,
  ],
})
export class PaginationComponent {
  readonly meta = input.required<PageMeta>();
  readonly loading = input<boolean>(false);
  readonly pageChange = output<number>();
  readonly pageSizeChange = output<number>();

  readonly pageSizeOptions = [10, 25, 50, 100];

  prevPage(): void {
    const m = this.meta();
    if (m.page > 1) this.pageChange.emit(m.page - 1);
  }
  nextPage(): void {
    const m = this.meta();
    if (m.page < m.totalPages) this.pageChange.emit(m.page + 1);
  }
  onPageSizeChange(event: Event): void {
    const value = Number.parseInt((event.target as HTMLSelectElement).value, 10);
    if (Number.isFinite(value)) this.pageSizeChange.emit(value);
  }
}

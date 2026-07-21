import { signal, type WritableSignal } from '@angular/core';
import type { PageMeta, PagedResponse } from './pagination.types';

/**
 * Small composable that holds the pagination/search state for an admin list.
 * Components can read/write its fields and call `applyResponse` after a fetch.
 */
export class AdminPagedListState {
  readonly page: WritableSignal<number> = signal(1);
  readonly pageSize: WritableSignal<number> = signal(25);
  readonly pagination: WritableSignal<PageMeta> = signal({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });

  applyResponse<T>(res: PagedResponse<T[]>): T[] {
    this.pagination.set(res.pagination);
    return res.data;
  }

  buildParams(): Record<string, string | number> {
    return { page: this.page(), pageSize: this.pageSize() };
  }

  setSearchParams(params: Record<string, string | number>, q: string): void {
    if (q.trim().length > 0) params['q'] = q.trim();
  }

  onSearch(): void {
    this.page.set(1);
  }

  onPageChange(page: number): void {
    this.page.set(page);
  }

  onPageSizeChange(pageSize: number): void {
    this.pageSize.set(pageSize);
    this.page.set(1);
  }
}

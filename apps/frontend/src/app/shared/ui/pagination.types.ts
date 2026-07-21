export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PagedResponse<T> {
  data: T;
  pagination: PageMeta;
  error: null;
}

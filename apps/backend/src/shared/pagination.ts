import type { Response } from "express";

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 100;

export type PaginationParams = {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
};

export type PageMeta = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PagedResponse<T> = {
  data: T;
  pagination: PageMeta;
  error: null;
};

export const parsePagination = (
  rawPage: unknown,
  rawPageSize: unknown,
): PaginationParams => {
  const page = clampInt(rawPage, 1, DEFAULT_PAGE);
  const pageSize = clampInt(rawPageSize, 1, MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE);
  return {
    page,
    pageSize,
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
};

const clampInt = (
  raw: unknown,
  min: number,
  max: number,
  fallback?: number,
): number => {
  const n = typeof raw === "string" ? Number.parseInt(raw, 10) : Number(raw);
  if (!Number.isFinite(n)) return fallback ?? min;
  return Math.min(Math.max(Math.trunc(n), min), max);
};

export const pagedResponse = <T>(
  rows: T[],
  total: number,
  params: PaginationParams,
): PagedResponse<T[]> => ({
  data: rows,
  pagination: {
    page: params.page,
    pageSize: params.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
  },
  error: null,
});

export const sendPaged = <T>(
  res: Response,
  rows: T[],
  total: number,
  params: PaginationParams,
) => {
  res.json(pagedResponse(rows, total, params));
};

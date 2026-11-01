export type SortDirection = "asc" | "desc";

export interface SortParams<F extends string = string> {
  field: F;
  direction: SortDirection;
}

export interface PaginationParams<F extends string = string> {
  page: number;
  pageSize: number;
  sort?: SortParams<F>;
}

export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export const DEFAULT_PAGE = 1;
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

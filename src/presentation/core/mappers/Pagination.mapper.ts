import { PaginatedResult } from "@/domain/core/pagination/Pagination";
import { PaginatedResponse } from "../responses/PaginatedResponse";

export function toPaginatedResponse<E, D>(
  result: PaginatedResult<E>,
  mapItem: (entity: E) => D,
): PaginatedResponse<D> {
  return {
    data: result.items.map(mapItem),
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
  };
}

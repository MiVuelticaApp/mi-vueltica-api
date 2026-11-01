import { z } from "zod";
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  PaginationParams,
  SortParams,
} from "@/domain/core/pagination/Pagination";

/**
 * Builds the query schema for paginated list endpoints.
 *
 *   ?page=2&pageSize=50&sort=name      (ascending)
 *   ?page=2&pageSize=50&sort=-createdAt (descending)
 *
 * `sortFields` is the whitelist of sortable fields for the endpoint. Extra filters can be
 * added with `.extend()`; unknown query keys are ignored rather than rejected.
 */
export function createPaginationQuerySchema<const F extends readonly [string, ...string[]]>(sortFields: F) {
  return z.object({
    page: z.coerce
      .number({ error: "La página debe ser un número" })
      .int("La página debe ser un número entero")
      .min(1, "La página debe ser mayor o igual a 1")
      .default(DEFAULT_PAGE),
    pageSize: z.coerce
      .number({ error: "El tamaño de página debe ser un número" })
      .int("El tamaño de página debe ser un número entero")
      .min(1, "El tamaño de página debe ser mayor o igual a 1")
      .max(MAX_PAGE_SIZE, `El tamaño de página no puede ser mayor a ${MAX_PAGE_SIZE}`)
      .default(DEFAULT_PAGE_SIZE),
    sort: z
      .string()
      .refine(
        (value) => (sortFields as readonly string[]).includes(value.startsWith("-") ? value.slice(1) : value),
        { error: `El orden debe ser uno de: ${sortFields.join(", ")} (use "-" para descendente)` },
      )
      .transform((value): SortParams<F[number]> =>
        value.startsWith("-")
          ? { field: value.slice(1), direction: "desc" }
          : { field: value, direction: "asc" },
      )
      .optional(),
  });
}

export type PaginationQuery<F extends string = string> = {
  page: number;
  pageSize: number;
  sort?: SortParams<F>;
};

/** Maps a parsed pagination query to the domain `PaginationParams`. */
export function toPaginationParams<F extends string>(query: PaginationQuery<F>): PaginationParams<F> {
  return { page: query.page, pageSize: query.pageSize, sort: query.sort };
}

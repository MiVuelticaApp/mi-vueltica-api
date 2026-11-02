import { Canton } from "@/domain/geography/entities/Canton";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export const CANTON_SORT_FIELDS = ["id", "name"] as const;

export interface ICantonRepository {
  /** Cantons of one province. Default order is `id` ascending. */
  listByProvince(provinceId: number, params: PaginationParams): Promise<PaginatedResult<Canton>>;
  find(id: number): Promise<Canton | null>;
  /** Name uniqueness is per province (`@@unique([provinceId, name])`). */
  findByName(provinceId: number, name: string): Promise<Canton | null>;
  /** Persists a new canton with its client-provided INEC id. */
  create(canton: Canton): Promise<Canton>;
  update(canton: Canton): Promise<void>;
  delete(id: number): Promise<void>;
  /** Places referencing the canton (`Place.cantonId` is ON DELETE RESTRICT). */
  countPlaces(id: number): Promise<number>;
}

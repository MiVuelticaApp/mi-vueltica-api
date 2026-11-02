import { Province } from "@/domain/geography/entities/Province";
import { ProvinceListItem } from "@/domain/geography/entities/ProvinceListItem";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface ProvinceListOptions {
  includeCantons?: boolean;
}

export interface IProvinceRepository {
  list(params: PaginationParams, options?: ProvinceListOptions): Promise<PaginatedResult<ProvinceListItem>>;
  find(id: number): Promise<Province | null>;
  findByName(name: string): Promise<Province | null>;
  /** Persists a new province with its client-provided INEC id. */
  create(province: Province): Promise<Province>;
  update(province: Province): Promise<void>;
  delete(id: number): Promise<void>;
  countCantons(id: number): Promise<number>;
}

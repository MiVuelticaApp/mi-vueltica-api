import { Canton } from "@/domain/geography/entities/Canton";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface CreateCantonInput {
  id: number;
  provinceId: number;
  name: string;
}

export interface ICantonService {
  /** 404 `ProvinceNotFoundError` when the province does not exist. */
  listByProvince(provinceId: number, params: PaginationParams): Promise<PaginatedResult<Canton>>;
  get(id: number): Promise<Canton>;
  create(input: CreateCantonInput): Promise<Canton>;
  /** Only the name can change: the province is encoded in the INEC id. */
  update(id: number, name: string): Promise<Canton>;
  delete(id: number): Promise<void>;
}

import { Province } from "@/domain/geography/entities/Province";
import { ProvinceListItem } from "@/domain/geography/entities/ProvinceListItem";
import { ProvinceListOptions } from "@/domain/geography/repositories/IProvinceRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface CreateProvinceInput {
  id: number;
  name: string;
}

export interface IProvinceService {
  list(params: PaginationParams, options?: ProvinceListOptions): Promise<PaginatedResult<ProvinceListItem>>;
  get(id: number): Promise<Province>;
  create(input: CreateProvinceInput): Promise<Province>;
  update(id: number, name: string): Promise<Province>;
  delete(id: number): Promise<void>;
}

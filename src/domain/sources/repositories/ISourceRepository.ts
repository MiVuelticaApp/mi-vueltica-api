import { Source } from "@/domain/sources/entities/Source";
import { SourceType } from "@/domain/sources/valueObjects/sourceType.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface SourceListFilters {
  type?: SourceType;
  search?: string;
}

export interface SourceUsage {
  places: number;
  events: number;
}

export interface CreateSourceData {
  name: string;
  url: string | null;
  type: SourceType;
}

export interface ISourceRepository {
  list(params: PaginationParams, filters?: SourceListFilters): Promise<PaginatedResult<Source>>;
  find(id: string): Promise<Source | null>;
  create(data: CreateSourceData): Promise<Source>;
  update(source: Source): Promise<void>;
  delete(id: string): Promise<void>;
  countUsages(id: string): Promise<SourceUsage>;
}

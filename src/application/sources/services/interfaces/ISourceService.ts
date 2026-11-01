import { Source } from "@/domain/sources/entities/Source";
import { SourceListFilters } from "@/domain/sources/repositories/ISourceRepository";
import { SourceType } from "@/domain/sources/valueObjects/sourceType.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface SourceInput {
  name: string;
  url?: string | null;
  type: SourceType;
}

export interface SourceUpdateInput extends SourceInput {
  /** `undefined` keeps the current value; `null` clears it. */
  lastCrawledAt?: Date | null;
}

export interface ISourceService {
  list(params: PaginationParams, filters?: SourceListFilters): Promise<PaginatedResult<Source>>;
  get(id: string): Promise<Source>;
  create(data: SourceInput): Promise<Source>;
  update(id: string, data: SourceUpdateInput): Promise<Source>;
  delete(id: string): Promise<void>;
  markCrawled(id: string, at?: Date): Promise<Source>;
}

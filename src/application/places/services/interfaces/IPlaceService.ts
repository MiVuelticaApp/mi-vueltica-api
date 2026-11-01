import { Place, PlaceData } from "@/domain/places/entities/Place";
import { PlaceDetail } from "@/domain/places/entities/PlaceDetail";
import { PlaceListFilters } from "@/domain/places/repositories/IPlaceRepository";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export type PlaceInput = PlaceData;

export interface PlaceVisibilityOptions {
  /** Only places in these statuses are visible. `undefined` means every status. */
  statuses?: ContentStatus[];
}

export interface IPlaceService {
  list(params: PaginationParams, filters?: PlaceListFilters): Promise<PaginatedResult<Place>>;
  /** Throws `PlaceNotFoundError` when missing or hidden by `options.statuses`. */
  get(id: string, options?: PlaceVisibilityOptions): Promise<PlaceDetail>;
  create(data: PlaceInput): Promise<Place>;
  update(id: string, data: PlaceInput): Promise<Place>;
  changeStatus(id: string, status: ContentStatus): Promise<Place>;
  delete(id: string): Promise<void>;
}

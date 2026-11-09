import { CreatePlanOptions } from "@/domain/community/valueObjects/planCommunity.valueObject";
import { Place, NormalizedPlaceData } from "@/domain/places/entities/Place";
import { PlaceDetail } from "@/domain/places/entities/PlaceDetail";
import { PlaceCard } from "@/domain/places/entities/PlaceCard";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PlanConditionsFilters } from "@/domain/places/valueObjects/planConditions.valueObject";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { BoundingBox, GeoFilters, RadiusFilter } from "@/domain/core/geo/GeoFilters";

export type { BoundingBox, RadiusFilter };

/** Price/audience/accessibility filters come from `PlanConditionsFilters`; `bbox` / `radius` from `GeoFilters`. */
export interface PlaceListFilters extends PlanConditionsFilters, GeoFilters {
  cantonId?: number;
  provinceId?: number;
  categoryId?: number;
  targetAudience?: TargetAudience;
  /** Restricts to these statuses. `undefined` means every status. */
  statuses?: ContentStatus[];
  /** Substring match on name, description or address. */
  search?: string;
}

export interface IPlaceRepository {
  /** Each item carries its card stats (PUBLISHED rating and cover photo). */
  list(params: PaginationParams, filters?: PlaceListFilters): Promise<PaginatedResult<PlaceCard>>;
  find(id: string): Promise<Place | null>;
  findDetail(id: string): Promise<PlaceDetail | null>;
  /** New places are always created as PENDING. */
  /** Inserts as PENDING. `options.authorId`: the submitter, when created from a community submission. */
  create(data: NormalizedPlaceData, options?: CreatePlanOptions): Promise<Place>;
  update(place: Place): Promise<void>;
  delete(id: string): Promise<void>;
  /**
   * Whether a canton with this id exists. There is no geography module yet, so this
   * lives here; it can move to a geography repository later.
   */
  cantonExists(id: number): Promise<boolean>;
}

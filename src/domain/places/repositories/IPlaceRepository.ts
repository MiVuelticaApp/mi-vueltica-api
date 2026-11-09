import { CreatePlanOptions } from "@/domain/community/valueObjects/planCommunity.valueObject";
import { Place, NormalizedPlaceData } from "@/domain/places/entities/Place";
import { PlaceDetail } from "@/domain/places/entities/PlaceDetail";
import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PlanConditionsFilters } from "@/domain/places/valueObjects/planConditions.valueObject";
import { TargetAudience } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface BoundingBox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface RadiusFilter {
  lat: number;
  lng: number;
  radiusKm: number;
}

/** Price/audience/accessibility filters come from `PlanConditionsFilters`. */
export interface PlaceListFilters extends PlanConditionsFilters {
  cantonId?: number;
  provinceId?: number;
  categoryId?: number;
  targetAudience?: TargetAudience;
  /** Restricts to these statuses. `undefined` means every status. */
  statuses?: ContentStatus[];
  /** Substring match on name, description or address. */
  search?: string;
  /** Mutually exclusive with `radius`. */
  bbox?: BoundingBox;
  /** Mutually exclusive with `bbox`. */
  radius?: RadiusFilter;
}

export interface IPlaceRepository {
  list(params: PaginationParams, filters?: PlaceListFilters): Promise<PaginatedResult<Place>>;
  find(id: string): Promise<Place | null>;
  findDetail(id: string): Promise<PlaceDetail | null>;
  /** New places are always created as PENDING. */
  /** Inserts as PENDING. `options.authorId`: the submitter, when created from a community submission. */
  create(data: NormalizedPlaceData, options?: CreatePlanOptions): Promise<Place>;
  update(place: Place): Promise<void>;
  delete(id: string): Promise<void>;
}

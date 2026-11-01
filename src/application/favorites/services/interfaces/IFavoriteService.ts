import { FavoritePlace } from "@/domain/favorites/entities/FavoritePlace";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface IFavoriteService {
  list(userId: string, params: PaginationParams): Promise<PaginatedResult<FavoritePlace>>;
  /** Idempotent. Throws `PlaceNotFoundError` unless the place exists and is PUBLISHED. */
  add(userId: string, placeId: string): Promise<void>;
  /** Idempotent: succeeds whether or not the favorite (or the place) exists. */
  remove(userId: string, placeId: string): Promise<void>;
  isFavorite(userId: string, placeId: string): Promise<boolean>;
}

import { FavoriteItem, FavoriteTarget } from "@/domain/favorites/entities/FavoriteItem";
import { FavoriteListFilters } from "@/domain/favorites/repositories/IFavoriteRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface IFavoriteService {
  /** Only favorites whose place/event is PUBLISHED; an event's place summary follows the public visibility rule. */
  list(userId: string, params: PaginationParams, filters?: FavoriteListFilters): Promise<PaginatedResult<FavoriteItem>>;
  /**
   * Idempotent. Throws `PlaceNotFoundError` / `EventNotFoundError` unless the target exists and is PUBLISHED.
   */
  add(userId: string, target: FavoriteTarget): Promise<void>;
  /** Idempotent: succeeds whether or not the favorite (or the target) exists. */
  remove(userId: string, target: FavoriteTarget): Promise<void>;
  isFavorite(userId: string, target: FavoriteTarget): Promise<boolean>;
}

import { FavoriteItem, FavoriteTarget, FavoriteType } from "../entities/FavoriteItem";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export const FAVORITE_SORT_FIELDS = ["createdAt"] as const;

export interface FavoriteListFilters {
  /** Only places or only events; both when omitted. */
  type?: FavoriteType;
  /** Hides the saved plans authored by these users (the viewer's blocked people, #17). Authorless plans stay. */
  excludeAuthorIds?: string[];
}

export interface IFavoriteRepository {
  /**
   * Favorites whose place or event is currently PUBLISHED (counted and listed). Default order is
   * `createdAt` descending (most recently favorited first). Event items carry the place summary as
   * loaded (any status); the service applies the visibility rule.
   */
  listForUser(userId: string, params: PaginationParams, filters?: FavoriteListFilters): Promise<PaginatedResult<FavoriteItem>>;
  /** Idempotent: an existing favorite is left untouched (keeps its original `createdAt`). */
  add(userId: string, target: FavoriteTarget): Promise<void>;
  /** Idempotent: removing a non-existent favorite is not an error. */
  remove(userId: string, target: FavoriteTarget): Promise<void>;
  exists(userId: string, target: FavoriteTarget): Promise<boolean>;
}

import { FavoritePlace } from "../entities/FavoritePlace";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export const FAVORITE_SORT_FIELDS = ["createdAt"] as const;

export interface IFavoriteRepository {
  /**
   * Favorites whose place is currently PUBLISHED (counted and listed). Default order is
   * `createdAt` descending (most recently favorited first).
   */
  listForUser(userId: string, params: PaginationParams): Promise<PaginatedResult<FavoritePlace>>;
  /** Idempotent: an existing favorite is left untouched (keeps its original `createdAt`). */
  add(userId: string, placeId: string): Promise<void>;
  /** Idempotent: removing a non-existent favorite is not an error. */
  remove(userId: string, placeId: string): Promise<void>;
  exists(userId: string, placeId: string): Promise<boolean>;
}

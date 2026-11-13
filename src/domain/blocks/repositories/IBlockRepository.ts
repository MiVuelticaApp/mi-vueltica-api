import { BlockedUser } from "../entities/BlockedUser";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export const BLOCK_SORT_FIELDS = ["createdAt"] as const;

export interface IBlockRepository {
  /** Idempotent: blocking someone already blocked keeps the original block (and its `createdAt`). */
  add(blockerId: string, blockedId: string): Promise<void>;
  /** Idempotent: only a block of `blockerId` is deleted; a missing or someone else's block is ignored. */
  remove(blockerId: string, blockId: string): Promise<void>;
  /** The caller's blocks, newest first unless a direction is given. */
  listForUser(blockerId: string, params: PaginationParams): Promise<PaginatedResult<BlockedUser>>;
  /** Ids of everyone the user has blocked, to hide their plans and reviews. */
  blockedUserIds(blockerId: string): Promise<string[]>;
}

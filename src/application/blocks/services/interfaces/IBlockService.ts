import { BlockedUser, BlockTarget } from "@/domain/blocks/entities/BlockedUser";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface IBlockService {
  /**
   * Blocks the author of a PUBLISHED place, event or review. Idempotent. Throws the target's not-found error
   * (404) unless it exists and is PUBLISHED, `BlockTargetWithoutAuthorError` (404) when nobody is behind it and
   * `CannotBlockYourselfError` (422) for the caller's own content.
   */
  blockAuthor(blockerId: string, target: BlockTarget): Promise<void>;
  list(blockerId: string, params: PaginationParams): Promise<PaginatedResult<BlockedUser>>;
  /** Idempotent: succeeds whether or not the block exists. */
  unblock(blockerId: string, blockId: string): Promise<void>;
  /** The blocked users' ids, to filter what the viewer sees. `[]` without a viewer (no query). */
  blockedUserIds(viewerId?: string): Promise<string[]>;
}

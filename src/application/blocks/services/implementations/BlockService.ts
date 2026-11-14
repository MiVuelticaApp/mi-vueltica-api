import { BlockedUser, BlockTarget } from "@/domain/blocks/entities/BlockedUser";
import { IBlockRepository } from "@/domain/blocks/repositories/IBlockRepository";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { IEventRepository } from "@/domain/events/repositories/IEventRepository";
import { IReviewRepository } from "@/domain/reviews/repositories/IReviewRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { PlaceNotFoundError } from "@/application/places/errors/PlaceNotFoundError";
import { EventNotFoundError } from "@/application/events/errors/EventNotFoundError";
import { ReviewNotFoundError } from "@/application/reviews/errors/ReviewNotFoundError";
import { BlockTargetWithoutAuthorError } from "../../errors/BlockTargetWithoutAuthorError";
import { CannotBlockYourselfError } from "../../errors/CannotBlockYourselfError";
import { IBlockService } from "../interfaces/IBlockService";

export class BlockService implements IBlockService {
  constructor(
    private readonly blockRepository: IBlockRepository,
    private readonly placeRepository: IPlaceRepository,
    private readonly eventRepository: IEventRepository,
    private readonly reviewRepository: IReviewRepository,
  ) {}

  async blockAuthor(blockerId: string, target: BlockTarget): Promise<void> {
    const authorId = await this.authorOf(target);
    if (authorId === null) throw new BlockTargetWithoutAuthorError();
    if (authorId === blockerId) throw new CannotBlockYourselfError();
    await this.blockRepository.add(blockerId, authorId);
  }

  list(blockerId: string, params: PaginationParams): Promise<PaginatedResult<BlockedUser>> {
    return this.blockRepository.listForUser(blockerId, params);
  }

  unblock(blockerId: string, blockId: string): Promise<void> {
    return this.blockRepository.remove(blockerId, blockId);
  }

  async blockedUserIds(viewerId?: string): Promise<string[]> {
    return viewerId ? this.blockRepository.blockedUserIds(viewerId) : [];
  }

  /**
   * The person behind a PUBLISHED target (`null` when nobody is). Anything not PUBLISHED is a 404, so blocking
   * never reveals who wrote a hidden or pending plan.
   */
  private async authorOf(target: BlockTarget): Promise<string | null> {
    switch (target.type) {
      case "PLACE": {
        const place = await this.placeRepository.find(target.id);
        if (!place || place.status !== "PUBLISHED") throw new PlaceNotFoundError();
        return place.authorId;
      }
      case "EVENT": {
        const event = await this.eventRepository.find(target.id);
        if (!event || event.status !== "PUBLISHED") throw new EventNotFoundError();
        return event.authorId;
      }
      case "REVIEW": {
        const review = await this.reviewRepository.find(target.id);
        if (!review || review.status !== "PUBLISHED") throw new ReviewNotFoundError();
        return review.userId;
      }
    }
  }
}

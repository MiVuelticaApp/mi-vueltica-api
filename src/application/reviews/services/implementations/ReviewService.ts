import { IReviewRepository } from "@/domain/reviews/repositories/IReviewRepository";
import { Review, ReviewData, normalizeReviewData } from "@/domain/reviews/entities/Review";
import { ReviewDetail } from "@/domain/reviews/entities/ReviewDetail";
import { ReviewTarget } from "@/domain/reviews/valueObjects/reviewTarget.valueObject";
import { WENT_WITH_BY_AUDIENCE } from "@/domain/reviews/valueObjects/reviewExperience.valueObject";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { IEventRepository } from "@/domain/events/repositories/IEventRepository";
import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams, SortDirection } from "@/domain/core/pagination/Pagination";
import { PlaceNotFoundError } from "@/application/places/errors/PlaceNotFoundError";
import { EventNotFoundError } from "@/application/events/errors/EventNotFoundError";
import { ForbiddenError } from "@/application/core/errors/ForbiddenError";
import { IUploadService } from "@/application/uploads/services/interfaces/IUploadService";
import { IReputationRepository } from "@/domain/reputation/repositories/IReputationRepository";
import { IReviewVoteUnitOfWork } from "@/domain/reviews/unitsOfWork/ReviewVoteUnitOfWork";
import { reputationCause } from "@/domain/reputation/entities/ReputationEvent";
import { ReputationLedger } from "@/application/reputation/services/ReputationLedger";
import { ReviewNotFoundError } from "../../errors/ReviewNotFoundError";
import { ReviewAlreadyExistsError } from "../../errors/ReviewAlreadyExistsError";
import {
  IReviewService,
  ListTargetReviewsOptions,
  ReviewActor,
  ReviewQueueFilters,
  TargetReviewList,
} from "../interfaces/IReviewService";

/**
 * Locks the voter and the author, always in id order: a vote and its undo for the same author run one
 * after the other, and two people voting each other's reviews at the same time cannot deadlock (the vote
 * row's foreign key takes a shared lock on the voter; see ReputationLedger).
 */
async function lockVoterAndAuthor(reputation: IReputationRepository, voterId: string, authorId: string): Promise<void> {
  for (const id of [voterId, authorId].sort()) await reputation.lockPoints(id);
}

const NEWEST_FIRST = { field: "createdAt", direction: "desc" as SortDirection };
const OLDEST_FIRST = { field: "createdAt", direction: "asc" as SortDirection };

export class ReviewService implements IReviewService {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly placeRepository: IPlaceRepository,
    private readonly eventRepository: IEventRepository,
    private readonly uploadService: IUploadService,
    private readonly voteUOW: IReviewVoteUnitOfWork,
  ) {}

  async listForTarget(
    target: ReviewTarget,
    params: PaginationParams,
    options: ListTargetReviewsOptions,
  ): Promise<TargetReviewList> {
    await this.assertTargetVisible(target, options.canSeeUnpublishedTarget);
    const [page, summary] = await Promise.all([
      this.reviewRepository.list(
        { ...params, sort: params.sort ?? NEWEST_FIRST },
        {
          ...(target.type === "PLACE" ? { placeId: target.id } : { eventId: target.id }),
          statuses: ["PUBLISHED"],
          includePendingOf: options.viewerId,
          wentWith: options.audience ? WENT_WITH_BY_AUDIENCE[options.audience] : undefined,
          withPhotos: options.withPhotos,
        },
        options.viewerId,
      ),
      this.reviewRepository.summary(target),
    ]);
    return { page, summary };
  }

  async listMine(userId: string, params: PaginationParams): Promise<PaginatedResult<ReviewDetail>> {
    return this.reviewRepository.list({ ...params, sort: params.sort ?? NEWEST_FIRST }, { userId }, userId);
  }

  async list(params: PaginationParams, filters: ReviewQueueFilters, viewerId?: string): Promise<PaginatedResult<ReviewDetail>> {
    // Queue: oldest first, so moderators work through it in arrival order.
    return this.reviewRepository.list({ ...params, sort: params.sort ?? OLDEST_FIRST }, filters, viewerId);
  }

  async create(userId: string, target: ReviewTarget, data: ReviewData): Promise<ReviewDetail> {
    // Validate before touching the DB (400 instead of a failed query).
    const normalized = normalizeReviewData(data);
    await this.assertTargetVisible(target, false);
    // Friendly 409; a concurrent duplicate still fails on the unique index (P2002 → 409).
    if (await this.reviewRepository.existsForUserAndTarget(userId, target)) {
      throw new ReviewAlreadyExistsError(
        target.type === "PLACE" ? "Ya escribiste una reseña para este lugar" : "Ya escribiste una reseña para este evento",
      );
    }
    const photos = await this.uploadService.resolveOwnUploads(userId, normalized.photos);
    return this.reviewRepository.create({ ...normalized, photos, userId, target });
  }

  async update(userId: string, id: string, data: ReviewData): Promise<ReviewDetail> {
    const review = await this.getOrThrow(id);
    if (!review.isOwnedBy(userId)) throw new ForbiddenError("Solo el autor puede editar esta reseña");
    const normalized = review.edit(data);
    await this.assertTargetVisible(review.target, false);
    const photos = await this.uploadService.resolveOwnUploads(userId, normalized.photos);
    return this.reviewRepository.save(review, photos, userId);
  }

  async delete(actor: ReviewActor, id: string): Promise<void> {
    const review = await this.getOrThrow(id);
    const privileged = actor.role === "MODERATOR" || actor.role === "ADMIN";
    if (!privileged && !review.isOwnedBy(actor.id)) {
      throw new ForbiddenError("Solo el autor o un moderador puede eliminar esta reseña");
    }
    const deleted = await this.reviewRepository.delete(id);
    if (!deleted) throw new ReviewNotFoundError();
  }

  async changeStatus(id: string, status: ContentStatus, viewerId?: string): Promise<ReviewDetail> {
    const review = await this.getOrThrow(id);
    review.changeStatus(parseContentStatus(status));
    return this.reviewRepository.save(review, undefined, viewerId);
  }

  async markUseful(userId: string, id: string): Promise<ReviewDetail> {
    const review = await this.getPublishedOrThrow(id);
    if (review.isOwnedBy(userId)) throw new ForbiddenError("No puedes marcar como útil tu propia reseña");
    const authorId = review.userId;
    await this.voteUOW.runInTransaction(async (ctx) => {
      const reputation = ctx.getReputationRepository();
      if (authorId) await lockVoterAndAuthor(reputation, userId, authorId);
      await ctx.getReviewRepository().addUsefulVote(id, userId);
      if (authorId) {
        await ReputationLedger.award(reputation, {
          userId: authorId,
          kind: "reviewUseful",
          causeKey: reputationCause.usefulVote(id, userId),
          at: new Date(),
        });
      }
    });
    return this.getDetailOrThrow(id, userId);
  }

  async unmarkUseful(userId: string, id: string): Promise<ReviewDetail> {
    const review = await this.getPublishedOrThrow(id);
    const authorId = review.userId;
    await this.voteUOW.runInTransaction(async (ctx) => {
      const reputation = ctx.getReputationRepository();
      if (authorId) await lockVoterAndAuthor(reputation, userId, authorId);
      await ctx.getReviewRepository().removeUsefulVote(id, userId);
      // Taking the vote back takes the point back; voting again gives it again.
      if (authorId) await ReputationLedger.revoke(reputation, authorId, reputationCause.usefulVote(id, userId));
    });
    return this.getDetailOrThrow(id, userId);
  }

  private async getOrThrow(id: string): Promise<Review> {
    const review = await this.reviewRepository.find(id);
    if (!review) throw new ReviewNotFoundError();
    return review;
  }

  /** Votes only apply to public reviews; any other one is reported as not found. */
  private async getPublishedOrThrow(id: string): Promise<Review> {
    const review = await this.getOrThrow(id);
    if (review.status !== "PUBLISHED") throw new ReviewNotFoundError();
    return review;
  }

  private async getDetailOrThrow(id: string, viewerId: string): Promise<ReviewDetail> {
    // The review can be deleted between the vote and this read.
    const detail = await this.reviewRepository.findDetail(id, viewerId);
    if (!detail) throw new ReviewNotFoundError();
    return detail;
  }

  /**
   * The place / event must exist and be PUBLISHED (unless `canSeeUnpublished`); otherwise it is
   * reported as not found. Only PUBLISHED places / events can be reviewed.
   */
  private async assertTargetVisible(target: ReviewTarget, canSeeUnpublished: boolean): Promise<void> {
    if (target.type === "PLACE") {
      const place = await this.placeRepository.find(target.id);
      if (!place || (place.status !== "PUBLISHED" && !canSeeUnpublished)) throw new PlaceNotFoundError();
    } else {
      const event = await this.eventRepository.find(target.id);
      if (!event || (event.status !== "PUBLISHED" && !canSeeUnpublished)) throw new EventNotFoundError();
    }
  }
}

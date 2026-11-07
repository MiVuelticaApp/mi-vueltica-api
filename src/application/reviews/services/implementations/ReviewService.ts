import { IReviewRepository } from "@/domain/reviews/repositories/IReviewRepository";
import { Review, ReviewData, normalizeReviewData } from "@/domain/reviews/entities/Review";
import { ReviewDetail } from "@/domain/reviews/entities/ReviewDetail";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { ContentStatus, parseContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PaginatedResult, PaginationParams, SortDirection } from "@/domain/core/pagination/Pagination";
import { PlaceNotFoundError } from "@/application/places/errors/PlaceNotFoundError";
import { ForbiddenError } from "@/application/core/errors/ForbiddenError";
import { ReviewNotFoundError } from "../../errors/ReviewNotFoundError";
import { ReviewAlreadyExistsError } from "../../errors/ReviewAlreadyExistsError";
import {
  IReviewService,
  ListPlaceReviewsOptions,
  ReviewActor,
  ReviewQueueFilters,
} from "../interfaces/IReviewService";

const NEWEST_FIRST = { field: "createdAt", direction: "desc" as SortDirection };
const OLDEST_FIRST = { field: "createdAt", direction: "asc" as SortDirection };

export class ReviewService implements IReviewService {
  constructor(
    private readonly reviewRepository: IReviewRepository,
    private readonly placeRepository: IPlaceRepository,
  ) {}

  async listForPlace(
    placeId: string,
    params: PaginationParams,
    options: ListPlaceReviewsOptions,
  ): Promise<PaginatedResult<ReviewDetail>> {
    const place = await this.placeRepository.find(placeId);
    if (!place || (place.status !== "PUBLISHED" && !options.canSeeUnpublishedPlace)) {
      throw new PlaceNotFoundError();
    }
    return this.reviewRepository.list(
      { ...params, sort: params.sort ?? NEWEST_FIRST },
      { placeId, statuses: ["PUBLISHED"] },
    );
  }

  async listMine(userId: string, params: PaginationParams): Promise<PaginatedResult<ReviewDetail>> {
    return this.reviewRepository.list({ ...params, sort: params.sort ?? NEWEST_FIRST }, { userId });
  }

  async list(params: PaginationParams, filters: ReviewQueueFilters): Promise<PaginatedResult<ReviewDetail>> {
    // Queue: oldest first, so moderators work through it in arrival order.
    return this.reviewRepository.list({ ...params, sort: params.sort ?? OLDEST_FIRST }, filters);
  }

  async create(userId: string, placeId: string, data: ReviewData): Promise<ReviewDetail> {
    // Validate before touching the DB (400 instead of a failed query).
    const normalized = normalizeReviewData(data);
    await this.assertPlaceReviewable(placeId);
    // Friendly 409; a concurrent duplicate still fails on the unique index (P2002 → 409).
    if (await this.reviewRepository.existsForUserAndPlace(userId, placeId)) {
      throw new ReviewAlreadyExistsError();
    }
    return this.reviewRepository.create({ ...normalized, userId, placeId });
  }

  async update(userId: string, id: string, data: ReviewData): Promise<ReviewDetail> {
    const review = await this.getOrThrow(id);
    if (!review.isOwnedBy(userId)) throw new ForbiddenError("Solo el autor puede editar esta reseña");
    review.edit(data);
    await this.assertPlaceReviewable(review.placeId);
    return this.reviewRepository.save(review);
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

  async changeStatus(id: string, status: ContentStatus): Promise<ReviewDetail> {
    const review = await this.getOrThrow(id);
    review.changeStatus(parseContentStatus(status));
    return this.reviewRepository.save(review);
  }

  private async getOrThrow(id: string): Promise<Review> {
    const review = await this.reviewRepository.find(id);
    if (!review) throw new ReviewNotFoundError();
    return review;
  }

  /** Only PUBLISHED places can be reviewed; any other place is reported as not found. */
  private async assertPlaceReviewable(placeId: string): Promise<void> {
    const place = await this.placeRepository.find(placeId);
    if (!place || place.status !== "PUBLISHED") throw new PlaceNotFoundError();
  }
}

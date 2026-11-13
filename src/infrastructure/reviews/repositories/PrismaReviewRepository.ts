import { Review } from "@/domain/reviews/entities/Review";
import { ReviewDetail } from "@/domain/reviews/entities/ReviewDetail";
import { RatingSummary } from "@/domain/reviews/entities/RatingSummary";
import { ReviewTarget } from "@/domain/reviews/valueObjects/reviewTarget.valueObject";
import {
  CreateReviewData,
  IReviewRepository,
  ReviewListFilters,
  ReviewPhotoInput,
  ReviewSortField,
} from "@/domain/reviews/repositories/IReviewRepository";
import { PaginatedResult, PaginationParams, SortDirection } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import {
  PrismaReviewMapper,
  reviewDetailInclude,
  spentToDb,
  wentWithListToDb,
  wentWithToDb,
} from "../mappers/PrismaReviewMapper";
import { publishedRatingSummary } from "./ratingSummary";

function targetWhere(target: ReviewTarget): Prisma.ReviewWhereInput {
  return target.type === "PLACE" ? { placeId: target.id } : { eventId: target.id };
}

function orderByFor(field: ReviewSortField, direction: SortDirection): Prisma.ReviewOrderByWithRelationInput {
  switch (field) {
    case "usefulCount":
      return { usefulVotes: { _count: direction } };
    case "photoCount":
      return { photos: { _count: direction } };
    default:
      return { [field]: direction };
  }
}

function photoRows(photos: ReviewPhotoInput[]) {
  return photos.map((photo, position) => ({ uploadId: photo.uploadId, url: photo.url, position }));
}

export default class PrismaReviewRepository implements IReviewRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(
    params: PaginationParams,
    filters: ReviewListFilters,
    viewerId?: string,
  ): Promise<PaginatedResult<ReviewDetail>> {
    try {
      const base: Prisma.ReviewWhereInput = {
        placeId: filters.placeId,
        eventId: filters.eventId,
        userId: filters.userId,
        wentWith: filters.wentWith ? { in: wentWithListToDb(filters.wentWith) } : undefined,
        photos: filters.withPhotos ? { some: {} } : undefined,
      };
      const byStatus: Prisma.ReviewWhereInput = filters.statuses ? { status: { in: filters.statuses } } : {};
      // `userId NOT IN (...)` is NULL (so the row is dropped) when userId is NULL: keep authorless reviews explicitly.
      const notBlocked: Prisma.ReviewWhereInput[] = filters.excludeUserIds?.length
        ? [{ OR: [{ userId: null }, { userId: { notIn: filters.excludeUserIds } }] }]
        : [];
      const where: Prisma.ReviewWhereInput = {
        ...(filters.includePendingOf
          ? { ...base, OR: [byStatus, { userId: filters.includePendingOf, status: "PENDING" }] }
          : { ...base, ...byStatus }),
        ...(notBlocked.length > 0 ? { AND: notBlocked } : {}),
      };

      const sort = params.sort ?? { field: "createdAt", direction: "desc" };
      const orderBy: Prisma.ReviewOrderByWithRelationInput[] = [
        orderByFor(sort.field as ReviewSortField, sort.direction),
        // Ties (same votes, same photo count...) show the newest first; `id` keeps pages stable.
        ...(sort.field === "createdAt" ? [] : [{ createdAt: "desc" as const }]),
        { id: "asc" },
      ];
      const include = reviewDetailInclude(viewerId);
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) => tx.review.findMany({ where, include, skip: page.skip, take: page.take, orderBy }),
          count: (tx) => tx.review.count({ where }),
        },
        (row) => PrismaReviewMapper.toDetail(row, viewerId),
      );
    } catch (error) {
      console.error("Error listing reviews:", error);
      throw new DatabaseError("Could not list reviews", error);
    }
  }

  async find(id: string): Promise<Review | null> {
    try {
      const row = await this.client.review.findUnique({ where: { id } });
      return row ? PrismaReviewMapper.toDomain(row) : null;
    } catch (error) {
      console.error("Error finding review:", error);
      throw new DatabaseError("Could not find review", error);
    }
  }

  async findDetail(id: string, viewerId?: string): Promise<ReviewDetail | null> {
    try {
      const row = await this.client.review.findUnique({ where: { id }, include: reviewDetailInclude(viewerId) });
      return row ? PrismaReviewMapper.toDetail(row, viewerId) : null;
    } catch (error) {
      console.error("Error finding review:", error);
      throw new DatabaseError("Could not find review", error);
    }
  }

  async existsForUserAndTarget(userId: string, target: ReviewTarget): Promise<boolean> {
    try {
      return (await this.client.review.count({ where: { userId, ...targetWhere(target) } })) > 0;
    } catch (error) {
      console.error("Error checking review:", error);
      throw new DatabaseError("Could not check review", error);
    }
  }

  async create(data: CreateReviewData): Promise<ReviewDetail> {
    try {
      const row = await this.client.review.create({
        data: {
          userId: data.userId,
          placeId: data.target.type === "PLACE" ? data.target.id : null,
          eventId: data.target.type === "EVENT" ? data.target.id : null,
          rating: data.rating,
          comment: data.comment,
          wentWith: wentWithToDb(data.wentWith),
          spent: spentToDb(data.spent),
          status: "PENDING",
          // Nested create: the review and its photos are written in one transaction.
          photos: { create: photoRows(data.photos) },
        },
        include: reviewDetailInclude(data.userId),
      });
      return PrismaReviewMapper.toDetail(row, data.userId);
    } catch (error) {
      console.error("Error creating review:", error);
      throw new DatabaseInsertError("Could not create review", error);
    }
  }

  async save(review: Review, photos?: ReviewPhotoInput[], viewerId?: string): Promise<ReviewDetail> {
    try {
      const row = await this.client.review.update({
        where: { id: review.id },
        data: {
          rating: review.rating,
          comment: review.comment,
          wentWith: wentWithToDb(review.wentWith),
          spent: spentToDb(review.spent),
          status: review.status,
          // Nested writes run in the same transaction as the update.
          photos: photos ? { deleteMany: {}, create: photoRows(photos) } : undefined,
        },
        include: reviewDetailInclude(viewerId),
      });
      return PrismaReviewMapper.toDetail(row, viewerId);
    } catch (error) {
      console.error("Error updating review:", error);
      throw new DatabaseInsertError("Could not update review", error);
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const { count } = await this.client.review.deleteMany({ where: { id } });
      return count > 0;
    } catch (error) {
      console.error("Error deleting review:", error);
      throw new DatabaseError("Could not delete review", error);
    }
  }

  async summary(target: ReviewTarget): Promise<RatingSummary> {
    try {
      return await publishedRatingSummary(this.client, targetWhere(target));
    } catch (error) {
      console.error("Error summarizing reviews:", error);
      throw new DatabaseError("Could not summarize reviews", error);
    }
  }

  async addUsefulVote(reviewId: string, userId: string): Promise<void> {
    try {
      // One statement on the primary key, so repeated or concurrent votes never fail with P2002 or
      // MariaDB's 1020 (see PrismaDeviceRepository.register). Not `INSERT IGNORE`: that would also
      // turn foreign key errors (review deleted meanwhile) into warnings.
      await this.client.$executeRaw`
        INSERT INTO ReviewUsefulVote (reviewId, userId, createdAt)
        VALUES (${reviewId}, ${userId}, UTC_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE reviewId = reviewId
      `;
    } catch (error) {
      console.error("Error adding useful vote:", error);
      throw new DatabaseInsertError("Could not mark the review as useful", error);
    }
  }

  async removeUsefulVote(reviewId: string, userId: string): Promise<void> {
    try {
      await this.client.reviewUsefulVote.deleteMany({ where: { reviewId, userId } });
    } catch (error) {
      console.error("Error removing useful vote:", error);
      throw new DatabaseError("Could not unmark the review as useful", error);
    }
  }
}

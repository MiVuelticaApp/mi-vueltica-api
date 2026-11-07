import { Review } from "@/domain/reviews/entities/Review";
import { ReviewDetail } from "@/domain/reviews/entities/ReviewDetail";
import { CreateReviewData, IReviewRepository, ReviewListFilters } from "@/domain/reviews/repositories/IReviewRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaReviewMapper, REVIEW_DETAIL_INCLUDE } from "../mappers/PrismaReviewMapper";

export default class PrismaReviewRepository implements IReviewRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async list(params: PaginationParams, filters: ReviewListFilters): Promise<PaginatedResult<ReviewDetail>> {
    try {
      const where: Prisma.ReviewWhereInput = {
        placeId: filters.placeId,
        userId: filters.userId,
        status: filters.statuses ? { in: filters.statuses } : undefined,
      };
      const sort = params.sort ?? { field: "createdAt", direction: "desc" };
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.review.findMany({
              where,
              include: REVIEW_DETAIL_INCLUDE,
              skip: page.skip,
              take: page.take,
              // `id` keeps pages stable when two rows tie on the sort field.
              orderBy: [{ [sort.field]: sort.direction }, { id: "asc" }],
            }),
          count: (tx) => tx.review.count({ where }),
        },
        PrismaReviewMapper.toDetail,
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

  async findDetail(id: string): Promise<ReviewDetail | null> {
    try {
      const row = await this.client.review.findUnique({ where: { id }, include: REVIEW_DETAIL_INCLUDE });
      return row ? PrismaReviewMapper.toDetail(row) : null;
    } catch (error) {
      console.error("Error finding review:", error);
      throw new DatabaseError("Could not find review", error);
    }
  }

  async existsForUserAndPlace(userId: string, placeId: string): Promise<boolean> {
    try {
      return (await this.client.review.count({ where: { userId, placeId } })) > 0;
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
          placeId: data.placeId,
          rating: data.rating,
          comment: data.comment,
          status: "PENDING",
        },
        include: REVIEW_DETAIL_INCLUDE,
      });
      return PrismaReviewMapper.toDetail(row);
    } catch (error) {
      console.error("Error creating review:", error);
      throw new DatabaseInsertError("Could not create review", error);
    }
  }

  async save(review: Review): Promise<ReviewDetail> {
    try {
      const row = await this.client.review.update({
        where: { id: review.id },
        data: { rating: review.rating, comment: review.comment, status: review.status },
        include: REVIEW_DETAIL_INCLUDE,
      });
      return PrismaReviewMapper.toDetail(row);
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
}

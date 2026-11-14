import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { IReviewReportRepository, NewReviewReport } from "@/domain/reviews/repositories/IReviewReportRepository";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { reportReasonToDb } from "@/infrastructure/community/mappers/communityEnums";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";

export default class PrismaReviewReportRepository implements IReviewReportRepository {
  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async lockReview(reviewId: string): Promise<{ userId: string | null; status: ContentStatus } | null> {
    try {
      const rows = await this.client.$queryRaw<{ userId: string | null; status: ContentStatus }[]>`
        SELECT userId, status FROM Review WHERE id = ${reviewId} FOR UPDATE
      `;
      return rows[0] ?? null;
    } catch (error) {
      console.error("Error locking review:", error);
      throw new DatabaseError("Could not report the review", error);
    }
  }

  async add(report: NewReviewReport): Promise<boolean> {
    try {
      await this.client.reviewReport.create({
        data: { reviewId: report.reviewId, userId: report.userId, reason: reportReasonToDb(report.reason), details: report.details },
      });
      return true;
    } catch (error) {
      // MySQL keeps the transaction usable after a duplicate key, and the caller rolls back anyway.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
      console.error("Error adding review report:", error);
      throw new DatabaseInsertError("Could not report the review", error);
    }
  }

  async countUnresolved(reviewId: string): Promise<number> {
    try {
      return await this.client.reviewReport.count({ where: { reviewId, resolvedAt: null } });
    } catch (error) {
      console.error("Error counting review reports:", error);
      throw new DatabaseError("Could not report the review", error);
    }
  }

  async hideReview(reviewId: string): Promise<void> {
    try {
      await this.client.review.update({ where: { id: reviewId }, data: { status: "PENDING" } });
    } catch (error) {
      console.error("Error hiding reported review:", error);
      throw new DatabaseError("Could not report the review", error);
    }
  }

  async resolveAll(reviewId: string): Promise<void> {
    try {
      await this.client.reviewReport.updateMany({ where: { reviewId, resolvedAt: null }, data: { resolvedAt: new Date() } });
    } catch (error) {
      console.error("Error resolving review reports:", error);
      throw new DatabaseError("Could not resolve the review reports", error);
    }
  }
}

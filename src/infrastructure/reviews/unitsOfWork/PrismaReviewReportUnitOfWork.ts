import { IReviewReportRepository } from "@/domain/reviews/repositories/IReviewReportRepository";
import { IReviewReportUnitOfWork } from "@/domain/reviews/unitsOfWork/ReviewReportUnitOfWork";
import { prisma } from "@/infrastructure/prisma/client";
import PrismaReviewReportRepository from "../repositories/PrismaReviewReportRepository";

/** Same pattern as PrismaReviewVoteUnitOfWork: the repository shares the transaction client. */
export class PrismaReviewReportUnitOfWork implements IReviewReportUnitOfWork {
  async runInTransaction<T>(work: (reports: IReviewReportRepository) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => work(new PrismaReviewReportRepository(tx)));
  }
}

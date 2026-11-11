import {
  ISubmissionApprovalContext,
  ISubmissionApprovalUnitOfWork,
} from "@/domain/submissions/unitsOfWork/SubmissionApprovalUnitOfWork";
import { TransactionOptions } from "@/domain/core/transactions/TransactionOptions";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import PrismaSubmissionRepository from "../repositories/PrismaSubmissionRepository";
import PrismaPlaceRepository from "@/infrastructure/places/repositories/PrismaPlaceRepository";
import PrismaEventRepository from "@/infrastructure/events/repositories/PrismaEventRepository";
import PrismaCategoryRepository from "@/infrastructure/categories/repositories/PrismaCategoryRepository";
import PrismaCantonRepository from "@/infrastructure/geography/repositories/PrismaCantonRepository";
import PrismaSourceRepository from "@/infrastructure/sources/repositories/PrismaSourceRepository";
import PrismaPhotoRepository from "@/infrastructure/photos/repositories/PrismaPhotoRepository";
import PrismaReputationRepository from "@/infrastructure/reputation/repositories/PrismaReputationRepository";
import PrismaModerationVoteRepository from "@/infrastructure/moderation/repositories/PrismaModerationVoteRepository";

/** Maps the domain options to Prisma's (default: the database's REPEATABLE READ). */
const txOptions = (options?: TransactionOptions) =>
  options?.readCommitted ? { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted } : undefined;

/** Same pattern as PrismaUserDeletionUnitOfWork: every repository shares the transaction client. */
export class PrismaSubmissionApprovalUnitOfWork implements ISubmissionApprovalUnitOfWork {
  async runInTransaction<T>(work: (context: ISubmissionApprovalContext) => Promise<T>, options?: TransactionOptions): Promise<T> {
    return prisma.$transaction(async (tx) => {
      const context: ISubmissionApprovalContext = {
        getSubmissionRepository: () => new PrismaSubmissionRepository(tx),
        getPlaceRepository: () => new PrismaPlaceRepository(tx),
        getEventRepository: () => new PrismaEventRepository(tx),
        getCantonRepository: () => new PrismaCantonRepository(tx),
        getCategoryRepository: () => new PrismaCategoryRepository(tx),
        getSourceRepository: () => new PrismaSourceRepository(tx),
        getPhotoRepository: () => new PrismaPhotoRepository(tx),
        getReputationRepository: () => new PrismaReputationRepository(tx),
        getModerationVoteRepository: () => new PrismaModerationVoteRepository(tx),
      };
      return work(context);
    }, txOptions(options));
  }
}

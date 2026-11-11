import { ICommunityContext, ICommunityUnitOfWork } from "@/domain/community/unitsOfWork/CommunityUnitOfWork";
import { TransactionOptions } from "@/domain/core/transactions/TransactionOptions";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import PrismaPlanStateRepository from "../repositories/PrismaPlanStateRepository";
import PrismaVerificationRepository from "../repositories/PrismaVerificationRepository";
import PrismaReportRepository from "../repositories/PrismaReportRepository";
import PrismaReputationRepository from "@/infrastructure/reputation/repositories/PrismaReputationRepository";
import PrismaModerationVoteRepository from "@/infrastructure/moderation/repositories/PrismaModerationVoteRepository";

/** Maps the domain options to Prisma's (default: the database's REPEATABLE READ). */
const txOptions = (options?: TransactionOptions) =>
  options?.readCommitted ? { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted } : undefined;

/** Same pattern as PrismaSubmissionApprovalUnitOfWork: the repositories share the transaction client. */
export class PrismaCommunityUnitOfWork implements ICommunityUnitOfWork {
  async runInTransaction<T>(work: (context: ICommunityContext) => Promise<T>, options?: TransactionOptions): Promise<T> {
    return prisma.$transaction(async (tx) =>
      work({
        getPlanStateRepository: () => new PrismaPlanStateRepository(tx),
        getVerificationRepository: () => new PrismaVerificationRepository(tx),
        getReportRepository: () => new PrismaReportRepository(tx),
        getReputationRepository: () => new PrismaReputationRepository(tx),
        getModerationVoteRepository: () => new PrismaModerationVoteRepository(tx),
      }),
      txOptions(options),
    );
  }
}

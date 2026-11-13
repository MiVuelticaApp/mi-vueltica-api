import { IReviewVoteContext, IReviewVoteUnitOfWork } from "@/domain/reviews/unitsOfWork/ReviewVoteUnitOfWork";
import { prisma } from "@/infrastructure/prisma/client";
import PrismaReviewRepository from "../repositories/PrismaReviewRepository";
import PrismaReputationRepository from "@/infrastructure/reputation/repositories/PrismaReputationRepository";

/** Same pattern as PrismaCommunityUnitOfWork: the repositories share the transaction client. */
export class PrismaReviewVoteUnitOfWork implements IReviewVoteUnitOfWork {
  async runInTransaction<T>(work: (context: IReviewVoteContext) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) =>
      work({
        getReviewRepository: () => new PrismaReviewRepository(tx),
        getReputationRepository: () => new PrismaReputationRepository(tx),
      }),
    );
  }
}

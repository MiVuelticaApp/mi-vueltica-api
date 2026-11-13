import { IReviewRepository } from "@/domain/reviews/repositories/IReviewRepository";
import { IReputationRepository } from "@/domain/reputation/repositories/IReputationRepository";

/**
 * Runs an "útil" vote (or its undo) and the author's reputation change in one transaction, so a vote
 * and its point are always written together.
 *
 * @see src/infrastructure/reviews/unitsOfWork/PrismaReviewVoteUnitOfWork.ts
 */
export interface IReviewVoteUnitOfWork {
  runInTransaction<T>(work: (context: IReviewVoteContext) => Promise<T>): Promise<T>;
}

export interface IReviewVoteContext {
  getReviewRepository(): IReviewRepository;
  getReputationRepository(): IReputationRepository;
}

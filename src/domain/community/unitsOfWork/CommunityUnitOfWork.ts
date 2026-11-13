import { IPlanStateRepository, IReportRepository, IVerificationRepository } from "../repositories/ICommunityRepositories";
import { IReputationRepository } from "@/domain/reputation/repositories/IReputationRepository";

/**
 * Runs a verification, a report or a moderator's decision in one transaction, after locking the
 * Place / Event row, so concurrent answers for the same plan are applied one at a time (an outcome is
 * never missed or applied twice).
 *
 * @see src/infrastructure/community/unitsOfWork/PrismaCommunityUnitOfWork.ts
 */
export interface ICommunityUnitOfWork {
  runInTransaction<T>(work: (context: ICommunityContext) => Promise<T>): Promise<T>;
}

export interface ICommunityContext {
  getPlanStateRepository(): IPlanStateRepository;
  getVerificationRepository(): IVerificationRepository;
  getReportRepository(): IReportRepository;
  getReputationRepository(): IReputationRepository;
}

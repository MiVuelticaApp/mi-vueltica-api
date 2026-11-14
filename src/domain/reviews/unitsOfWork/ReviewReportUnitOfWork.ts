import { IReviewReportRepository } from "../repositories/IReviewReportRepository";

/**
 * Runs a review report (lock, insert, count, maybe hide) in one transaction, so three concurrent reports
 * can never miss the threshold or apply it twice.
 *
 * @see src/infrastructure/reviews/unitsOfWork/PrismaReviewReportUnitOfWork.ts
 */
export interface IReviewReportUnitOfWork {
  runInTransaction<T>(work: (reports: IReviewReportRepository) => Promise<T>): Promise<T>;
}

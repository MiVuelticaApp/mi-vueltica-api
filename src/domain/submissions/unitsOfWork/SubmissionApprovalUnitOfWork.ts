import { ISubmissionRepository } from "@/domain/submissions/repositories/ISubmissionRepository";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { IEventRepository } from "@/domain/events/repositories/IEventRepository";
import { ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { ICantonRepository } from "@/domain/geography/repositories/ICantonRepository";
import { ISourceRepository } from "@/domain/sources/repositories/ISourceRepository";
import { IPhotoRepository } from "@/domain/photos/repositories/IPhotoRepository";
import { IReputationRepository } from "@/domain/reputation/repositories/IReputationRepository";

/**
 * Runs a submission approval in one transaction: creating the Place/Event and marking the
 * submission as reviewed either both happen or neither does. Also used for the author's edit of a
 * PENDING submission, so an edit and a concurrent approval run one after the other (row lock).
 *
 * @see src/infrastructure/submissions/unitsOfWork/PrismaSubmissionApprovalUnitOfWork.ts
 */
export interface ISubmissionApprovalUnitOfWork {
  runInTransaction<T>(work: (context: ISubmissionApprovalContext) => Promise<T>): Promise<T>;
}

/** Repositories bound to the transaction. */
export interface ISubmissionApprovalContext {
  getSubmissionRepository(): ISubmissionRepository;
  getPlaceRepository(): IPlaceRepository;
  getEventRepository(): IEventRepository;
  getCantonRepository(): ICantonRepository;
  getCategoryRepository(): ICategoryRepository;
  getSourceRepository(): ISourceRepository;
  getPhotoRepository(): IPhotoRepository;
  getReputationRepository(): IReputationRepository;
}

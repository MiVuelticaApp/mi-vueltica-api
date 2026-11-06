import { ISubmissionRepository } from "@/domain/submissions/repositories/ISubmissionRepository";
import { IPlaceRepository } from "@/domain/places/repositories/IPlaceRepository";
import { IEventRepository } from "@/domain/events/repositories/IEventRepository";
import { ICategoryRepository } from "@/domain/categories/repositories/ICategoryRepository";
import { ISourceRepository } from "@/domain/sources/repositories/ISourceRepository";
import { IPhotoRepository } from "@/domain/photos/repositories/IPhotoRepository";

/**
 * Runs a submission approval in one transaction: creating the Place/Event and marking the
 * submission as reviewed either both happen or neither does.
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
  getCategoryRepository(): ICategoryRepository;
  getSourceRepository(): ISourceRepository;
  getPhotoRepository(): IPhotoRepository;
}

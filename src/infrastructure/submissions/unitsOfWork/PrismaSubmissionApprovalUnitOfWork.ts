import {
  ISubmissionApprovalContext,
  ISubmissionApprovalUnitOfWork,
} from "@/domain/submissions/unitsOfWork/SubmissionApprovalUnitOfWork";
import { prisma } from "@/infrastructure/prisma/client";
import PrismaSubmissionRepository from "../repositories/PrismaSubmissionRepository";
import PrismaPlaceRepository from "@/infrastructure/places/repositories/PrismaPlaceRepository";
import PrismaEventRepository from "@/infrastructure/events/repositories/PrismaEventRepository";
import PrismaCategoryRepository from "@/infrastructure/categories/repositories/PrismaCategoryRepository";
import PrismaCantonRepository from "@/infrastructure/geography/repositories/PrismaCantonRepository";
import PrismaSourceRepository from "@/infrastructure/sources/repositories/PrismaSourceRepository";
import PrismaPhotoRepository from "@/infrastructure/photos/repositories/PrismaPhotoRepository";
import PrismaReputationRepository from "@/infrastructure/reputation/repositories/PrismaReputationRepository";

/** Same pattern as PrismaUserDeletionUnitOfWork: every repository shares the transaction client. */
export class PrismaSubmissionApprovalUnitOfWork implements ISubmissionApprovalUnitOfWork {
  async runInTransaction<T>(work: (context: ISubmissionApprovalContext) => Promise<T>): Promise<T> {
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
      };
      return work(context);
    });
  }
}

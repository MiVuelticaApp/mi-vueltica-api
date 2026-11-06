import { IPhotoGalleryContext, IPhotoGalleryUnitOfWork } from "@/domain/photos/unitsOfWork/PhotoGalleryUnitOfWork";
import { prisma } from "@/infrastructure/prisma/client";
import PrismaPhotoRepository from "../repositories/PrismaPhotoRepository";

/** Same pattern as PrismaSubmissionApprovalUnitOfWork: the repository shares the transaction client. */
export class PrismaPhotoGalleryUnitOfWork implements IPhotoGalleryUnitOfWork {
  async runInTransaction<T>(work: (context: IPhotoGalleryContext) => Promise<T>): Promise<T> {
    return prisma.$transaction(async (tx) => work({ getPhotoRepository: () => new PrismaPhotoRepository(tx) }));
  }
}

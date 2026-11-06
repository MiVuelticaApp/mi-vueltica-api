import { IPhotoRepository } from "@/domain/photos/repositories/IPhotoRepository";

/**
 * Runs a gallery write (append, reorder) in one transaction, after locking the owner row,
 * so two concurrent appends never get the same position.
 *
 * @see src/infrastructure/photos/unitsOfWork/PrismaPhotoGalleryUnitOfWork.ts
 */
export interface IPhotoGalleryUnitOfWork {
  runInTransaction<T>(work: (context: IPhotoGalleryContext) => Promise<T>): Promise<T>;
}

export interface IPhotoGalleryContext {
  getPhotoRepository(): IPhotoRepository;
}

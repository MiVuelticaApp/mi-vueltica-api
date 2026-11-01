import { IUserRepository } from "@/domain/users/repositories/IUserRepository";

/**
 * Runs the account deletion reads and writes in one transaction so a failure
 * midway leaves the database intact.
 *
 * @see src/infrastructure/users/unitsOfWork/PrismaUserDeletionUnitOfWork.ts
 */
export interface IUserDeletionUnitOfWork {
  runInTransaction<T>(work: (context: IUserDeletionContext) => Promise<T>): Promise<T>;
}

export interface IUserDeletionContext {
  getUserRepository(): IUserRepository;
}
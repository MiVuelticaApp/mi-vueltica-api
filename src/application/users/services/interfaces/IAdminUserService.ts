import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { User, UserRole } from "@/domain/users/entities/User";
import { UserListFilters } from "@/domain/users/repositories/IUserRepository";
import { AccountDeletionResult } from "./IAccountDeletionService";

export interface IAdminUserService {
  /** Active (not soft-deleted) users only. */
  list(params: PaginationParams, filters: UserListFilters): Promise<PaginatedResult<User>>;
  /** Throws `UserNotFoundError` if the user does not exist or is soft-deleted. */
  findActive(id: string): Promise<User>;
  /** Throws `SelfModificationError` when `actorId === targetId`. */
  changeRole(actorId: string, targetId: string, role: UserRole): Promise<User>;
  /**
   * Deletes the target account with the same semantics as self-deletion.
   * Throws `SelfModificationError` when `actorId === targetId`.
   * The caller is responsible for running the external cleanup with the returned result.
   */
  deleteUser(actorId: string, targetId: string): Promise<AccountDeletionResult>;
}

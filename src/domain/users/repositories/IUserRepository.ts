import { SsoProvider, User, UserRole } from "@/domain/users/entities/User";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface UserListFilters {
  role?: UserRole;
  /** Matches (contains) email, name or surnames. */
  search?: string;
}

export interface IUserRepository {
  all(): Promise<User[]>;
  /** Paginated list of active (not soft-deleted) users. */
  list(params: PaginationParams, filters: UserListFilters): Promise<PaginatedResult<User>>;
  create(user: User): Promise<void>;
  find(value: string, field?: string): Promise<User | null>;
  findBySso(provider: SsoProvider, subject: string): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

import { SsoProvider, User, UserRole } from "@/domain/users/entities/User";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface UserListFilters {
  role?: UserRole;
  /** Matches (contains) email, name or surnames. */
  search?: string;
}

/** What a user has contributed, for the profile screen. */
export interface UserActivityCounts {
  /** Their suggestions that were approved (published as a place or event). */
  vuelticas: number;
  /** Their reviews, in any status. */
  reviews: number;
  /** Plans they verified (one per plan). */
  verifications: number;
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
  activityCounts(userId: string): Promise<UserActivityCounts>;
}

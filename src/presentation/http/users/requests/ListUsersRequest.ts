import { UserRole } from "@/domain/users/entities/User";
import { PaginationQuery } from "@/presentation/http/core/validators/pagination";

export interface ListUsersRequest extends PaginationQuery<"createdAt" | "email" | "name"> {
  role?: UserRole;
  search?: string;
}

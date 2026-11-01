import { UserRole } from "@/domain/users/entities/User";

export interface ChangeUserRoleRequest {
  role: UserRole;
}

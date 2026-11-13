import { CategoryResponse } from "@/presentation/http/categories/responses/CategoryResponse";
import { UserResponse } from "./UserResponse";
import { UserActivityCounts } from "@/domain/users/repositories/IUserRepository";

export interface MyProfileResponse extends UserResponse {
  interests: CategoryResponse[];
  counts: UserActivityCounts;
}

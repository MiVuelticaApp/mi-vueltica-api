import { CategoryResponse } from "@/presentation/categories/responses/CategoryResponse";
import { UserResponse } from "./UserResponse";

export interface MyProfileResponse extends UserResponse {
  interests: CategoryResponse[];
}

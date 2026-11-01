import { CategoryResponse } from "@/presentation/http/categories/responses/CategoryResponse";
import { UserResponse } from "./UserResponse";

export interface MyProfileResponse extends UserResponse {
  interests: CategoryResponse[];
}

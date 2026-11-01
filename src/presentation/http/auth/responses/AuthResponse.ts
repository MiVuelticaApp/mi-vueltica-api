import { UserResponse } from "@/presentation/users/responses/UserResponse";

export interface AuthResponse {
  user: UserResponse;
  token: string;
  expiresIn: string;
}

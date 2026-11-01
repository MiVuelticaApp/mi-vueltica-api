import { UserResponse } from "@/presentation/http/users/responses/UserResponse";

export interface AuthResponse {
  user: UserResponse;
  token: string;
  expiresIn: string;
}

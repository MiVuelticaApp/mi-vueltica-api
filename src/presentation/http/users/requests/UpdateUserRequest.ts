import { AgeRange } from "@/domain/users/entities/User";

export interface UpdateUserRequest {
  name: string;
  surnames: string;
  ageRange?: AgeRange | null;
}

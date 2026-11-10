/* eslint-disable @typescript-eslint/no-explicit-any */
import { AgeRange, SsoProvider, User } from "@/domain/users/entities/User";
import { UserActivityCounts } from "@/domain/users/repositories/IUserRepository";

export interface UpdateProfileInput {
  name: string;
  surnames: string;
  ageRange?: AgeRange | null;
  /** Omitted keeps the current province, null clears it; an unknown id is a 422. */
  provinceId?: number | null;
}

export interface IUserService {
  create(user: User): Promise<User>;
  find(value: any, field?: string): Promise<User | null>;
  findBySso(provider: SsoProvider, subject: string): Promise<User | null>;
  updateProfile(id: string, changes: UpdateProfileInput): Promise<User>;
  activityCounts(userId: string): Promise<UserActivityCounts>;
}

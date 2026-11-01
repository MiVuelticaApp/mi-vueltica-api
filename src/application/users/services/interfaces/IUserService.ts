/* eslint-disable @typescript-eslint/no-explicit-any */
import { SsoProvider, User, UserProfileChanges } from "@/domain/users/entities/User";

export interface IUserService {
  create(user: User): Promise<User>;
  find(value: any, field?: string): Promise<User | null>;
  findBySso(provider: SsoProvider, subject: string): Promise<User | null>;
  updateProfile(id: string, changes: UserProfileChanges): Promise<User>;
}

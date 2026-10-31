/* eslint-disable @typescript-eslint/no-explicit-any */
import { User } from "@/domain/users/entities/User";

export interface IUserService {
  create(user: User): Promise<User>;
  find(value: any, field?: string): Promise<User | null>;
  update(user: User): Promise<User>;
}
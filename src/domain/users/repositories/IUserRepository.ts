import { SsoProvider, User } from "@/domain/users/entities/User";

export interface IUserRepository {
  all(): Promise<User[]>;
  create(user: User): Promise<void>;
  find(value: string, field?: string): Promise<User | null>;
  findBySso(provider: SsoProvider, subject: string): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

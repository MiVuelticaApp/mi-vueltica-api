import { User } from "@/domain/users/entities/User";
import { UserId } from "../valueObjects/userId.valueObject";

export interface IUserRepository {
  all(): Promise<User[]>;
  create(user: User): Promise<void>;
  find(value: string, field?: string): Promise<User | null>;
  update(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}
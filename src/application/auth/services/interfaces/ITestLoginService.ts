import { User } from "@/domain/users/entities/User";

export interface ITestLoginService {
  authenticate(email: string, password: string): Promise<User>;
}

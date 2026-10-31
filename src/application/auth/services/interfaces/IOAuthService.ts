import { User } from "@/domain/users/entities/User";

export interface IOAuthService {
  google(accessToken: string): Promise<User>;
  apple(identityToken: string, firstName?: string, lastName?: string): Promise<User>;
}

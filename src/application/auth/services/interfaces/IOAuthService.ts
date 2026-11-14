import { User } from "@/domain/users/entities/User";

export interface IOAuthService {
  /** `privacyVersion`: the notice the person accepted; required to create a new account (#7). */
  google(accessToken: string, privacyVersion?: string): Promise<User>;
  apple(identityToken: string, firstName?: string, lastName?: string, privacyVersion?: string): Promise<User>;
}

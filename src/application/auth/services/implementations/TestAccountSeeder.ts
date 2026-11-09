import { IIDGenerator } from "@/domain/core/services/IIDGenerator";
import { ITestAccountSeeder } from "../interfaces/ITestAccountSeeder";
import { IUserService } from "@/application/users/services/interfaces/IUserService";


/**
 * Hook to seed a fresh review account with sample data, so App Store / Google Play reviewers land
 * on a populated app instead of an empty one. Runs once, on the first test login of a brand new
 * user (see TestLoginService), never on later logins. It is a placeholder: it writes nothing yet.
 */
export class TestAccountSeeder implements ITestAccountSeeder {
  constructor(
    private readonly usersService: IUserService,
  ) {}

  async seed(userId: string): Promise<void> {
    try {
      // Idempotency guard for when it writes data: a retried login, or a redeploy that re-runs it
      // against the same account, must not duplicate the sample data.
      const user = await this.usersService.find(userId);
      if (!user) return;

      const now = new Date().toISOString();
    } catch (error) {
      // The demo seed is a nice-to-have, not part of the login contract: a failure here must
      // never prevent the reviewer from getting a token.
      console.error("[test-login] demo seed failed:", error);
    }
  }

  
}

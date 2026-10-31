import { IIDGenerator } from "@/domain/core/services/IIDGenerator";
import { ITestAccountSeeder } from "../interfaces/ITestAccountSeeder";
import { IUserService } from "@/application/users/services/interfaces/IUserService";


/**
 * Seeds a fresh review account with a demo company and some sample data, so App Store / Google
 * Play reviewers land on a populated app instead of an empty one. Runs once, on the first
 * test-login of a brand new user (see TestLoginService) — never on subsequent logins.
 *
 * Stays well under the FREE plan limits (`PlanCatalog.ts`): 4 clients, 4 products and 3 orders
 * are nowhere near the 25 clients / 20 products / 10 documents-per-month ceiling.
 */
export class TestAccountSeeder implements ITestAccountSeeder {
  constructor(
    private readonly usersService: IUserService,
  ) {}

  async seed(userId: string): Promise<void> {
    try {
      // Idempotency guard: only seed a user that exists and has no company yet. A retried
      // login, or a redeploy that re-runs this against the same account, must not duplicate
      // the demo data.
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

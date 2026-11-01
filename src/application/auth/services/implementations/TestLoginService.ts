import { timingSafeEqual } from "crypto";
import { User } from "@/domain/users/entities/User";
import { ITestLoginService } from "../interfaces/ITestLoginService";
import { ITestAccountSeeder } from "../interfaces/ITestAccountSeeder";
import { IIDGenerator } from "@/domain/core/services/IIDGenerator";
import { IUserService } from "@/application/users/services/interfaces/IUserService";
import { InvalidCredentialsError } from "../../errors/InvalidCredentialsError";

/**
 * Config for the test-login flow, injected by the DI container. Read from `ENV` there —
 * this application-layer service must never import `ENV` directly.
 */
export interface TestLoginConfig {
  enabled: boolean;
  email: string;
  password: string;
}

// Fixed-credential login used only so App Store / Google Play reviewers can sign in without
// going through Google/Apple OAuth. See ITestLoginService for the contract.
export default class TestLoginService implements ITestLoginService {
  constructor(
    private readonly usersService: IUserService,
    private readonly idGenerator: IIDGenerator,
    private readonly config: TestLoginConfig,
    private readonly seeder: ITestAccountSeeder,
  ) {}

  async authenticate(email: string, password: string): Promise<User> {
    // Defense in depth: the route is only mounted when TEST_LOGIN_ENABLED is true, but this
    // service re-checks its own config in case it is ever wired up elsewhere.
    if (!this.config.enabled || !this.config.email || !this.config.password) {
      throw new InvalidCredentialsError("Credenciales inválidas");
    }

    const normalizedEmail = email.trim().toLowerCase();
    const configuredEmail = this.config.email.trim().toLowerCase();

    // Compute both comparisons before branching so the response time does not reveal which
    // one (if any) failed. Never reveal whether the email exists.
    const emailOk = this.safeEquals(normalizedEmail, configuredEmail);
    const passwordOk = this.safeEquals(password, this.config.password);

    if (!emailOk || !passwordOk) {
      throw new InvalidCredentialsError("Credenciales inválidas");
    }

    let user = await this.usersService.find(normalizedEmail, "email");
    let justCreated = false;
    if (!user) {
      const newUser = new User({
        id: this.idGenerator.generate(),
        email: normalizedEmail,
        name: "Cuenta",
        surnames: "de Prueba",
        // Not a real SSO account: the schema requires a provider, and the enum has no TEST
        // value. The fixed subject keeps it from ever matching a real Google `sub`.
        ssoProvider: "GOOGLE",
        ssoSubject: "test-login",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      user = await this.usersService.create(newUser);
      justCreated = true;
    }

    // Only seed demo data the first time this account is created — never on subsequent
    // logins. The seeder swallows its own errors, so the token below is always returned.
    if (justCreated) {
      await this.seeder.seed(user.id);
    }

    return user;
  }

  // Constant-time string comparison: crypto.timingSafeEqual throws on length mismatch, so the
  // length check must short-circuit before calling it (and does not leak meaningful timing,
  // since string lengths are not secret here).
  private safeEquals(a: string, b: string): boolean {
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return timingSafeEqual(bufA, bufB);
  }
}

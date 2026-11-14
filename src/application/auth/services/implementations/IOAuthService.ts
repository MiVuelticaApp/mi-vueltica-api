import { SsoProvider, User } from "@/domain/users/entities/User";
import { IOAuthService } from "../interfaces/IOAuthService";
import { IOAuthProvider, OAuthUserPayload } from "@/domain/auth/providers/IOAuthProvider";
import { IIDGenerator } from "@/domain/core/services/IIDGenerator";
import { IUserService } from "@/application/users/services/interfaces/IUserService";
import { InvalidCredentialsError } from "../../errors/InvalidCredentialsError";
import { UserAlreadyExistsError } from "@/application/users/errors/UserAlreadyExistsError";
import ApplicationError from "@/application/core/errors/ApplicationError";
import { PrivacyConsentRequiredError } from "../../errors/PrivacyConsentRequiredError";

export default class OAuthService implements IOAuthService {
  constructor(
    private readonly usersService: IUserService,
    private readonly googleOAuthProvider: IOAuthProvider,
    private readonly appleOAuthProvider: IOAuthProvider,
    private readonly idGenerator: IIDGenerator
  ) {}

  async google(accessToken: string, privacyVersion?: string): Promise<User> {
    try {
      const userInfo = await this.googleOAuthProvider.getUserInfo(accessToken);
      return await this.loginWithSso("GOOGLE", userInfo, userInfo.name ?? "", "", privacyVersion);
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      console.error(error);
      throw new InvalidCredentialsError();
    }
  }

  async apple(identityToken: string, firstName?: string, lastName?: string, privacyVersion?: string): Promise<User> {
    try {
      const userInfo = await this.appleOAuthProvider.getUserInfo(identityToken);
      // Apple only sends the name on the very first sign in, so it is only used when creating.
      return await this.loginWithSso("APPLE", userInfo, firstName ?? "", lastName ?? "", privacyVersion);
    } catch (error) {
      if (error instanceof ApplicationError) throw error;
      console.error(error);
      throw new InvalidCredentialsError();
    }
  }

  // Users are identified by their provider's stable id (`sub`), not by email: Apple can relay
  // or hide the email, and it may change. Email is still unique, so an email already registered
  // with the other provider is rejected rather than silently linked.
  private async loginWithSso(
    provider: SsoProvider,
    userInfo: OAuthUserPayload,
    name: string,
    surnames: string,
    privacyVersion?: string,
  ): Promise<User> {
    const existing = await this.usersService.findBySso(provider, userInfo.sub);
    if (existing) {
      // The person accepted a (newer) notice on this device before signing in: record it (#7).
      if (privacyVersion && existing.privacyVersion !== privacyVersion) return this.usersService.acceptPrivacy(existing.id, privacyVersion);
      return existing;
    }
    // A new account needs the consent on record (Ley 8968 art. 5).
    if (!privacyVersion) throw new PrivacyConsentRequiredError();

    const emailTaken = await this.usersService.find(userInfo.email, "email");
    if (emailTaken) {
      throw new UserAlreadyExistsError("Esta cuenta ya está registrada con otro proveedor");
    }

    const now = new Date().toISOString();
    const newUser = new User({
      id: this.idGenerator.generate(),
      email: userInfo.email,
      name,
      surnames,
      ssoProvider: provider,
      ssoSubject: userInfo.sub,
      privacyVersion,
      privacyAcceptedAt: now,
      createdAt: now,
      updatedAt: now,
    });
    return this.usersService.create(newUser);
  }
}

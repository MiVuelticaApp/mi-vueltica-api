import { IOAuthProvider, OAuthUserPayload } from "@/domain/auth/providers/IOAuthProvider";
import InfrastructureError from "@/infrastructure/core/errors/InfrastructureError";
import appleSignin from "apple-signin-auth";

export default class AppleOAuthProvider implements IOAuthProvider {
  constructor(
    private readonly teamId: string,
    private readonly keyId: string,
    private readonly privateKey: string,
    private readonly clientId: string,
  ) {}

  async getUserInfo(identityToken: string): Promise<OAuthUserPayload> {
    try {
      const claims = await appleSignin.verifyIdToken(identityToken, {
        audience: this.clientId,
        ignoreExpiration: false,
      });

      if (!claims.email) {
        throw new InfrastructureError("Apple identity token missing email claim");
      }

      return {
        sub: claims.sub,
        email: claims.email,
        email_verified: claims.email_verified === true || claims.email_verified === "true",
      };
    } catch (error) {
      if (error instanceof InfrastructureError) throw error;
      throw new InfrastructureError("Invalid Apple identity token");
    }
  }

  /**
   * Revokes the Apple Sign In token as part of account deletion (App Review 5.1.1(v)).
   * The client sends an `appleAuthorizationCode` in the DELETE /api/v1/me body; this
   * method exchanges nothing and revokes the code directly via Apple's `/auth/revoke`
   * endpoint. Silently skips when the Apple env vars are not configured so that a
   * Google user (no code) or an unconfigured deployment is unaffected.
   */
  async revokeToken(authorizationCode: string): Promise<void> {
    if (!this.teamId || !this.keyId || !this.privateKey || !this.clientId) {
      console.warn("AppleOAuthProvider: revokeToken skipped, Apple env vars not configured.");
      return;
    }

    try {
      const clientSecret = appleSignin.getClientSecret({
        clientID: this.clientId,
        teamID: this.teamId,
        keyIdentifier: this.keyId,
        privateKey: this.privateKey,
      });

      await appleSignin.revokeAuthorizationToken(authorizationCode, {
        clientID: this.clientId,
        clientSecret,
        tokenTypeHint: "access_token",
      });
    } catch (error) {
      if (error instanceof InfrastructureError) throw error;
      throw new InfrastructureError("Failed to revoke Apple token");
    }
  }
}
import { OAuth2Client } from "google-auth-library";
import { IOAuthProvider, OAuthUserPayload } from "@/domain/auth/providers/IOAuthProvider";
import InfrastructureError from "@/infrastructure/core/errors/InfrastructureError";

/** The part of `OAuth2Client` this provider uses (a fake can be passed in tests). */
type GoogleIdTokenVerifier = Pick<OAuth2Client, "verifyIdToken">;

export default class GoogleOAuthProvider implements IOAuthProvider {
  private readonly audiences: string[];

  /**
   * `audiences`: the OAuth client ids whose id tokens are accepted (iOS, Android and web; empty values
   * are ignored). The web one is needed because on Android `@react-native-google-signin` only returns
   * an id token when `webClientId` is set, and that token's `aud` is the web client id (#35).
   */
  constructor(
    audiences: Array<string | undefined>,
    private readonly client: GoogleIdTokenVerifier = new OAuth2Client(),
  ) {
    this.audiences = audiences.filter((audience): audience is string => !!audience && audience.trim().length > 0);
    if (this.audiences.length === 0) {
      console.warn("GoogleOAuthProvider: no GOOGLE_*_CLIENT_ID is set; every Google login will be rejected.");
    }
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserPayload> {
    // Fail closed: without a configured client id no token can be trusted.
    if (this.audiences.length === 0) {
      throw new InfrastructureError("Google login is not configured (no GOOGLE_*_CLIENT_ID)");
    }

    const ticket = await this.client.verifyIdToken({ idToken: accessToken, audience: this.audiences });
    const payload = ticket.getPayload();

    if (!payload) {
      throw new InfrastructureError("Invalid Google token payload");
    }

    if (!payload.email_verified) {
      throw new InfrastructureError("Google email not verified");
    }

    return {
      sub: payload.sub,
      email: payload.email!,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified,
    };
  }

  /**
   * Google Sign In is one-shot on this server: we only verify the id token at login
   * and never persist any access/refresh token. There is therefore nothing to
   * revoke server-side. The mobile client owns its own Google sign-out; this is a
   * logged no-op so the shared `IOAuthProvider` port stays uniform across providers.
   */
  async revokeToken(_authorizationCode: string): Promise<void> {
    console.warn("GoogleOAuthProvider: revokeToken is not supported; ignoring.");
  }
}

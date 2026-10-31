import { IOAuthProvider, OAuthUserPayload } from "@/domain/auth/providers/IOAuthProvider";
import { googleClient } from "../config/googleOAuthClient";
import InfrastructureError from "@/infrastructure/core/errors/InfrastructureError";

export default class GoogleOAuthProvider implements IOAuthProvider {
  async getUserInfo(accessToken: string): Promise<OAuthUserPayload> {
    const ticket = await googleClient.verifyIdToken({
      idToken: accessToken,
      audience: [process.env.GOOGLE_IOS_CLIENT_ID!, process.env.GOOGLE_ANDROID_CLIENT_ID!]
    });

    const payload = ticket.getPayload()

    if (!payload) {
      throw new InfrastructureError('Invalid Google token payload')
    }

    if (!payload.email_verified) {
      throw new InfrastructureError('Google email not verified')
    }

    return {
      sub: payload.sub,
      email: payload.email!,
      name: payload.name,
      picture: payload.picture,
      email_verified: payload.email_verified
    }
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

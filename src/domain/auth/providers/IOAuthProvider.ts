export interface OAuthUserPayload {
  sub: string
  email: string
  name?: string
  picture?: string
  email_verified: boolean
}

export interface IOAuthProvider {
  getUserInfo: (accessToken: string) => Promise<OAuthUserPayload>;
  /**
   * Best-effort: revoke the provider's tokens for the given authorization code/token.
   * Resolves on success; throws InfrastructureError on transient failure.
   *
   * Implementations MUST silently skip (log + return) when not configured, so a
   * deployment without provider credentials still allows account deletion to
   * succeed. For providers that do not store any token server-side (e.g. Google,
   * which only verifies one-shot id tokens), this is a logged no-op.
   */
  revokeToken: (authorizationCode: string) => Promise<void>;
}
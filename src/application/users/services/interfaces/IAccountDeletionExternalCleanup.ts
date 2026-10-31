import { AccountDeletionResult } from "./IAccountDeletionService";

export interface AccountDeletionExternalCleanupInput {
  result: AccountDeletionResult;
  /**
   * Apple authorization code sent by the iOS client. Absent for Google users — in
   * that case the Apple revoke step is skipped entirely.
   */
  appleAuthorizationCode?: string;
}

export interface IAccountDeletionExternalCleanup {
  /**
   * Runs every best-effort side effect of account deletion that must NOT live inside
   * the deletion transaction: Apple token revocation, RevenueCat subscriber cleanup,
   * confirmation email. Each side effect is isolated in its own try/catch so a
   * provider outage never throws back to the caller and never reverts the deletion.
   */
  run(input: AccountDeletionExternalCleanupInput): Promise<void>;
}
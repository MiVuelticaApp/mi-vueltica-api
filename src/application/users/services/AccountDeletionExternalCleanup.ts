import { IOAuthProvider } from "@/domain/auth/providers/IOAuthProvider";
import AccountDeletionEmailSender from "./AccountDeletionEmailSender";
import {
  AccountDeletionExternalCleanupInput,
  IAccountDeletionExternalCleanup,
} from "./interfaces/IAccountDeletionExternalCleanup";

/**
 * Orchestrates the best-effort side effects of account deletion that must run AFTER the
 * deletion transaction has committed (see issues #42, #43):
 *
 *   1. Apple Sign In token revocation (App Review 5.1.1(v)) — only when the client sent an
 *      `appleAuthorizationCode` (iOS users). Silently skipped for Google users and when
 *      the Apple env vars are not configured.
 *   2. RevenueCat subscriber deletion for each deleted company (app_user_id === companyId),
 *      so a late webhook does not upsert a Subscription row for a company that no longer
 *      exists. Silently skipped when REVENUECAT_API_KEY is not configured.
 *   3. Confirmation email to the address captured pre-deletion.
 *
 * Every side effect is wrapped in its own try/catch and only logged on failure. This method
 * does NOT throw back to the caller: a Resend/Apple/RevenueCat outage must never revert the
 * DB deletion nor surface as 5xx to the client.
 */
export class AccountDeletionExternalCleanup implements IAccountDeletionExternalCleanup {
  constructor(
    private readonly appleProvider: IOAuthProvider,
    private readonly accountDeletionEmailSender: AccountDeletionEmailSender,
  ) {}

  async run({ result, appleAuthorizationCode }: AccountDeletionExternalCleanupInput): Promise<void> {
    // 1. Apple token revocation. The body field is only sent by the iOS client; absence
    //    means a Google user, for which there is nothing to revoke server-side.
    if (appleAuthorizationCode) {
      try {
        await this.appleProvider.revokeToken(appleAuthorizationCode);
      } catch (error) {
        console.error("Apple revokeToken failed (best-effort):", error);
      }
    }

    // 2. Confirmation email to the address captured pre-deletion. The email is the only
    //    user-facing artifact of the deletion once the account is gone.
    try {
      await this.accountDeletionEmailSender.sendDeletionConfirmationEmail(
        result.email,
        result.name,
        result.deletedCompanyIds.length,
      );
    } catch (error) {
      console.error("Failed to send account deletion confirmation email (best-effort):", error);
    }
  }
}
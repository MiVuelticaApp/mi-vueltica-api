import dotenv from "dotenv" ;
dotenv.config();

const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const ENV = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 3000,
  DATABASE_URL: process.env.DATABASE_URL || "mongodb://localhost:27017/myapp",
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret",
  RESEND_API_KEY: required("RESEND_API_KEY"),
  MAIL_FROM: required("MAIL_FROM"),
  // Test login for App Store / Google Play review. Deliberately NOT required(): a deployment
  // without these must still boot. The route is only mounted when TEST_LOGIN_ENABLED === "true".
  TEST_LOGIN_ENABLED: process.env.TEST_LOGIN_ENABLED === "true",
  TEST_LOGIN_EMAIL: process.env.TEST_LOGIN_EMAIL || "",
  TEST_LOGIN_PASSWORD: process.env.TEST_LOGIN_PASSWORD || "",
  // Apple Sign In. Deliberately NOT required(): an existing deployment without these must
  // still boot. Used both to verify Apple id tokens at login and to revoke tokens at
  // DELETE /api/v1/me (App Review 5.1.1(v)). AppleOAuthProvider silently skips revocation
  // when these are unset.
  APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID || "",
  APPLE_TEAM_ID: process.env.APPLE_TEAM_ID || "",
  APPLE_KEY_ID: process.env.APPLE_KEY_ID || "",
  APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY || "",
  // Minimum supported frontend/app version. Required and validated as semver at boot so
  // a typo doesn't silently ship a broken version gate to clients.
  MIN_FRONTEND_VERSION: required("MIN_FRONTEND_VERSION"),
};

const TEST_LOGIN_MIN_PASSWORD_LENGTH = 16;

// Fail-fast (never fail-open): if the test-login route is enabled, its credentials must be
// present and strong enough. A deployment with TEST_LOGIN_ENABLED=true and no/weak
// credentials must not boot silently into a broken or, worse, easily-guessable review
// endpoint.
function validateTestLoginConfig(): void {
  if (!ENV.TEST_LOGIN_ENABLED) return;

  if (!ENV.TEST_LOGIN_EMAIL) {
    throw new Error("TEST_LOGIN_ENABLED is true but TEST_LOGIN_EMAIL is missing");
  }

  if (!ENV.TEST_LOGIN_PASSWORD) {
    throw new Error("TEST_LOGIN_ENABLED is true but TEST_LOGIN_PASSWORD is missing");
  }

  if (ENV.TEST_LOGIN_PASSWORD.length < TEST_LOGIN_MIN_PASSWORD_LENGTH) {
    // Never include the value itself in the message.
    throw new Error(
      `TEST_LOGIN_PASSWORD must be at least ${TEST_LOGIN_MIN_PASSWORD_LENGTH} characters long. ` +
      `Generate one with: openssl rand -base64 24`
    );
  }

  // Loud, unmissable boot warning: this is a temporary, submission-only bypass of the normal
  // OAuth login, not a product feature. Never log the password or the email itself.
  console.warn(
    "\n" +
    "==================== WARNING: TEST LOGIN ENABLED ====================\n" +
    "Password login (POST /auth/test-login) is ENABLED on this deployment.\n" +
    "This exists ONLY for App Store / Google Play review.\n" +
    "TURN IT OFF (TEST_LOGIN_ENABLED=false) AS SOON AS THE APP IS APPROVED.\n" +
    "======================================================================\n"
  );
}

validateTestLoginConfig();

// Fail-fast: the min frontend version must be valid semver. A malformed value
// (e.g. "1.2" or "v1.2.0") would otherwise silently ship a broken version gate
// to every client. Never include the value itself in the error message.
function validateMinFrontendVersionConfig(): void {
  if (!SEMVER_REGEX.test(ENV.MIN_FRONTEND_VERSION)) {
    throw new Error(
      "MIN_FRONTEND_VERSION must be a valid semver string (e.g. \"1.0.0\")."
    );
  }
}

validateMinFrontendVersionConfig();

export default ENV;
# AGENTS.md

## Architecture

DDL / Clean Architecture with 4 layers. Dependency direction: **domain → application → infrastructure → presentation**.

- `src/domain/{model}/` — entities, value objects, repository interfaces
- `src/application/{model}/` — service interfaces + implementations, errors
- `src/infrastructure/{model}/` — Prisma repositories, mappers; `src/infrastructure/prisma/` for DB client
- `src/presentation/{model}/` — controllers, routes, validators (Zod), request/response DTOs, mappers
- `src/dependencyInjection/container.ts` — manual DI wiring (no framework)

New models must follow the conventions in `.github/instructions/ddd-*-layer.instructions.md`.

## Prisma (non-standard paths)

- Schema: `src/infrastructure/prisma/schema.prisma`
- Migrations: `src/infrastructure/prisma/migrations`
- Generated client: `src/infrastructure/prisma/generated/` (gitignored)
- Config: `prisma.config.ts` at repo root defines these paths

After schema changes, regenerate:
```
npx prisma generate
```

## Database

MariaDB (not MySQL, not MongoDB). Uses `@prisma/adapter-mariadb`. Connection config in `src/infrastructure/core/config/keys/mysql.ts`.

Required env vars (see `.env.example`): `DATABASE_URL`, `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`, `JWT_SECRET`, `RESEND_API_KEY`, `MAIL_FROM`, `APP_INVITE_URL`.

## Commands

- `npm run dev` — nodemon + ts-node (entry: `src/presentation/server.ts`)
- `npm run build` — `tsc && tsc-alias` (resolves `@/*` path aliases)
- `npm run start` — runs built JS with tsconfig-paths (production debugging)
- `npm run start:prod` — runs built JS directly (Docker CMD)

No test, lint, or typecheck scripts are configured.

## Path Aliases

`@/*` → `src/*` (configured in `tsconfig.json`, resolved at build by `tsc-alias`).

## Auth

API auth uses JWT (`src/presentation/auth/middlewares/jwtAuth.ts`). Extracts `Bearer` token from `Authorization` header, sets `req.user`. Routes apply `jwtAuth` middleware as needed. Google OAuth for login flow.

## Test login (App Store / Play review)

`POST /api/v1/auth/test-login` exists because Apple and Google require a working demo account
for app review, and this app has no email/password login otherwise (only Google/Apple OAuth,
which reviewers cannot exercise as themselves). Credentials live entirely in env vars
(`TEST_LOGIN_ENABLED`, `TEST_LOGIN_EMAIL`, `TEST_LOGIN_PASSWORD`) — there is no password column
on `User` and no migration; the service (`TestLoginService`,
`src/application/auth/services/implementations/TestLoginService.ts`) compares the submitted
email/password against the configured ones with `crypto.timingSafeEqual` and never reveals
whether the email exists.

The route is only mounted when `TEST_LOGIN_ENABLED === "true"` (`auth.route.ts`); with the flag
unset or false, `POST /api/v1/auth/test-login` 404s rather than existing-but-rejecting. `env.ts`
fails fast at boot if the flag is on but the email/password are missing or the password is
shorter than 16 characters, and prints a loud warning banner on every boot while the flag is on.
The route is additionally rate-limited (10 attempts / 15 min per IP,
`src/presentation/core/middlewares/rateLimit.ts`), and every successful login is logged
(IP only, never the password).

On first login, the account is seeded once with a demo company, clients, products and orders
(`TestAccountSeeder`) so reviewers see a populated app; from then on it is a completely ordinary
FREE-plan user — same `jwtAuth`, `requireCompanyId`, `requireCompanyRole` and `enforceLimit`
checks as any other account, no special role or bypass.

**Operating rule: turn it on for submission, turn it off as soon as the app is approved.** This
is not a product feature — see the submission checklist on issue #37 for the exact steps.

## Billing

Plans are per `Company`, not per user. RevenueCat's `app_user_id` MUST be the `companyId` — the
mobile client passes the organization id as the app user id when starting a purchase. Webhook
events (`POST /api/v1/billing/webhooks/revenuecat`) are unauthenticated by JWT — there is no
`jwtAuth`/`requireCompanyId` on that route — and are instead verified server-to-server against
the `REVENUECAT_WEBHOOK_AUTH` shared secret in the `Authorization` header
(`src/infrastructure/billing/providers/RevenueCatProvider.ts`). The provider is abstracted behind
`IPaymentProvider` (`src/domain/billing/providers/`) so a future Tilopay adapter can be added
without touching application code. Plan limits (per resource, per tier) live in code in
`src/application/billing/PlanCatalog.ts`.

Every company gets a FREE subscription at creation time, in the same transaction as the company
itself (`PrismaCompanyCreationUnitOfWork`); companies predating this were backfilled by the
`20260725130000_backfill_free_subscriptions` data migration. Limits are enforced in the
presentation layer by the `enforceLimit(resource)` middleware, which returns **HTTP 402** with a
machine-readable `PLAN_LIMIT_EXCEEDED` payload — the API never blocks silently, the client owns
the upgrade UX. Monthly/daily windows are evaluated in `America/Costa_Rica`
(`src/application/billing/utils/billingWindows.ts`).

Optional env vars: `REVENUECAT_WEBHOOK_AUTH` (must match the `Authorization` header configured in
the RevenueCat dashboard; when unset the webhook fails closed and rejects everything),
`REVENUECAT_API_KEY`.

## Account deletion

`DELETE /api/v1/me` is JWT-authenticated, rate-limited (5 / 15 min per IP), and accepts an
optional body `{ appleAuthorizationCode?: string }` (sent only by the iOS client, see #43).
The response is **204** with no body; no `try/catch` in the controller — service-level
`UserNotFoundError` etc. propagate via `asyncHandler` to the central `errorHandler`.

### Transactional core (issues #40, #41)

The DB deletion runs in ONE transaction via `UserDeletionUnitOfWork`
(`src/infrastructure/users/unitsOfWork/PrismaUserDeletionUnitOfWork.ts`):

1. Load the user; throw `UserNotFoundError` (404) if missing.
2. For each `UserCompany` membership, reuse `CompanyMember.isLastOwner(member, members)`:
   - **Sole OWNER** → `CompanyRepository.deleteWithAllData(companyId)`, which cascades in
     leaf→root topological order with raw `deleteMany` (bypassing the `Client`/`Product`
     soft-delete filters, otherwise their `deletedAt: null` rows would survive and the final
     `company.delete()` would hit `ON DELETE RESTRICT`).
   - Otherwise → `CompanyMemberRepository.remove(userId, companyId)` (the company stays).
3. Delete the `CompanyInvitation`s the user **sent** (`invitedById`, FK RESTRICT, would block
   the user delete) and the ones **addressed to their email** (hygiene so a re-registration
   with the same email does not inherit stale invitations).
4. `userRepository.delete(userId)` last.

`deletedCompanyIds` and `unlinkedCompanyIds` are returned in `AccountDeletionResult`, along
with `email`/`name` captured **before** the user row is deleted (the confirmation email needs
a recipient).

### Best-effort side effects (issue #43) — after the commit

`AccountDeletionExternalCleanup` runs three provider side effects AFTER the transaction
commits. Each is isolated in its own `try/catch` so a provider outage never throws back to the
client, never returns 5xx, and never reverts the deletion:

1. **Apple Sign In token revocation** (App Review 5.1.1(v)) via
   `AppleOAuthProvider.revokeToken(appleAuthorizationCode)` (direct `/auth/revoke`, no token
   exchange). Requires `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`;
   silently skips (one `console.warn`) when unset, so a Google user (no `appleAuthorizationCode`
   in the body) or an unconfigured deployment is unaffected. `GoogleOAuthProvider.revokeToken`
   is a logged no-op because the server never stores Google tokens.
2. **RevenueCat subscriber deletion** for each `deletedCompanyIds` entry via
   `IPaymentProvider.deleteSubscriber(companyId)` (the `app_user_id === companyId` convention).
   The local `Subscription` row was already deleted inside the transaction by
   `deleteWithAllData`, but the provider side still holds the subscriber and would otherwise
   keep sending webhooks. Requires `REVENUECAT_API_KEY`; silently skips when unset. Idempotent
   (200/204/404 all treated as success).
3. **Confirmation email** via `AccountDeletionEmailSender` (HTML + plain text, es-CR) to the
   pre-deletion email. A Resend outage is logged, not surfaced.

### Webhook hardening

`SubscriptionSyncService.applyEvent` now looks up the company first and **ignores** (log +
HTTP 200) events whose `companyId` no longer exists. Without this guard, a late `RENEWAL` /
`EXPIRATION` webhook for a deleted company would `upsertByProviderCustomerId` against a
missing `company.id` → FK RESTRICT throw → 500 → RevenueCat retries the webhook forever
(`Subscription.companyId` has a unique constraint, not a soft-fail column). The guard keeps
the endpoint returning 200 and writes nothing.

### Optional env vars

`APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` — none use
`required()`; a deployment without them still boots, and only Apple token revocation at
`DELETE /me` is skipped. `REVENUECAT_API_KEY` is the same — it was already optional and is now
consumed by `deleteSubscriber`.

### App review checklist

- Where the reviewer sees it in the app: **Settings → Cuenta → Eliminar cuenta**. The user
  taps it, confirms, the iOS client requests a fresh Apple authorization code, sends
  `DELETE /api/v1/me` with `{ appleAuthorizationCode }`, and signs the user out on 204.
- How the reviewer reproduces it: log in via the test-login route (see the "Test login"
  section above) — reviewers cannot exercise Google/Apple OAuth as themselves — then
  Settings → Cuenta → Eliminar cuenta. A later `GET /api/v1/me` with the same token returns
  404 "Usuario no encontrado".

## Key Quirks

- Express **5.x** (not 4) — response methods may differ from 4.x patterns
- Some value object files have typos (e.g., `valouObject.ts`) — match existing naming when editing
- `prisma.config.ts` uses `dotenv/config` import for env loading
- All API routes mounted under `/api/v1`
- `requireCompanyId` middleware parses company context from requests
## API docs (Scalar)

Outside production (`NODE_ENV !== "production"`), the server exposes:

- `GET /docs` — Scalar API reference UI (`@scalar/express-api-reference`)
- `GET /openapi.json` — the OpenAPI 3.1 document

The spec lives in `src/presentation/core/docs/openapi.ts`. Request bodies are generated from the
route's Zod validator via `z.toJSONSchema`; response schemas are hand-written to mirror the
`*/responses` interfaces. **When adding or changing a route, update this file too.**

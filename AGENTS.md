# AGENTS.md

## Architecture

DDL / Clean Architecture with 4 layers. Dependency direction: **domain → application → infrastructure → presentation**.

- `src/domain/{model}/` — entities, value objects, repository interfaces
- `src/application/{model}/` — service interfaces + implementations, errors
- `src/infrastructure/{model}/` — Prisma repositories, mappers; `src/infrastructure/prisma/` for DB client
- `src/presentation/` — two delivery adapters over the same application services:
  - `src/presentation/http/{model}/` — REST: controllers, routes, validators (Zod), request/response DTOs, mappers;
    `http/app.ts` + `http/server.ts` are the Express app and entry point
  - `src/presentation/mcp/` — MCP server for LLM clients (see "MCP" below)
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

## Seed data

Reference data (Costa Rica provinces, cantons, initial categories) is seeded, not migrated.

- Dev: `npx prisma db seed` or `npm run db:seed` (command configured in `migrations.seed` of `prisma.config.ts`).
- Prod: `npm run db:seed:prod` runs the compiled `dist/infrastructure/prisma/seed/seed.js`; the Docker
  CMD runs it automatically after `prisma migrate deploy` and before the server starts (every deploy).
- Data files (versioned source of truth): `src/infrastructure/prisma/seed/data/geography.ts`
  (`PROVINCES`, `CANTONS`) and `src/infrastructure/prisma/seed/data/categories.ts` (`CATEGORIES`).
  Script: `src/infrastructure/prisma/seed/seed.ts`.
- INEC id convention: province id = INEC province code (1-7); canton id = `provinceCode * 100 + cantonCode`
  (101 = San José, 216 = Río Cuarto). 7 provinces / 84 cantons; the seed validates this before writing.
- Idempotent: everything is upserted in one transaction (provinces by id, cantons by id, categories by
  `name`). Renames propagate (`update: { name }`); **nothing is ever deleted**, so existing rows and
  their foreign keys are safe. Categories are only created, never modified.
- When INEC changes the division, edit the data files and redeploy.

## Commands

- `npm run dev` — nodemon + ts-node (entry: `src/presentation/http/server.ts`)
- `npm run build` — `tsc && tsc-alias` (resolves `@/*` path aliases)
- `npm run start` — runs built JS with tsconfig-paths (production debugging)
- `npm run start:prod` — runs built JS directly (Docker CMD)
- `npm run db:seed` (`npx prisma db seed`) — seed geography + categories (dev, ts-node)
- `npm run db:seed:prod` — same seed from built JS (`dist/`), no devDeps needed

No test, lint, or typecheck scripts are configured.

## Path Aliases

`@/*` → `src/*` (configured in `tsconfig.json`, resolved at build by `tsc-alias`).

## Auth

API auth uses JWT (`src/presentation/http/auth/middlewares/jwtAuth.ts`). Extracts `Bearer` token from `Authorization` header, sets `req.user`. Routes apply `jwtAuth` middleware as needed. Google OAuth for login flow.

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
`src/presentation/http/core/middlewares/rateLimit.ts`), and every successful login is logged
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

The spec lives in `src/presentation/http/core/docs/openapi.ts`. Request bodies are generated from the
route's Zod validator via `z.toJSONSchema`; response schemas are hand-written to mirror the
`*/responses` interfaces. **When adding or changing a route, update this file too.**

## Authorization (roles)

`requireRole(...roles)` (`src/presentation/http/auth/middlewares/requireRole.ts`) goes **after** `jwtAuth`:

```ts
router.get("/", jwtAuth, requireRole("ADMIN"), asyncHandler(controller.list.bind(controller)));
```

- The role is never taken from the JWT or the client. The user is loaded from the DB
  (`userService.find`) on every request, so role changes and soft-deletes apply immediately.
- No `req.user` or user missing / `deletedAt` set → **401**; role not in the list → **403**
  (`UnauthorizedError` / `ForbiddenError`, formatted by `errorHandler`). On success
  `req.user.role` is populated. `requireRole()` with no roles throws at route definition time.
- In controllers read the authenticated user with `getAuthUser(req)`
  (`src/presentation/http/auth/utils/getAuthUser.ts`); never `@ts-expect-error` on `req.user`.
  `req.user` is typed through the `Express.User` augmentation in `src/types/express.d.ts`.

## Pagination & errors

- `validateSchema(schema, source = "body")` accepts `"body" | "query" | "params"`. The parsed
  output (defaults, coercions) is stored in `req.validated[source]` (Express 5's `req.query` is
  read-only); read it with `getValidated<T>(req, "query")`. Invalid input → 400 `{ message }`.
- `createPaginationQuerySchema(["name", "createdAt"] as const)`
  (`src/presentation/http/core/validators/pagination.ts`) validates `page` (default 1), `pageSize`
  (default 20, max 100) and `sort` (`field` asc / `-field` desc, whitelisted). Add filters with
  `.extend()`. `toPaginationParams(query)` gives the domain `PaginationParams`.
  `uuidParamSchema` / `intIdParamSchema` (and `uuidParam(name)` / `intParam(name)`) validate path params.
- Repositories take `PaginationParams` and return `PaginatedResult<Entity>`
  (`src/domain/core/pagination/Pagination.ts`). In Prisma repositories use `paginate(...)` or
  `toPrismaPage(...)` from `src/infrastructure/core/repositories/prismaPagination.ts`.
- Controllers respond with `toPaginatedResponse(result, mapItem)` →
  `{ data, page, pageSize, total }`.
- `errorHandler` maps Prisma errors via `mapPrismaError`: `P2002` → 409, `P2003` → 409,
  `P2025` → 404. Repositories wrap Prisma errors in `DatabaseError` / `DatabaseInsertError`:
  **always pass the original error as the second argument (`cause`)** so the mapping still works.
- OpenAPI has reusable `components.parameters` (`Page`, `PageSize`, `Sort`, `UuidId`, `IntId`),
  `components.responses` (`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`) and
  the `paginationParams` / `paginated(ref)` helpers exported from `openapi.ts`.

## Categories

`/api/v1/categories`: `GET /` (paginated, sort `id`/`name`, optional `search`) and `GET /:id` are
public; `POST`, `PUT /:id`, `DELETE /:id` require `jwtAuth` + `requireRole("ADMIN")`. Names are
trimmed, 1–100 chars, unique (409 `CategoryAlreadyExistsError`; a P2002 race also maps to 409).
Delete returns 409 `CategoryInUseError` while any `Place` or `Event` references the category;
`UserInterest` rows cascade at DB level so they never block it. `ICategoryRepository.findByIds`
and `CategoryResponse` / `CategoryDtoMapper` are meant to be reused by other modules (user interests).

## Sources

`/api/v1/sources`: `GET /` (paginated, sort `name`/`type`/`lastCrawledAt`, optional `type` enum filter and
`search` substring on name) and `GET /:id` require `jwtAuth` + `requireRole("MODERATOR", "ADMIN")`; `POST`,
`PUT /:id` (full replace) and `DELETE /:id` require `jwtAuth` + `requireRole("ADMIN")`. Ids are UUIDs
(Prisma default). Name is trimmed, 1-191 chars; `url` is optional, must be http(s) and at most 2048 chars;
`type` is `CRAWLER | COMMUNITY | TEAM`. `lastCrawledAt` is not accepted on create and is only changed via
`PUT` by admins (omitted keeps the current value, `null` clears it) or by `SourceService.markCrawled(id, at)`
for future crawler jobs. Delete returns 409 `SourceInUseError` while any `Place` or `Event` references the
source; unknown ids give 404 `SourceNotFoundError`.

## Places

`/api/v1/places`: `GET /` (paginated, sort `name`/`createdAt`/`updatedAt`, default `name`) and `GET /:id` are public
with **optional auth** (`optionalJwtAuth`, `src/presentation/http/auth/middlewares/optionalJwtAuth.ts`: no/invalid/expired
token or missing/soft-deleted user continues anonymously, never 401; a valid one loads the user from the DB and sets
`req.user.role`). `POST /`, `PUT /:id` (full replace) and `PATCH /:id/status` (`{ status }`) require `jwtAuth` +
`requireRole("MODERATOR", "ADMIN")`; `DELETE /:id` requires `requireRole("ADMIN")`. Ids are UUIDs.

- **Visibility**: the controller treats MODERATOR/ADMIN as privileged and passes the service a plain
  `statuses?: ContentStatus[]`. Anonymous/regular users: list forced to `PUBLISHED` (`status` query ignored) and
  `GET /:id` of a non-PUBLISHED place is 404 `PlaceNotFoundError`. Privileged: optional `status` filter (all statuses
  when omitted) and `GET /:id` returns any status.
- **List filters** (all optional): `cantonId`, `provinceId` (via canton), `categoryId`, `targetAudience`, `status`
  (privileged only), `q` (substring on name/description/address, max 100). Geo: bbox `minLat,minLng,maxLat,maxLng`
  (all four, min <= max) **or** radius `lat,lng,radiusKm` (all three, 0 < radiusKm <= 500); mixing them is 400. Radius
  runs a parameterized `$queryRaw` in `PrismaPlaceRepository` (bbox prefilter + Haversine, 6371 km) that returns ids,
  then `id IN (...)` is added to the Prisma `where` so pagination/count stay correct. No antimeridian wrap-around.
- **Detail** (`PlaceDetail` read model from `IPlaceRepository.findDetail`): photos ordered by `position`,
  `averageRating` (2 decimals, `null` if none) and `reviewCount`, both over PUBLISHED reviews only.
- **Body**: `cantonId`, `categoryId`, `sourceId?` (uuid|null), `name` (1-191), `description?` (<=5000), `latitude`
  (-90..90), `longitude` (-180..180), `address?` (<=191), `openingHours?`, `targetAudience?` (default `EVERYONE`).
  Lat/lng are validated in Zod and in the `Coordinates` value object; Prisma `Decimal` <-> `number` in the mapper.
  Status is not in POST/PUT: new places are `PENDING`, PUT keeps the current status.
- **openingHours**: object keyed `monday`..`sunday` (all optional, unknown keys rejected), each an array (max 6) of
  `{ open: "HH:MM", close: "HH:MM" }` (24h, `open < close`, no overlaps within a day, touching is allowed); `[]` = closed
  that day. Zod schema in `validators/openingHours.ts`, re-validated by the `OpeningHours` value object; stored as JSON.
- **422 rules**: unknown `cantonId`/`categoryId`/`sourceId` give `InvalidCantonError` / `InvalidCategoryError` /
  `InvalidSourceError` on create and update. `cantonExists` lives in `IPlaceRepository` until a geography module exists.
- **verifiedAt**: `Place.changeStatus(status, now)` sets `verifiedAt = now` whenever the place transitions to
  `PUBLISHED` (an already-PUBLISHED place keeps its `verifiedAt`); other statuses leave it untouched.
- **isFavorite**: `GET /:id` adds `isFavorite: boolean` when the caller is authenticated (see Favorites) and omits it for anonymous callers; the list endpoint is unchanged.
- **Delete** is a plain `place.delete`: photos, favorites and reviews cascade at DB level and events keep existing with
  `placeId = null` (SET NULL). Category/source deletes still return 409 while any place references them.

## Events

`/api/v1/events`: `GET /` (paginated, sort `startsAt`/`createdAt`/`title`, default `startsAt` **asc**, tie-breaker `id`) and `GET /:id`
are public with **optional auth** (`optionalJwtAuth`). `POST /`, `PUT /:id` (full replace) and `PATCH /:id/status` (`{ status }`)
require `jwtAuth` + `requireRole("MODERATOR", "ADMIN")`; `DELETE /:id` requires `requireRole("ADMIN")`. Ids are UUIDs. Reuses the
`ContentStatus` / `TargetAudience` value objects from `domain/places`.

- **Visibility**: same as places. The controller passes `statuses?: ContentStatus[]` (`["PUBLISHED"]` for anonymous/regular users, `status`
  query ignored; all statuses or the optional `status` filter for MODERATOR/ADMIN). `GET /:id` of a non-PUBLISHED event is 404
  `EventNotFoundError` unless privileged.
- **List filters** (all optional): `from`, `to` (ISO 8601 **with offset**, `from <= to` else 400), `categoryId`, `placeId`, `cantonId`
  (through `place`; events without a place never match), `targetAudience`, `status` (privileged only), `q` (substring on title/description, max 100).
  **`from` defaults to now for everyone** (applied after validation), so the list shows upcoming/ongoing events unless an earlier `from` is sent.
  Range semantics are overlap: `startsAt <= to` AND (`endsAt >= from` OR (`endsAt IS NULL` AND `startsAt >= from`)).
- **Body**: `placeId?` (uuid|null), `categoryId`, `sourceId?` (uuid|null), `title` (1-191), `description?` (<=5000), `startsAt`, `endsAt?`
  (ISO 8601 with offset; responses always use `toISOString()` UTC), `targetAudience?` (default `EVERYONE`). Status is not in POST/PUT: new events are
  `PENDING`, PUT keeps the current status. There is no `verifiedAt` on events.
- **Rules**: `endsAt >= startsAt` is enforced in Zod (400) and by the `EventSchedule` value object (`DataException`, so the service/MCP path is protected too).
  Unknown `placeId` (any status) / `categoryId` / `sourceId` give 422 `InvalidPlaceError` / `InvalidCategoryError` / `InvalidSourceError`
  (the last two are reused from `application/places/errors`).
- **Detail** (`EventDetail` read model): `place: PlaceSummary | null` (`id, name, cantonId, latitude, longitude, address, status`). For non-privileged
  callers the place is `null` when it is not PUBLISHED (`placeId` is still returned); done in `EventService.get` through the same `statuses` option.
- **Delete** is a plain `event.delete`; notifications cascade at DB level.

## Favorites

- `GET /api/v1/me/favorites` (under `profileRouter`, so `jwtAuth`): paginated `{ place: PlaceResponse, createdAt }`.
  Only favorites whose place is currently `PUBLISHED` are listed and counted; unpublishing hides a favorite
  (the row stays) and re-publishing brings it back. Sort whitelist is `createdAt` only, default **desc** (most
  recently favorited first), tie-breaker `placeId`.
- `PUT /api/v1/places/:placeId/favorite` and `DELETE /api/v1/places/:placeId/favorite` (`jwtAuth`, 204, no body) live in
  `placeFavoriteRouter` (`Router({ mergeParams: true })`, mounted in `router.ts` BEFORE `/places` so it is not shadowed).
- **PUT is idempotent**: the place must exist and be `PUBLISHED`, else 404 `PlaceNotFoundError`. The repository
  `upsert`s on `userId_placeId` with `update: {}`, so repeated/concurrent PUTs never 409 and keep the original `createdAt`.
- **DELETE is idempotent**: `deleteMany`, 204 whether or not the favorite existed and regardless of the place's
  status or existence (never 404, hence no `FavoriteNotFoundError`).
- **isFavorite**: `PlaceController.get` calls `IFavoriteService.isFavorite(userId, placeId)` when `req.user` is set and
  adds `isFavorite` to the detail response; anonymous callers do not get the field.

## User interests

`GET /api/v1/me/interests` and `PUT /api/v1/me/interests` (under `profileRouter`, so `jwtAuth`) return
`CategoryResponse[]` ordered by name. PUT body is `{ categoryIds: number[] }` (unique, max 20, empty
clears all) and **replaces the whole set**: `PrismaUserInterestRepository.replaceForUser` runs
`deleteMany` + `createMany` in one transaction. Every id must exist (checked via
`ICategoryRepository.findByIds`) or the API answers 422 `InvalidCategoryIdsError`. `GET /me` also
includes `interests`.
## Admin user management

`/api/v1/users` (`GET /`, `GET /:id`, `PATCH /:id/role`, `DELETE /:id`) is `jwtAuth` + `requireRole("ADMIN")`
(`AdminUsersController`, `AdminUserService`). Soft-deleted users (`deletedAt`) are excluded from list/get
(`UserNotFoundError` 404). `DELETE` reuses `AccountDeletionService` + `AccountDeletionExternalCleanup` (no Apple
code), so it has the same semantics as self-deletion. An admin cannot change their own role or delete themselves
(`SelfModificationError`, 403). Responses use `UserResponse`, which never exposes `ssoSubject`.

## MCP

`POST /mcp` (outside `/api/v1`, same Express app/port) exposes an MCP server
(`@modelcontextprotocol/sdk`) over **Streamable HTTP in stateless mode**: `McpController` builds a fresh
`McpServer` + `StreamableHTTPServerTransport` (`sessionIdGenerator: undefined`) per request and closes both
when the response ends, so there is no in-memory session state. `GET /mcp` and `DELETE /mcp` answer 405.

- **Auth**: `jwtAuth` + `requireRole("MODERATOR", "ADMIN")` — the client sends `Authorization: Bearer <jwt>`.
- **Layout**: `mcp/server/createMcpServer.ts` (`createMcpServerFactory(deps)`) is the single place where tools
  are registered; one `mcp/tools/{model}.tools.ts` per model exporting `register{Model}Tools(server, ...services)`.
  Services are injected from `container.ts` through `McpServerDependencies` (tools never import the container,
  to avoid a circular import). Tools reuse the HTTP DTO mappers (`@/presentation/http/{model}/mappers`).
- **Results**: return `toolOk(payload)` (sets `structuredContent` + a JSON text block; declare an `outputSchema`)
  and wrap handlers in `try/catch` → `toolError(error)` (`mcp/utils/toolResult.ts`): `DomainError` /
  `ApplicationError` messages go to the model with `isError: true`; anything else is logged and returned as a
  generic message. Input validation errors are produced by the SDK from the zod `inputSchema`.
- **Tools**: `list_categories` (`search?`, `page` = 1, `pageSize` = 100 max 100; sorted by name, read-only).
- **Try it**: `npx @modelcontextprotocol/inspector` → Streamable HTTP, `http://localhost:<PORT>/mcp`, with the
  `Authorization` header; or `claude mcp add --transport http mi-vueltica http://localhost:<PORT>/mcp --header "Authorization: Bearer <jwt>"`.

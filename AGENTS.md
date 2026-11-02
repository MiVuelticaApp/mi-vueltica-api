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

The connection parameters (host, user, password, database, port) are parsed from `DATABASE_URL`, which is
also what the Prisma CLI reads (`prisma.config.ts`).

Env vars (see `.env.example`):

- **Required at boot** (the server throws without them): `DATABASE_URL` (`mysql.ts`), `RESEND_API_KEY`,
  `MAIL_FROM`, `MIN_FRONTEND_VERSION` (semver, validated; `required()` in
  `src/presentation/http/core/config/env.ts`).
- **Needed in practice**: `JWT_SECRET` (`JwtTokenService` falls back to a hard-coded secret when it is unset,
  so always set it outside local dev), `JWT_EXPIRES_IN` (default `7d`), and `GOOGLE_CLIENT_ID`,
  `GOOGLE_IOS_CLIENT_ID`, `GOOGLE_ANDROID_CLIENT_ID` for Google login.
- **Optional**: `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (see "Account
  deletion") and `TEST_LOGIN_ENABLED`, `TEST_LOGIN_EMAIL`, `TEST_LOGIN_PASSWORD` (see "Test login").

## Seed data

Reference data (Costa Rica provinces, cantons, initial categories) is seeded, not migrated.

- Dev: `npx prisma db seed` or `npm run db:seed` (command configured in `migrations.seed` of `prisma.config.ts`).
- Prod: `npm run db:seed:prod` runs the compiled `dist/infrastructure/prisma/seed/seed.js`; the Docker
  CMD runs it automatically after `prisma migrate deploy` and before the server starts (every deploy).
- Data files (versioned source of truth): `src/infrastructure/prisma/seed/data/geography.ts`
  (`PROVINCES`, `CANTONS`), `src/infrastructure/prisma/seed/data/categories.ts` (`CATEGORIES`) and
  `src/infrastructure/prisma/seed/data/sources.ts` (`SOURCES`: the "Comunidad" `COMMUNITY` source with the fixed id
  `COMMUNITY_SOURCE_ID` from `src/domain/sources/communitySource.ts`; upserted by id with `update: {}`, so it is only
  created and admin renames are kept). Script: `src/infrastructure/prisma/seed/seed.ts`.
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

API auth uses JWT (`src/presentation/http/auth/middlewares/jwtAuth.ts`). Extracts `Bearer` token from `Authorization` header, sets `req.user`. Routes apply `jwtAuth` middleware as needed. Login is Google (`POST /auth/google`) or Apple Sign In
(`POST /auth/apple`); both return a JWT.

## Test login (App Store / Play review)

`POST /api/v1/auth/qa` exists because Apple and Google require a working demo account
for app review, and this app has no email/password login otherwise (only Google/Apple OAuth,
which reviewers cannot exercise as themselves). Credentials live entirely in env vars
(`TEST_LOGIN_ENABLED`, `TEST_LOGIN_EMAIL`, `TEST_LOGIN_PASSWORD`) — there is no password column
on `User` and no migration; the service (`TestLoginService`,
`src/application/auth/services/implementations/TestLoginService.ts`) compares the submitted
email/password against the configured ones with `crypto.timingSafeEqual` and never reveals
whether the email exists.

The route is only mounted when `TEST_LOGIN_ENABLED === "true"` (`auth.route.ts`); with the flag
unset or false, `POST /api/v1/auth/qa` 404s rather than existing-but-rejecting (it is also left out of
the OpenAPI document). `env.ts`
fails fast at boot if the flag is on but the email/password are missing or the password is
shorter than 16 characters, and prints a loud warning banner on every boot while the flag is on.
The route is additionally rate-limited (10 attempts / 15 min per IP,
`src/presentation/http/core/middlewares/rateLimit.ts`), and every successful login is logged
(IP only, never the password).

On first login a `USER`-role account is created ("Cuenta de Prueba") and `TestAccountSeeder` runs once.
The seeder is currently a placeholder that writes nothing (it was meant to add demo data so
reviewers land on a populated app); its errors are swallowed so they never block the token. From
then on it is a completely ordinary user — same `jwtAuth` and `requireRole` checks as any other
account, no special role or bypass.

**Operating rule: turn it on for submission, turn it off as soon as the app is approved.** This
is not a product feature.

## Account deletion

`POST /api/v1/me` (in `profileRouter`, so `jwtAuth`) deletes the caller's account. It is rate-limited
(5 / 15 min per IP) and accepts an optional strict body `{ appleAuthCode?: string }`, sent only by the
iOS client; unknown keys → 400. The response is **204** with no body. Service errors such as
`UserNotFoundError` (404) propagate via `asyncHandler` to the central `errorHandler`.

### Transactional core

`AccountDeletionService` runs in ONE transaction via `IUserDeletionUnitOfWork`
(`src/infrastructure/users/unitsOfWork/PrismaUserDeletionUnitOfWork.ts`):

1. Load the user; throw `UserNotFoundError` (404) if missing.
2. Capture `email` and `name` **before** deleting (the confirmation email needs a recipient).
3. Hard delete the `User` row. Everything that belongs to the user is removed by the database:
   `UserInterest`, `Submission` (as author), `Favorite`, `Review`, `Device` and `Notification` cascade;
   `Submission.reviewedById` is set to null for submissions the user moderated.

It returns `AccountDeletionResult` `{ email, name }`.

### Best-effort side effects — after the commit

`AccountDeletionExternalCleanup` runs AFTER the transaction commits. Each step has its own
`try/catch` (and the controller wraps the call again), so a provider outage never returns 5xx and
never reverts the deletion:

1. **Apple Sign In token revocation** (App Review 5.1.1(v)) via
   `AppleOAuthProvider.revokeToken(appleAuthCode)`, only when the client sent the code. Requires
   `APPLE_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`; when they are unset it
   skips with one `console.warn`. `GoogleOAuthProvider.revokeToken` is a logged no-op because the
   server never stores Google tokens.
2. **Confirmation email** via `AccountDeletionEmailSender` (HTML + plain text, es-CR) to the
   pre-deletion address. A Resend outage is logged, not surfaced.

The controller logs only the `userId`, never the email or the Apple code. Admin deletion
(`DELETE /api/v1/users/:id`, see "Admin user management") reuses the same service and cleanup, without
an Apple code.

The Apple env vars do not use `required()`: a deployment without them still boots, and only the
Apple token revocation is skipped.

### How a reviewer reproduces it

Log in through the test-login route (see "Test login"), since reviewers cannot use Google/Apple
OAuth as themselves, then send `POST /api/v1/me`. A later `GET /api/v1/me` with the same token
returns 404.

## Key Quirks

- Express **5.x** (not 4) — response methods may differ from 4.x patterns
- Some value object files have typos (e.g., `valouObject.ts`) — match existing naming when editing
- `prisma.config.ts` uses `dotenv/config` import for env loading
- All API routes mounted under `/api/v1`

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
  `components.responses` (`BadRequest`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`,
  `UnprocessableEntity`) and
  the `paginationParams` / `paginated(ref)` helpers exported from `openapi.ts`.

## Categories

`/api/v1/categories`: `GET /` (paginated, sort `id`/`name`, optional `search`) and `GET /:id` are
public; `POST`, `PUT /:id`, `DELETE /:id` require `jwtAuth` + `requireRole("ADMIN")`. Names are
trimmed, 1–100 chars, unique (409 `CategoryAlreadyExistsError`; a P2002 race also maps to 409).
Delete returns 409 `CategoryInUseError` while any `Place` or `Event` references the category;
`UserInterest` rows cascade at DB level so they never block it. `ICategoryRepository.findByIds`
and `CategoryResponse` / `CategoryDtoMapper` are meant to be reused by other modules (user interests).

## Provinces

`/api/v1/provinces` (module `geography`: `src/{domain,application,infrastructure}/geography/`,
`src/presentation/http/geography/`): `GET /` (paginated, sort `id`/`name`, default `id` asc, optional
`include=cantons`) and `GET /:id` are public; `POST`, `PUT /:id`, `DELETE /:id` require `jwtAuth` +
`requireRole("ADMIN")`.

- **Id** is the INEC province code, always sent by the client in `POST { id, name }` (never generated) and
  immutable (`PUT` only takes `{ name }`). Duplicate id or name → 409 `ProvinceAlreadyExistsError`; a P2002
  race also maps to 409. Names are trimmed, 1-191 chars; uniqueness follows the `utf8mb4_unicode_ci`
  collation, so it is case- and accent-insensitive ("san jose" clashes with "San José").
- **Delete** returns 409 `ProvinceInUseError` while the province has cantons (`Canton.provinceId` is
  `ON DELETE RESTRICT`).
- **`include=cantons`** nests `cantons: { id, name }[]` (ordered by id) in each list item through the
  `ProvinceListItem` read model; without it the field is omitted. `CantonSummary` is meant to be reused by
  the canton module (#8).
- **Caching**: successful `GET`s send `Cache-Control: public, max-age=3600` via `setPublicCache(res)`
  (`src/presentation/http/core/utils/cacheControl.ts`), called right before responding so errors are never
  cached. Reuse it for other public reference data.
- **Seed caveat**: the seed upserts provinces by id with `update: { name }`, so a rename made through the API
  is reverted on the next deploy unless `seed/data/geography.ts` is changed too. Provinces created through
  the API survive (the seed never deletes), but the seed's own validation only covers the data files.

## Cantons

Same `geography` module as provinces. `GET /api/v1/provinces/:provinceId/cantons` (`provinceCantonsRouter`,
`Router({ mergeParams: true })`, mounted **before** `/provinces`; paginated, sort `id`/`name`, default `id` asc)
and `GET /api/v1/cantons/:id` are public and cacheable (`setPublicCache`); `POST /cantons`, `PUT /cantons/:id`
and `DELETE /cantons/:id` require `jwtAuth` + `requireRole("ADMIN")`. Responses are `{ id, provinceId, name }`.

- **Id** is the INEC canton code, always sent by the client in `POST { id, provinceId, name }`, and must be
  `provinceId * 100 + cantonNumber` with cantonNumber 1-99 (`assertCantonIdMatchesProvince`, checked by the
  `Canton` entity → 400 `DataException`; Zod only checks the types, so the rule lives in one place). The id
  encodes the province, so both are immutable: `PUT` only takes `{ name }` (other keys are stripped).
- **Province**: unknown `provinceId` in the POST body → 422 `InvalidProvinceError`; unknown `provinceId` in the
  list URL → 404 `ProvinceNotFoundError` (not an empty list).
- **Uniqueness**: duplicate id or duplicate name within the same province → 409 `CantonAlreadyExistsError`
  (`withId()` / `withName()`); same collation as provinces (case- and accent-insensitive); a P2002 race also
  maps to 409. The same name is allowed in different provinces.
- **Delete** returns 409 `CantonInUseError` while any `Place` references the canton (`Place.cantonId` is
  `ON DELETE RESTRICT`).
- **Seed caveat**: same as provinces. The seed upserts cantons by id with `update: { name, provinceId }`, so a
  rename made through the API is reverted on the next deploy unless `seed/data/geography.ts` is changed too.
  Cantons created through the API survive; the seed's "84 cantons" check only covers the data file.

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
  `InvalidSourceError` on create and update. `cantonExists` still lives in `IPlaceRepository`; moving it to `ICantonRepository` is a pending follow-up.
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

## Submissions

Community suggestions of places/events that become real content once a moderator approves them. Crawlers are
expected to use this same API as regular authenticated clients (discovering it through `/openapi.json`).

- **Author side** — `/api/v1/me/submissions` (`mySubmissionsRouter`, mounted **before** `/me`, own `jwtAuth`):
  `POST /` (201), `GET /` (paginated, own only, default `-createdAt`), `GET /:id`, `DELETE /:id` (204, only while
  `PENDING`, else 409). Someone else's submission is a 404 (existence is not leaked).
- **Moderation** — `/api/v1/submissions` (`jwtAuth` + `requireRole("MODERATOR", "ADMIN")` on the whole router):
  `GET /` (queue: `status` defaults to `PENDING`, optional `type`, default order `createdAt` asc), `GET /:id`,
  `POST /:id/approve` (200 `{ submission, created: { type, id } }`), `POST /:id/reject` (`{ reason }`, 1-1000 chars,
  stored in `Submission.reviewNote`). Approve/reject only from `PENDING`, else 409 `SubmissionNotPendingError`.
- **Body** `{ type: "PLACE" | "EVENT", data }`: a Zod discriminated union (`validators/createSubmission.ts`, rendered
  as `oneOf`). `data` is the `POST /places` or `POST /events` body **without `sourceId`**; unknown keys (`sourceId`,
  `aiScore`, `aiReason`, `status`, ...) are stripped. The event variant reuses `CreateEventBaseSchema` +
  `endsAtNotBeforeStartsAt` (Zod 4 forbids `.omit()` on refined objects). The domain re-validates the payload with
  `normalizePlaceData` / `normalizeEventData` (`domain/submissions/entities/SubmissionPayload.ts`); event dates are
  stored in the JSON column as ISO strings. Unknown canton/category/place → 422 (on create and again on approve).
- **Approve** runs in one transaction (`ISubmissionApprovalUnitOfWork` / `PrismaSubmissionApprovalUnitOfWork`, same
  pattern as user deletion): lock the submission row (`findForUpdate`, `SELECT ... FOR UPDATE`), check `PENDING`,
  re-check references, create the Place/Event (repositories insert as `PENDING`), publish it through the entity
  (`place.changeStatus("PUBLISHED", now)` sets `verifiedAt`) with `sourceId = COMMUNITY_SOURCE_ID` (falls back to
  `null` with a warning if an admin deleted that source), then `markReviewed`. The row lock is required: MariaDB 11's
  `innodb_snapshot_isolation` makes a concurrent conditional `UPDATE` fail with "Record has changed since last read"
  (500) instead of matching zero rows; with the lock, concurrent approvals get a clean 409 and create nothing.
  `markReviewed` / `deletePendingOwned` still only write while the row is `PENDING` (second guard).
- **Rate limit**: `POST /me/submissions` allows `SUBMISSION_CREATE_RATE_LIMIT` (20 / 15 min,
  `src/presentation/http/submissions/submissionLimits.ts`) **per user** via `rateLimit({ keyGenerator: byUserId })`
  (in-memory, per process). Raise it if a crawler account needs more.
- `aiScore` / `aiReason` are never writable through the API (reserved for an AI moderation job) and only shown in the
  moderation responses. There is no column linking a submission to the Place/Event it created; the approve
  response returns it.
- Caveat: reading a submission re-validates its stored `data` with the current Place/Event rules, so tightening
  those rules can make old submissions fail to load (400). Migrate or relax the data if that ever happens.

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
  `list_places` (`cantonId?`, `provinceId?`, `categoryId?`, `targetAudience?`, `status?`, `page`, `pageSize` = 20; by name, read-only) and
  `search_places` (required `query`, optional radius `lat`+`lng`+`radiusKm` all together else `isError`, `categoryId?`, `cantonId?`, `status?`, paging; read-only).
  `list_events` (`from?` defaults to now, `to?`, `categoryId?`, `placeId?`, `cantonId?`, `targetAudience?`, `status?`, paging; by `startsAt` asc, `from > to` is an `isError`)
  and `search_events` (same plus required `query` on title/description; read-only). `create_place` and `create_event`
  (same fields as the POST bodies; created as `PENDING`; datetimes ISO 8601 with offset; `endsAt < startsAt` surfaces as `isError` via the domain value object).
  The MCP caller is privileged, so list/search include every status unless `status` is given. Input uses raw Zod shapes (no object-level refinements), so
  cross-field rules live in the handler / domain.
- **Try it**: `npx @modelcontextprotocol/inspector` → Streamable HTTP, `http://localhost:<PORT>/mcp`, with the
  `Authorization` header; or `claude mcp add --transport http mi-vueltica http://localhost:<PORT>/mcp --header "Authorization: Bearer <jwt>"`.

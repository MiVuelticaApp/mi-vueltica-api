import { z } from "zod";
import ENV from "@/presentation/http/core/config/env";
import { GoogleLoginSchema } from "@/presentation/http/auth/validators/googleLogin";
import { AppleLoginSchema } from "@/presentation/http/auth/validators/appleLogin";
import { TestLoginSchema } from "@/presentation/http/auth/validators/testLogin";
import { UpdateUserSchema } from "@/presentation/http/users/validators/updateUser";
import { UpdateInterestsSchema } from "@/presentation/http/users/validators/updateInterests";
import { DeleteAccountSchema } from "@/presentation/http/users/validators/deleteAccount";
import { CreateCategorySchema } from "@/presentation/http/categories/validators/createCategory";
import { UpdateCategorySchema } from "@/presentation/http/categories/validators/updateCategory";
import { CATEGORY_SORT_FIELDS } from "@/presentation/http/categories/validators/listCategories";
import { CreateSourceSchema } from "@/presentation/http/sources/validators/createSource";
import { UpdateSourceSchema } from "@/presentation/http/sources/validators/updateSource";
import { SOURCE_SORT_FIELDS } from "@/presentation/http/sources/validators/listSources";
import { SOURCE_TYPES } from "@/domain/sources/valueObjects/sourceType.valueObject";
import { CreatePlaceSchema } from "@/presentation/http/places/validators/createPlace";
import { UpdatePlaceSchema } from "@/presentation/http/places/validators/updatePlace";
import { ChangePlaceStatusSchema } from "@/presentation/http/places/validators/changePlaceStatus";
import { OpeningHoursSchema } from "@/presentation/http/places/validators/openingHours";
import { FAVORITE_SORT_FIELDS } from "@/presentation/http/favorites/validators/listFavorites";
import { PLACE_SORT_FIELDS, MAX_RADIUS_KM } from "@/presentation/http/places/validators/listPlaces";
import { CONTENT_STATUSES } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { ChangeUserRoleSchema } from "@/presentation/http/users/validators/changeUserRole";
import { USER_SORT_FIELDS } from "@/presentation/http/users/validators/listUsers";
import { AGE_RANGES, USER_ROLES } from "@/domain/users/entities/User";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/domain/core/pagination/Pagination";

// OpenAPI document served to Scalar (see app.ts). Request bodies are generated from the
// same Zod schemas used by validateSchema, so docs can't drift from validation. Responses
// mirror the TS interfaces in */responses and must be kept in sync by hand.
// When adding a route, add it here too.

const toSchema = (schema: z.ZodType) => {
  const { $schema, ...jsonSchema } = z.toJSONSchema(schema, { io: "input" });
  return jsonSchema;
};

const jsonBody = (schema: z.ZodType) => ({
  required: true,
  content: { "application/json": { schema: toSchema(schema) } },
});

const jsonResponse = (description: string, ref: string) => ({
  description,
  content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } },
});

const errorResponse = (description: string) => jsonResponse(description, "Error");

const bearer = [{ bearerAuth: [] }];
// Public endpoint that behaves differently when a valid token is sent (`{}` = anonymous allowed).
const optionalBearer = [{}, { bearerAuth: [] }];

const responseRef = (name: string) => ({ $ref: `#/components/responses/${name}` });

// Reusable pieces for paginated list endpoints (see Pagination & errors in AGENTS.md).
// Endpoints should override the `Sort` description/enum with their own sortable fields.
export const paginationParams = [
  { $ref: "#/components/parameters/Page" },
  { $ref: "#/components/parameters/PageSize" },
  { $ref: "#/components/parameters/Sort" },
];

/** `{ data: Item[], page, pageSize, total }` for a list endpoint returning `itemRef`. */
export const paginated = (itemRef: string) => ({
  allOf: [
    {
      type: "object",
      properties: { data: { type: "array", items: { $ref: `#/components/schemas/${itemRef}` } } },
      required: ["data"],
    },
    { $ref: "#/components/schemas/PaginationMeta" },
  ],
});

const paths: Record<string, Record<string, unknown>> = {
  "/auth/google": {
    post: {
      tags: ["Auth"],
      summary: "Login with Google",
      requestBody: jsonBody(GoogleLoginSchema),
      responses: {
        200: jsonResponse("Authenticated", "AuthResponse"),
        400: responseRef("BadRequest"),
        401: errorResponse("Authentication failed"),
        409: responseRef("Conflict"),
      },
    },
  },
  "/auth/apple": {
    post: {
      tags: ["Auth"],
      summary: "Sign in with Apple",
      requestBody: jsonBody(AppleLoginSchema),
      responses: {
        200: jsonResponse("Authenticated", "AuthResponse"),
        400: responseRef("BadRequest"),
        401: errorResponse("Authentication failed"),
        409: responseRef("Conflict"),
      },
    },
  },
  "/auth/refresh": {
    post: {
      tags: ["Auth"],
      summary: "Refresh JWT",
      description: "Send the current token as `Authorization: Bearer <token>` to get a new one.",
      security: bearer,
      responses: {
        200: jsonResponse("New token", "TokenResponse"),
        401: responseRef("Unauthorized"),
      },
    },
  },
  "/auth/logout": {
    post: {
      tags: ["Auth"],
      summary: "Logout",
      description: "Tokens are stateless; the client is expected to discard its token.",
      security: bearer,
      responses: {
        200: jsonResponse("Logged out", "Message"),
        401: responseRef("Unauthorized"),
      },
    },
  },
  "/auth/me": {
    get: {
      tags: ["Auth"],
      summary: "Current authenticated user",
      security: bearer,
      responses: {
        200: jsonResponse("Current user", "UserResponse"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/me": {
    get: {
      tags: ["Profile"],
      summary: "Get my profile",
      security: bearer,
      responses: {
        200: jsonResponse("Profile", "MyProfileResponse"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
      },
    },
    put: {
      tags: ["Profile"],
      summary: "Update my profile",
      security: bearer,
      requestBody: jsonBody(UpdateUserSchema),
      responses: {
        200: jsonResponse("Updated profile", "UserResponse"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
      },
    },
    post: {
      tags: ["Profile"],
      summary: "Delete my account",
      description: "Permanently deletes the account. Rate limited to 5 requests / 15 min per IP.",
      security: bearer,
      requestBody: { ...jsonBody(DeleteAccountSchema), required: false },
      responses: {
        204: { description: "Account deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        429: errorResponse("Too many requests"),
      },
    },
  },
  "/me/interests": {
    get: {
      tags: ["Profile"],
      summary: "List my interests",
      description: "Categories the authenticated user is interested in, ordered by name.",
      security: bearer,
      responses: {
        200: {
          description: "Interests",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Category" } } } },
        },
        401: responseRef("Unauthorized"),
      },
    },
    put: {
      tags: ["Profile"],
      summary: "Replace my interests",
      description: "Replaces the whole set atomically. An empty list clears all interests. Max 20, no duplicates.",
      security: bearer,
      requestBody: jsonBody(UpdateInterestsSchema),
      responses: {
        200: {
          description: "The new interests",
          content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Category" } } } },
        },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
        422: responseRef("UnprocessableEntity"),
      },
    },
  },
  "/me/favorites": {
    get: {
      tags: ["Favorites"],
      summary: "List my favorite places",
      description:
        "Only favorites whose place is currently PUBLISHED are listed and counted: an unpublished place disappears from the list (the favorite is kept) and reappears when it is published again. Default order is `createdAt` descending (most recently favorited first).",
      security: bearer,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending. Default: `-createdAt`.",
          schema: { type: "string", enum: FAVORITE_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
      ],
      responses: {
        200: {
          description: "Page of favorite places",
          content: { "application/json": { schema: paginated("FavoritePlace") } },
        },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
      },
    },
  },
  "/categories": {
    get: {
      tags: ["Categories"],
      summary: "List categories",
      description: "Public. Paginated; default order is by name.",
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending.",
          schema: { type: "string", enum: CATEGORY_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
        {
          name: "search",
          in: "query",
          description: "Case-insensitive substring match on the category name",
          schema: { type: "string", maxLength: 100 },
        },
      ],
      responses: {
        200: {
          description: "Page of categories",
          content: { "application/json": { schema: paginated("Category") } },
        },
        400: responseRef("BadRequest"),
      },
    },
    post: {
      tags: ["Categories"],
      summary: "Create a category",
      description: "ADMIN only.",
      security: bearer,
      requestBody: jsonBody(CreateCategorySchema),
      responses: {
        201: jsonResponse("Created category", "Category"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        409: responseRef("Conflict"),
      },
    },
  },
  "/categories/{id}": {
    get: {
      tags: ["Categories"],
      summary: "Get a category",
      description: "Public.",
      parameters: [{ $ref: "#/components/parameters/IntId" }],
      responses: {
        200: jsonResponse("Category", "Category"),
        400: responseRef("BadRequest"),
        404: responseRef("NotFound"),
      },
    },
    put: {
      tags: ["Categories"],
      summary: "Rename a category",
      description: "ADMIN only. 409 if another category already has that name.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/IntId" }],
      requestBody: jsonBody(UpdateCategorySchema),
      responses: {
        200: jsonResponse("Updated category", "Category"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      },
    },
    delete: {
      tags: ["Categories"],
      summary: "Delete a category",
      description:
        "ADMIN only. 409 while any place or event references the category. Users' interests in it are removed automatically.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/IntId" }],
      responses: {
        204: { description: "Category deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      },
    },
  },
  "/sources": {
    get: {
      tags: ["Sources"],
      summary: "List sources (MODERATOR, ADMIN)",
      description: "Paginated; default order is by name.",
      security: bearer,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending.",
          schema: { type: "string", enum: SOURCE_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
        {
          name: "type",
          in: "query",
          description: "Filter by source type",
          schema: { $ref: "#/components/schemas/SourceType" },
        },
        {
          name: "search",
          in: "query",
          description: "Case-insensitive substring match on the source name",
          schema: { type: "string", maxLength: 100 },
        },
      ],
      responses: {
        200: {
          description: "Page of sources",
          content: { "application/json": { schema: paginated("Source") } },
        },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
      },
    },
    post: {
      tags: ["Sources"],
      summary: "Create a source",
      description: "ADMIN only. `lastCrawledAt` cannot be set on creation.",
      security: bearer,
      requestBody: jsonBody(CreateSourceSchema),
      responses: {
        201: jsonResponse("Created source", "Source"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
      },
    },
  },
  "/sources/{id}": {
    get: {
      tags: ["Sources"],
      summary: "Get a source (MODERATOR, ADMIN)",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        200: jsonResponse("Source", "Source"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
    put: {
      tags: ["Sources"],
      summary: "Replace a source",
      description:
        "ADMIN only. Full replace of name, url and type. `lastCrawledAt` is kept when omitted and set (or cleared with null) when provided.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(UpdateSourceSchema),
      responses: {
        200: jsonResponse("Updated source", "Source"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
    delete: {
      tags: ["Sources"],
      summary: "Delete a source",
      description: "ADMIN only. 409 while any place or event references the source.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        204: { description: "Source deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      },
    },
  },
  "/places": {
    get: {
      tags: ["Places"],
      summary: "List places",
      description:
        "Public (optional bearer token). Anonymous and regular users only see PUBLISHED places; MODERATOR / ADMIN see every status and may filter with `status`. Paginated; default order is by name. Geo filters: bounding box (`minLat`, `minLng`, `maxLat`, `maxLng`) or radius (`lat`, `lng`, `radiusKm`), never both.",
      security: optionalBearer,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending. Default: `name`.",
          schema: { type: "string", enum: PLACE_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
        {
          name: "cantonId",
          in: "query",
          description: "Filter by canton id",
          schema: { type: "integer", minimum: 1 },
        },
        {
          name: "provinceId",
          in: "query",
          description: "Filter by province id (through the canton)",
          schema: { type: "integer", minimum: 1 },
        },
        {
          name: "categoryId",
          in: "query",
          description: "Filter by category id",
          schema: { type: "integer", minimum: 1 },
        },
        {
          name: "targetAudience",
          in: "query",
          description: "Filter by target audience",
          schema: { $ref: "#/components/schemas/TargetAudience" },
        },
        {
          name: "status",
          in: "query",
          description: "Filter by status. Only honored for MODERATOR / ADMIN (send the bearer token); ignored for everyone else, who always get PUBLISHED only.",
          schema: { $ref: "#/components/schemas/ContentStatus" },
        },
        {
          name: "q",
          in: "query",
          description: "Substring match on name, description or address",
          schema: { type: "string", maxLength: 100 },
        },
        {
          name: "minLat",
          in: "query",
          description: "Bounding box south edge. `minLat`, `minLng`, `maxLat` and `maxLng` must be sent together (min <= max). Mutually exclusive with the radius filter.",
          schema: { type: "number", minimum: -90, maximum: 90 },
        },
        {
          name: "minLng",
          in: "query",
          description: "Bounding box west edge (see `minLat`)",
          schema: { type: "number", minimum: -180, maximum: 180 },
        },
        {
          name: "maxLat",
          in: "query",
          description: "Bounding box north edge (see `minLat`)",
          schema: { type: "number", minimum: -90, maximum: 90 },
        },
        {
          name: "maxLng",
          in: "query",
          description: "Bounding box east edge (see `minLat`)",
          schema: { type: "number", minimum: -180, maximum: 180 },
        },
        {
          name: "lat",
          in: "query",
          description: "Radius search center latitude. `lat`, `lng` and `radiusKm` must be sent together. Mutually exclusive with the bounding box filter.",
          schema: { type: "number", minimum: -90, maximum: 90 },
        },
        {
          name: "lng",
          in: "query",
          description: "Radius search center longitude (see `lat`)",
          schema: { type: "number", minimum: -180, maximum: 180 },
        },
        {
          name: "radiusKm",
          in: "query",
          description: "Radius in kilometers (see `lat`), Haversine distance",
          schema: { type: "number", exclusiveMinimum: 0, maximum: MAX_RADIUS_KM },
        },
      ],
      responses: {
        200: {
          description: "Page of places",
          content: { "application/json": { schema: paginated("Place") } },
        },
        400: responseRef("BadRequest"),
      },
    },
    post: {
      tags: ["Places"],
      summary: "Create a place (MODERATOR, ADMIN)",
      description:
        "New places start as PENDING. 422 when the canton, category or source does not exist.",
      security: bearer,
      requestBody: jsonBody(CreatePlaceSchema),
      responses: {
        201: jsonResponse("Created place", "Place"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        422: responseRef("UnprocessableEntity"),
      },
    },
  },
  "/places/{id}": {
    get: {
      tags: ["Places"],
      summary: "Get a place",
      description:
        "Public (optional bearer token). Includes photos ordered by position and the rating summary over PUBLISHED reviews. A non-PUBLISHED place is 404 unless the caller is MODERATOR / ADMIN. Authenticated callers also get `isFavorite`.",
      security: optionalBearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        200: jsonResponse("Place", "PlaceDetail"),
        400: responseRef("BadRequest"),
        404: responseRef("NotFound"),
      },
    },
    put: {
      tags: ["Places"],
      summary: "Replace a place (MODERATOR, ADMIN)",
      description:
        "Full replace of the editable fields; the status and verifiedAt are kept (use `PATCH /places/{id}/status`). 422 when the canton, category or source does not exist.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(UpdatePlaceSchema),
      responses: {
        200: jsonResponse("Updated place", "Place"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        422: responseRef("UnprocessableEntity"),
      },
    },
    delete: {
      tags: ["Places"],
      summary: "Delete a place (ADMIN)",
      description:
        "Photos, favorites and reviews are deleted with the place; events that referenced it are kept with no place.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        204: { description: "Place deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/places/{placeId}/favorite": {
    put: {
      tags: ["Favorites"],
      summary: "Favorite a place",
      description:
        "Idempotent: favoriting an already favorited place is a no-op (204) that keeps the original `createdAt`. 404 unless the place exists and is PUBLISHED.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/PlaceId" }],
      responses: {
        204: { description: "Place is now a favorite" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
      },
    },
    delete: {
      tags: ["Favorites"],
      summary: "Unfavorite a place",
      description:
        "Idempotent: 204 whether or not the favorite existed, and regardless of the place's status or existence (never 404).",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/PlaceId" }],
      responses: {
        204: { description: "Place is not a favorite" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
      },
    },
  },
  "/places/{id}/status": {
    patch: {
      tags: ["Places"],
      summary: "Change a place's status (MODERATOR, ADMIN)",
      description:
        "Moving to PUBLISHED sets `verifiedAt` to now (kept if the place is already PUBLISHED). Other statuses leave `verifiedAt` untouched.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(ChangePlaceStatusSchema),
      responses: {
        200: jsonResponse("Updated place", "Place"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/users": {
    get: {
      tags: ["Users"],
      summary: "List users (ADMIN)",
      description: "Active (not soft-deleted) users only.",
      security: bearer,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: `Field to sort by (\`field\` ascending, \`-field\` descending): ${USER_SORT_FIELDS.join(", ")}`,
          schema: { type: "string", examples: ["createdAt", "-createdAt"] },
        },
        { name: "role", in: "query", description: "Filter by role", schema: { type: "string", enum: [...USER_ROLES] } },
        {
          name: "search",
          in: "query",
          description: "Case-insensitive contains match on email, name or surnames",
          schema: { type: "string", maxLength: 100 },
        },
      ],
      responses: {
        200: {
          description: "Paginated users",
          content: { "application/json": { schema: paginated("UserResponse") } },
        },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
      },
    },
  },
  "/users/{id}": {
    get: {
      tags: ["Users"],
      summary: "Get a user (ADMIN)",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        200: jsonResponse("User", "UserResponse"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
    delete: {
      tags: ["Users"],
      summary: "Delete a user (ADMIN)",
      description:
        "Same semantics as self-deletion (`POST /me`): removes the account and its data, then runs best-effort external cleanup. An admin cannot delete their own account here (403).",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        204: { description: "User deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/users/{id}/role": {
    patch: {
      tags: ["Users"],
      summary: "Change a user's role (ADMIN)",
      description: "An admin cannot change their own role (403).",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(ChangeUserRoleSchema),
      responses: {
        200: jsonResponse("Updated user", "UserResponse"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/system/min-frontend-version": {
    get: {
      tags: ["System"],
      summary: "Minimum supported frontend version",
      description: "Public. Lets clients force an update before logging in.",
      responses: {
        200: jsonResponse("Minimum version", "MinFrontendVersionResponse"),
      },
    },
  },
};

// Mirrors auth.route.ts: the route only exists when the flag is on, so only document it then.
if (ENV.TEST_LOGIN_ENABLED) {
  paths["/auth/qa"] = {
    post: {
      tags: ["Auth"],
      summary: "Test login (App Store / Google Play review only)",
      description: "Rate limited to 10 requests / 15 min per IP.",
      requestBody: jsonBody(TestLoginSchema),
      responses: {
        200: jsonResponse("Authenticated", "AuthResponse"),
        400: responseRef("BadRequest"),
        401: errorResponse("Invalid credentials"),
        429: errorResponse("Too many requests"),
      },
    },
  };
}

const userProperties = {
  id: { type: "string" },
  email: { type: "string", format: "email" },
  name: { type: "string" },
  surnames: { type: "string" },
  ageRange: { type: ["string", "null"], enum: [...AGE_RANGES, null] },
  role: { type: "string", enum: [...USER_ROLES] },
};

const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Mi Vueltica API",
    version: "1.0.0",
  },
  servers: [{ url: "/api/v1" }],
  tags: [
    { name: "Auth" },
    { name: "Profile" },
    { name: "Categories" },
    { name: "Sources" },
    { name: "Places" },
    { name: "Favorites" },
    { name: "Users" },
    { name: "System" },
  ],
  paths,
  components: {
    parameters: {
      Page: {
        name: "page",
        in: "query",
        description: "1-based page number",
        schema: { type: "integer", minimum: 1, default: DEFAULT_PAGE },
      },
      PageSize: {
        name: "pageSize",
        in: "query",
        description: "Items per page",
        schema: { type: "integer", minimum: 1, maximum: MAX_PAGE_SIZE, default: DEFAULT_PAGE_SIZE },
      },
      Sort: {
        name: "sort",
        in: "query",
        description: "Field to sort by: `field` for ascending, `-field` for descending. Allowed fields depend on the endpoint.",
        schema: { type: "string", examples: ["createdAt", "-createdAt"] },
      },
      UuidId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      PlaceId: {
        name: "placeId",
        in: "path",
        required: true,
        schema: { type: "string", format: "uuid" },
      },
      IntId: {
        name: "id",
        in: "path",
        required: true,
        schema: { type: "integer", minimum: 1 },
      },
    },
    responses: {
      BadRequest: jsonResponse("Invalid request body, query or path parameters", "Error"),
      Unauthorized: jsonResponse("Missing or invalid token", "Error"),
      Forbidden: jsonResponse("The authenticated user lacks the required role", "Error"),
      NotFound: jsonResponse("Resource not found", "Error"),
      UnprocessableEntity: jsonResponse("Well-formed request referencing resources that do not exist (e.g. unknown category ids)", "Error"),
      Conflict: jsonResponse("Conflict with the current state (e.g. already exists or in use)", "Error"),
    },
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      Error: {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"],
      },
      PaginationMeta: {
        type: "object",
        properties: {
          page: { type: "integer", minimum: 1 },
          pageSize: { type: "integer", minimum: 1, maximum: MAX_PAGE_SIZE },
          total: { type: "integer", minimum: 0 },
        },
        required: ["page", "pageSize", "total"],
      },
      Message: {
        type: "object",
        properties: { message: { type: "string" } },
        required: ["message"],
      },
      UserResponse: {
        type: "object",
        properties: userProperties,
        required: Object.keys(userProperties),
      },
      Category: {
        type: "object",
        properties: { id: { type: "integer" }, name: { type: "string", minLength: 1, maxLength: 100 } },
        required: ["id", "name"],
      },
      SourceType: { type: "string", enum: [...SOURCE_TYPES] },
      Source: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", minLength: 1, maxLength: 191 },
          url: { type: ["string", "null"], format: "uri", maxLength: 2048 },
          type: { $ref: "#/components/schemas/SourceType" },
          lastCrawledAt: { type: ["string", "null"], format: "date-time" },
        },
        required: ["id", "name", "url", "type", "lastCrawledAt"],
      },
      ContentStatus: { type: "string", enum: [...CONTENT_STATUSES] },
      TargetAudience: { type: "string", enum: [...TARGET_AUDIENCES] },
      OpeningHours: toSchema(OpeningHoursSchema),
      PlacePhoto: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          url: { type: "string", maxLength: 2048 },
          position: { type: "integer" },
        },
        required: ["id", "url", "position"],
      },
      Place: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          cantonId: { type: "integer" },
          categoryId: { type: "integer" },
          sourceId: { type: ["string", "null"], format: "uuid" },
          name: { type: "string", minLength: 1, maxLength: 191 },
          description: { type: ["string", "null"], maxLength: 5000 },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
          address: { type: ["string", "null"], maxLength: 191 },
          openingHours: {
            oneOf: [{ $ref: "#/components/schemas/OpeningHours" }, { type: "null" }],
          },
          targetAudience: { $ref: "#/components/schemas/TargetAudience" },
          status: { $ref: "#/components/schemas/ContentStatus" },
          verifiedAt: { type: ["string", "null"], format: "date-time" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id", "cantonId", "categoryId", "sourceId", "name", "description", "latitude", "longitude",
          "address", "openingHours", "targetAudience", "status", "verifiedAt", "createdAt", "updatedAt",
        ],
      },
      FavoritePlace: {
        type: "object",
        properties: {
          place: { $ref: "#/components/schemas/Place" },
          createdAt: { type: "string", format: "date-time", description: "When the user favorited the place" },
        },
        required: ["place", "createdAt"],
      },
      PlaceDetail: {
        allOf: [
          { $ref: "#/components/schemas/Place" },
          {
            type: "object",
            properties: {
              photos: { type: "array", items: { $ref: "#/components/schemas/PlacePhoto" } },
              averageRating: {
                type: ["number", "null"],
                minimum: 1,
                maximum: 5,
                description: "Mean of PUBLISHED reviews rounded to 2 decimals; null when there are none",
              },
              reviewCount: { type: "integer", minimum: 0, description: "Number of PUBLISHED reviews" },
              isFavorite: {
                type: "boolean",
                description: "Only present for authenticated callers: whether the caller favorited this place",
              },
            },
            required: ["photos", "averageRating", "reviewCount"],
          },
        ],
      },
      MyProfileResponse: {
        allOf: [
          { $ref: "#/components/schemas/UserResponse" },
          {
            type: "object",
            properties: { interests: { type: "array", items: { $ref: "#/components/schemas/Category" } } },
            required: ["interests"],
          },
        ],
      },
      AuthResponse: {
        type: "object",
        properties: {
          user: { $ref: "#/components/schemas/UserResponse" },
          token: { type: "string" },
          expiresIn: { type: "string", examples: ["7d"] },
        },
        required: ["user", "token", "expiresIn"],
      },
      TokenResponse: {
        type: "object",
        properties: {
          token: { type: "string" },
          expiresIn: { type: "string", examples: ["7d"] },
        },
        required: ["token", "expiresIn"],
      },
      MinFrontendVersionResponse: {
        type: "object",
        properties: { minVersion: { type: "string", examples: ["1.0.0"] } },
        required: ["minVersion"],
      },
    },
  },
};

export default openApiDocument;

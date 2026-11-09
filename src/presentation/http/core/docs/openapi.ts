import { z } from "zod";
import ENV from "@/presentation/http/core/config/env";
import { GoogleLoginSchema } from "@/presentation/http/auth/validators/googleLogin";
import { AppleLoginSchema } from "@/presentation/http/auth/validators/appleLogin";
import { TestLoginSchema } from "@/presentation/http/auth/validators/testLogin";
import { LogoutBodySchema } from "@/presentation/http/auth/validators/logout";
import { RegisterDeviceSchema } from "@/presentation/http/devices/validators/registerDevice";
import { DEVICE_SORT_FIELDS } from "@/presentation/http/devices/validators/listDevices";
import { NOTIFICATION_SORT_FIELDS } from "@/presentation/http/notifications/validators/listNotifications";
import { PLATFORMS } from "@/domain/devices/valueObjects/platform.valueObject";
import { UpdateUserSchema } from "@/presentation/http/users/validators/updateUser";
import { UpdateInterestsSchema } from "@/presentation/http/users/validators/updateInterests";
import { DeleteAccountSchema } from "@/presentation/http/users/validators/deleteAccount";
import { CreateCategorySchema } from "@/presentation/http/categories/validators/createCategory";
import { UpdateCategorySchema } from "@/presentation/http/categories/validators/updateCategory";
import { CATEGORY_SORT_FIELDS } from "@/presentation/http/categories/validators/listCategories";
import { CreateProvinceSchema } from "@/presentation/http/geography/validators/createProvince";
import { UpdateProvinceSchema } from "@/presentation/http/geography/validators/updateProvince";
import { PROVINCE_INCLUDES, PROVINCE_SORT_FIELDS } from "@/presentation/http/geography/validators/listProvinces";
import { PROVINCE_NAME_MAX_LENGTH } from "@/domain/geography/valueObjects/provinceName.valueObject";
import { CreateCantonSchema } from "@/presentation/http/geography/validators/createCanton";
import { UpdateCantonSchema } from "@/presentation/http/geography/validators/updateCanton";
import { CANTON_SORT_FIELDS } from "@/presentation/http/geography/validators/listCantons";
import { CANTON_NAME_MAX_LENGTH } from "@/domain/geography/valueObjects/cantonName.valueObject";
import { REFERENCE_DATA_MAX_AGE_SECONDS } from "@/presentation/http/core/utils/cacheControl";
import { CreateSourceSchema } from "@/presentation/http/sources/validators/createSource";
import { UpdateSourceSchema } from "@/presentation/http/sources/validators/updateSource";
import { SOURCE_SORT_FIELDS } from "@/presentation/http/sources/validators/listSources";
import { SOURCE_TYPES } from "@/domain/sources/valueObjects/sourceType.valueObject";
import { CreatePlaceSchema } from "@/presentation/http/places/validators/createPlace";
import { UpdatePlaceSchema } from "@/presentation/http/places/validators/updatePlace";
import { ChangePlaceStatusSchema } from "@/presentation/http/places/validators/changePlaceStatus";
import { OpeningHoursSchema } from "@/presentation/http/places/validators/openingHours";
import { CreateEventSchema } from "@/presentation/http/events/validators/createEvent";
import { UpdateEventSchema } from "@/presentation/http/events/validators/updateEvent";
import { ChangeEventStatusSchema } from "@/presentation/http/events/validators/changeEventStatus";
import { EVENT_SORT_FIELDS } from "@/presentation/http/events/validators/listEvents";
import { FAVORITE_SORT_FIELDS } from "@/presentation/http/favorites/validators/listFavorites";
import { CreateReviewSchema, UpdateReviewSchema } from "@/presentation/http/reviews/validators/reviewBody";
import { ChangeReviewStatusSchema } from "@/presentation/http/reviews/validators/changeReviewStatus";
import { REVIEW_SORT_FIELDS } from "@/presentation/http/reviews/validators/listReviews";
import { MAX_RATING, MIN_RATING } from "@/domain/reviews/valueObjects/rating.valueObject";
import { REVIEW_COMMENT_MAX_LENGTH } from "@/domain/reviews/valueObjects/reviewComment.valueObject";
import { REVIEW_AUDIENCES, SPENT_TIERS, WENT_WITH_VALUES } from "@/domain/reviews/valueObjects/reviewExperience.valueObject";
import { REVIEW_MAX_PHOTOS } from "@/domain/reviews/valueObjects/reviewPhotos.valueObject";
import { VerifySchema, ReportSchema, ReportDecisionSchema } from "@/presentation/http/community/validators/community";
import { REPORT_RATE_LIMIT, VERIFICATION_RATE_LIMIT } from "@/presentation/http/community/communityLimits";
import { REPORT_REASONS } from "@/domain/community/valueObjects/reportReason.valueObject";
import { REPORTS_TO_HIDE, NEEDS_REVIEW_HOURS } from "@/domain/community/rules/reportRules";
import { VERIFICATIONS_TO_UPDATE } from "@/domain/community/rules/verificationRules";
import { PLACE_SORT_FIELDS, MAX_RADIUS_KM } from "@/presentation/http/places/validators/listPlaces";
import { CONTENT_STATUSES } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import {
  AUDIENCES,
  FREE_FOR_GROUPS,
  MAX_PRICE_PER_PERSON,
  PRICE_TIERS,
} from "@/domain/places/valueObjects/planConditions.valueObject";
import { ChangeUserRoleSchema } from "@/presentation/http/users/validators/changeUserRole";
import { USER_SORT_FIELDS } from "@/presentation/http/users/validators/listUsers";
import { CreateSubmissionSchema } from "@/presentation/http/submissions/validators/createSubmission";
import { REJECTION_REASONS, REJECTION_REASON_LABELS } from "@/domain/submissions/valueObjects/rejectionReason.valueObject";
import { RejectSubmissionSchema } from "@/presentation/http/submissions/validators/rejectSubmission";
import { SUBMISSION_SORT_FIELDS } from "@/presentation/http/submissions/validators/listSubmissions";
import { SUBMISSION_CREATE_RATE_LIMIT } from "@/presentation/http/submissions/submissionLimits";
import { SUBMISSION_TYPES } from "@/domain/submissions/valueObjects/submissionType.valueObject";
import { AGE_RANGES, USER_ROLES } from "@/domain/users/entities/User";
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/domain/core/pagination/Pagination";
import { SUBMISSION_MAX_PHOTOS } from "@/domain/submissions/entities/SubmissionPayload";
import { AddPhotoSchema } from "@/presentation/http/photos/validators/addPhoto";
import { ReorderPhotosSchema } from "@/presentation/http/photos/validators/reorderPhotos";
import {
  UPLOAD_ACCEPTED_TYPES,
  UPLOAD_FIELD_NAME,
  UPLOAD_MAX_BYTES,
  UPLOAD_RATE_LIMIT,
} from "@/presentation/http/uploads/uploadLimits";
import { MAX_IMAGE_DIMENSION } from "@/domain/uploads/services/IImageProcessor";

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

// Response header sent by cacheable public reads (setPublicCache), only on success.
const publicCacheHeaders = {
  "Cache-Control": {
    description: "Cacheable public reference data.",
    schema: { type: "string", example: `public, max-age=${REFERENCE_DATA_MAX_AGE_SECONDS}` },
  },
};

// Reusable pieces for paginated list endpoints (see Pagination & errors in AGENTS.md).
// Endpoints should override the `Sort` description/enum with their own sortable fields.
export const paginationParams = [
  { $ref: "#/components/parameters/Page" },
  { $ref: "#/components/parameters/PageSize" },
  { $ref: "#/components/parameters/Sort" },
];

const booleanFlagSchema = { type: "string", enum: ["true", "false"] } as const;

/** `authorName` of Place and Event (#40). */
const authorNameSchema = {
  type: ["string", "null"],
  description:
    'Who contributed it: "Ana M." (first name + first surname initial), "Anónimo" for a community plan whose author is ' +
    "unknown (deleted account, or approved before authors were recorded), null for team content",
};

/** `reason` codes of `POST /submissions/{id}/reject` with the text the author sees (#40). */
const rejectionReasonList = Object.entries(REJECTION_REASON_LABELS)
  .map(([code, label]) => `\`${code}\` (${label})`)
  .join(", ");

/** Bounding box or radius filters shared by `GET /places` and `GET /events` (`what` names the point matched). */
const geoParams = (what: string) => [
  {
    name: "minLat",
    in: "query",
    description: `Bounding box south edge, matched against ${what}. \`minLat\`, \`minLng\`, \`maxLat\` and \`maxLng\` must be sent together (min <= max). Mutually exclusive with the radius filter.`,
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
    description: `Radius search center latitude, matched against ${what}. \`lat\`, \`lng\` and \`radiusKm\` must be sent together. Mutually exclusive with the bounding box filter.`,
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
];

/** Price / audience / accessibility filters shared by `GET /places` and `GET /events` (the app's filters). */
const planConditionsParams = [
  {
    name: "maxPrice",
    in: "query",
    description:
      "Price ceiling: `gratis` (0), `hasta2500` (<= ₡2.500) or `hasta5000` (<= ₡5.000). `hasta5000` also includes plans whose price is unknown (`pricePerPerson: null`).",
    schema: { $ref: "#/components/schemas/PriceTier" },
  },
  {
    name: "students",
    in: "query",
    description: "`true`: only plans aimed at students (`audiences` has `estudiantes`) or free for them (`freeFor` has `estudiantes`). `false` does not filter.",
    schema: booleanFlagSchema,
  },
  {
    name: "seniors",
    in: "query",
    description: "`true`: only plans aimed at senior citizens (`ciudadanosOro`) or free for them. `false` does not filter.",
    schema: booleanFlagSchema,
  },
  {
    name: "families",
    in: "query",
    description: "`true`: only plans whose `audiences` include `familias`. `false` does not filter.",
    schema: booleanFlagSchema,
  },
  {
    name: "wheelchair",
    in: "query",
    description: "`true`: only wheelchair-accessible plans. `false` does not filter.",
    schema: booleanFlagSchema,
  },
];

/** Response properties shared by `Place` and `Event`. */
const planConditionsProperties = {
  pricePerPerson: {
    type: ["integer", "null"],
    minimum: 0,
    maximum: MAX_PRICE_PER_PERSON,
    description: "Colones per person; 0 = free, null = unknown",
  },
  priceTier: {
    oneOf: [{ $ref: "#/components/schemas/PriceTier" }, { type: "null" }],
    description: "Derived from pricePerPerson (0 → gratis, 1-2500 → hasta2500, 2501-5000 → hasta5000); null when the price is unknown",
  },
  freeFor: {
    type: "array",
    items: { $ref: "#/components/schemas/FreeForGroup" },
    description: "Groups that enter free even when pricePerPerson > 0",
  },
  audiences: {
    type: "array",
    minItems: 1,
    items: { $ref: "#/components/schemas/Audience" },
    description: "Who the plan is for. Replaces the single-value targetAudience, which is kept for older clients",
  },
  wheelchair: { type: "boolean", description: "Wheelchair accessible" },
};
const planConditionsRequired = ["pricePerPerson", "priceTier", "freeFor", "audiences", "wheelchair"];

const priceLimitNote = ` 422 when \`pricePerPerson\` is above ₡${MAX_PRICE_PER_PERSON}.`;

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

/** GET / POST / PATCH order of a Place or Event gallery (`/places/{placeId}/photos`, `/events/{eventId}/photos`). */
const galleryPaths = (kind: "place" | "event") => {
  const tag = "Photos";
  const base = `/${kind}s/{${kind}Id}/photos`;
  const parameters = [{ $ref: `#/components/parameters/${kind === "place" ? "PlaceId" : "EventId"}` }];
  return {
    [base]: {
      get: {
        tags: [tag],
        summary: `List the ${kind}'s photos`,
        description:
          `Public (optional bearer token). The ${kind}'s gallery ordered by \`position\`. 404 if the ${kind} does not exist or is not PUBLISHED, unless the caller is MODERATOR / ADMIN.`,
        security: optionalBearer,
        parameters,
        responses: {
          200: { description: "Photos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Photo" } } } } },
          400: responseRef("BadRequest"),
          404: responseRef("NotFound"),
        },
      },
      post: {
        tags: [tag],
        summary: `Add a photo to the ${kind} (MODERATOR, ADMIN)`,
        description:
          `Appended at the end of the gallery (\`position = max + 1\`). \`url\` is either a URL returned by \`POST /uploads\` (linked to that upload, stored in canonical form) or any external **https** URL (max 2048 chars). 422 when it looks like one of our file URLs but the upload does not exist.`,
        security: bearer,
        parameters,
        requestBody: jsonBody(AddPhotoSchema),
        responses: {
          201: jsonResponse("Created photo", "Photo"),
          400: responseRef("BadRequest"),
          401: responseRef("Unauthorized"),
          403: responseRef("Forbidden"),
          404: responseRef("NotFound"),
          422: responseRef("UnprocessableEntity"),
        },
      },
    },
    [`${base}/order`]: {
      patch: {
        tags: [tag],
        summary: `Reorder the ${kind}'s photos (MODERATOR, ADMIN)`,
        description:
          "`photoIds` must contain exactly the gallery's photo ids, each once (else 422); the first gets position 0. Applied in one transaction. Returns the reordered gallery.",
        security: bearer,
        parameters,
        requestBody: jsonBody(ReorderPhotosSchema),
        responses: {
          200: { description: "Reordered photos", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/Photo" } } } } },
          400: responseRef("BadRequest"),
          401: responseRef("Unauthorized"),
          403: responseRef("Forbidden"),
          404: responseRef("NotFound"),
          422: responseRef("UnprocessableEntity"),
        },
      },
    },
  };
};

/** PUBLISHED reviews per star. */
/** Card stats of list items (PlaceCard / EventCard). Same rating rules as the detail, without the distribution. */
const planStatsSchema = {
  type: "object",
  properties: {
    averageRating: {
      type: ["number", "null"],
      minimum: 1,
      maximum: 5,
      description: "Mean of PUBLISHED reviews rounded to 2 decimals; null when there are none",
    },
    reviewCount: { type: "integer", minimum: 0, description: "Number of PUBLISHED reviews" },
    coverPhotoUrl: {
      type: ["string", "null"],
      description: "First photo of the gallery (lowest position), for the card's thumbnail; null without photos",
    },
  },
  required: ["averageRating", "reviewCount", "coverPhotoUrl"],
};

const ratingDistributionSchema = {
  type: "array",
  minItems: MAX_RATING,
  maxItems: MAX_RATING,
  items: { type: "integer", minimum: 0 },
  description: "Number of PUBLISHED reviews per star: index 0 = 1 star ... index 4 = 5 stars",
};

/** Page, pageSize and the reviews `sort` whitelist; `defaultSort` is only documented. */
const reviewListParams = (defaultSort: string) => [
  { $ref: "#/components/parameters/Page" },
  { $ref: "#/components/parameters/PageSize" },
  {
    name: "sort",
    in: "query",
    description: `Field to sort by: \`field\` ascending, \`-field\` descending. Default: \`${defaultSort}\`.`,
    schema: { type: "string", enum: REVIEW_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
  },
];

/** GET / POST of the reviews of a Place or Event (`/places/{placeId}/reviews`, `/events/{eventId}/reviews`). */
/** Optional guest identity for verifications and reports (signed-in callers are identified by the token). */
const deviceIdHeader = {
  name: "X-Device-Id",
  in: "header",
  required: false,
  description:
    "Guests only (no bearer token): a stable id of the device, 8-128 characters of letters, digits, `.`, `_`, `:` " +
    "or `-`. Verifications and reports are deduplicated per device. Ignored when a valid bearer token is sent.",
  schema: { type: "string", pattern: "^[A-Za-z0-9._:-]{8,128}$" },
};

const perMinutes = (limit: { windowMs: number; max: number }) => `${limit.max} / ${limit.windowMs / 60000} min`;

/** Verifications, reports and the report decision of a Place or Event (`/places/{placeId}/...`, `/events/{eventId}/...`). */
const communityPaths = (kind: "place" | "event") => {
  const param = { $ref: `#/components/parameters/${kind === "place" ? "PlaceId" : "EventId"}` };
  const noun = kind;
  return {
    [`/${kind}s/{${kind}Id}/verifications`]: {
      post: {
        tags: ["Community"],
        summary: `Verify a${kind === "event" ? "n" : ""} ${noun} ("¿Sigue siendo gratis?")`,
        description:
          `Signed-in users (bearer token) or guests (\`X-Device-Id\`; 400 with neither). One counted verification per ` +
          `person and ${noun}: a newer answer replaces the previous one. ${VERIFICATIONS_TO_UPDATE} matching answers update the ` +
          `listing: \`stillHappening: "no"\` hides it ("Ya no existe"), \`pricePaid: "mas5000"\` hides it ("Cuesta más de ₡5.000") ` +
          "and any other `pricePaid` sets the price to that tier (kept if it already is in it, else the tier's maximum). " +
          "Hiding makes it ARCHIVED with `hiddenReason`; its author still sees it. Price answers only count from signed-in " +
          "users (the app's \"level 2\" rule; the API has no reputation yet). `photo` is a URL from `POST /uploads` " +
          `(signed-in users only, 401 for guests; 422 if not the caller's own upload). 404 unless the ${noun} is PUBLISHED. ` +
          `Rate limit: ${perMinutes(VERIFICATION_RATE_LIMIT)} per user or IP. \`queued\` is always false and \`points\` always 0.`,
        security: optionalBearer,
        parameters: [param, deviceIdHeader],
        requestBody: jsonBody(VerifySchema),
        responses: {
          200: jsonResponse("Verification applied", "VerifyResult"),
          400: responseRef("BadRequest"),
          401: responseRef("Unauthorized"),
          404: responseRef("NotFound"),
          422: responseRef("UnprocessableEntity"),
          429: { description: "Too many requests" },
        },
      },
    },
    [`/${kind}s/{${kind}Id}/reports`]: {
      post: {
        tags: ["Community"],
        summary: `Report a${kind === "event" ? "n" : ""} ${noun}`,
        description:
          `Signed-in users or guests (\`X-Device-Id\`). The reporter is stored but never shown. One report per person and ` +
          `${noun}: a second one is 409 (also after a moderator's decision). ${REPORTS_TO_HIDE} unresolved reports with the same ` +
          `reason hide the ${noun} ("En revisión por reportes") until a moderator decides; after ${NEEDS_REVIEW_HOURS} h without ` +
          "a decision it is flagged `needsReview` in `GET /reports`. `photo`: as in verifications. 404 unless the " +
          `${noun} is PUBLISHED. Rate limit: ${perMinutes(REPORT_RATE_LIMIT)} per user or IP.`,
        security: optionalBearer,
        parameters: [param, deviceIdHeader],
        requestBody: jsonBody(ReportSchema),
        responses: {
          201: jsonResponse("Report created", "CreatedReport"),
          400: responseRef("BadRequest"),
          401: responseRef("Unauthorized"),
          404: responseRef("NotFound"),
          409: responseRef("Conflict"),
          422: responseRef("UnprocessableEntity"),
          429: { description: "Too many requests" },
        },
      },
    },
    [`/${kind}s/{${kind}Id}/reports/decision`]: {
      post: {
        tags: ["Community"],
        summary: `Decide on a reported ${noun} (MODERATOR, ADMIN)`,
        description:
          "`keep`: PUBLISHED again (clears `hiddenReason`). `hide`: ARCHIVED with \"Ocultada por moderación\". Both resolve " +
          `the ${noun}'s pending reports. 409 when it has none; 404 when it does not exist.`,
        security: bearer,
        parameters: [param],
        requestBody: jsonBody(ReportDecisionSchema),
        responses: {
          200: jsonResponse("Decision applied", "ReportDecisionResult"),
          400: responseRef("BadRequest"),
          401: responseRef("Unauthorized"),
          403: responseRef("Forbidden"),
          404: responseRef("NotFound"),
          409: responseRef("Conflict"),
        },
      },
    },
  };
};

/** PUT / DELETE of a favorite (`/places/{placeId}/favorite`, `/events/{eventId}/favorite`). */
const favoriteTargetPaths = (kind: "place" | "event") => {
  const param = { $ref: `#/components/parameters/${kind === "place" ? "PlaceId" : "EventId"}` };
  return {
    [`/${kind}s/{${kind}Id}/favorite`]: {
      put: {
        tags: ["Favorites"],
        summary: `Save a ${kind}`,
        description: `Idempotent: saving an already saved ${kind} is a no-op (204) that keeps the original \`createdAt\` (also under concurrent calls). 404 unless the ${kind} exists and is PUBLISHED.`,
        security: bearer,
        parameters: [param],
        responses: {
          204: { description: `The ${kind} is saved` },
          400: responseRef("BadRequest"),
          401: responseRef("Unauthorized"),
          404: responseRef("NotFound"),
        },
      },
      delete: {
        tags: ["Favorites"],
        summary: `Unsave a ${kind}`,
        description: `Idempotent: 204 whether or not the favorite existed, and regardless of the ${kind}'s status or existence (never 404).`,
        security: bearer,
        parameters: [param],
        responses: {
          204: { description: `The ${kind} is not saved` },
          400: responseRef("BadRequest"),
          401: responseRef("Unauthorized"),
        },
      },
    },
  };
};

const reviewTargetPaths = (kind: "place" | "event") => {
  const param = kind === "place" ? "PlaceId" : "EventId";
  const noun = kind === "place" ? "place" : "event";
  return {
    [`/${kind}s/{${kind}Id}/reviews`]: {
      get: {
        tags: ["Reviews"],
        summary: `List a${kind === "event" ? "n" : ""} ${noun}'s reviews`,
        description:
          `Public (optional bearer token). PUBLISHED reviews, plus the caller's own PENDING review (so the author sees it ` +
          `right after writing it; check its \`status\`). 404 if the ${noun} does not exist or is not PUBLISHED, unless ` +
          "the caller is MODERATOR / ADMIN. Default order is `createdAt` descending (newest first); `-usefulCount` is " +
          "\"most useful\" and `-photoCount` puts reviews with photos first (ties: newest first). `summary` covers every " +
          "PUBLISHED review and ignores the filters. Authenticated callers get `markedUsefulByMe`.",
        security: optionalBearer,
        parameters: [
          { $ref: `#/components/parameters/${param}` },
          ...reviewListParams("-createdAt"),
          {
            name: "audience",
            in: "query",
            description: "`familias`: reviewers who went with family. `estudiantes`: reviewers who went with friends or alone.",
            schema: { type: "string", enum: [...REVIEW_AUDIENCES] },
          },
          {
            name: "withPhotos",
            in: "query",
            description: "`true`: only reviews with at least one photo.",
            schema: { type: "string", enum: ["true", "false"] },
          },
        ],
        responses: {
          200: {
            description: "Page of reviews and the rating summary",
            content: {
              "application/json": {
                schema: {
                  allOf: [
                    paginated("Review"),
                    {
                      type: "object",
                      properties: { summary: { $ref: "#/components/schemas/RatingSummary" } },
                      required: ["summary"],
                    },
                  ],
                },
              },
            },
          },
          400: responseRef("BadRequest"),
          404: responseRef("NotFound"),
        },
      },
      post: {
        tags: ["Reviews"],
        summary: `Review a${kind === "event" ? "n" : ""} ${noun}`,
        description:
          `\`rating\` is an integer from ${MIN_RATING} to ${MAX_RATING}; \`comment\` is optional (max ${REVIEW_COMMENT_MAX_LENGTH} characters, ` +
          `blank is stored as null). \`wentWith\` (${WENT_WITH_VALUES.join(", ")}) and \`spent\` (${SPENT_TIERS.join(", ")}) are ` +
          `optional. \`photos\` holds up to ${REVIEW_MAX_PHOTOS} URLs returned by \`POST /uploads\`, each one of the caller's own ` +
          "uploads (422 otherwise). The review is created PENDING and only becomes public (and counts in the rating) once a " +
          `moderator publishes it. One review per user and ${noun} (409 if the caller already reviewed it: edit it with ` +
          `\`PUT /reviews/{id}\`). 404 unless the ${noun} exists and is PUBLISHED.`,
        security: bearer,
        parameters: [{ $ref: `#/components/parameters/${param}` }],
        requestBody: jsonBody(CreateReviewSchema),
        responses: {
          201: jsonResponse("Created review", "Review"),
          400: responseRef("BadRequest"),
          401: responseRef("Unauthorized"),
          404: responseRef("NotFound"),
          409: responseRef("Conflict"),
          422: responseRef("UnprocessableEntity"),
        },
      },
    },
  };
};

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
      description:
        "Tokens are stateless; the client is expected to discard its token. The body is optional: send the " +
        "current device's `pushToken` to stop it receiving this user's notifications (ignored if the token is " +
        "unknown or belongs to another user).",
      security: bearer,
      requestBody: { ...jsonBody(LogoutBodySchema), required: false },
      responses: {
        200: jsonResponse("Logged out", "Message"),
        400: responseRef("BadRequest"),
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
      summary: "List my saved places and events",
      description:
        "Places and events in one list (`type` tells which). Only favorites whose place or event is currently PUBLISHED are listed and counted: an unpublished one disappears from the list (the favorite is kept) and reappears when it is published again. Past events stay listed. Default order is `createdAt` descending (most recently saved first).",
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
        {
          name: "type",
          in: "query",
          description: "Only places (`PLACE`) or only events (`EVENT`); both when omitted",
          schema: { type: "string", enum: ["PLACE", "EVENT"] },
        },
      ],
      responses: {
        200: {
          description: "Page of saved places and events",
          content: { "application/json": { schema: paginated("Favorite") } },
        },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
      },
    },
  },
  "/me/reviews": {
    get: {
      tags: ["Reviews"],
      summary: "List my reviews",
      description: "The caller's own reviews in any status. Default order is `createdAt` descending (newest first).",
      security: bearer,
      parameters: reviewListParams("-createdAt"),
      responses: {
        200: { description: "Page of reviews", content: { "application/json": { schema: paginated("Review") } } },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
      },
    },
  },
  "/me/devices": {
    get: {
      tags: ["Devices"],
      summary: "List my devices",
      description: "Devices registered for push notifications. Default order is `updatedAt` descending (most recently registered first).",
      security: bearer,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending. Default: `-updatedAt`.",
          schema: { type: "string", enum: DEVICE_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
      ],
      responses: {
        200: { description: "Page of devices", content: { "application/json": { schema: paginated("Device") } } },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
      },
    },
    post: {
      tags: ["Devices"],
      summary: "Register this device",
      description:
        "Idempotent upsert by `pushToken`, always 200: call it on every login. If the token already belongs to " +
        "another user it is moved to the caller (same phone, new login).",
      security: bearer,
      requestBody: jsonBody(RegisterDeviceSchema),
      responses: {
        200: jsonResponse("Registered device", "Device"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
      },
    },
  },
  "/me/devices/{id}": {
    delete: {
      tags: ["Devices"],
      summary: "Remove one of my devices",
      description: "404 if it does not exist or belongs to another user.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        204: { description: "Device removed" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/me/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "List my notifications",
      description:
        "Events the user was notified about. Only notifications whose event is currently PUBLISHED are listed and " +
        "counted: an unpublished event's notification disappears (it is kept) and reappears when the event is " +
        "published again. Default order is `sentAt` descending (newest first). There is no create endpoint: " +
        "notifications are recorded internally when they are sent.",
      security: bearer,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending. Default: `-sentAt`.",
          schema: { type: "string", enum: NOTIFICATION_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
      ],
      responses: {
        200: { description: "Page of notifications", content: { "application/json": { schema: paginated("Notification") } } },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
      },
    },
  },
  "/me/notifications/{id}": {
    delete: {
      tags: ["Notifications"],
      summary: "Delete one of my notifications",
      description: "404 if it does not exist or belongs to another user.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        204: { description: "Notification deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
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
  "/provinces": {
    get: {
      tags: ["Provinces"],
      summary: "List provinces",
      description:
        "Public and cacheable. Paginated; default order is by id (INEC code). " +
        "Send `include=cantons` to nest each province's cantons, ordered by id.",
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending.",
          schema: { type: "string", enum: PROVINCE_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
        {
          name: "include",
          in: "query",
          description: "Related data to nest in each item.",
          schema: { type: "string", enum: [...PROVINCE_INCLUDES] },
        },
      ],
      responses: {
        200: {
          description: "Page of provinces",
          headers: publicCacheHeaders,
          content: { "application/json": { schema: paginated("Province") } },
        },
        400: responseRef("BadRequest"),
      },
    },
    post: {
      tags: ["Provinces"],
      summary: "Create a province",
      description: "ADMIN only. The `id` is the INEC province code and must be provided. 409 if the id or the name already exists.",
      security: bearer,
      requestBody: jsonBody(CreateProvinceSchema),
      responses: {
        201: jsonResponse("Created province", "Province"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        409: responseRef("Conflict"),
      },
    },
  },
  "/provinces/{id}": {
    get: {
      tags: ["Provinces"],
      summary: "Get a province",
      description: "Public and cacheable.",
      parameters: [{ $ref: "#/components/parameters/IntId" }],
      responses: {
        200: { ...jsonResponse("Province", "Province"), headers: publicCacheHeaders },
        400: responseRef("BadRequest"),
        404: responseRef("NotFound"),
      },
    },
    put: {
      tags: ["Provinces"],
      summary: "Rename a province",
      description: "ADMIN only. The id (INEC code) cannot change. 409 if another province already has that name.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/IntId" }],
      requestBody: jsonBody(UpdateProvinceSchema),
      responses: {
        200: jsonResponse("Updated province", "Province"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      },
    },
    delete: {
      tags: ["Provinces"],
      summary: "Delete a province",
      description: "ADMIN only. 409 while the province has cantons.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/IntId" }],
      responses: {
        204: { description: "Province deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      },
    },
  },
  "/provinces/{provinceId}/cantons": {
    get: {
      tags: ["Cantons"],
      summary: "List the cantons of a province",
      description: "Public and cacheable. Paginated; default order is by id (INEC code). 404 if the province does not exist.",
      parameters: [
        { name: "provinceId", in: "path", required: true, description: "INEC province code", schema: { type: "integer", minimum: 1 } },
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending. Default: `id`.",
          schema: { type: "string", enum: CANTON_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
      ],
      responses: {
        200: {
          description: "Page of cantons",
          headers: publicCacheHeaders,
          content: { "application/json": { schema: paginated("Canton") } },
        },
        400: responseRef("BadRequest"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/cantons": {
    post: {
      tags: ["Cantons"],
      summary: "Create a canton",
      description:
        "ADMIN only. The `id` is the INEC canton code and must be provided: `provinceId * 100 + cantonNumber` " +
        "(1-99), e.g. 216 for canton 16 of province 2; any other id is a 400. 422 if the province does not exist. " +
        "409 if the id, or the name within the same province, already exists.",
      security: bearer,
      requestBody: jsonBody(CreateCantonSchema),
      responses: {
        201: jsonResponse("Created canton", "Canton"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        409: responseRef("Conflict"),
        422: responseRef("UnprocessableEntity"),
      },
    },
  },
  "/cantons/{id}": {
    get: {
      tags: ["Cantons"],
      summary: "Get a canton",
      description: "Public and cacheable.",
      parameters: [{ $ref: "#/components/parameters/IntId" }],
      responses: {
        200: { ...jsonResponse("Canton", "Canton"), headers: publicCacheHeaders },
        400: responseRef("BadRequest"),
        404: responseRef("NotFound"),
      },
    },
    put: {
      tags: ["Cantons"],
      summary: "Rename a canton",
      description:
        "ADMIN only. Only the name can change: the id (INEC code) encodes the province, so neither can be updated. " +
        "409 if another canton of the same province already has that name.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/IntId" }],
      requestBody: jsonBody(UpdateCantonSchema),
      responses: {
        200: jsonResponse("Updated canton", "Canton"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      },
    },
    delete: {
      tags: ["Cantons"],
      summary: "Delete a canton",
      description: "ADMIN only. 409 while any place references the canton.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/IntId" }],
      responses: {
        204: { description: "Canton deleted" },
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
        ...planConditionsParams,
        ...geoParams("the place's coordinates"),
      ],
      responses: {
        200: {
          description: "Page of places (each with its card stats: rating and cover photo)",
          content: { "application/json": { schema: paginated("PlaceCard") } },
        },
        400: responseRef("BadRequest"),
      },
    },
    post: {
      tags: ["Places"],
      summary: "Create a place (MODERATOR, ADMIN)",
      description:
        "New places start as PENDING. 422 when the canton, category or source does not exist." + priceLimitNote,
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
        "Public (optional bearer token). Includes photos ordered by position, the rating summary over PUBLISHED reviews and the verification summary (`myVerifiedToday` uses the token or `X-Device-Id`). A non-PUBLISHED place is 404 unless the caller is MODERATOR / ADMIN or its author (whose submission created it; they see it with `hiddenReason`). Authenticated callers also get `isFavorite` and `isMine`.",
      security: optionalBearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }, deviceIdHeader],
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
        "Full replace of the editable fields (omitted price/audience fields go back to their defaults); the status and verifiedAt are kept (use `PATCH /places/{id}/status`). 422 when the canton, category or source does not exist." + priceLimitNote,
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
  ...favoriteTargetPaths("place"),
  ...reviewTargetPaths("place"),
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
  "/events": {
    get: {
      tags: ["Events"],
      summary: "List events",
      description:
        "Public (optional bearer token). Anonymous and regular users only see PUBLISHED events; MODERATOR / ADMIN see every status and may filter with `status`. Paginated; default order is `startsAt` ascending. **`from` defaults to now** (for everyone), so by default only upcoming and ongoing events are listed; send an earlier `from` to see past events. Range semantics are overlap: an event matches when it starts at/before `to` and is still running at/after `from` (`endsAt >= from`, or no `endsAt` and `startsAt >= from`). Every item has its resolved location (`latitude`, `longitude`, `address`) and a `place` summary, so no request per place is needed. Geo filters: bounding box (`minLat`, `minLng`, `maxLat`, `maxLng`) or radius (`lat`, `lng`, `radiusKm`), never both.",
      security: optionalBearer,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending. Default: `startsAt`.",
          schema: { type: "string", enum: EVENT_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
        {
          name: "from",
          in: "query",
          description: "ISO 8601 datetime with offset. Lower bound of the overlap range. Defaults to the current time.",
          schema: { type: "string", format: "date-time" },
        },
        {
          name: "to",
          in: "query",
          description: "ISO 8601 datetime with offset. Upper bound: only events starting at/before it. Must not be earlier than an explicit `from`.",
          schema: { type: "string", format: "date-time" },
        },
        {
          name: "categoryId",
          in: "query",
          description: "Filter by category id",
          schema: { type: "integer", minimum: 1 },
        },
        {
          name: "placeId",
          in: "query",
          description: "Filter by place id",
          schema: { type: "string", format: "uuid" },
        },
        {
          name: "cantonId",
          in: "query",
          description: "Filter by canton id (through the event's place; events without a place never match)",
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
          description: "Substring match on title or description",
          schema: { type: "string", maxLength: 100 },
        },
        ...planConditionsParams,
        ...geoParams("the event's location (its place's point, or its own when it has no place; events without a location never match)"),
      ],
      responses: {
        200: {
          description: "Page of events (each with its card stats: rating and cover photo)",
          content: { "application/json": { schema: paginated("EventCard") } },
        },
        400: responseRef("BadRequest"),
      },
    },
    post: {
      tags: ["Events"],
      summary: "Create an event (MODERATOR, ADMIN)",
      description:
        "New events start as PENDING. Datetimes must be ISO 8601 with offset and `endsAt` must not be earlier than `startsAt`. Location: either `placeId` (the place's point is used) or the event's own `latitude` + `longitude` (+ optional `address`), never both (400); an event with neither is allowed but never shown on the map. 422 when the place, category or source does not exist." + priceLimitNote,
      security: bearer,
      requestBody: jsonBody(CreateEventSchema),
      responses: {
        201: jsonResponse("Created event", "Event"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        422: responseRef("UnprocessableEntity"),
      },
    },
  },
  "/events/{id}": {
    get: {
      tags: ["Events"],
      summary: "Get an event",
      description:
        "Public (optional bearer token). Includes a summary of the event's place, the event's photos ordered by position and the rating summary over PUBLISHED reviews (`averageRating`, `reviewCount`, `ratingDistribution`). It also has the verification summary (`myVerifiedToday` uses the token or `X-Device-Id`). A non-PUBLISHED event is 404 unless the caller is MODERATOR / ADMIN or its author (they see it with `hiddenReason`); for other callers `place` is null when the linked place is not PUBLISHED (the location fields stay). Authenticated callers also get `isFavorite` and `isMine`.",
      security: optionalBearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }, deviceIdHeader],
      responses: {
        200: jsonResponse("Event", "EventDetail"),
        400: responseRef("BadRequest"),
        404: responseRef("NotFound"),
      },
    },
    put: {
      tags: ["Events"],
      summary: "Replace an event (MODERATOR, ADMIN)",
      description:
        "Full replace of the editable fields (omitted price/audience/location fields go back to their defaults); the status is kept (use `PATCH /events/{id}/status`). Same location rule as `POST /events`: do not send back the `latitude`/`longitude`/`address` of a response when `placeId` is set, they come from the place. 422 when the place, category or source does not exist." + priceLimitNote,
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(UpdateEventSchema),
      responses: {
        200: jsonResponse("Updated event", "Event"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        422: responseRef("UnprocessableEntity"),
      },
    },
    delete: {
      tags: ["Events"],
      summary: "Delete an event (ADMIN)",
      description: "Notifications, favorites, photos, reviews, verifications and reports of the event are deleted with it.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        204: { description: "Event deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/events/{id}/status": {
    patch: {
      tags: ["Events"],
      summary: "Change an event's status (MODERATOR, ADMIN)",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(ChangeEventStatusSchema),
      responses: {
        200: jsonResponse("Updated event", "Event"),
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
  "/me/submissions": {
    post: {
      tags: ["Submissions"],
      summary: "Suggest a place or event",
      description:
        "Creates a PENDING community suggestion for moderators to review. `type` selects the shape of `data`: " +
        "`PLACE` uses the same fields as `POST /places`, `EVENT` the same fields as `POST /events` (datetimes ISO 8601 " +
        "with offset, `endsAt >= startsAt`), in both cases without `sourceId`. Unknown keys (including `sourceId`, " +
        "`aiScore`, `aiReason`, `status`) are ignored. The price/audience fields (`pricePerPerson`, `freeFor`, `audiences`, " +
        "`wheelchair`) are accepted too; `pricePerPerson` above ₡5.000 → 422. Unknown canton, category or place → 422. " +
        `\`data.photos\` (optional): up to ${SUBMISSION_MAX_PHOTOS} URLs returned by \`POST /uploads\` for the caller's own uploads, in gallery order ` +
        "(anything else, or a repeated photo → 422); on approval they become the Place/Event gallery. " +
        `Rate-limited to ${SUBMISSION_CREATE_RATE_LIMIT.max} requests per ${SUBMISSION_CREATE_RATE_LIMIT.windowMs / 60000} minutes per user (429).`,
      security: bearer,
      requestBody: jsonBody(CreateSubmissionSchema),
      responses: {
        201: jsonResponse("Created submission", "Submission"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        422: responseRef("UnprocessableEntity"),
        429: errorResponse("Too many requests"),
      },
    },
    get: {
      tags: ["Submissions"],
      summary: "List my submissions",
      description: "Only the caller's own submissions, any status. Default order is `createdAt` descending (newest first).",
      security: bearer,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending. Default: `-createdAt`.",
          schema: { type: "string", enum: SUBMISSION_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
      ],
      responses: {
        200: { description: "Page of submissions", content: { "application/json": { schema: paginated("Submission") } } },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
      },
    },
  },
  "/me/submissions/{id}": {
    get: {
      tags: ["Submissions"],
      summary: "Get one of my submissions",
      description:
        "404 if it does not exist or belongs to another user. When rejected it shows `rejectionReason`, `reviewNote` and " +
        "`rejectionMessage`; once approved, `created` points to the published Place/Event.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        200: jsonResponse("Submission", "Submission"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
      },
    },
    put: {
      tags: ["Submissions"],
      summary: "Edit one of my submissions",
      description:
        "Full replace of a PENDING suggestion: same body and rules as `POST /me/submissions` (400 / 422), and `data.photos` " +
        "replaces the attached photos. The `type` cannot change (422). 404 if it does not exist or belongs to another user; " +
        "409 once it is no longer PENDING (an edit and a concurrent review run one after the other). " +
        `Rate-limited like creating: ${SUBMISSION_CREATE_RATE_LIMIT.max} requests per ${SUBMISSION_CREATE_RATE_LIMIT.windowMs / 60000} minutes per user (429).`,
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(CreateSubmissionSchema),
      responses: {
        200: jsonResponse("Updated submission", "Submission"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
        422: responseRef("UnprocessableEntity"),
        429: errorResponse("Too many requests"),
      },
    },
    delete: {
      tags: ["Submissions"],
      summary: "Withdraw one of my submissions",
      description: "Only while it is PENDING (409 otherwise). 404 if it does not exist or belongs to another user.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        204: { description: "Submission deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      },
    },
  },
  "/submissions": {
    get: {
      tags: ["Submissions"],
      summary: "Moderation queue (MODERATOR, ADMIN)",
      description: "Defaults to PENDING submissions, oldest first. Includes the AI pre-screening fields.",
      security: bearer,
      parameters: [
        { $ref: "#/components/parameters/Page" },
        { $ref: "#/components/parameters/PageSize" },
        {
          name: "sort",
          in: "query",
          description: "Field to sort by: `field` ascending, `-field` descending. Default: `createdAt`.",
          schema: { type: "string", enum: SUBMISSION_SORT_FIELDS.flatMap((f) => [f, `-${f}`]) },
        },
        {
          name: "status",
          in: "query",
          description: "Filter by status (default PENDING)",
          schema: { type: "string", enum: [...CONTENT_STATUSES], default: "PENDING" },
        },
        { name: "type", in: "query", description: "Filter by type", schema: { type: "string", enum: [...SUBMISSION_TYPES] } },
      ],
      responses: {
        200: {
          description: "Page of submissions",
          content: { "application/json": { schema: paginated("ModerationSubmission") } },
        },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
      },
    },
  },
  "/submissions/{id}": {
    get: {
      tags: ["Submissions"],
      summary: "Get a submission (MODERATOR, ADMIN)",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        200: jsonResponse("Submission", "ModerationSubmission"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/submissions/{id}/approve": {
    post: {
      tags: ["Submissions"],
      summary: "Approve a submission (MODERATOR, ADMIN)",
      description:
        "In one transaction: creates the Place/Event as PUBLISHED, attributed to the community source, and marks the " +
        "submission PUBLISHED with the reviewer and date. Only PENDING submissions (409 otherwise, also when another " +
        "moderator approved it first). References are re-checked (422 if the canton, category or place no longer exists). " +
        "The submission's `created` keeps the link to the new Place/Event (shown to the author).",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        200: jsonResponse("Approved submission and the created resource", "ApproveSubmissionResponse"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
        422: responseRef("UnprocessableEntity"),
      },
    },
  },
  "/submissions/{id}/reject": {
    post: {
      tags: ["Submissions"],
      summary: "Reject a submission (MODERATOR, ADMIN)",
      description:
        `Only PENDING submissions (409 otherwise). \`reason\` is one of: ${rejectionReasonList}, or \`otro\`, which requires ` +
        "`note` (400 without it); `note` is optional for the other codes. The author sees `rejectionReason`, `reviewNote` " +
        "and `rejectionMessage`. Temporary compatibility: any other text in `reason` (the free-text body used before #40) " +
        "is stored as `otro` with that text as the note.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(RejectSubmissionSchema),
      responses: {
        200: jsonResponse("Rejected submission", "ModerationSubmission"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        409: responseRef("Conflict"),
      },
    },
  },
  ...galleryPaths("place"),
  ...galleryPaths("event"),
  ...favoriteTargetPaths("event"),
  ...reviewTargetPaths("event"),
  ...communityPaths("place"),
  ...communityPaths("event"),
  "/reports": {
    get: {
      tags: ["Community"],
      summary: "Reported plans (MODERATOR, ADMIN)",
      description:
        "Places and events with unresolved reports, one item each with every unresolved report (the reporter is never " +
        `shown). Order: \`needsReview\` first (hidden by reports for more than ${NEEDS_REVIEW_HOURS} h), then the ones hidden ` +
        "by reports, then by oldest report. Decide with `POST /places/{placeId}/reports/decision` (or the event one).",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/Page" }, { $ref: "#/components/parameters/PageSize" }],
      responses: {
        200: { description: "Page of reported plans", content: { "application/json": { schema: paginated("ReportQueueItem") } } },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
      },
    },
  },
  "/reviews": {
    get: {
      tags: ["Reviews"],
      summary: "Review moderation queue (MODERATOR, ADMIN)",
      description: "Defaults to PENDING reviews, oldest first. Optional `placeId` / `eventId` filters.",
      security: bearer,
      parameters: [
        ...reviewListParams("createdAt"),
        {
          name: "status",
          in: "query",
          description: "Default: PENDING",
          schema: { type: "string", enum: [...CONTENT_STATUSES], default: "PENDING" },
        },
        { name: "placeId", in: "query", schema: { type: "string", format: "uuid" } },
        { name: "eventId", in: "query", schema: { type: "string", format: "uuid" } },
      ],
      responses: {
        200: { description: "Page of reviews", content: { "application/json": { schema: paginated("Review") } } },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
      },
    },
  },
  "/reviews/{id}": {
    put: {
      tags: ["Reviews"],
      summary: "Edit my review",
      description:
        "Author only (403 otherwise). Full replace of `rating`, `comment`, `wentWith`, `spent` and `photos` (an omitted " +
        "field is cleared; send the current photo URLs to keep them). The review goes back to PENDING until a moderator " +
        "publishes it again. 404 if the review does not exist or its place / event is no longer PUBLISHED; 422 if a photo " +
        "is not one of the caller's uploads.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(UpdateReviewSchema),
      responses: {
        200: jsonResponse("Updated review", "Review"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
        422: responseRef("UnprocessableEntity"),
      },
    },
    delete: {
      tags: ["Reviews"],
      summary: "Delete a review",
      description: "The author, a MODERATOR or an ADMIN (403 otherwise).",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        204: { description: "Review deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/reviews/{id}/useful": {
    post: {
      tags: ["Reviews"],
      summary: "Mark a review as useful",
      description:
        "\"Útil\" vote: one per user and review, idempotent (repeating it changes nothing). Only PUBLISHED reviews (404 " +
        "otherwise); 403 on the caller's own review. Returns the review with the updated `usefulCount` and " +
        "`markedUsefulByMe`.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        200: jsonResponse("Review", "Review"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
    delete: {
      tags: ["Reviews"],
      summary: "Remove my useful vote",
      description: "Idempotent (200 whether or not the caller had voted). Only PUBLISHED reviews (404 otherwise).",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        200: jsonResponse("Review", "Review"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/reviews/{id}/status": {
    patch: {
      tags: ["Reviews"],
      summary: "Change a review's status (MODERATOR, ADMIN)",
      description:
        "PUBLISHED makes the review public and counts it in the place's / event's `averageRating`, `reviewCount` and " +
        "`ratingDistribution`.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      requestBody: jsonBody(ChangeReviewStatusSchema),
      responses: {
        200: jsonResponse("Updated review", "Review"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/photos/{id}": {
    delete: {
      tags: ["Photos"],
      summary: "Delete a photo (MODERATOR, ADMIN)",
      description:
        "Removes a photo from its Place/Event gallery; the other photos keep their positions. The stored file (if it was an upload) is removed later by the orphan cleanup once nothing references it.",
      security: bearer,
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        204: { description: "Photo deleted" },
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        403: responseRef("Forbidden"),
        404: responseRef("NotFound"),
      },
    },
  },
  "/uploads": {
    post: {
      tags: ["Uploads"],
      summary: "Upload a photo",
      description:
        `Any authenticated user. \`multipart/form-data\` with one file in the \`${UPLOAD_FIELD_NAME}\` field, at most ${UPLOAD_MAX_BYTES / (1024 * 1024)} MB. ` +
        `The format is detected from the bytes (JPEG, PNG or WebP; HEIC/AVIF are rejected, send them as JPEG) → 415 otherwise. ` +
        `The image is re-encoded: EXIF orientation applied, **all metadata (GPS position included) removed**, scaled down to at most ${MAX_IMAGE_DIMENSION} px per side, stored as JPEG in the object storage (SeaweedFS). ` +
        "The returned `url` is served by this API (`GET /files/{id}`) and is what clients send in a submission's `data.photos`. " +
        `Uploads that nothing references (no submission, no gallery photo) are deleted after a grace period (24 h by default). ` +
        `Rate-limited to ${UPLOAD_RATE_LIMIT.max} uploads per ${UPLOAD_RATE_LIMIT.windowMs / 60000} minutes per user (429).`,
      security: bearer,
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                [UPLOAD_FIELD_NAME]: { type: "string", format: "binary", description: `${UPLOAD_ACCEPTED_TYPES.join(", ")}` },
              },
              required: [UPLOAD_FIELD_NAME],
            },
          },
        },
      },
      responses: {
        201: jsonResponse("Stored upload", "Upload"),
        400: responseRef("BadRequest"),
        401: responseRef("Unauthorized"),
        413: errorResponse("File too large"),
        415: errorResponse("Not a JPEG, PNG or WebP image (or damaged / too many pixels)"),
        429: errorResponse("Too many requests"),
        503: errorResponse("Object storage unavailable, retry later"),
      },
    },
  },
  "/files/{id}": {
    get: {
      tags: ["Uploads"],
      summary: "Download an uploaded file",
      description:
        "Public. Streams the file from the object storage (SeaweedFS; the bucket itself is private; the API is the only way to reach it). " +
        "The random id is the capability, so these URLs can be used directly as image sources. Files are immutable: " +
        "`Cache-Control: public, max-age=31536000, immutable`, `ETag`/`Last-Modified` with 304 on conditional requests. HEAD is supported.",
      parameters: [{ $ref: "#/components/parameters/UuidId" }],
      responses: {
        200: {
          description: "File bytes",
          headers: {
            "Cache-Control": { schema: { type: "string" }, description: "public, max-age=31536000, immutable" },
            ETag: { schema: { type: "string" } },
          },
          content: { "image/jpeg": { schema: { type: "string", format: "binary" } } },
        },
        304: { description: "Not modified" },
        400: responseRef("BadRequest"),
        404: responseRef("NotFound"),
        503: errorResponse("Object storage unavailable, retry later"),
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
    { name: "Provinces" },
    { name: "Cantons" },
    { name: "Sources" },
    { name: "Places" },
    { name: "Events" },
    { name: "Photos" },
    { name: "Uploads" },
    { name: "Favorites" },
    { name: "Reviews" },
    { name: "Community", description: "Verifications (\"¿Sigue siendo gratis?\"), reports and their moderation" },
    { name: "Devices" },
    { name: "Notifications" },
    { name: "Users" },
    { name: "Submissions" },
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
      EventId: {
        name: "eventId",
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
      Device: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          platform: { type: "string", enum: [...PLATFORMS] },
          pushToken: { type: "string" },
          updatedAt: { type: "string", format: "date-time", description: "Last time the device was registered" },
        },
        required: ["id", "platform", "pushToken", "updatedAt"],
      },
      NotificationEvent: {
        type: "object",
        description: "Summary of the notified event (full data in `GET /events/{id}`)",
        properties: {
          id: { type: "string", format: "uuid" },
          title: { type: "string" },
          startsAt: { type: "string", format: "date-time" },
          endsAt: { type: ["string", "null"], format: "date-time" },
          placeId: { type: ["string", "null"], format: "uuid" },
        },
        required: ["id", "title", "startsAt", "endsAt", "placeId"],
      },
      Notification: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          sentAt: { type: "string", format: "date-time", description: "When the user was notified" },
          event: { $ref: "#/components/schemas/NotificationEvent" },
        },
        required: ["id", "sentAt", "event"],
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
      CantonSummary: {
        type: "object",
        properties: { id: { type: "integer", description: "INEC code (provinceCode * 100 + cantonCode)" }, name: { type: "string" } },
        required: ["id", "name"],
      },
      Canton: {
        type: "object",
        properties: {
          id: { type: "integer", description: "INEC code (provinceId * 100 + cantonNumber)" },
          provinceId: { type: "integer", description: "INEC province code" },
          name: { type: "string", minLength: 1, maxLength: CANTON_NAME_MAX_LENGTH },
        },
        required: ["id", "provinceId", "name"],
      },
      Province: {
        type: "object",
        properties: {
          id: { type: "integer", description: "INEC province code" },
          name: { type: "string", minLength: 1, maxLength: PROVINCE_NAME_MAX_LENGTH },
          cantons: {
            type: "array",
            description: "Only in the list, and only with `include=cantons`.",
            items: { $ref: "#/components/schemas/CantonSummary" },
          },
        },
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
      PriceTier: { type: "string", enum: [...PRICE_TIERS] },
      Audience: { type: "string", enum: [...AUDIENCES] },
      FreeForGroup: { type: "string", enum: [...FREE_FOR_GROUPS] },
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
      Photo: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          placeId: { type: ["string", "null"], format: "uuid", description: "Set for place photos" },
          eventId: { type: ["string", "null"], format: "uuid", description: "Set for event photos" },
          url: { type: "string", maxLength: 2048 },
          position: { type: "integer", description: "Gallery order, ascending" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "placeId", "eventId", "url", "position", "createdAt"],
      },
      Upload: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          url: { type: "string", description: "Durable URL served by this API (`/api/v1/files/{id}`); send it in a submission's `data.photos`" },
          contentType: { type: "string", enum: ["image/jpeg"], description: "Every upload is re-encoded as JPEG" },
          size: { type: "integer", description: "Stored size in bytes" },
          width: { type: "integer" },
          height: { type: "integer" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "url", "contentType", "size", "width", "height", "createdAt"],
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
          ...planConditionsProperties,
          status: { $ref: "#/components/schemas/ContentStatus" },
          hiddenReason: {
            type: ["string", "null"],
            description: "Why it is hidden (ARCHIVED by verifications, reports or moderation); null otherwise",
          },
          authorName: authorNameSchema,
          verifiedAt: {
            type: ["string", "null"],
            format: "date-time",
            description: "When a moderator published it or the community last confirmed it (`si`)",
          },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id", "cantonId", "categoryId", "sourceId", "name", "description", "latitude", "longitude",
          "address", "openingHours", "targetAudience", "status", "hiddenReason", "authorName", "verifiedAt", "createdAt", "updatedAt",
          ...planConditionsRequired,
        ],
      },
      Review: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          placeId: { type: ["string", "null"], format: "uuid", description: "Set for place reviews" },
          eventId: { type: ["string", "null"], format: "uuid", description: "Set for event reviews" },
          rating: { type: "integer", minimum: MIN_RATING, maximum: MAX_RATING },
          comment: { type: ["string", "null"], maxLength: REVIEW_COMMENT_MAX_LENGTH },
          wentWith: { type: ["string", "null"], enum: [...WENT_WITH_VALUES, null], description: "Null when not told" },
          spent: { type: ["string", "null"], enum: [...SPENT_TIERS, null], description: "Null when not told" },
          photos: {
            type: "array",
            maxItems: REVIEW_MAX_PHOTOS,
            items: { type: "string", format: "uri" },
            description: "Photo URLs in the order the author attached them",
          },
          usefulCount: { type: "integer", minimum: 0, description: "Number of \"útil\" votes" },
          markedUsefulByMe: { type: "boolean", description: "Whether the caller voted it useful (false when anonymous)" },
          status: { type: "string", enum: [...CONTENT_STATUSES] },
          createdAt: { type: "string", format: "date-time" },
          author: {
            type: "object",
            description:
              "Only the author's first name and initials are exposed. When the author deleted their account the review " +
              "is kept as `{ id: null, name: \"Anónimo\", initials: \"A\" }`.",
            properties: {
              id: { type: ["string", "null"], format: "uuid" },
              name: { type: "string" },
              initials: { type: "string", description: "First letters of the first name and first surname" },
            },
            required: ["id", "name", "initials"],
          },
          place: {
            type: ["object", "null"],
            properties: { id: { type: "string", format: "uuid" }, name: { type: "string" } },
            required: ["id", "name"],
          },
          event: {
            type: ["object", "null"],
            properties: { id: { type: "string", format: "uuid" }, title: { type: "string" } },
            required: ["id", "title"],
          },
        },
        required: [
          "id", "placeId", "eventId", "rating", "comment", "wentWith", "spent", "photos", "usefulCount",
          "markedUsefulByMe", "status", "createdAt", "author", "place", "event",
        ],
      },
      RatingSummary: {
        type: "object",
        description: "Over PUBLISHED reviews only",
        properties: {
          averageRating: { type: ["number", "null"], minimum: 1, maximum: 5, description: "Rounded to 2 decimals; null when there are none" },
          reviewCount: { type: "integer", minimum: 0 },
          distribution: ratingDistributionSchema,
        },
        required: ["averageRating", "reviewCount", "distribution"],
      },
      Favorite: {
        type: "object",
        description: "A saved place or event: exactly one of `place` / `event` is set, as told by `type`.",
        properties: {
          type: { type: "string", enum: ["PLACE", "EVENT"] },
          place: { oneOf: [{ $ref: "#/components/schemas/PlaceCard" }, { type: "null" }], description: "Set when `type` is PLACE" },
          event: { oneOf: [{ $ref: "#/components/schemas/EventCard" }, { type: "null" }], description: "Set when `type` is EVENT" },
          createdAt: { type: "string", format: "date-time", description: "When the user saved it" },
        },
        required: ["type", "place", "event", "createdAt"],
      },
      PlaceCard: {
        description: "A place in a list or in the saved items, with what its card shows.",
        allOf: [{ $ref: "#/components/schemas/Place" }, planStatsSchema],
      },
      EventCard: {
        description: "An event in a list or in the saved items, with what its card shows.",
        allOf: [{ $ref: "#/components/schemas/Event" }, planStatsSchema],
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
              ratingDistribution: ratingDistributionSchema,
              isFavorite: {
                type: "boolean",
                description: "Only present for authenticated callers: whether the caller favorited this place",
              },
              lastVerifiedAt: { type: ["string", "null"], format: "date-time", description: "Latest verification; null if never verified" },
              verificationCount: { type: "integer", minimum: 0, description: "People who verified it (one per person)" },
              myVerifiedToday: {
                type: "boolean",
                description: "Whether the caller (token, or guest `X-Device-Id`) verified it today, Costa Rica time",
              },
              isMine: {
                type: "boolean",
                description: "Only present for authenticated callers: whether the caller is the author (their submission created it)",
              },
            },
            required: [
              "photos", "averageRating", "reviewCount", "ratingDistribution", "lastVerifiedAt", "verificationCount",
              "myVerifiedToday",
            ],
          },
        ],
      },
      PlaceSummary: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string" },
          cantonId: { type: "integer" },
          latitude: { type: "number", minimum: -90, maximum: 90 },
          longitude: { type: "number", minimum: -180, maximum: 180 },
          address: { type: ["string", "null"], maxLength: 191 },
          status: { $ref: "#/components/schemas/ContentStatus" },
        },
        required: ["id", "name", "cantonId", "latitude", "longitude", "address", "status"],
      },
      Event: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          placeId: { type: ["string", "null"], format: "uuid" },
          categoryId: { type: "integer" },
          sourceId: { type: ["string", "null"], format: "uuid" },
          title: { type: "string", minLength: 1, maxLength: 191 },
          description: { type: ["string", "null"], maxLength: 5000 },
          startsAt: { type: "string", format: "date-time", description: "ISO 8601, UTC" },
          endsAt: { type: ["string", "null"], format: "date-time", description: "ISO 8601, UTC; never earlier than startsAt" },
          latitude: {
            type: ["number", "null"],
            minimum: -90,
            maximum: 90,
            description:
              "Where the event is on the map: the place's point when `placeId` is set (whatever the place's status), otherwise the event's own location; null when it has neither",
          },
          longitude: { type: ["number", "null"], minimum: -180, maximum: 180, description: "See `latitude`" },
          address: { type: ["string", "null"], maxLength: 191, description: "The place's address, or the event's own (see `latitude`)" },
          place: {
            oneOf: [{ $ref: "#/components/schemas/PlaceSummary" }, { type: "null" }],
            description: "Null when the event has no place or the caller may not see it (not PUBLISHED); the location fields stay",
          },
          targetAudience: { $ref: "#/components/schemas/TargetAudience" },
          ...planConditionsProperties,
          status: { $ref: "#/components/schemas/ContentStatus" },
          hiddenReason: {
            type: ["string", "null"],
            description: "Why it is hidden (ARCHIVED by verifications, reports or moderation); null otherwise",
          },
          authorName: authorNameSchema,
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
        required: [
          "id", "placeId", "categoryId", "sourceId", "title", "description", "startsAt", "endsAt",
          "latitude", "longitude", "address", "place",
          "targetAudience", "status", "hiddenReason", "authorName", "createdAt", "updatedAt",
          ...planConditionsRequired,
        ],
      },
      EventDetail: {
        allOf: [
          { $ref: "#/components/schemas/Event" },
          {
            type: "object",
            properties: {
              isFavorite: {
                type: "boolean",
                description: "Only present for authenticated callers: whether the caller saved this event",
              },
              photos: {
                type: "array",
                items: { $ref: "#/components/schemas/PlacePhoto" },
                description: "The event's own gallery, ordered by position",
              },
              averageRating: {
                type: ["number", "null"],
                minimum: 1,
                maximum: 5,
                description: "Mean of PUBLISHED reviews rounded to 2 decimals; null when there are none",
              },
              reviewCount: { type: "integer", minimum: 0, description: "Number of PUBLISHED reviews" },
              ratingDistribution: ratingDistributionSchema,
              lastVerifiedAt: { type: ["string", "null"], format: "date-time", description: "Latest verification; null if never verified" },
              verificationCount: { type: "integer", minimum: 0, description: "People who verified it (one per person)" },
              myVerifiedToday: {
                type: "boolean",
                description: "Whether the caller (token, or guest `X-Device-Id`) verified it today, Costa Rica time",
              },
              isMine: {
                type: "boolean",
                description: "Only present for authenticated callers: whether the caller is the author (their submission created it)",
              },
            },
            required: [
              "photos", "averageRating", "reviewCount", "ratingDistribution", "lastVerifiedAt",
              "verificationCount", "myVerifiedToday",
            ],
          },
        ],
      },
      VerifyResult: {
        type: "object",
        description: "Same shape as the app's `VerifyResult`",
        properties: {
          queued: { type: "boolean", description: "Always false: the server applies verifications immediately" },
          points: { type: "integer", description: "Reputation points earned; always 0 (no reputation model yet)" },
          hidden: { type: "boolean", description: "This verification hid the plan" },
        },
        required: ["queued", "points", "hidden"],
      },
      Report: {
        type: "object",
        description: "The reporter is never included",
        properties: {
          id: { type: "string", format: "uuid" },
          placeId: { type: ["string", "null"], format: "uuid" },
          eventId: { type: ["string", "null"], format: "uuid" },
          reason: { type: "string", enum: [...REPORT_REASONS] },
          details: { type: ["string", "null"] },
          photo: { type: ["string", "null"], format: "uri" },
          createdAt: { type: "string", format: "date-time" },
        },
        required: ["id", "placeId", "eventId", "reason", "details", "photo", "createdAt"],
      },
      CreatedReport: {
        allOf: [
          { $ref: "#/components/schemas/Report" },
          {
            type: "object",
            properties: { hidden: { type: "boolean", description: "This report hid the plan" } },
            required: ["hidden"],
          },
        ],
      },
      ReportQueueItem: {
        type: "object",
        properties: {
          type: { type: "string", enum: ["PLACE", "EVENT"] },
          placeId: { type: ["string", "null"], format: "uuid" },
          eventId: { type: ["string", "null"], format: "uuid" },
          title: { type: "string", description: "Place name or event title" },
          status: { $ref: "#/components/schemas/ContentStatus" },
          hiddenReason: { type: ["string", "null"] },
          reportedAt: {
            type: ["string", "null"],
            format: "date-time",
            description: "When reports hid it (null when not hidden by reports)",
          },
          needsReview: { type: "boolean", description: `Hidden by reports for more than ${NEEDS_REVIEW_HOURS} h without a decision` },
          reportCount: { type: "integer", minimum: 1 },
          topReason: { type: ["string", "null"], enum: [...REPORT_REASONS, null] },
          reasons: {
            type: "object",
            description: "Unresolved reports per reason",
            additionalProperties: { type: "integer", minimum: 1 },
          },
          firstReportAt: { type: "string", format: "date-time" },
          lastReportAt: { type: "string", format: "date-time" },
          reports: { type: "array", items: { $ref: "#/components/schemas/Report" }, description: "Newest first" },
        },
        required: [
          "type", "placeId", "eventId", "title", "status", "hiddenReason", "reportedAt", "needsReview", "reportCount",
          "topReason", "reasons", "firstReportAt", "lastReportAt", "reports",
        ],
      },
      ReportDecisionResult: {
        type: "object",
        properties: {
          placeId: { type: ["string", "null"], format: "uuid" },
          eventId: { type: ["string", "null"], format: "uuid" },
          decision: { type: "string", enum: ["keep", "hide"] },
          status: { $ref: "#/components/schemas/ContentStatus" },
          hiddenReason: { type: ["string", "null"] },
          resolvedReports: { type: "integer", minimum: 1 },
        },
        required: ["placeId", "eventId", "decision", "status", "hiddenReason", "resolvedReports"],
      },
      Submission: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          userId: { type: "string", format: "uuid", description: "Author" },
          type: { type: "string", enum: [...SUBMISSION_TYPES] },
          data: {
            type: "object",
            description: "The suggested fields: a POST /places body (PLACE) or POST /events body (EVENT), without sourceId, plus `photos` (array of upload URLs, possibly empty). Event dates as ISO 8601 UTC.",
          },
          status: { $ref: "#/components/schemas/ContentStatus" },
          reviewedAt: { type: ["string", "null"], format: "date-time" },
          rejectionReason: {
            type: ["string", "null"],
            enum: [...REJECTION_REASONS, null],
            description: `Rejection code when REJECTED (null otherwise, and for rejections from before #40): ${rejectionReasonList}, or \`otro\` (the moderator's note)`,
          },
          reviewNote: { type: ["string", "null"], description: "The moderator's written note (required for `otro`)" },
          rejectionMessage: {
            type: ["string", "null"],
            description: "What to show the author when REJECTED: the reason's text, or the note for `otro`; null otherwise",
          },
          created: {
            oneOf: [
              {
                type: "object",
                properties: { type: { type: "string", enum: [...SUBMISSION_TYPES] }, id: { type: "string", format: "uuid" } },
                required: ["type", "id"],
              },
              { type: "null" },
            ],
            description: "The Place/Event it became once approved; null before that, for approvals from before #40, or if it was deleted",
          },
          createdAt: { type: "string", format: "date-time" },
        },
        required: [
          "id", "userId", "type", "data", "status", "reviewedAt", "rejectionReason", "reviewNote",
          "rejectionMessage", "created", "createdAt",
        ],
      },
      ModerationSubmission: {
        allOf: [
          { $ref: "#/components/schemas/Submission" },
          {
            type: "object",
            properties: {
              reviewedById: {
                type: ["string", "null"],
                format: "uuid",
                description: "Who reviewed it. Only in moderation responses: the author is not told which moderator decided",
              },
              aiScore: { type: ["number", "null"], description: "Reserved for the AI moderation job; not writable through the API" },
              aiReason: { type: ["string", "null"], description: "Reserved for the AI moderation job; not writable through the API" },
            },
            required: ["reviewedById", "aiScore", "aiReason"],
          },
        ],
      },
      ApproveSubmissionResponse: {
        type: "object",
        properties: {
          submission: { $ref: "#/components/schemas/ModerationSubmission" },
          created: {
            type: "object",
            description: "The Place or Event created from the submission",
            properties: { type: { type: "string", enum: [...SUBMISSION_TYPES] }, id: { type: "string", format: "uuid" } },
            required: ["type", "id"],
          },
        },
        required: ["submission", "created"],
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

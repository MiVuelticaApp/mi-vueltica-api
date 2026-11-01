import { z } from "zod";
import ENV from "@/presentation/core/config/env";
import { GoogleLoginSchema } from "@/presentation/auth/validators/googleLogin";
import { AppleLoginSchema } from "@/presentation/auth/validators/appleLogin";
import { TestLoginSchema } from "@/presentation/auth/validators/testLogin";
import { UpdateUserSchema } from "@/presentation/users/validators/updateUser";
import { UpdateInterestsSchema } from "@/presentation/users/validators/updateInterests";
import { DeleteAccountSchema } from "@/presentation/users/validators/deleteAccount";
import { CreateCategorySchema } from "@/presentation/categories/validators/createCategory";
import { UpdateCategorySchema } from "@/presentation/categories/validators/updateCategory";
import { CATEGORY_SORT_FIELDS } from "@/presentation/categories/validators/listCategories";
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

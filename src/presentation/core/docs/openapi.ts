import { z } from "zod";
import ENV from "@/presentation/core/config/env";
import { GoogleLoginSchema } from "@/presentation/auth/validators/googleLogin";
import { AppleLoginSchema } from "@/presentation/auth/validators/appleLogin";
import { TestLoginSchema } from "@/presentation/auth/validators/testLogin";
import { UpdateUserSchema } from "@/presentation/users/validators/updateUser";
import { DeleteAccountSchema } from "@/presentation/users/validators/deleteAccount";
import { AGE_RANGES, USER_ROLES } from "@/domain/users/entities/User";

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

const paths: Record<string, Record<string, unknown>> = {
  "/auth/google": {
    post: {
      tags: ["Auth"],
      summary: "Login with Google",
      requestBody: jsonBody(GoogleLoginSchema),
      responses: {
        200: jsonResponse("Authenticated", "AuthResponse"),
        400: errorResponse("Invalid request body"),
        401: errorResponse("Authentication failed"),
        409: errorResponse("Email already registered with another provider"),
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
        400: errorResponse("Invalid request body"),
        401: errorResponse("Authentication failed"),
        409: errorResponse("Email already registered with another provider"),
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
        401: { $ref: "#/components/responses/Unauthorized" },
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
        401: { $ref: "#/components/responses/Unauthorized" },
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
        401: { $ref: "#/components/responses/Unauthorized" },
        404: errorResponse("User not found"),
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
        401: { $ref: "#/components/responses/Unauthorized" },
        404: errorResponse("User not found"),
      },
    },
    put: {
      tags: ["Profile"],
      summary: "Update my profile",
      security: bearer,
      requestBody: jsonBody(UpdateUserSchema),
      responses: {
        200: jsonResponse("Updated profile", "UserResponse"),
        400: errorResponse("Invalid request body"),
        401: { $ref: "#/components/responses/Unauthorized" },
        404: errorResponse("User not found"),
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
        400: errorResponse("Invalid request body"),
        401: { $ref: "#/components/responses/Unauthorized" },
        429: errorResponse("Too many requests"),
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
        400: errorResponse("Invalid request body"),
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
    { name: "System" },
  ],
  paths,
  components: {
    responses: {
      Unauthorized: jsonResponse("Missing or invalid token", "Error"),
      Forbidden: jsonResponse("The authenticated user lacks the required role", "Error"),
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
      MyProfileResponse: { $ref: "#/components/schemas/UserResponse" },
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

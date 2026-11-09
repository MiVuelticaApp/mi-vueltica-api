import "express";
import type { UserRole } from "@/domain/users/entities/User";

declare global {
  namespace Express {
    /** The authenticated caller, set by `jwtAuth` / `optionalJwtAuth`. */
    interface User {
      id: string;
      email: string;
      // Only populated after `requireRole` / `optionalJwtAuth` has loaded the user from the database.
      role?: UserRole;
    }

    interface Request {
      // Declared here since there is no passport anymore (it used to come from @types/passport).
      user?: User;
      // Parsed output of `validateSchema`, per source. Read it with `getValidated`.
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

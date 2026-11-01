import "express";
import type { UserRole } from "@/domain/users/entities/User";
import type { Email } from "@/domain/users/valueObjects/email.valueObject";

declare global {
  namespace Express {
    // `req.user` is typed by @types/passport as `Express.User`, so augment that
    // interface instead of redeclaring `Request.user`.
    interface User {
      id: string;
      // `jwtAuth` sets a string; the legacy passport session code still puts the domain
      // User (whose `email` is a value object) here, so both must be assignable.
      email: string | Email;
      // Only populated after `requireRole` has loaded the user from the database.
      role?: UserRole;
    }

    interface Request {
      // Parsed output of `validateSchema`, per source. Read it with `getValidated`.
      validated?: {
        body?: unknown;
        query?: unknown;
        params?: unknown;
      };
    }
  }
}

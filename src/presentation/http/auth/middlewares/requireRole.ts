import { NextFunction, Request, Response } from "express";
import { userService } from "@/dependencyInjection/container";
import { UserRole } from "@/domain/users/entities/User";
import { UnauthorizedError } from "@/application/core/errors/UnauthorizedError";
import { ForbiddenError } from "@/application/core/errors/ForbiddenError";

/**
 * Authorizes by role. Must run after `jwtAuth`.
 *
 * The role is never read from the token or the client: the user is loaded from the
 * database on every request, so role changes and soft-deletes apply immediately.
 */
export default function requireRole(...roles: UserRole[]) {
  if (roles.length === 0) {
    throw new Error("requireRole needs at least one role");
  }

  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }

      const user = await userService.find(req.user.id);
      if (!user || user.deletedAt) {
        return next(new UnauthorizedError("Usuario no válido o eliminado"));
      }

      if (!roles.includes(user.role)) {
        return next(new ForbiddenError());
      }

      req.user.role = user.role;
      next();
    } catch (error) {
      next(error);
    }
  };
}

import { NextFunction, Request, Response } from "express";
import { jwtService, userService } from "@/dependencyInjection/container";

/**
 * For public endpoints whose result depends on who is asking. Never rejects the request:
 * no header, an invalid/expired token or a missing/soft-deleted user simply continue
 * anonymously. When the token is valid the user is loaded from the database (so the role
 * is never taken from the token) and `req.user` is populated including `role`.
 */
export default async function optionalJwtAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    const payload = jwtService.verifyToken(authHeader.substring(7));
    if (!payload) {
      return next();
    }

    const user = await userService.find(payload.id);
    if (user && !user.deletedAt) {
      req.user = { id: user.id, email: payload.email, role: user.role };
    }
    next();
  } catch (error) {
    next(error);
  }
}

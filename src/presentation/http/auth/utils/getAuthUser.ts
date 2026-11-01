import { Request } from "express";
import { UnauthorizedError } from "@/application/core/errors/UnauthorizedError";

/** Returns the user set by `jwtAuth`, or throws `UnauthorizedError` (401) if there is none. */
export function getAuthUser(req: Request): Express.User {
  if (!req.user) throw new UnauthorizedError();
  return req.user;
}

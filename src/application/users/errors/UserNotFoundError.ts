import ApplicationError from "@/application/core/errors/ApplicationError";

export class UserNotFoundError extends ApplicationError {
  constructor() {
    super("User not found");
    this.name = "UserNotFoundError";
    this.stack = new Error().stack;
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}
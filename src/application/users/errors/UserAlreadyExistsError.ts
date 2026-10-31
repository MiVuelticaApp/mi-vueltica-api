import ApplicationError from "@/application/core/errors/ApplicationError";

export class UserAlreadyExistsError extends ApplicationError {
  constructor() {
    super("User already exists");
    this.name = "UserAlreadyExistsError";
    this.stack = new Error().stack;
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

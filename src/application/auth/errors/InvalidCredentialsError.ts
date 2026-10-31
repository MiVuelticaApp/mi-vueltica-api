import ApplicationError from "@/application/core/errors/ApplicationError";

export class InvalidCredentialsError extends ApplicationError {
  constructor(message: string = "Invalid email or password") {
    super(message);
    this.name = "InvalidCredentialsError";
    this.stack = new Error().stack;
    this.statusCode = 401;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}
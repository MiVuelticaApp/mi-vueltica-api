import ApplicationError from "@/application/core/errors/ApplicationError";

export class UnauthorizedError extends ApplicationError {
  constructor(message: string = "No autenticado") {
    super(message, 401);
    this.name = "UnauthorizedError";
    this.stack = new Error().stack;
    this.statusCode = 401;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

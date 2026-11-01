import ApplicationError from "@/application/core/errors/ApplicationError";

export class ForbiddenError extends ApplicationError {
  constructor(message: string = "No tienes permisos para realizar esta acción") {
    super(message, 403);
    this.name = "ForbiddenError";
    this.stack = new Error().stack;
    this.statusCode = 403;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

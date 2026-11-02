import ApplicationError from "@/application/core/errors/ApplicationError";

export class CantonNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Cantón no encontrado");
    this.name = "CantonNotFoundError";
    this.stack = new Error().stack;
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

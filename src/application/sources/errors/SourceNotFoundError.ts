import ApplicationError from "@/application/core/errors/ApplicationError";

export class SourceNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Fuente no encontrada");
    this.name = "SourceNotFoundError";
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

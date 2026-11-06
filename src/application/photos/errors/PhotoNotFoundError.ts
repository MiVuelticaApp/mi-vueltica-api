import ApplicationError from "@/application/core/errors/ApplicationError";

export class PhotoNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Foto no encontrada");
    this.name = "PhotoNotFoundError";
    this.stack = new Error().stack;
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

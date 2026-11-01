import ApplicationError from "@/application/core/errors/ApplicationError";

export class PlaceNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Lugar no encontrado");
    this.name = "PlaceNotFoundError";
    this.stack = new Error().stack;
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

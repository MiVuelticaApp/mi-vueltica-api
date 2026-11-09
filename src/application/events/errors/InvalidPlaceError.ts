import ApplicationError from "@/application/core/errors/ApplicationError";

export class InvalidPlaceError extends ApplicationError {
  constructor(message?: string) {
    super(message || "El lugar indicado no existe");
    this.name = "InvalidPlaceError";
    this.statusCode = 422;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

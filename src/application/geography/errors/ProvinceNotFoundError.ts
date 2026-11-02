import ApplicationError from "@/application/core/errors/ApplicationError";

export class ProvinceNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Provincia no encontrada");
    this.name = "ProvinceNotFoundError";
    this.stack = new Error().stack;
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

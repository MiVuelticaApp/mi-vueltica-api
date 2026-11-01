import ApplicationError from "@/application/core/errors/ApplicationError";

export class InvalidCantonError extends ApplicationError {
  constructor(message?: string) {
    super(message || "El cantón indicado no existe");
    this.name = "InvalidCantonError";
    this.stack = new Error().stack;
    this.statusCode = 422;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

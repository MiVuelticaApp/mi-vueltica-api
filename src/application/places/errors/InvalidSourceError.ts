import ApplicationError from "@/application/core/errors/ApplicationError";

export class InvalidSourceError extends ApplicationError {
  constructor(message?: string) {
    super(message || "La fuente indicada no existe");
    this.name = "InvalidSourceError";
    this.stack = new Error().stack;
    this.statusCode = 422;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

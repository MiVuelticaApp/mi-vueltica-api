import ApplicationError from "@/application/core/errors/ApplicationError";

export class NoPendingReportsError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Este plan no tiene reportes pendientes");
    this.name = "NoPendingReportsError";
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

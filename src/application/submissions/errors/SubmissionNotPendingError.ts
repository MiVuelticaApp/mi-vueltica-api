import ApplicationError from "@/application/core/errors/ApplicationError";

export class SubmissionNotPendingError extends ApplicationError {
  constructor(message?: string) {
    super(message || "La sugerencia ya no está pendiente");
    this.name = "SubmissionNotPendingError";
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

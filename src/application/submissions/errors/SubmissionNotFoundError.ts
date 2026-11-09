import ApplicationError from "@/application/core/errors/ApplicationError";

export class SubmissionNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Sugerencia no encontrada");
    this.name = "SubmissionNotFoundError";
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

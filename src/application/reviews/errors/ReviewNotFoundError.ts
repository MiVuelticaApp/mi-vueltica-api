import ApplicationError from "@/application/core/errors/ApplicationError";

export class ReviewNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Reseña no encontrada");
    this.name = "ReviewNotFoundError";
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

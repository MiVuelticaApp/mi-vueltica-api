import ApplicationError from "@/application/core/errors/ApplicationError";

export class ReviewAlreadyExistsError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Ya escribiste una reseña para este lugar");
    this.name = "ReviewAlreadyExistsError";
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

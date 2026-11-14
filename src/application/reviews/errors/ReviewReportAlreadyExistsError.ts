import ApplicationError from "@/application/core/errors/ApplicationError";

export class ReviewReportAlreadyExistsError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Ya reportaste esta reseña");
    this.name = "ReviewReportAlreadyExistsError";
    this.statusCode = 409;
    this.status = "fail";
    this.isOperational = true;
    this.layer = "application";
  }
}

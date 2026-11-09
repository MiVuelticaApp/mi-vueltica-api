import ApplicationError from "@/application/core/errors/ApplicationError";

export class ReportAlreadyExistsError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Ya reportaste este plan");
    this.name = "ReportAlreadyExistsError";
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

import ApplicationError from "@/application/core/errors/ApplicationError";

export class CannotBlockYourselfError extends ApplicationError {
  constructor(message?: string) {
    super(message || "No puedes bloquearte a ti mismo");
    this.name = "CannotBlockYourselfError";
    this.statusCode = 422;
    this.status = "fail";
    this.isOperational = true;
    this.layer = "application";
  }
}

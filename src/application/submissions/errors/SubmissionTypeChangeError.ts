import ApplicationError from "@/application/core/errors/ApplicationError";

/** An edit tried to turn a PLACE suggestion into an EVENT one (or the other way around). */
export class SubmissionTypeChangeError extends ApplicationError {
  constructor() {
    super("No se puede cambiar el tipo de una sugerencia; elimínala y crea otra");
    this.name = "SubmissionTypeChangeError";
    this.statusCode = 422;
    this.status = "fail";
    this.isOperational = true;
    this.layer = "application";
  }
}

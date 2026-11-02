import ApplicationError from "@/application/core/errors/ApplicationError";

/** A request body references a province that does not exist (422, not 404: the URL is fine). */
export class InvalidProvinceError extends ApplicationError {
  constructor(message?: string) {
    super(message || "La provincia indicada no existe");
    this.name = "InvalidProvinceError";
    this.stack = new Error().stack;
    this.statusCode = 422;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

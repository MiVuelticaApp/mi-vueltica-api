import ApplicationError from "@/application/core/errors/ApplicationError";

export class InvalidCategoryIdsError extends ApplicationError {
  constructor(missingIds: number[]) {
    super(`Las siguientes categorías no existen: ${missingIds.join(", ")}`);
    this.name = "InvalidCategoryIdsError";
    this.stack = new Error().stack;
    this.statusCode = 422;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

import ApplicationError from "@/application/core/errors/ApplicationError";

export class InvalidCategoryError extends ApplicationError {
  constructor(message?: string) {
    super(message || "La categoría indicada no existe");
    this.name = "InvalidCategoryError";
    this.stack = new Error().stack;
    this.statusCode = 422;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

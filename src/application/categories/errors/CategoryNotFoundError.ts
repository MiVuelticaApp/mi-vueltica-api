import ApplicationError from "@/application/core/errors/ApplicationError";

export class CategoryNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Categoría no encontrada");
    this.name = "CategoryNotFoundError";
    this.stack = new Error().stack;
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

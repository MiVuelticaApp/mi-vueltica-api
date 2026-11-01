import ApplicationError from "@/application/core/errors/ApplicationError";

export class CategoryInUseError extends ApplicationError {
  constructor(message?: string) {
    super(message || "No se puede eliminar la categoría porque está en uso por lugares o eventos");
    this.name = "CategoryInUseError";
    this.stack = new Error().stack;
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

import ApplicationError from "@/application/core/errors/ApplicationError";

export class CategoryAlreadyExistsError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Ya existe una categoría con ese nombre");
    this.name = "CategoryAlreadyExistsError";
    this.stack = new Error().stack;
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

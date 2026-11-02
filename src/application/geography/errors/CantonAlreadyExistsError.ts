import ApplicationError from "@/application/core/errors/ApplicationError";

export class CantonAlreadyExistsError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Ya existe un cantón con ese código o nombre");
    this.name = "CantonAlreadyExistsError";
    this.stack = new Error().stack;
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }

  static withId(id: number) {
    return new CantonAlreadyExistsError(`Ya existe un cantón con el código ${id}`);
  }

  static withName() {
    return new CantonAlreadyExistsError("Ya existe un cantón con ese nombre en la provincia");
  }
}

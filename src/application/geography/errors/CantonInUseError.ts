import ApplicationError from "@/application/core/errors/ApplicationError";

export class CantonInUseError extends ApplicationError {
  constructor(message?: string) {
    super(message || "No se puede eliminar el cantón porque tiene lugares asociados");
    this.name = "CantonInUseError";
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

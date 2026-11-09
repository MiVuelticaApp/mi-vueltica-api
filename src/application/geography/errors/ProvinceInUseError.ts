import ApplicationError from "@/application/core/errors/ApplicationError";

export class ProvinceInUseError extends ApplicationError {
  constructor(message?: string) {
    super(message || "No se puede eliminar la provincia porque tiene cantones asociados");
    this.name = "ProvinceInUseError";
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

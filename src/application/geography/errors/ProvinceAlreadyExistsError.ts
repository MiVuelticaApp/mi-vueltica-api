import ApplicationError from "@/application/core/errors/ApplicationError";

export class ProvinceAlreadyExistsError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Ya existe una provincia con ese código o nombre");
    this.name = "ProvinceAlreadyExistsError";
    this.statusCode = 409;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }

  static withId(id: number) {
    return new ProvinceAlreadyExistsError(`Ya existe una provincia con el código ${id}`);
  }

  static withName() {
    return new ProvinceAlreadyExistsError("Ya existe una provincia con ese nombre");
  }
}

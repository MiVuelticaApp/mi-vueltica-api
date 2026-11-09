import ApplicationError from "@/application/core/errors/ApplicationError";

export class InvalidPhotoOrderError extends ApplicationError {
  constructor(message?: string) {
    super(message || "El nuevo orden debe incluir exactamente las fotos de la galería, sin repetir");
    this.name = "InvalidPhotoOrderError";
    this.statusCode = 422;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

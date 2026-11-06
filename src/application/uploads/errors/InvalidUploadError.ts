import ApplicationError from "@/application/core/errors/ApplicationError";

export class InvalidUploadError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Foto inválida: usa una URL devuelta por POST /uploads");
    this.name = "InvalidUploadError";
    this.stack = new Error().stack;
    this.statusCode = 422;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

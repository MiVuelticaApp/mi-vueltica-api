import ApplicationError from "@/application/core/errors/ApplicationError";

export class FileNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Archivo no encontrado");
    this.name = "FileNotFoundError";
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

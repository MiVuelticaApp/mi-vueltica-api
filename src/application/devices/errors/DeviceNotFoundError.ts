import ApplicationError from "@/application/core/errors/ApplicationError";

export class DeviceNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Dispositivo no encontrado");
    this.name = "DeviceNotFoundError";
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

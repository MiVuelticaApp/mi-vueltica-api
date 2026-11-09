import ApplicationError from "@/application/core/errors/ApplicationError";

export class NotificationNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Notificación no encontrada");
    this.name = "NotificationNotFoundError";
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

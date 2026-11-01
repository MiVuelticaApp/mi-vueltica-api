import ApplicationError from "@/application/core/errors/ApplicationError";

export class EventNotFoundError extends ApplicationError {
  constructor(message?: string) {
    super(message || "Evento no encontrado");
    this.name = "EventNotFoundError";
    this.stack = new Error().stack;
    this.statusCode = 404;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

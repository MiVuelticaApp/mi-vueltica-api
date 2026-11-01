import ApplicationError from "@/application/core/errors/ApplicationError";

export class SelfModificationError extends ApplicationError {
  constructor() {
    super("No puedes cambiar tu propio rol ni eliminar tu propia cuenta desde administración", 403);
    this.name = "SelfModificationError";
    this.stack = new Error().stack;
    this.statusCode = 403;
    this.status = 'fail';
    this.isOperational = true;
    this.layer = "application";
  }
}

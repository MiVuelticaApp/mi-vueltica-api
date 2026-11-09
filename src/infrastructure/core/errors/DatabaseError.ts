import InfrastructureError from "./InfrastructureError";

export default class DatabaseError extends InfrastructureError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "DatabaseError";
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}
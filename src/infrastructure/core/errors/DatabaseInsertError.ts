import InfrastructureError from "./InfrastructureError";

export default class DatabaseInsertError extends InfrastructureError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = "DatabaseInsertError";
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}
import InfrastructureError from "./InfrastructureError";

export default class DatabaseInsertError extends InfrastructureError {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseInsertError";
    this.stack = new Error().stack;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}
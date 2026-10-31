import InfrastructureError from "./InfrastructureError";

export default class DatabaseError extends InfrastructureError {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseError";
    this.stack = new Error().stack;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}
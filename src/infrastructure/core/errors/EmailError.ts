import InfrastructureError from "./InfrastructureError";

export default class EmailError extends InfrastructureError {
  constructor(message: string) {
    super(message);
    this.name = "EmailError";
    this.stack = new Error().stack;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}
import InfrastructureError from "./InfrastructureError";

export default class EmailError extends InfrastructureError {
  constructor(message: string) {
    super(message);
    this.name = "EmailError";
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}
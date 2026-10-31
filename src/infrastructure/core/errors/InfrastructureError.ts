export default class InfrastructureError extends Error {
  public statusCode: number = 500;
  public status:string;
  public isOperational: boolean = true;
  public layer: string = "infrastructure";

  constructor(message: string) {
    super(message);
    this.name = "InfrastructureError";
    this.stack = new Error().stack;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}


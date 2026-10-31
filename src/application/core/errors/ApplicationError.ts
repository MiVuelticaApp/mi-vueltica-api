export default class ApplicationError extends Error {
  public statusCode: number = 500;
  public status:string;
  public isOperational: boolean = true;
  public layer: string = "application";

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = "ApplicationError";
    this.stack = new Error().stack;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
  }
}
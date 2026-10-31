import DomainError from "./DomainError";

export default class DataError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "Invalid Data Error";
    this.stack = new Error().stack;
    this.statusCode = 400;
    this.status = 'error';
  }
}
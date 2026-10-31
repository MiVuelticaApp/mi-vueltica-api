import DataException from "@/domain/core/errors/DataError";

export class Email {
  private constructor(private readonly _value: string) {}

  static create(value: string) {
    if (!value || !value.includes("@")) {
      throw new DataException("Invalid email");
    }
    return new Email(value.toLowerCase().trim());
  }

  get value() {
    return this._value;
  }
}

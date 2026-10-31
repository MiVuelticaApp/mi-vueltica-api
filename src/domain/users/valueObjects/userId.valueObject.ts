import DataException from "@/domain/core/errors/DataError";

export class UserId {
  private readonly _value: string
  private constructor(value: string) {
    this._value = value
  }

  static create(value: string) {
    if (!value) throw new DataException("UserId cannot be empty");
    return new UserId(value.trim());
  }

  get value() {
    return this._value;
  }
}

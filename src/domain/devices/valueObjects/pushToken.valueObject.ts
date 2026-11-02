import DataException from "@/domain/core/errors/DataError";

// Matches the VARCHAR(512) column of Device.pushToken.
export const PUSH_TOKEN_MAX_LENGTH = 512;

export class PushToken {
  private constructor(private readonly _value: string) {}

  static create(value: string) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) {
      throw new DataException("El token push es requerido");
    }
    if (trimmed.length > PUSH_TOKEN_MAX_LENGTH) {
      throw new DataException(`El token push no puede exceder ${PUSH_TOKEN_MAX_LENGTH} caracteres`);
    }
    return new PushToken(trimmed);
  }

  get value() {
    return this._value;
  }
}

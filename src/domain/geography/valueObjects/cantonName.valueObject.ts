import DataException from "@/domain/core/errors/DataError";

// Matches the VARCHAR(191) column of Canton.name.
export const CANTON_NAME_MAX_LENGTH = 191;

export class CantonName {
  private constructor(private readonly _value: string) {}

  static create(value: string) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) {
      throw new DataException("El nombre del cantón es requerido");
    }
    if (trimmed.length > CANTON_NAME_MAX_LENGTH) {
      throw new DataException(`El nombre del cantón no puede exceder ${CANTON_NAME_MAX_LENGTH} caracteres`);
    }
    return new CantonName(trimmed);
  }

  get value() {
    return this._value;
  }
}

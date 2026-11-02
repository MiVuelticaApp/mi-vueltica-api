import DataException from "@/domain/core/errors/DataError";

// Matches the VARCHAR(191) column of Province.name.
export const PROVINCE_NAME_MAX_LENGTH = 191;

export class ProvinceName {
  private constructor(private readonly _value: string) {}

  static create(value: string) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) {
      throw new DataException("El nombre de la provincia es requerido");
    }
    if (trimmed.length > PROVINCE_NAME_MAX_LENGTH) {
      throw new DataException(`El nombre de la provincia no puede exceder ${PROVINCE_NAME_MAX_LENGTH} caracteres`);
    }
    return new ProvinceName(trimmed);
  }

  get value() {
    return this._value;
  }
}

import DataException from "@/domain/core/errors/DataError";

export const CATEGORY_NAME_MAX_LENGTH = 100;

export class CategoryName {
  private constructor(private readonly _value: string) {}

  static create(value: string) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) {
      throw new DataException("El nombre de la categoría es requerido");
    }
    if (trimmed.length > CATEGORY_NAME_MAX_LENGTH) {
      throw new DataException(`El nombre de la categoría no puede exceder ${CATEGORY_NAME_MAX_LENGTH} caracteres`);
    }
    return new CategoryName(trimmed);
  }

  get value() {
    return this._value;
  }
}

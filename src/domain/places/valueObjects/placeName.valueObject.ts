import DataException from "@/domain/core/errors/DataError";

export const PLACE_NAME_MAX_LENGTH = 191;

export class PlaceName {
  private constructor(private readonly _value: string) {}

  static create(value: string) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) {
      throw new DataException("El nombre del lugar es requerido");
    }
    if (trimmed.length > PLACE_NAME_MAX_LENGTH) {
      throw new DataException(`El nombre del lugar no puede exceder ${PLACE_NAME_MAX_LENGTH} caracteres`);
    }
    return new PlaceName(trimmed);
  }

  get value() {
    return this._value;
  }
}

import DataException from "@/domain/core/errors/DataError";

export const SOURCE_NAME_MAX_LENGTH = 191;

export class SourceName {
  private constructor(private readonly _value: string) {}

  static create(value: string) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) {
      throw new DataException("El nombre de la fuente es requerido");
    }
    if (trimmed.length > SOURCE_NAME_MAX_LENGTH) {
      throw new DataException(`El nombre de la fuente no puede exceder ${SOURCE_NAME_MAX_LENGTH} caracteres`);
    }
    return new SourceName(trimmed);
  }

  get value() {
    return this._value;
  }
}

import DataException from "@/domain/core/errors/DataError";

export const PLACE_DESCRIPTION_MAX_LENGTH = 5000;

/** Optional free text. An empty/absent value is stored as `null`. */
export class PlaceDescription {
  private constructor(private readonly _value: string | null) {}

  static create(value: string | null | undefined) {
    if (value === null || value === undefined) return new PlaceDescription(null);
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) return new PlaceDescription(null);
    if (trimmed.length > PLACE_DESCRIPTION_MAX_LENGTH) {
      throw new DataException(`La descripción no puede exceder ${PLACE_DESCRIPTION_MAX_LENGTH} caracteres`);
    }
    return new PlaceDescription(trimmed);
  }

  get value() {
    return this._value;
  }
}

import DataException from "@/domain/core/errors/DataError";

export const PLACE_ADDRESS_MAX_LENGTH = 191;

/** Optional address. An empty/absent value is stored as `null`. */
export class PlaceAddress {
  private constructor(private readonly _value: string | null) {}

  static create(value: string | null | undefined) {
    if (value === null || value === undefined) return new PlaceAddress(null);
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) return new PlaceAddress(null);
    if (trimmed.length > PLACE_ADDRESS_MAX_LENGTH) {
      throw new DataException(`La dirección no puede exceder ${PLACE_ADDRESS_MAX_LENGTH} caracteres`);
    }
    return new PlaceAddress(trimmed);
  }

  get value() {
    return this._value;
  }
}

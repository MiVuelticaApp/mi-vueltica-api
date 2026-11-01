import DataException from "@/domain/core/errors/DataError";

export const EVENT_DESCRIPTION_MAX_LENGTH = 5000;

/** Optional free text. An empty/absent value is stored as `null`. */
export class EventDescription {
  private constructor(private readonly _value: string | null) {}

  static create(value: string | null | undefined) {
    if (value === null || value === undefined) return new EventDescription(null);
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) return new EventDescription(null);
    if (trimmed.length > EVENT_DESCRIPTION_MAX_LENGTH) {
      throw new DataException(`La descripción no puede exceder ${EVENT_DESCRIPTION_MAX_LENGTH} caracteres`);
    }
    return new EventDescription(trimmed);
  }

  get value() {
    return this._value;
  }
}

import DataException from "@/domain/core/errors/DataError";

export const EVENT_TITLE_MAX_LENGTH = 191;

export class EventTitle {
  private constructor(private readonly _value: string) {}

  static create(value: string) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) {
      throw new DataException("El título del evento es requerido");
    }
    if (trimmed.length > EVENT_TITLE_MAX_LENGTH) {
      throw new DataException(`El título del evento no puede exceder ${EVENT_TITLE_MAX_LENGTH} caracteres`);
    }
    return new EventTitle(trimmed);
  }

  get value() {
    return this._value;
  }
}

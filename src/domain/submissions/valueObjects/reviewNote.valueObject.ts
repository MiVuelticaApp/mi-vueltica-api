import DataException from "@/domain/core/errors/DataError";

export const REVIEW_NOTE_MAX_LENGTH = 1000;

/** Moderator's reason when rejecting a submission. */
export class ReviewNote {
  private constructor(private readonly _value: string) {}

  static create(value: string) {
    const trimmed = typeof value === "string" ? value.trim() : "";
    if (trimmed.length === 0) {
      throw new DataException("El motivo es requerido");
    }
    if (trimmed.length > REVIEW_NOTE_MAX_LENGTH) {
      throw new DataException(`El motivo no puede exceder ${REVIEW_NOTE_MAX_LENGTH} caracteres`);
    }
    return new ReviewNote(trimmed);
  }

  get value() {
    return this._value;
  }
}

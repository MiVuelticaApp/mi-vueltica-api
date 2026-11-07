import DataException from "@/domain/core/errors/DataError";

export const REVIEW_COMMENT_MAX_LENGTH = 2000;

/** Optional review text. Trimmed; an absent or blank comment is stored as `null`. */
export class ReviewComment {
  private constructor(private readonly _value: string | null) {}

  static create(value: string | null | undefined) {
    if (value === null || value === undefined) return new ReviewComment(null);
    if (typeof value !== "string") {
      throw new DataException("El comentario debe ser texto");
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) return new ReviewComment(null);
    if (trimmed.length > REVIEW_COMMENT_MAX_LENGTH) {
      throw new DataException(`El comentario no puede exceder ${REVIEW_COMMENT_MAX_LENGTH} caracteres`);
    }
    return new ReviewComment(trimmed);
  }

  get value() {
    return this._value;
  }
}

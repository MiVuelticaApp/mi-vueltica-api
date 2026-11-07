import DataException from "@/domain/core/errors/DataError";

export const MIN_RATING = 1;
export const MAX_RATING = 5;

/** Star rating of a review: an integer from 1 to 5. */
export class Rating {
  private constructor(private readonly _value: number) {}

  static create(value: number) {
    if (typeof value !== "number" || !Number.isInteger(value) || value < MIN_RATING || value > MAX_RATING) {
      throw new DataException(`La calificación debe ser un número entero entre ${MIN_RATING} y ${MAX_RATING}`);
    }
    return new Rating(value);
  }

  get value() {
    return this._value;
  }
}

import DataException from "@/domain/core/errors/DataError";

const isValidDate = (value: unknown): value is Date => value instanceof Date && !Number.isNaN(value.getTime());

/** When an event starts and (optionally) ends. `endsAt`, when present, must be `>= startsAt`. */
export class EventSchedule {
  private constructor(
    private readonly _startsAt: Date,
    private readonly _endsAt: Date | null,
  ) {}

  static create(startsAt: Date, endsAt?: Date | null) {
    if (!isValidDate(startsAt)) {
      throw new DataException("La fecha de inicio del evento no es válida");
    }
    if (endsAt === null || endsAt === undefined) return new EventSchedule(startsAt, null);
    if (!isValidDate(endsAt)) {
      throw new DataException("La fecha de fin del evento no es válida");
    }
    if (endsAt.getTime() < startsAt.getTime()) {
      throw new DataException("La fecha de fin no puede ser anterior a la de inicio");
    }
    return new EventSchedule(startsAt, endsAt);
  }

  get startsAt() {
    return this._startsAt;
  }

  get endsAt() {
    return this._endsAt;
  }
}

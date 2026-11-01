import DataException from "@/domain/core/errors/DataError";

export const WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** 24h `HH:MM`. */
export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
export const MAX_INTERVALS_PER_DAY = 6;

export interface OpeningInterval {
  open: string;
  close: string;
}

/** Weekdays missing from the object are "unknown"; an empty array means closed that day. */
export type OpeningHoursValue = Partial<Record<Weekday, OpeningInterval[]>>;

/**
 * Weekly opening hours. Re-validates the shape enforced by the presentation schema:
 * known weekday keys only, at most 6 intervals per day, `open < close`, no overlaps
 * (touching intervals such as 08:00-12:00 and 12:00-18:00 are allowed).
 * An absent value is stored as `null`.
 */
export class OpeningHours {
  private constructor(private readonly _value: OpeningHoursValue | null) {}

  static create(value: unknown) {
    if (value === null || value === undefined) return new OpeningHours(null);
    if (typeof value !== "object" || Array.isArray(value)) {
      throw new DataException("El horario debe ser un objeto con los días de la semana");
    }

    const result: OpeningHoursValue = {};
    for (const [day, intervals] of Object.entries(value)) {
      if (!(WEEKDAYS as readonly string[]).includes(day)) {
        throw new DataException(`Día no válido en el horario: ${day}`);
      }
      result[day as Weekday] = OpeningHours.parseDay(day, intervals);
    }
    return new OpeningHours(result);
  }

  private static parseDay(day: string, intervals: unknown): OpeningInterval[] {
    if (!Array.isArray(intervals)) {
      throw new DataException(`El horario de ${day} debe ser una lista de intervalos`);
    }
    if (intervals.length > MAX_INTERVALS_PER_DAY) {
      throw new DataException(`El horario de ${day} no puede tener más de ${MAX_INTERVALS_PER_DAY} intervalos`);
    }

    const parsed = intervals.map((interval): OpeningInterval => {
      const open = (interval as OpeningInterval | null)?.open;
      const close = (interval as OpeningInterval | null)?.close;
      if (typeof open !== "string" || typeof close !== "string" || !TIME_REGEX.test(open) || !TIME_REGEX.test(close)) {
        throw new DataException(`Las horas de ${day} deben tener el formato HH:MM (24 horas)`);
      }
      if (open >= close) {
        throw new DataException(`En ${day}, la hora de apertura debe ser anterior a la de cierre`);
      }
      return { open, close };
    });

    const sorted = [...parsed].sort((a, b) => a.open.localeCompare(b.open));
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].open < sorted[i - 1].close) {
        throw new DataException(`Los intervalos de ${day} no pueden solaparse`);
      }
    }
    return parsed;
  }

  get value() {
    return this._value;
  }
}

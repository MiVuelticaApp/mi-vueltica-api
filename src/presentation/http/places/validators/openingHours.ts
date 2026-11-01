import z from "zod";
import {
  MAX_INTERVALS_PER_DAY,
  TIME_REGEX,
  WEEKDAYS,
} from "@/domain/places/valueObjects/openingHours.valueObject";

const timeField = z
  .string({ error: "La hora debe ser texto con formato HH:MM" })
  .regex(TIME_REGEX, { message: "La hora debe tener el formato HH:MM (24 horas)" });

const intervalSchema = z
  .object({ open: timeField, close: timeField })
  .refine((interval) => interval.open < interval.close, {
    message: "La hora de apertura debe ser anterior a la de cierre",
  });

const daySchema = z
  .array(intervalSchema, { error: "El horario de un día debe ser una lista de intervalos" })
  .max(MAX_INTERVALS_PER_DAY, { message: `Un día no puede tener más de ${MAX_INTERVALS_PER_DAY} intervalos` })
  .refine(
    (intervals) => {
      const sorted = [...intervals].sort((a, b) => a.open.localeCompare(b.open));
      return sorted.every((interval, i) => i === 0 || interval.open >= sorted[i - 1].close);
    },
    { message: "Los intervalos de un mismo día no pueden solaparse" },
  );

/**
 * Weekly opening hours keyed by weekday (`monday`..`sunday`, all optional, unknown keys rejected).
 * An empty array means closed that day.
 */
export const OpeningHoursSchema = z
  .object(Object.fromEntries(WEEKDAYS.map((day) => [day, daySchema.optional()])) as Record<(typeof WEEKDAYS)[number], z.ZodOptional<typeof daySchema>>, {
    error: "El horario debe ser un objeto con los días de la semana",
  })
  .strict();

import z from "zod";
import { EVENT_TITLE_MAX_LENGTH } from "@/domain/events/valueObjects/eventTitle.valueObject";
import { EVENT_DESCRIPTION_MAX_LENGTH } from "@/domain/events/valueObjects/eventDescription.valueObject";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";

/** ISO 8601 datetime that must carry an offset (`Z` or `+hh:mm`), kept as a string. */
export const isoDateTimeField = (label: string) =>
  z.iso.datetime({ offset: true, error: `${label} debe ser una fecha ISO 8601 con zona horaria (ej. 2026-12-01T18:00:00-06:00)` });

/** Same as `isoDateTimeField` but parsed into a `Date`. */
export const dateTimeField = (label: string) => isoDateTimeField(label).transform((value) => new Date(value));

export const eventTitleField = z
  .string({ error: "El título es requerido" })
  .trim()
  .min(1, { message: "El título es requerido" })
  .max(EVENT_TITLE_MAX_LENGTH, { message: `El título no puede exceder ${EVENT_TITLE_MAX_LENGTH} caracteres` });

export const eventDescriptionField = z
  .string({ error: "La descripción debe ser texto" })
  .trim()
  .max(EVENT_DESCRIPTION_MAX_LENGTH, { message: `La descripción no puede exceder ${EVENT_DESCRIPTION_MAX_LENGTH} caracteres` });

export const eventTargetAudienceField = z.enum(TARGET_AUDIENCES, { error: "El público objetivo no es válido" });

export const CreateEventSchema = z
  .object({
    placeId: z.uuid({ error: "El lugar debe ser un UUID válido" }).nullish(),
    categoryId: z
      .number({ error: "La categoría es requerida" })
      .int("La categoría debe ser un número entero")
      .positive("La categoría debe ser un número positivo"),
    sourceId: z.uuid({ error: "La fuente debe ser un UUID válido" }).nullish(),
    title: eventTitleField,
    description: eventDescriptionField.nullish(),
    startsAt: dateTimeField("La fecha de inicio"),
    endsAt: dateTimeField("La fecha de fin").nullish(),
    targetAudience: eventTargetAudienceField.default("EVERYONE"),
  })
  .refine((event) => !event.endsAt || event.endsAt.getTime() >= event.startsAt.getTime(), {
    path: ["endsAt"],
    message: "La fecha de fin no puede ser anterior a la de inicio",
  });

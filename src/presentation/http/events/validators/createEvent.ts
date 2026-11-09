import z from "zod";
import { EVENT_TITLE_MAX_LENGTH } from "@/domain/events/valueObjects/eventTitle.valueObject";
import { EVENT_DESCRIPTION_MAX_LENGTH } from "@/domain/events/valueObjects/eventDescription.valueObject";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { PLACE_ADDRESS_MAX_LENGTH } from "@/domain/places/valueObjects/placeAddress.valueObject";
import {
  MAX_LATITUDE,
  MAX_LONGITUDE,
  MIN_LATITUDE,
  MIN_LONGITUDE,
} from "@/domain/places/valueObjects/coordinates.valueObject";
import { EventLocationInput, eventLocationError } from "@/domain/events/valueObjects/eventLocation.valueObject";
import { planConditionsFields } from "@/presentation/http/places/validators/planConditions";

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

/** The event's own location: only without `placeId`; see `eventLocationRule`. */
export const eventLocationFields = {
  latitude: z
    .number({ error: "La latitud debe ser un número" })
    .min(MIN_LATITUDE, { message: `La latitud debe estar entre ${MIN_LATITUDE} y ${MAX_LATITUDE}` })
    .max(MAX_LATITUDE, { message: `La latitud debe estar entre ${MIN_LATITUDE} y ${MAX_LATITUDE}` })
    .nullish(),
  longitude: z
    .number({ error: "La longitud debe ser un número" })
    .min(MIN_LONGITUDE, { message: `La longitud debe estar entre ${MIN_LONGITUDE} y ${MAX_LONGITUDE}` })
    .max(MAX_LONGITUDE, { message: `La longitud debe estar entre ${MIN_LONGITUDE} y ${MAX_LONGITUDE}` })
    .nullish(),
  address: z
    .string({ error: "La dirección debe ser texto" })
    .trim()
    .max(PLACE_ADDRESS_MAX_LENGTH, { message: `La dirección no puede exceder ${PLACE_ADDRESS_MAX_LENGTH} caracteres` })
    .nullish(),
};

/**
 * `placeId` **or** own `latitude` + `longitude` (+ optional `address`), or neither. Same rule as the
 * domain (`eventLocationError`), so the HTTP, submission and MCP paths give the same message.
 */
export const eventLocationRule = (event: EventLocationInput, ctx: z.RefinementCtx) => {
  const message = eventLocationError(event);
  if (message) ctx.addIssue({ code: "custom", message });
};

/**
 * Event body without the cross-field rules. Zod 4 forbids `.omit()`/`.pick()` on refined objects, so
 * schemas derived from it (e.g. submissions) apply `endsAtNotBeforeStartsAt` and `eventLocationRule` themselves.
 */
export const CreateEventBaseSchema = z.object({
  placeId: z.uuid({ error: "El lugar debe ser un UUID válido" }).nullish(),
  ...eventLocationFields,
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
  ...planConditionsFields,
});

/** `endsAt >= startsAt` (also enforced by the `EventSchedule` value object). */
export const endsAtNotBeforeStartsAt = (event: { startsAt: Date; endsAt?: Date | null }) =>
  !event.endsAt || event.endsAt.getTime() >= event.startsAt.getTime();

export const endsAtNotBeforeStartsAtError = {
  path: ["endsAt"],
  message: "La fecha de fin no puede ser anterior a la de inicio",
};

export const CreateEventSchema = CreateEventBaseSchema
  .refine(endsAtNotBeforeStartsAt, endsAtNotBeforeStartsAtError)
  .superRefine(eventLocationRule);

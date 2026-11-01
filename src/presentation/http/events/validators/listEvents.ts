import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { contentStatusField } from "@/presentation/http/places/validators/changePlaceStatus";
import { dateTimeField } from "./createEvent";

export const EVENT_SORT_FIELDS = ["startsAt", "createdAt", "title"] as const;

const intFilter = (label: string) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .int(`${label} debe ser un número entero`)
    .positive(`${label} debe ser un número positivo`)
    .optional();

/**
 * `from` defaults to "now" (for everyone), so the list shows upcoming/ongoing events unless the
 * caller passes an earlier `from`. The default is applied after validation, so `from <= to` is only
 * enforced when both are sent explicitly. Default order is `startsAt` ascending.
 */
export const ListEventsQuerySchema = createPaginationQuerySchema(EVENT_SORT_FIELDS)
  .extend({
    from: dateTimeField("from").optional(),
    to: dateTimeField("to").optional(),
    categoryId: intFilter("La categoría"),
    placeId: z.uuid({ error: "El lugar debe ser un UUID válido" }).optional(),
    cantonId: intFilter("El cantón"),
    targetAudience: z.enum(TARGET_AUDIENCES, { error: "El público objetivo no es válido" }).optional(),
    // Only honored for MODERATOR / ADMIN; ignored for everyone else.
    status: contentStatusField.optional(),
    q: z.string().trim().max(100, { message: "La búsqueda no puede exceder 100 caracteres" }).optional(),
  })
  .refine((query) => !query.from || !query.to || query.from.getTime() <= query.to.getTime(), {
    path: ["to"],
    message: "from no puede ser posterior a to",
  })
  .transform((query) => ({ ...query, from: query.from ?? new Date() }));

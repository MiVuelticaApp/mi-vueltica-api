import z from "zod";
import { createPaginationQuerySchema } from "@/presentation/http/core/validators/pagination";
import { geoQueryFields, refineGeoQuery, MAX_RADIUS_KM } from "@/presentation/http/core/validators/geo";
import { TARGET_AUDIENCES } from "@/domain/places/valueObjects/targetAudience.valueObject";
import { contentStatusField } from "./changePlaceStatus";
import { planConditionsQueryFields } from "./planConditions";

export const PLACE_SORT_FIELDS = ["name", "createdAt", "updatedAt"] as const;
export { MAX_RADIUS_KM };

const intFilter = (label: string) =>
  z.coerce
    .number({ error: `${label} debe ser un número` })
    .int(`${label} debe ser un número entero`)
    .positive(`${label} debe ser un número positivo`)
    .optional();

export const ListPlacesQuerySchema = createPaginationQuerySchema(PLACE_SORT_FIELDS)
  .extend({
    cantonId: intFilter("El cantón"),
    provinceId: intFilter("La provincia"),
    categoryId: intFilter("La categoría"),
    targetAudience: z.enum(TARGET_AUDIENCES, { error: "El público objetivo no es válido" }).optional(),
    // Only honored for MODERATOR / ADMIN; ignored for everyone else.
    status: contentStatusField.optional(),
    q: z.string().trim().max(100, { message: "La búsqueda no puede exceder 100 caracteres" }).optional(),
    ...planConditionsQueryFields,
    ...geoQueryFields,
  })
  .superRefine(refineGeoQuery);

import { z } from "zod";
import { AUDIENCES, FREE_FOR_GROUPS, PRICE_TIERS, PlanConditionsFilters } from "@/domain/places/valueObjects/planConditions.valueObject";
import { planConditionsFields } from "@/presentation/http/places/validators/planConditions";

/** Price / audience fields of the place and event tool outputs (same as the HTTP responses). */
export const planConditionsOutput = {
  pricePerPerson: z.number().int().nullable(),
  priceTier: z.enum(PRICE_TIERS).nullable(),
  freeFor: z.array(z.enum(FREE_FOR_GROUPS)),
  audiences: z.array(z.enum(AUDIENCES)),
  wheelchair: z.boolean(),
};

/** Same fields as the POST bodies, with descriptions aimed at the model. */
export const planConditionsInput = {
  pricePerPerson: planConditionsFields.pricePerPerson.describe(
    "Precio por persona en colones (entero): 0 = gratis, máximo 5000. Si cuesta más de ₡5.000 no se puede registrar " +
      "(la app solo muestra planes de hasta ₡5.000). Omítelo si no se conoce.",
  ),
  freeFor: planConditionsFields.freeFor.describe(
    "Grupos que entran gratis aunque el plan tenga precio: \"estudiantes\" y/o \"ciudadanosOro\" (adultos mayores). Por defecto [].",
  ),
  audiences: planConditionsFields.audiences.describe(
    "Públicos a los que va dirigido (al menos uno): \"todo\", \"familias\", \"estudiantes\", \"ciudadanosOro\". Por defecto [\"todo\"].",
  ),
  wheelchair: planConditionsFields.wheelchair.describe("Accesible en silla de ruedas. Por defecto false."),
};

/** Card stats added to list/search items (not to create results): PUBLISHED rating and first gallery photo. */
export const planStatsOutput = {
  averageRating: z.number().nullable().describe("Promedio de reseñas publicadas (2 decimales); null sin reseñas."),
  reviewCount: z.number().int().describe("Cantidad de reseñas publicadas."),
  coverPhotoUrl: z.string().nullable().describe("Primera foto de la galería; null sin fotos."),
};

/** Price / audience / accessibility list filters, same as the REST query (`planConditionsQueryFields`). */
export const planFiltersInput = {
  maxPrice: z
    .enum(PRICE_TIERS)
    .optional()
    .describe("Precio máximo: \"gratis\", \"hasta2500\" o \"hasta5000\" (este último también incluye planes de precio desconocido). Filtro opcional."),
  students: z.boolean().optional().describe("true = para estudiantes o gratis para ellos. false u omitido = sin filtro."),
  seniors: z.boolean().optional().describe("true = para ciudadanos de oro o gratis para ellos. false u omitido = sin filtro."),
  families: z.boolean().optional().describe("true = dirigido a familias. false u omitido = sin filtro."),
  wheelchair: z.boolean().optional().describe("true = accesible en silla de ruedas. false u omitido = sin filtro."),
};

/** `false` does not filter (as the REST `\"false\"` flag), so it is dropped like an omitted one. */
export function toPlanFilters(args: PlanConditionsFilters): PlanConditionsFilters {
  return {
    maxPrice: args.maxPrice,
    students: args.students || undefined,
    seniors: args.seniors || undefined,
    families: args.families || undefined,
    wheelchair: args.wheelchair || undefined,
  };
}

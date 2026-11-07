import z from "zod";
import {
  AUDIENCES,
  FREE_FOR_GROUPS,
  MAX_PRICE_PER_PERSON,
  PRICE_TIERS,
} from "@/domain/places/valueObjects/planConditions.valueObject";

/**
 * Price / audience / accessibility fields shared by the Place and Event bodies (and so by
 * submissions). The ₡5.000 ceiling is deliberately NOT checked here: the `PlanConditions` value
 * object rejects it with 422 `PriceAboveLimitError`, the same answer on every entry point.
 */
export const planConditionsFields = {
  pricePerPerson: z
    .number({ error: "El precio por persona debe ser un número" })
    .int("El precio por persona debe ser un número entero de colones")
    .min(0, "El precio por persona no puede ser negativo")
    .nullish()
    .describe(`Colones por persona: 0 = gratis, máximo ${MAX_PRICE_PER_PERSON} (más es 422). null u omitido = desconocido.`),
  freeFor: z
    .array(z.enum(FREE_FOR_GROUPS, { error: "freeFor solo admite estudiantes y ciudadanosOro" }), {
      error: "freeFor debe ser una lista",
    })
    .optional()
    .describe("Grupos que entran gratis aunque pricePerPerson > 0. Por defecto []."),
  audiences: z
    .array(z.enum(AUDIENCES, { error: "audiences solo admite todo, familias, estudiantes y ciudadanosOro" }), {
      error: "audiences debe ser una lista",
    })
    .min(1, "audiences debe tener al menos un público")
    .optional()
    .describe('Públicos a los que va dirigido. Por defecto ["todo"].'),
  wheelchair: z
    .boolean({ error: "wheelchair debe ser verdadero o falso" })
    .optional()
    .describe("Accesible en silla de ruedas. Por defecto false."),
};

/** `"true"` / `"false"` query flag (`z.coerce.boolean()` would turn `"false"` into `true`). */
const booleanFlag = (label: string) =>
  z
    .enum(["true", "false"], { error: `${label} debe ser true o false` })
    .transform((value) => value === "true")
    .optional();

/** Query filters sent by the app on `GET /places` and `GET /events`. */
export const planConditionsQueryFields = {
  maxPrice: z.enum(PRICE_TIERS, { error: "maxPrice debe ser gratis, hasta2500 o hasta5000" }).optional(),
  students: booleanFlag("students"),
  seniors: booleanFlag("seniors"),
  families: booleanFlag("families"),
  wheelchair: booleanFlag("wheelchair"),
};

import { z } from "zod";
import { AUDIENCES, FREE_FOR_GROUPS, PRICE_TIERS } from "@/domain/places/valueObjects/planConditions.valueObject";
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

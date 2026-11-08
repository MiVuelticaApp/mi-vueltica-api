import DataException from "@/domain/core/errors/DataError";
import { PriceTier } from "@/domain/places/valueObjects/planConditions.valueObject";

/** App values (`StillHappening` in mi-vueltica-app). */
export const STILL_HAPPENING_VALUES = ["si", "no", "nose"] as const;
export type StillHappening = (typeof STILL_HAPPENING_VALUES)[number];

/** App values (`PricePaid`). `mas5000` is over the app's ₡5.000 limit. */
export const PRICE_PAID_VALUES = ["gratis", "menos2500", "entre2500y5000", "mas5000"] as const;
export type PricePaid = (typeof PRICE_PAID_VALUES)[number];

export const CORRECTED_TIME_MAX_LENGTH = 100;

export function parseStillHappening(value: unknown): StillHappening {
  if (typeof value === "string" && (STILL_HAPPENING_VALUES as readonly string[]).includes(value)) {
    return value as StillHappening;
  }
  throw new DataException(`stillHappening debe ser uno de: ${STILL_HAPPENING_VALUES.join(", ")}`);
}

export function parsePricePaid(value: unknown): PricePaid | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && (PRICE_PAID_VALUES as readonly string[]).includes(value)) return value as PricePaid;
  throw new DataException(`pricePaid debe ser uno de: ${PRICE_PAID_VALUES.join(", ")}`);
}

/** Free text such as "Abre a las 9:00". Trimmed; blank → null. */
export function parseCorrectedTime(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") throw new DataException("correctedTime debe ser texto");
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > CORRECTED_TIME_MAX_LENGTH) {
    throw new DataException(`correctedTime no puede exceder ${CORRECTED_TIME_MAX_LENGTH} caracteres`);
  }
  return trimmed;
}

/** Price tier a `pricePaid` answer points to; `mas5000` is outside every tier. */
export function pricePaidToTier(pricePaid: PricePaid): PriceTier | "mas5000" {
  switch (pricePaid) {
    case "gratis": return "gratis";
    case "menos2500": return "hasta2500";
    case "entre2500y5000": return "hasta5000";
    default: return "mas5000";
  }
}

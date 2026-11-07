import DataException from "@/domain/core/errors/DataError";
import { PriceAboveLimitError } from "../errors/PriceAboveLimitError";

/**
 * Who a plan (Place or Event) is for and what it costs. Shared by places, events and submissions.
 * The string values are the ones the mobile app uses (`src/domain/types.ts` in mi-vueltica-app).
 */

/** Highest allowed price per person, in colones. */
export const MAX_PRICE_PER_PERSON = 5000;

export const PRICE_TIERS = ["gratis", "hasta2500", "hasta5000"] as const;
export type PriceTier = (typeof PRICE_TIERS)[number];

/** Highest price (₡) each tier allows. */
export const PRICE_TIER_LIMITS: Record<PriceTier, number> = {
  gratis: 0,
  hasta2500: 2500,
  hasta5000: MAX_PRICE_PER_PERSON,
};

export const AUDIENCES = ["todo", "familias", "estudiantes", "ciudadanosOro"] as const;
export type Audience = (typeof AUDIENCES)[number];

export const FREE_FOR_GROUPS = ["estudiantes", "ciudadanosOro"] as const;
export type FreeForGroup = (typeof FREE_FOR_GROUPS)[number];

export const DEFAULT_AUDIENCES: Audience[] = ["todo"];

/** Optional input fields; omitted ones take their defaults. */
export interface PlanConditionsData {
  /** Colones per person; `0` = free, `null` = unknown. */
  pricePerPerson?: number | null;
  freeFor?: FreeForGroup[];
  audiences?: Audience[];
  wheelchair?: boolean;
}

export interface PlanConditionsValue {
  pricePerPerson: number | null;
  freeFor: FreeForGroup[];
  audiences: Audience[];
  wheelchair: boolean;
}

/** `null` when the price is unknown. Throws for prices that are not allowed. */
export function tierForPrice(price: number | null): PriceTier | null {
  if (price === null) return null;
  if (price === 0) return "gratis";
  if (price <= PRICE_TIER_LIMITS.hasta2500) return "hasta2500";
  if (price <= PRICE_TIER_LIMITS.hasta5000) return "hasta5000";
  throw new PriceAboveLimitError();
}

/** Deduplicates and orders `values` as they appear in `allowed`; rejects anything else. */
function parseSet<T extends string>(values: unknown, allowed: readonly T[], label: string): T[] {
  if (!Array.isArray(values)) throw new DataException(`${label} debe ser una lista`);
  for (const value of values) {
    if (!(allowed as readonly unknown[]).includes(value)) throw new DataException(`${label} contiene un valor no válido`);
  }
  return allowed.filter((value) => values.includes(value));
}

export class PlanConditions {
  private constructor(public readonly value: PlanConditionsValue) {}

  /**
   * Validates and normalizes the conditions. A negative or non-integer price is a
   * `DataException` (400); a price above ₡5.000 is a `PriceAboveLimitError` (422).
   * Defaults: unknown price, nobody free, audiences `["todo"]`, not wheelchair accessible.
   */
  static create(data: PlanConditionsData = {}): PlanConditions {
    const price = data.pricePerPerson ?? null;
    if (price !== null && (typeof price !== "number" || !Number.isInteger(price) || price < 0)) {
      throw new DataException("El precio por persona debe ser un número entero mayor o igual a 0");
    }
    tierForPrice(price);

    const audiences = data.audiences === undefined
      ? [...DEFAULT_AUDIENCES]
      : parseSet(data.audiences, AUDIENCES, "audiences");
    if (audiences.length === 0) throw new DataException("audiences debe tener al menos un público");

    const wheelchair = data.wheelchair ?? false;
    if (typeof wheelchair !== "boolean") throw new DataException("wheelchair debe ser verdadero o falso");

    return new PlanConditions({
      pricePerPerson: price,
      freeFor: data.freeFor === undefined ? [] : parseSet(data.freeFor, FREE_FOR_GROUPS, "freeFor"),
      audiences,
      wheelchair,
    });
  }

  get priceTier(): PriceTier | null {
    return tierForPrice(this.value.pricePerPerson);
  }
}

/** List filters, as the app sends them. */
export interface PlanConditionsFilters {
  /** Price ceiling. `hasta5000` also matches plans with an unknown price (the app's fallback tier). */
  maxPrice?: PriceTier;
  /** For students, or free for them. */
  students?: boolean;
  /** For senior citizens ("ciudadanos de oro"), or free for them. */
  seniors?: boolean;
  /** For families. */
  families?: boolean;
  wheelchair?: boolean;
}

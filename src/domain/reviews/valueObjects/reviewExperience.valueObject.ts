import DataException from "@/domain/core/errors/DataError";

/** Who the reviewer went with. Values are the app's own strings (`WentWith` in mi-vueltica-app). */
export const WENT_WITH_VALUES = ["familia", "amigos", "pareja", "solo"] as const;
export type WentWith = (typeof WENT_WITH_VALUES)[number];

/** How much the reviewer spent per person. Values are the app's own strings (`SpentTier`). */
export const SPENT_TIERS = ["nada", "menos2500", "entre2500y5000"] as const;
export type SpentTier = (typeof SPENT_TIERS)[number];

/** `null` / `undefined` mean "not told" (every review written before these fields existed). */
export function parseWentWith(value: unknown): WentWith | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && (WENT_WITH_VALUES as readonly string[]).includes(value)) return value as WentWith;
  throw new DataException(`wentWith debe ser uno de: ${WENT_WITH_VALUES.join(", ")}`);
}

export function parseSpentTier(value: unknown): SpentTier | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" && (SPENT_TIERS as readonly string[]).includes(value)) return value as SpentTier;
  throw new DataException(`spent debe ser uno de: ${SPENT_TIERS.join(", ")}`);
}

/**
 * Audience filter of the reviews list, mirroring the app's mock: `familias` → went with family,
 * `estudiantes` → went with friends or alone.
 */
export const REVIEW_AUDIENCES = ["familias", "estudiantes"] as const;
export type ReviewAudience = (typeof REVIEW_AUDIENCES)[number];

export const WENT_WITH_BY_AUDIENCE: Record<ReviewAudience, WentWith[]> = {
  familias: ["familia"],
  estudiantes: ["amigos", "solo"],
};

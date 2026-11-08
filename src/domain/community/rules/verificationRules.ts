import { PriceTier } from "@/domain/places/valueObjects/planConditions.valueObject";
import { PricePaid, StillHappening, pricePaidToTier } from "../valueObjects/verificationAnswers.valueObject";

/** Matching verifications needed to change the listing (app: `VERIFICATIONS_TO_UPDATE`). */
export const VERIFICATIONS_TO_UPDATE = 3;

export const HIDDEN_REASON_GONE = "Ya no existe";
export const HIDDEN_REASON_OVER_LIMIT = "Cuesta más de ₡5.000";

/** A verification as the outcome sees it. */
export interface CountedVerification {
  stillHappening: StillHappening;
  /** Null when not answered or when it does not count (guests; see `countsPrice`). */
  pricePaid: PricePaid | null;
}

export type VerificationOutcome =
  | { kind: "none" }
  | { kind: "hide"; reason: string }
  | { kind: "price"; tier: PriceTier };

/**
 * Port of the app's `outcomeOfVerifications`: 3 matching verifications update the listing. All three
 * say the plan is gone → hide; three paid over ₡5.000 → hide; three paid the same tier → that tier.
 */
export function outcomeOfVerifications(verifications: CountedVerification[]): VerificationOutcome {
  const gone = verifications.filter((v) => v.stillHappening === "no").length;
  if (gone >= VERIFICATIONS_TO_UPDATE) return { kind: "hide", reason: HIDDEN_REASON_GONE };

  const counts = new Map<PriceTier | "mas5000", number>();
  for (const v of verifications) {
    if (!v.pricePaid) continue;
    const tier = pricePaidToTier(v.pricePaid);
    counts.set(tier, (counts.get(tier) ?? 0) + 1);
  }
  for (const [tier, n] of counts) {
    if (n < VERIFICATIONS_TO_UPDATE) continue;
    if (tier === "mas5000") return { kind: "hide", reason: HIDDEN_REASON_OVER_LIMIT };
    return { kind: "price", tier };
  }
  return { kind: "none" };
}

/**
 * Price to store when the community confirms a tier: the current price if it already falls in that
 * tier, else the tier's upper bound (0, 2500 or 5000), so the listing is never cheaper than reported.
 */
export function priceForTier(current: number | null, tier: PriceTier): number {
  switch (tier) {
    case "gratis":
      return 0;
    case "hasta2500":
      return current !== null && current >= 1 && current <= 2500 ? current : 2500;
    case "hasta5000":
      return current !== null && current >= 2501 && current <= 5000 ? current : 5000;
  }
}

/**
 * Whether a price answer counts. The app only counts them from reputation level 2; the API has no
 * reputation yet, so they count only from signed-in users (guests' answers are stored but ignored).
 */
export function countsPrice(isSignedIn: boolean): boolean {
  return isSignedIn;
}

/** Costa Rica has no daylight saving time: UTC-6 all year. */
const COSTA_RICA_OFFSET_MS = -6 * 60 * 60 * 1000;

/** Start of the current day in Costa Rica, as a UTC instant (for `myVerifiedToday`). */
export function startOfCostaRicaDay(now: Date): Date {
  const local = new Date(now.getTime() + COSTA_RICA_OFFSET_MS);
  const localMidnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  return new Date(localMidnight - COSTA_RICA_OFFSET_MS);
}

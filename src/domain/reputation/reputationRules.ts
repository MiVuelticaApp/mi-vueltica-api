/**
 * Reputation v1: the single place where levels, points and perks are configured (#42).
 * Values are the app's PLAN §8 placeholders, confirmed by product on 2026-11-08. Change them here only.
 */

/** Why a user won or lost points. Values are the strings the app receives in `recent[].kind`. */
export const REPUTATION_KINDS = [
  "published",
  "rejected",
  "verified",
  "reviewUseful",
  "reported",
  "moderationVote",
  "minorityModerator",
] as const;
export type ReputationKind = (typeof REPUTATION_KINDS)[number];

/** Points per kind. `moderationVote` / `minorityModerator` are applied by community moderation (#43). */
export const REPUTATION_POINTS: Readonly<Record<ReputationKind, number>> = {
  published: 10,
  rejected: -10,
  verified: 2,
  reviewUseful: 1,
  reported: -5,
  moderationVote: 1,
  minorityModerator: -2,
};

export const REPUTATION_LEVELS = [1, 2, 3, 4, 5] as const;
export type ReputationLevel = (typeof REPUTATION_LEVELS)[number];

/** Points needed to reach each level (level 1 = everyone). */
export const LEVEL_THRESHOLDS: Readonly<Record<ReputationLevel, number>> = { 1: 0, 2: 50, 3: 120, 4: 200, 5: 400 };

/** What each level unlocks (cumulative: a level keeps the perks of the ones below). */
export const LEVEL_PERKS = {
  /** Their price answers count in verifications. */
  priceVerification: 2,
  /** May moderate; their own suggestions need fewer votes (#43). */
  moderation: 3,
  /** Their verifications count double. */
  doubleVerification: 4,
  /** Their moderation votes count double (#43). */
  doubleModerationVote: 5,
} as const satisfies Record<string, ReputationLevel>;
export type ReputationPerk = keyof typeof LEVEL_PERKS;

/** Points never go below this. */
export const POINTS_FLOOR = 0;

export function levelFor(points: number): ReputationLevel {
  let level: ReputationLevel = 1;
  for (const candidate of REPUTATION_LEVELS) {
    if (points >= LEVEL_THRESHOLDS[candidate]) level = candidate;
  }
  return level;
}

export function hasPerk(level: ReputationLevel, perk: ReputationPerk): boolean {
  return level >= LEVEL_PERKS[perk];
}

export function perksOf(level: ReputationLevel): ReputationPerk[] {
  return (Object.keys(LEVEL_PERKS) as ReputationPerk[]).filter((perk) => hasPerk(level, perk));
}

export interface LevelProgress {
  level: ReputationLevel;
  /** Null at the top level. */
  nextLevel: ReputationLevel | null;
  /** Points still needed for `nextLevel`; 0 at the top level. */
  pointsToNext: number;
  /** 0..1 inside the current level (1 at the top level), rounded to 2 decimals. */
  progress: number;
}

export function levelProgress(points: number): LevelProgress {
  const level = levelFor(points);
  if (level === 5) return { level, nextLevel: null, pointsToNext: 0, progress: 1 };
  const nextLevel = (level + 1) as ReputationLevel;
  const from = LEVEL_THRESHOLDS[level];
  const to = LEVEL_THRESHOLDS[nextLevel];
  const progress = Math.round(((points - from) / (to - from)) * 100) / 100;
  return { level, nextLevel, pointsToNext: to - points, progress };
}

/**
 * The change actually applied to a total: `delta`, except that the total never goes below the floor
 * (with 3 points, a −10 penalty applies −3). The ledger stores this value, so it always adds up to the total.
 */
export function appliedDelta(currentPoints: number, delta: number): number {
  return Math.max(delta, POINTS_FLOOR - currentPoints);
}

/** Weight of a verification in the outcome: guests 1, level 4+ double. `points` is null for guests. */
export function verificationWeight(points: number | null): number {
  if (points === null) return 1;
  return hasPerk(levelFor(points), "doubleVerification") ? 2 : 1;
}

/** Price answers only count from level 2 (guests never). */
export function countsPrice(points: number | null): boolean {
  return points !== null && hasPerk(levelFor(points), "priceVerification");
}

import { ReputationEvent } from "@/domain/reputation/entities/ReputationEvent";
import { LevelProgress, ReputationPerk } from "@/domain/reputation/reputationRules";

export interface ReputationSummary extends LevelProgress {
  points: number;
  /** Everything the current level unlocks. */
  perks: ReputationPerk[];
  /** Latest changes first (at most `RECENT_REPUTATION_EVENTS`). */
  recent: ReputationEvent[];
}

export interface IReputationService {
  /** 404 `UserNotFoundError` if the user does not exist. */
  summary(userId: string): Promise<ReputationSummary>;
}

import { Submission } from "@/domain/submissions/entities/Submission";
import { ReportQueueItem } from "@/domain/community/entities/Report";
import { ModerationTally } from "@/domain/moderation/entities/ModerationVote";
import { Voter } from "../moderationVoting";

export interface ModerationQueue {
  /** PENDING suggestions, oldest first (never the voter's own). */
  nuevas: (ModerationTally & { submission: Submission })[];
  /** Plans with pending reports, in the report queue's order (never the voter's own). */
  reportadas: (ModerationTally & { report: ReportQueueItem })[];
  /** Items in each list in total (the lists hold at most `MODERATION_QUEUE_LIMIT`). */
  totals: { nuevas: number; reportadas: number };
}

export interface IModerationService {
  /** The community moderation queue; 403 below level 3 (MODERATOR / ADMIN always see it). */
  queue(voter: Voter): Promise<ModerationQueue>;
}

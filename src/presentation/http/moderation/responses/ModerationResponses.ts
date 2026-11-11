import { ModerationDecision, VoteChoice } from "@/domain/moderation/moderationRules";
import { ModerationTargetType } from "@/domain/moderation/entities/ModerationVote";
import { SubmissionResponse } from "@/presentation/http/submissions/responses/SubmissionResponse";
import { ReportQueueItemResponse } from "@/presentation/http/community/responses/CommunityResponses";

/** The app's `ModerationItem` counters. Votes are weighted (level 5 counts 2). */
export interface ModerationTallyResponse {
  votesFor: number;
  votesAgainst: number;
  votesNeeded: number;
  myVote: VoteChoice | null;
}

export interface ModerationVoteResponse extends ModerationTallyResponse {
  type: ModerationTargetType;
  id: string;
  kind: "nueva" | "reportada";
  decision: ModerationDecision;
}

/** A pending suggestion as community voters see it: no author id. */
export type QueueSubmissionResponse = Omit<SubmissionResponse, "userId">;

export interface ModerationQueueResponse {
  nuevas: (ModerationTallyResponse & { submission: QueueSubmissionResponse })[];
  reportadas: (ModerationTallyResponse & { report: ReportQueueItemResponse })[];
  totals: { nuevas: number; reportadas: number };
  total: number;
}

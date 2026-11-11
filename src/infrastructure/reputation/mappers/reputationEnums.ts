import { ReputationKind } from "@/domain/reputation/reputationRules";
import { ReputationKind as DbReputationKind } from "@/infrastructure/prisma/generated/prisma/client";

// The API speaks the app's strings; the database keeps uppercase enums like the rest of the schema.
const KIND_TO_DB: Record<ReputationKind, DbReputationKind> = {
  published: "SUBMISSION_APPROVED",
  rejected: "SUBMISSION_REJECTED",
  verified: "VERIFICATION",
  reviewUseful: "REVIEW_USEFUL",
  reported: "PLAN_HIDDEN",
  moderationVote: "MODERATION_VOTE",
  minorityModerator: "MODERATION_MINORITY",
};

const KIND_FROM_DB = Object.fromEntries(Object.entries(KIND_TO_DB).map(([k, v]) => [v, k])) as Record<
  DbReputationKind,
  ReputationKind
>;

export const reputationKindToDb = (kind: ReputationKind): DbReputationKind => KIND_TO_DB[kind];
export const reputationKindFromDb = (kind: DbReputationKind): ReputationKind => KIND_FROM_DB[kind];

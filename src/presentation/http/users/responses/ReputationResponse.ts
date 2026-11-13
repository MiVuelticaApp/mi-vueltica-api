import { ReputationKind, ReputationLevel, ReputationPerk } from "@/domain/reputation/reputationRules";

export interface ReputationEventResponse {
  kind: ReputationKind;
  delta: number;
  createdAt: string;
}

export interface ReputationResponse {
  points: number;
  level: ReputationLevel;
  nextLevel: ReputationLevel | null;
  pointsToNext: number;
  progress: number;
  perks: ReputationPerk[];
  recent: ReputationEventResponse[];
}

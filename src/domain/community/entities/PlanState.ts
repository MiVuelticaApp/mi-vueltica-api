import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";
import { PlanTarget } from "../valueObjects/planTarget.valueObject";

/** The part of a Place / Event that verifications and reports read and change. */
export interface PlanState {
  target: PlanTarget;
  status: ContentStatus;
  pricePerPerson: number | null;
  hiddenReason: string | null;
  reportedAt: Date | null;
  /** The submitter it was approved from; null for team content (and plans approved before #39). */
  authorId: string | null;
}

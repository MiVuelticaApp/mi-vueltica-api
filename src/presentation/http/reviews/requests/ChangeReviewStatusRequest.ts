import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

export interface ChangeReviewStatusRequest {
  status: ContentStatus;
}

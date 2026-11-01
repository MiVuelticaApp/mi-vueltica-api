import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

export interface ChangePlaceStatusRequest {
  status: ContentStatus;
}

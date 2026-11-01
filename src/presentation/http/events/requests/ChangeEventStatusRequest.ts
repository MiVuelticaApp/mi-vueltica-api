import { ContentStatus } from "@/domain/places/valueObjects/contentStatus.valueObject";

export interface ChangeEventStatusRequest {
  status: ContentStatus;
}

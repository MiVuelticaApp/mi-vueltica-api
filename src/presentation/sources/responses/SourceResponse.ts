import { SourceType } from "@/domain/sources/valueObjects/sourceType.valueObject";

export interface SourceResponse {
  id: string;
  name: string;
  url: string | null;
  type: SourceType;
  lastCrawledAt: string | null;
}

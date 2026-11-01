import { SourceType } from "@/domain/sources/valueObjects/sourceType.valueObject";

export interface UpdateSourceRequest {
  name: string;
  url?: string | null;
  type: SourceType;
  /** ISO 8601 datetime. Omitted keeps the current value; null clears it. */
  lastCrawledAt?: string | null;
}

import { COMMUNITY_SOURCE_ID, COMMUNITY_SOURCE_NAME } from "@/domain/sources/communitySource";
import type { SourceType } from "@/domain/sources/valueObjects/sourceType.valueObject";

export interface SourceSeed {
  /** Fixed id: sources have no unique name, so the id is what makes the upsert idempotent. */
  id: string;
  name: string;
  type: SourceType;
}

// Sources the application itself relies on. Crawler/team sources are managed through /sources.
export const SOURCES: SourceSeed[] = [
  { id: COMMUNITY_SOURCE_ID, name: COMMUNITY_SOURCE_NAME, type: "COMMUNITY" },
];

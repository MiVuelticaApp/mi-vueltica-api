import { SourceType } from "@/domain/sources/valueObjects/sourceType.valueObject";

export interface CreateSourceRequest {
  name: string;
  url?: string | null;
  type: SourceType;
}

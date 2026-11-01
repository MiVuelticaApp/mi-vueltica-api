import { Source } from "@/domain/sources/entities/Source";
import { SourceResponse } from "../responses/SourceResponse";

export default class SourceDtoMapper {
  static toResponse(source: Source): SourceResponse {
    return {
      id: source.id,
      name: source.name,
      url: source.url,
      type: source.type,
      lastCrawledAt: source.lastCrawledAt ? source.lastCrawledAt.toISOString() : null,
    };
  }
}

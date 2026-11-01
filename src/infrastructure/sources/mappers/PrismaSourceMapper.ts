import { Source } from "@/domain/sources/entities/Source";
import { Source as PrismaSource } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaSourceMapper {
  static toDomain(row: PrismaSource): Source {
    return new Source({
      id: row.id,
      name: row.name,
      url: row.url,
      type: row.type,
      lastCrawledAt: row.lastCrawledAt,
    });
  }
}

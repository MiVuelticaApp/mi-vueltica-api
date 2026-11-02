import { Canton } from "@/domain/geography/entities/Canton";
import { Canton as PrismaCanton } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaCantonMapper {
  static toDomain(row: PrismaCanton): Canton {
    return new Canton({ id: row.id, provinceId: row.provinceId, name: row.name });
  }
}

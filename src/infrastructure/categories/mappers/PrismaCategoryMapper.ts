import { Category } from "@/domain/categories/entities/Category";
import { Category as PrismaCategory } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaCategoryMapper {
  static toDomain(row: PrismaCategory): Category {
    return new Category({ id: row.id, name: row.name });
  }
}

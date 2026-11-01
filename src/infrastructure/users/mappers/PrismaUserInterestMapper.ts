import { UserInterest } from "@/domain/users/entities/UserInterest";
import { UserInterest as PrismaUserInterest } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaUserInterestMapper {
  static toDomain(row: PrismaUserInterest): UserInterest {
    return new UserInterest(row.userId, row.categoryId);
  }

  static toCreateMany(userId: string, categoryIds: number[]) {
    return categoryIds.map((categoryId) => ({ userId, categoryId }));
  }
}

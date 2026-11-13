import { User } from "@/domain/users/entities/User";
import { Prisma, User as PrismaUser } from "@/infrastructure/prisma/generated/prisma/client";

/** Every user read loads the province name (`GET /me`, auth responses). */
export const USER_INCLUDE = { province: { select: { id: true, name: true } } } satisfies Prisma.UserInclude;
type UserRow = PrismaUser & { province: { id: number; name: string } | null };
import { UserUncheckedCreateInput, UserUncheckedUpdateInput } from "@/infrastructure/prisma/generated/prisma/models";

export class PrismaUserMapper {
  static toDomain(row: UserRow): User {
    return new User({
      id: row.id,
      name: row.name,
      surnames: row.surnames,
      email: row.email,
      ssoProvider: row.ssoProvider,
      ssoSubject: row.ssoSubject,
      ageRange: row.ageRange,
      role: row.role,
      province: row.province,
      reputationPoints: row.reputationPoints,
      deletedAt: row.deletedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  static toCreateData(user: User): UserUncheckedCreateInput {
    return {
      id: user.id,
      name: user.name,
      surnames: user.surnames,
      email: user.email.value,
      ssoProvider: user.ssoProvider,
      ssoSubject: user.ssoSubject,
      ageRange: user.ageRange,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  // Email and SSO identity are deliberately excluded: an update must never rewrite them. Nor
  // `reputationPoints`: only the reputation ledger changes it (a profile edit would overwrite a concurrent award).
  static toUpdateData(user: User): UserUncheckedUpdateInput {
    return {
      name: user.name,
      surnames: user.surnames,
      ageRange: user.ageRange,
      role: user.role,
      provinceId: user.provinceId,
      updatedAt: user.updatedAt,
    };
  }
}

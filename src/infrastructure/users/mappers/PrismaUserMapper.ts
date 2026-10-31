/* eslint-disable @typescript-eslint/no-explicit-any */

import { User } from "@/domain/users/entities/User";
import { Company, User as PrismaUser  } from "@/infrastructure/prisma/generated/prisma/client";
import { UserCreateArgs } from "@/infrastructure/prisma/generated/prisma/models";

type UserCompanyRegistry = {
  id: string;
  userId: string;
  companyId: string;
  company: Company;
  role: string;
}

export class PrismaUserMapper {
  static toDomain(row: PrismaUser & {companies: UserCompanyRegistry[]}): User {
    return new User({
      id: row.id,
      name: row.name,
      surnames: row.surnames,
      email: row.email,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    });
  }

  static toPersistence(user: User): UserCreateArgs {
    return {
      data: {
        id: user.id,
        name: user.name,
        surnames: user.surnames,
        email: user.email.value,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }
}
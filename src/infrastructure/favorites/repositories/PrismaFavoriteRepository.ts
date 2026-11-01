import { FavoritePlace } from "@/domain/favorites/entities/FavoritePlace";
import { IFavoriteRepository } from "@/domain/favorites/repositories/IFavoriteRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaFavoriteMapper } from "../mappers/PrismaFavoriteMapper";

export default class PrismaFavoriteRepository implements IFavoriteRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async listForUser(userId: string, params: PaginationParams): Promise<PaginatedResult<FavoritePlace>> {
    try {
      // Unpublished places are hidden (not deleted): the row stays and reappears on re-publish.
      const where: Prisma.FavoriteWhereInput = { userId, place: { status: "PUBLISHED" } };
      // Most recently favorited first unless a direction is given; `placeId` keeps pages stable.
      const direction = params.sort?.direction ?? "desc";
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.favorite.findMany({
              where,
              include: { place: true },
              skip: page.skip,
              take: page.take,
              orderBy: [{ createdAt: direction }, { placeId: "asc" }],
            }),
          count: (tx) => tx.favorite.count({ where }),
        },
        PrismaFavoriteMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing favorites:", error);
      throw new DatabaseError("Could not list favorites", error);
    }
  }

  async add(userId: string, placeId: string): Promise<void> {
    try {
      // `update: {}` makes a repeated or concurrent add a no-op that keeps the original createdAt.
      await this.client.favorite.upsert({
        where: { userId_placeId: { userId, placeId } },
        create: { userId, placeId },
        update: {},
      });
    } catch (error) {
      console.error("Error adding favorite:", error);
      throw new DatabaseInsertError("Could not add favorite", error);
    }
  }

  async remove(userId: string, placeId: string): Promise<void> {
    try {
      await this.client.favorite.deleteMany({ where: { userId, placeId } });
    } catch (error) {
      console.error("Error removing favorite:", error);
      throw new DatabaseError("Could not remove favorite", error);
    }
  }

  async exists(userId: string, placeId: string): Promise<boolean> {
    try {
      return (await this.client.favorite.count({ where: { userId, placeId } })) > 0;
    } catch (error) {
      console.error("Error checking favorite:", error);
      throw new DatabaseError("Could not check favorite", error);
    }
  }
}

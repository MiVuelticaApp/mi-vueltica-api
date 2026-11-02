import { NotificationItem } from "@/domain/notifications/entities/NotificationItem";
import { INotificationRepository } from "@/domain/notifications/repositories/INotificationRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaNotificationMapper } from "../mappers/PrismaNotificationMapper";

export default class PrismaNotificationRepository implements INotificationRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async listForUser(userId: string, params: PaginationParams): Promise<PaginatedResult<NotificationItem>> {
    try {
      // Hidden (not deleted) while the event is not PUBLISHED: the row stays and reappears on re-publish.
      const where: Prisma.NotificationWhereInput = { userId, event: { status: "PUBLISHED" } };
      // Newest first unless a direction is given; `id` keeps pages stable when two rows tie.
      const direction = params.sort?.direction ?? "desc";
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.notification.findMany({
              where,
              include: { event: true },
              skip: page.skip,
              take: page.take,
              orderBy: [{ sentAt: direction }, { id: "asc" }],
            }),
          count: (tx) => tx.notification.count({ where }),
        },
        PrismaNotificationMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing notifications:", error);
      throw new DatabaseError("Could not list notifications", error);
    }
  }

  async create(userId: string, eventId: string): Promise<boolean> {
    try {
      // A single INSERT, and the unique (userId, eventId) index decides: a repeat fails with
      // P2002, which here means "already notified", not an error. There is no read before the
      // write, so concurrent calls for the same pair cannot both insert.
      // Not createMany({ skipDuplicates }): on MariaDB that is INSERT IGNORE, which also turns
      // foreign key errors into warnings, so an unknown user or event would be a silent no-op.
      await this.client.notification.create({ data: { userId, eventId } });
      return true;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
      console.error("Error creating notification:", error);
      throw new DatabaseInsertError("Could not create notification", error);
    }
  }

  async deleteOwned(id: string, userId: string): Promise<boolean> {
    try {
      const { count } = await this.client.notification.deleteMany({ where: { id, userId } });
      return count > 0;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw new DatabaseInsertError("Could not delete notification", error);
    }
  }
}

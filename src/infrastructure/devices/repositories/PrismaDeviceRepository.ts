import { Device } from "@/domain/devices/entities/Device";
import { IDeviceRepository, RegisterDeviceData } from "@/domain/devices/repositories/IDeviceRepository";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";
import { prisma } from "@/infrastructure/prisma/client";
import { Prisma } from "@/infrastructure/prisma/generated/prisma/client";
import { paginate } from "@/infrastructure/core/repositories/prismaPagination";
import DatabaseError from "@/infrastructure/core/errors/DatabaseError";
import DatabaseInsertError from "@/infrastructure/core/errors/DatabaseInsertError";
import { PrismaDeviceMapper } from "../mappers/PrismaDeviceMapper";

export default class PrismaDeviceRepository implements IDeviceRepository {

  private readonly client: Prisma.TransactionClient;

  constructor(client?: Prisma.TransactionClient) {
    this.client = client || prisma;
  }

  async listForUser(userId: string, params: PaginationParams): Promise<PaginatedResult<Device>> {
    try {
      const where: Prisma.DeviceWhereInput = { userId };
      // `updatedAt` is the only sortable field; `id` keeps pages stable when two rows tie.
      const direction = params.sort?.direction ?? "desc";
      return await paginate(
        this.client as Parameters<typeof paginate>[0],
        params,
        {
          findMany: (tx, page) =>
            tx.device.findMany({
              where,
              skip: page.skip,
              take: page.take,
              orderBy: [{ updatedAt: direction }, { id: "asc" }],
            }),
          count: (tx) => tx.device.count({ where }),
        },
        PrismaDeviceMapper.toDomain,
      );
    } catch (error) {
      console.error("Error listing devices:", error);
      throw new DatabaseError("Could not list devices", error);
    }
  }

  async upsertByPushToken(data: RegisterDeviceData): Promise<Device> {
    try {
      // One atomic statement on the unique pushToken: concurrent registrations of the same token
      // never create duplicates, and an existing token is moved to the current user.
      const row = await this.client.device.upsert({
        where: { pushToken: data.pushToken },
        create: { userId: data.userId, platform: data.platform, pushToken: data.pushToken },
        update: { userId: data.userId, platform: data.platform },
      });
      return PrismaDeviceMapper.toDomain(row);
    } catch (error) {
      console.error("Error registering device:", error);
      throw new DatabaseInsertError("Could not register device", error);
    }
  }

  async deleteOwned(id: string, userId: string): Promise<boolean> {
    try {
      const { count } = await this.client.device.deleteMany({ where: { id, userId } });
      return count > 0;
    } catch (error) {
      console.error("Error deleting device:", error);
      throw new DatabaseInsertError("Could not delete device", error);
    }
  }

  async deleteByPushToken(userId: string, pushToken: string): Promise<void> {
    try {
      await this.client.device.deleteMany({ where: { userId, pushToken } });
    } catch (error) {
      console.error("Error deleting device by push token:", error);
      throw new DatabaseInsertError("Could not delete device", error);
    }
  }
}

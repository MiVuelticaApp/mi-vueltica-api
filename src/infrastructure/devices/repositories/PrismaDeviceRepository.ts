import { randomUUID } from "crypto";
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

  /**
   * Why raw SQL instead of `this.client.device.upsert(...)`:
   *
   * The app registers its token on every login, and it can do so twice at almost the same time
   * (login + token refresh). On MariaDB, Prisma's `upsert` is not one statement: it reads the row
   * first and then creates or updates it. Under concurrent calls with the same token that gap
   * breaks it, which we reproduced with 10 parallel requests (4 × 200, 1 × 409, 5 × 500):
   *   - both requests see no row and both INSERT → P2002 on `Device_pushToken_key` (409);
   *   - both requests UPDATE the same row → MariaDB 11 (`innodb_snapshot_isolation`) rejects one
   *     with error 1020 "Record has changed since last read" (500). Same issue as submission
   *     approval, see `PrismaSubmissionRepository.findForUpdate`.
   *
   * `INSERT ... ON DUPLICATE KEY UPDATE` is a single statement that MariaDB resolves atomically on
   * the unique `pushToken` index, so every concurrent call succeeds and there is still one row.
   * Notes on the statement:
   *   - the id is generated here because Prisma's `@default(uuid())` only applies to Prisma writes;
   *   - `UTC_TIMESTAMP(3)` (not `NOW()`) because Prisma stores DateTime in UTC, and `@updatedAt`
   *     is likewise only applied by Prisma writes;
   *   - an existing token gets the caller's `userId`: same phone, new login.
   * The row is read back afterwards; if another user takes the token in between, the response
   * shows the reassigned row, which is the correct final state (last registration wins).
   */
  async upsertByPushToken(data: RegisterDeviceData): Promise<Device> {
    try {
      await this.client.$executeRaw`
        INSERT INTO Device (id, userId, platform, pushToken, updatedAt)
        VALUES (${randomUUID()}, ${data.userId}, ${data.platform}, ${data.pushToken}, UTC_TIMESTAMP(3))
        ON DUPLICATE KEY UPDATE
          userId = VALUES(userId),
          platform = VALUES(platform),
          updatedAt = UTC_TIMESTAMP(3)`;
      const row = await this.client.device.findUniqueOrThrow({ where: { pushToken: data.pushToken } });
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

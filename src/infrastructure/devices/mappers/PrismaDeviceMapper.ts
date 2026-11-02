import { Device } from "@/domain/devices/entities/Device";
import { Device as PrismaDevice } from "@/infrastructure/prisma/generated/prisma/client";

export class PrismaDeviceMapper {
  static toDomain(row: PrismaDevice): Device {
    return new Device({
      id: row.id,
      userId: row.userId,
      platform: row.platform,
      pushToken: row.pushToken,
      updatedAt: row.updatedAt,
    });
  }
}

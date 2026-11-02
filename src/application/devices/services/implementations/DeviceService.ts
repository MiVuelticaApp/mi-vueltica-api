import { Device } from "@/domain/devices/entities/Device";
import { IDeviceRepository } from "@/domain/devices/repositories/IDeviceRepository";
import { PushToken } from "@/domain/devices/valueObjects/pushToken.valueObject";
import { parsePlatform } from "@/domain/devices/valueObjects/platform.valueObject";
import { PaginatedResult, PaginationParams, SortDirection } from "@/domain/core/pagination/Pagination";
import { IDeviceService, RegisterDeviceInput } from "../interfaces/IDeviceService";
import { DeviceNotFoundError } from "../../errors/DeviceNotFoundError";

const DEFAULT_SORT = { field: "updatedAt", direction: "desc" as SortDirection };

export class DeviceService implements IDeviceService {
  constructor(private readonly deviceRepository: IDeviceRepository) {}

  async listMine(userId: string, params: PaginationParams): Promise<PaginatedResult<Device>> {
    return this.deviceRepository.listForUser(userId, { ...params, sort: params.sort ?? DEFAULT_SORT });
  }

  async register(userId: string, input: RegisterDeviceInput): Promise<Device> {
    // Validate before touching the DB (400 instead of a failed query).
    return this.deviceRepository.upsertByPushToken({
      userId,
      platform: parsePlatform(input.platform),
      pushToken: PushToken.create(input.pushToken).value,
    });
  }

  async deleteMine(userId: string, id: string): Promise<void> {
    // Scoped by userId: someone else's device is a 404, so its existence is not revealed.
    const deleted = await this.deviceRepository.deleteOwned(id, userId);
    if (!deleted) throw new DeviceNotFoundError();
  }

  async removeByPushToken(userId: string, pushToken: string): Promise<void> {
    await this.deviceRepository.deleteByPushToken(userId, PushToken.create(pushToken).value);
  }
}

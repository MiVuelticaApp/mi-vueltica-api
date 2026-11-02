import { Device } from "@/domain/devices/entities/Device";
import { Platform } from "@/domain/devices/valueObjects/platform.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export const DEVICE_SORT_FIELDS = ["updatedAt"] as const;

export interface RegisterDeviceData {
  userId: string;
  platform: Platform;
  pushToken: string;
}

export interface IDeviceRepository {
  /** The user's devices. Default order is `updatedAt` descending (most recently registered first). */
  listForUser(userId: string, params: PaginationParams): Promise<PaginatedResult<Device>>;
  /**
   * Creates the device, or updates it when the push token already exists. An existing token is
   * moved to `data.userId` even if it belonged to another user (same phone, new login).
   */
  upsertByPushToken(data: RegisterDeviceData): Promise<Device>;
  /** Deletes the device only if it belongs to `userId`. Returns false when nothing was deleted. */
  deleteOwned(id: string, userId: string): Promise<boolean>;
  /** Idempotent: does nothing if the token does not exist or belongs to another user. */
  deleteByPushToken(userId: string, pushToken: string): Promise<void>;
}

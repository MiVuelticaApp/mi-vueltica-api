import { Device } from "@/domain/devices/entities/Device";
import { Platform } from "@/domain/devices/valueObjects/platform.valueObject";
import { PaginatedResult, PaginationParams } from "@/domain/core/pagination/Pagination";

export interface RegisterDeviceInput {
  platform: Platform;
  pushToken: string;
}

export interface IDeviceService {
  listMine(userId: string, params: PaginationParams): Promise<PaginatedResult<Device>>;
  /** Idempotent: registering the same token again updates it (and moves it to this user). */
  register(userId: string, input: RegisterDeviceInput): Promise<Device>;
  /** 404 if the device does not exist or belongs to another user. */
  deleteMine(userId: string, id: string): Promise<void>;
  /** Used on logout. Never fails when the token is unknown or belongs to someone else. */
  removeByPushToken(userId: string, pushToken: string): Promise<void>;
}

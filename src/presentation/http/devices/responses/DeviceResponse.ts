import { Platform } from "@/domain/devices/valueObjects/platform.valueObject";

export interface DeviceResponse {
  id: string;
  platform: Platform;
  pushToken: string;
  /** Last time the device was registered (ISO 8601 UTC). */
  updatedAt: string;
}

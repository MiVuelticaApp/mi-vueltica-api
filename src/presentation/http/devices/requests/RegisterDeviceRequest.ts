import { Platform } from "@/domain/devices/valueObjects/platform.valueObject";

export interface RegisterDeviceRequest {
  platform: Platform;
  pushToken: string;
}

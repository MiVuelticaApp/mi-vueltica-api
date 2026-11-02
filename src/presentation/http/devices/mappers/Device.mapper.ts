import { Device } from "@/domain/devices/entities/Device";
import { DeviceResponse } from "../responses/DeviceResponse";

export default class DeviceDtoMapper {
  static toResponse(device: Device): DeviceResponse {
    return {
      id: device.id,
      platform: device.platform,
      pushToken: device.pushToken,
      updatedAt: device.updatedAt.toISOString(),
    };
  }
}

import { Request, Response } from "express";
import { z } from "zod";
import { IDeviceService } from "@/application/devices/services/interfaces/IDeviceService";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListDevicesQuerySchema } from "../validators/listDevices";
import { RegisterDeviceRequest } from "../requests/RegisterDeviceRequest";
import DeviceDtoMapper from "../mappers/Device.mapper";

type ListQuery = z.output<typeof ListDevicesQuerySchema>;
type IdParams = { id: string };

/** /me/devices — the authenticated user's push-notification devices. */
export default class MyDevicesController {
  constructor(private readonly deviceService: IDeviceService) {}

  async list(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.deviceService.listMine(userId, toPaginationParams(query));
    res.json(toPaginatedResponse(result, DeviceDtoMapper.toResponse));
  }

  // Always 200: registering is idempotent (the app calls it on every login).
  async register(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { platform, pushToken }: RegisterDeviceRequest = req.body;
    const device = await this.deviceService.register(userId, { platform, pushToken });
    res.json(DeviceDtoMapper.toResponse(device));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    await this.deviceService.deleteMine(userId, id);
    res.status(204).send();
  }
}

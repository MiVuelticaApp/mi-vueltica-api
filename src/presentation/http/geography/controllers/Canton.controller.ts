import { Request, Response } from "express";
import { z } from "zod";
import { ICantonService } from "@/application/geography/services/interfaces/ICantonService";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { setPublicCache } from "@/presentation/http/core/utils/cacheControl";
import { ListCantonsQuerySchema } from "../validators/listCantons";
import { CreateCantonRequest } from "../requests/CreateCantonRequest";
import { UpdateCantonRequest } from "../requests/UpdateCantonRequest";
import CantonDtoMapper from "../mappers/Canton.mapper";

type ListQuery = z.output<typeof ListCantonsQuerySchema>;
type IdParams = { id: number };
type ProvinceParams = { provinceId: number };

export default class CantonController {
  constructor(private readonly cantonService: ICantonService) {}

  /** GET /provinces/:provinceId/cantons */
  async listByProvince(req: Request, res: Response): Promise<void> {
    const { provinceId } = getValidated<ProvinceParams>(req, "params");
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.cantonService.listByProvince(provinceId, toPaginationParams(query));
    setPublicCache(res);
    res.json(toPaginatedResponse(result, CantonDtoMapper.toResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const canton = await this.cantonService.get(id);
    setPublicCache(res);
    res.json(CantonDtoMapper.toResponse(canton));
  }

  async create(req: Request, res: Response): Promise<void> {
    const { id, provinceId, name }: CreateCantonRequest = req.body;
    const canton = await this.cantonService.create({ id, provinceId, name });
    res.status(201).json(CantonDtoMapper.toResponse(canton));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const { name }: UpdateCantonRequest = req.body;
    const canton = await this.cantonService.update(id, name);
    res.json(CantonDtoMapper.toResponse(canton));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    await this.cantonService.delete(id);
    res.status(204).send();
  }
}

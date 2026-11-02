import { Request, Response } from "express";
import { z } from "zod";
import { IProvinceService } from "@/application/geography/services/interfaces/IProvinceService";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { setPublicCache } from "@/presentation/http/core/utils/cacheControl";
import { ListProvincesQuerySchema } from "../validators/listProvinces";
import { CreateProvinceRequest } from "../requests/CreateProvinceRequest";
import { UpdateProvinceRequest } from "../requests/UpdateProvinceRequest";
import ProvinceDtoMapper from "../mappers/Province.mapper";

type ListQuery = z.output<typeof ListProvincesQuerySchema>;
type IdParams = { id: number };

export default class ProvinceController {
  constructor(private readonly provinceService: IProvinceService) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.provinceService.list(toPaginationParams(query), {
      includeCantons: query.include === "cantons",
    });
    setPublicCache(res);
    res.json(toPaginatedResponse(result, ProvinceDtoMapper.toListItemResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const province = await this.provinceService.get(id);
    setPublicCache(res);
    res.json(ProvinceDtoMapper.toResponse(province));
  }

  async create(req: Request, res: Response): Promise<void> {
    const { id, name }: CreateProvinceRequest = req.body;
    const province = await this.provinceService.create({ id, name });
    res.status(201).json(ProvinceDtoMapper.toResponse(province));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const { name }: UpdateProvinceRequest = req.body;
    const province = await this.provinceService.update(id, name);
    res.json(ProvinceDtoMapper.toResponse(province));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    await this.provinceService.delete(id);
    res.status(204).send();
  }
}

import { Request, Response } from "express";
import { z } from "zod";
import { ISourceService } from "@/application/sources/services/interfaces/ISourceService";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListSourcesQuerySchema } from "../validators/listSources";
import { CreateSourceRequest } from "../requests/CreateSourceRequest";
import { UpdateSourceRequest } from "../requests/UpdateSourceRequest";
import SourceDtoMapper from "../mappers/Source.mapper";

type ListQuery = z.output<typeof ListSourcesQuerySchema>;
type IdParams = { id: string };

export default class SourceController {
  constructor(private readonly sourceService: ISourceService) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.sourceService.list(toPaginationParams(query), {
      type: query.type,
      search: query.search || undefined,
    });
    res.json(toPaginatedResponse(result, SourceDtoMapper.toResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const source = await this.sourceService.get(id);
    res.json(SourceDtoMapper.toResponse(source));
  }

  async create(req: Request, res: Response): Promise<void> {
    const { name, url, type }: CreateSourceRequest = req.body;
    const source = await this.sourceService.create({ name, url, type });
    res.status(201).json(SourceDtoMapper.toResponse(source));
  }

  async update(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const { name, url, type, lastCrawledAt }: UpdateSourceRequest = req.body;
    const source = await this.sourceService.update(id, {
      name,
      url,
      type,
      lastCrawledAt: lastCrawledAt === undefined ? undefined : lastCrawledAt === null ? null : new Date(lastCrawledAt),
    });
    res.json(SourceDtoMapper.toResponse(source));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    await this.sourceService.delete(id);
    res.status(204).send();
  }
}

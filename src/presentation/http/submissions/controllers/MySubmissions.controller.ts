import { Request, Response } from "express";
import { z } from "zod";
import { ISubmissionService } from "@/application/submissions/services/interfaces/ISubmissionService";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListMySubmissionsQuerySchema } from "../validators/listSubmissions";
import { CreateSubmissionRequest } from "../requests/CreateSubmissionRequest";
import SubmissionDtoMapper from "../mappers/Submission.mapper";

type ListQuery = z.output<typeof ListMySubmissionsQuerySchema>;
type IdParams = { id: string };

/** /me/submissions — the authenticated user's own submissions. */
export default class MySubmissionsController {
  constructor(private readonly submissionService: ISubmissionService) {}

  async create(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const body: CreateSubmissionRequest = req.body;
    const submission = await this.submissionService.create(userId, body);
    res.status(201).json(SubmissionDtoMapper.toResponse(submission));
  }

  async list(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.submissionService.listMine(userId, toPaginationParams(query));
    res.json(toPaginatedResponse(result, SubmissionDtoMapper.toResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    const submission = await this.submissionService.getMine(userId, id);
    res.json(SubmissionDtoMapper.toResponse(submission));
  }

  async delete(req: Request, res: Response): Promise<void> {
    const { id: userId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    await this.submissionService.deleteMine(userId, id);
    res.status(204).send();
  }
}

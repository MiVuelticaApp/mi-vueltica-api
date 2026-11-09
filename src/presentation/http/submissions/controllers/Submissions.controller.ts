import { Request, Response } from "express";
import { z } from "zod";
import { ISubmissionService } from "@/application/submissions/services/interfaces/ISubmissionService";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginationParams } from "@/presentation/http/core/validators/pagination";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ListSubmissionsQuerySchema } from "../validators/listSubmissions";
import { RejectSubmissionRequest } from "../requests/RejectSubmissionRequest";
import SubmissionDtoMapper from "../mappers/Submission.mapper";

type ListQuery = z.output<typeof ListSubmissionsQuerySchema>;
type IdParams = { id: string };

/** /submissions — moderation queue (MODERATOR / ADMIN). */
export default class SubmissionsController {
  constructor(private readonly submissionService: ISubmissionService) {}

  async list(req: Request, res: Response): Promise<void> {
    const query = getValidated<ListQuery>(req, "query");
    const result = await this.submissionService.listQueue(toPaginationParams(query), {
      status: query.status,
      type: query.type,
    });
    res.json(toPaginatedResponse(result, SubmissionDtoMapper.toModerationResponse));
  }

  async get(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<IdParams>(req, "params");
    const submission = await this.submissionService.get(id);
    res.json(SubmissionDtoMapper.toModerationResponse(submission));
  }

  async approve(req: Request, res: Response): Promise<void> {
    const { id: reviewerId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    const result = await this.submissionService.approve(id, reviewerId);
    res.json(SubmissionDtoMapper.toApprovalResponse(result));
  }

  async reject(req: Request, res: Response): Promise<void> {
    const { id: reviewerId } = getAuthUser(req);
    const { id } = getValidated<IdParams>(req, "params");
    const { reason, note }: RejectSubmissionRequest = req.body;
    const submission = await this.submissionService.reject(id, reviewerId, { reason, note });
    res.json(SubmissionDtoMapper.toModerationResponse(submission));
  }
}

import { Request, Response } from "express";
import { z } from "zod";
import { ICommunityService } from "@/application/community/services/interfaces/ICommunityService";
import { PlanTarget, PlanTargetType } from "@/domain/community/valueObjects/planTarget.valueObject";
import { ReportDecision } from "@/domain/community/rules/reportRules";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { toPaginatedResponse } from "@/presentation/http/core/mappers/Pagination.mapper";
import { ReportDecisionSchema, ReportQueueQuerySchema, ReportSchema, VerifySchema } from "../validators/community";
import { CreateReportResponse, VerifyResponse } from "../responses/CommunityResponses";
import CommunityDtoMapper from "../mappers/Community.mapper";
import { requirePerson } from "../utils/person";

type Handler = (req: Request, res: Response) => Promise<void>;
type VerifyBody = z.output<typeof VerifySchema>;
type ReportBody = z.output<typeof ReportSchema>;
type DecisionBody = z.output<typeof ReportDecisionSchema>;
type QueueQuery = z.output<typeof ReportQueueQuerySchema>;

/** Path param holding the place / event id. */
export const PLAN_TARGET_PARAMS: Record<PlanTargetType, string> = { PLACE: "placeId", EVENT: "eventId" };

/** Verifications ("¿Sigue siendo gratis?"), reports and the moderators' decisions on reported plans. */
export default class CommunityController {
  constructor(private readonly communityService: ICommunityService) {}

  /** Handlers of `/places/:placeId/...` or `/events/:eventId/...`. */
  plan(type: PlanTargetType): { verify: Handler; report: Handler; decide: Handler } {
    const targetOf = (req: Request): PlanTarget => ({
      type,
      id: getValidated<Record<string, string>>(req, "params")[PLAN_TARGET_PARAMS[type]],
    });

    return {
      verify: async (req, res) => {
        const person = requirePerson(req);
        const body: VerifyBody = req.body;
        const result = await this.communityService.verify(person, targetOf(req), body);
        const response: VerifyResponse = { queued: result.queued, points: result.points, hidden: result.hidden };
        res.json(response);
      },
      report: async (req, res) => {
        const person = requirePerson(req);
        const body: ReportBody = req.body;
        const { report, hidden } = await this.communityService.report(person, targetOf(req), body);
        const response: CreateReportResponse = { ...CommunityDtoMapper.toReportResponse(report), hidden };
        res.status(201).json(response);
      },
      decide: async (req, res) => {
        const { decision }: DecisionBody = req.body;
        const result = await this.communityService.decide(targetOf(req), decision as ReportDecision);
        res.json(CommunityDtoMapper.toDecisionResponse(result, decision));
      },
    };
  }

  /** GET /reports — reported plans for moderators. */
  async queue(req: Request, res: Response): Promise<void> {
    const query = getValidated<QueueQuery>(req, "query");
    const result = await this.communityService.reportQueue({ page: query.page, pageSize: query.pageSize });
    res.json(toPaginatedResponse(result, CommunityDtoMapper.toQueueItemResponse));
  }
}

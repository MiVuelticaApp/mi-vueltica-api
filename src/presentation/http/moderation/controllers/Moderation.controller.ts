import { Request, Response } from "express";
import { z } from "zod";
import { IModerationService } from "@/application/moderation/services/interfaces/IModerationService";
import { ISubmissionService } from "@/application/submissions/services/interfaces/ISubmissionService";
import { ICommunityService } from "@/application/community/services/interfaces/ICommunityService";
import { Voter } from "@/application/moderation/services/moderationVoting";
import { UnauthorizedError } from "@/application/core/errors/UnauthorizedError";
import { PlanTarget, PlanTargetType } from "@/domain/community/valueObjects/planTarget.valueObject";
import { getAuthUser } from "@/presentation/http/auth/utils/getAuthUser";
import { getValidated } from "@/presentation/http/core/middlewares/validateSchema";
import { PLAN_TARGET_PARAMS } from "@/presentation/http/community/controllers/Community.controller";
import { VoteSchema } from "../validators/vote";
import ModerationDtoMapper from "../mappers/Moderation.mapper";

type Handler = (req: Request, res: Response) => Promise<void>;
type VoteBody = z.output<typeof VoteSchema>;

/** The role is loaded from the database by `requireRole` (never from the token or the body). */
function voterOf(req: Request): Voter {
  const user = getAuthUser(req);
  if (!user.role) throw new UnauthorizedError();
  return { id: user.id, role: user.role };
}

/** Community moderation (#43): the queue and the votes on suggestions and reported plans. */
export default class ModerationController {
  constructor(
    private readonly moderationService: IModerationService,
    private readonly submissionService: ISubmissionService,
    private readonly communityService: ICommunityService,
  ) {}

  async queue(req: Request, res: Response): Promise<void> {
    res.json(ModerationDtoMapper.toQueueResponse(await this.moderationService.queue(voterOf(req))));
  }

  async voteSubmission(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<{ id: string }>(req, "params");
    const { choice }: VoteBody = req.body;
    res.json(ModerationDtoMapper.toVoteResponse(await this.submissionService.vote(voterOf(req), id, choice)));
  }

  async undoSubmissionVote(req: Request, res: Response): Promise<void> {
    const { id } = getValidated<{ id: string }>(req, "params");
    res.json(ModerationDtoMapper.toVoteResponse(await this.submissionService.undoVote(voterOf(req), id)));
  }

  /** Handlers of `/moderation/places/:placeId/vote` or `/moderation/events/:eventId/vote`. */
  plan(type: PlanTargetType): { vote: Handler; undo: Handler } {
    const targetOf = (req: Request): PlanTarget => ({
      type,
      id: getValidated<Record<string, string>>(req, "params")[PLAN_TARGET_PARAMS[type]],
    });
    return {
      vote: async (req, res) => {
        const { choice }: VoteBody = req.body;
        res.json(ModerationDtoMapper.toVoteResponse(await this.communityService.voteReport(voterOf(req), targetOf(req), choice)));
      },
      undo: async (req, res) => {
        res.json(ModerationDtoMapper.toVoteResponse(await this.communityService.undoReportVote(voterOf(req), targetOf(req))));
      },
    };
  }
}
